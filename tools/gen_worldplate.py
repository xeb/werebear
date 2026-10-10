#!/usr/bin/env python3
"""Generate seamless, tileable painted WORLD PLATES for the far+mid parallax
forest layers (night and day variants), keyed transparent so the sky gradient
shows through the canopy. 2048x576, edges tile left/right."""
import base64, json, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'site/art/assets'
REF = OUT / 'tree_elderwood.png'
MODEL = 'google/gemini-3-pro-image'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")

PLATES = [
    ('world_night', """A WIDE SEAMLESSLY TILING panoramic forest skyline for a dark Norse-horror
game's far background layer: an unbroken band of layered primeval pine and ancient oak
SILHOUETTES in deep desaturated blue-green darkness, two depth layers (distant pale
misty ridge behind, darker detailed canopy in front), painted in the same painterly
semi-realistic style as the reference tree. Above the treetops the sky is SOLID
PURE BLACK (#000000, uniformly, no pattern, no checkerboard, no stars, no moon).
Dead trees, broken crowns, hanging mist. Grim, ominous, epic. NO ground, NO
fireflies, NO bright colours.
The image must TILE PERFECTLY horizontally: the left edge continues the right edge."""),
    ('world_day', """A WIDE SEAMLESSLY TILING panoramic forest skyline for a Norse folklore game's
day background layer: layered primeval pine and oak forest in muted desaturated
sage green and grey-brown, overcast grim daylight, two depth layers (pale misty
distant ridge behind, darker detailed canopy in front), painted in the same
painterly semi-realistic style as the reference tree.
Somber, epic, slightly ominous even in daylight — muddy, cold, wind-bent crowns.
NO sun, NO birds, NO blue sky colours, NO ground.
Above the treetops the sky is SOLID PURE BLACK (#000000, uniformly, no pattern,
no checkerboard).
The image must TILE PERFECTLY horizontally: the left edge continues the right edge."""),
]

def key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def gen(name, prompt):
    imgs = [{'type': 'text', 'text': prompt}]
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
    (OUT / f'{name}.png').write_bytes(base64.b64decode(out[0]['image_url']['url'].split(',', 1)[1]))

def crop_band(path):
    """Key the solid-black sky via flood fill from the top/left/right, crop the
    canopy band, save webp."""
    from PIL import Image, ImageFilter
    import numpy as np
    from collections import deque
    im = Image.open(path).convert('RGBA')
    a = np.asarray(im).astype(np.int16)
    lum = a[..., :3].max(axis=2)
    dark = lum < 40
    h, w = dark.shape
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        if dark[0, x] and not bg[0, x]: bg[0, x] = True; q.append((0, x))
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
    alpha = np.asarray(img)[..., 3]
    rows_op = np.where(alpha.max(axis=1) > 20)[0]
    top = max(0, int(np.percentile(rows_op, 6)))
    band = img.crop((0, top, img.width, min(img.height, top + 640)))
    band.save(path.with_suffix('.webp'), 'WEBP', quality=88)
    band.save(path)
    return band.size

if __name__ == '__main__':
    for name, prompt in PLATES:
        for attempt in (1, 2):
            try:
                gen(name, prompt)
                print(name, 'band:', crop_band(OUT / f'{name}.png'))
                break
            except Exception as e:
                print(f'{name} attempt {attempt} failed: {e}', file=sys.stderr)
                if attempt == 2: raise
                time.sleep(5)
