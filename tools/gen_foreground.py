#!/usr/bin/env python3
"""Generate a seamless tiling dark foreground flora band (dead ferns, bracken,
thistles, mud-level weeds) drawn along the ground line. Keyed black-sky like
the world plates. Writes site/art/assets/world_fore.webp"""
import base64, json, subprocess, sys, time, urllib.request
from pathlib import Path
from PIL import Image
import numpy as np
from collections import deque

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'site/art/assets'
REF = OUT / 'tree_sapling.png'
MODEL = 'google/gemini-3-pro-image'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")

PROMPT = """A WIDE SEAMLESSLY TILING foreground flora strip for a dark Norse-horror
game, viewed at ground level: dead bracken, withered ferns, thistles, gnarled
weed tufts and skeletal twigs rising from mud, in very dark desaturated
green-black tones with faint cold rim light, painted in the same painterly
semi-realistic style as the reference plant. The plants' bases sit along the
BOTTOM edge of the image; everything above the plants is SOLID PURE BLACK
(uniform, no pattern). Foreboding, decaying, dense but readable silhouettes.
The image must TILE PERFECTLY horizontally."""

def key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def gen(path):
    imgs = [{'type': 'text', 'text': PROMPT}]
    raw = base64.b64encode(REF.read_bytes()).decode()
    imgs.append({'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{raw}'}})
    body = {'model': MODEL, 'messages': [{'role': 'user', 'content': imgs}]}
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    out = data['choices'][0]['message'].get('images') or []
    if not out: raise RuntimeError('no image')
    path.write_bytes(base64.b64decode(out[0]['image_url']['url'].split(',', 1)[1]))

def crop(path):
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int16)
    lum = a[..., :3].max(axis=2)
    dark = lum < 40
    h, w = dark.shape
    bg = np.zeros((h, w), bool); q = deque()
    for x in range(w):
        if dark[0, x]: bg[0, x] = True; q.append((0, x))
    for y in range(h):
        if dark[y, 0] and not bg[y, 0]: bg[y, 0] = True; q.append((y, 0))
        if dark[y, w-1] and not bg[y, w-1]: bg[y, w-1] = True; q.append((y, w-1))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    a[..., 3] = np.where(bg, 0, 255).astype(np.uint8)
    img = Image.fromarray(a.astype(np.uint8), 'RGBA')
    band = img.crop((0, max(0, img.height - 360), img.width, img.height))
    band.save(OUT / 'world_fore.png')
    band.save(OUT / 'world_fore.webp', 'WEBP', quality=88)
    return band.size

if __name__ == '__main__':
    for attempt in (1, 2):
        try:
            p = OUT / 'world_fore.png'
            gen(p)
            print('band:', crop(p))
            break
        except Exception as e:
            print(f'attempt {attempt} failed: {e}', file=sys.stderr)
            if attempt == 2: raise
            time.sleep(5)
