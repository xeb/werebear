#!/usr/bin/env python3
"""Regenerate named art assets with an edit prompt (input = current sprite,
style anchor = werebear folio), then key out the white backdrop.
Usage: python3 tools/regen_asset.py NAME 'edit instructions' [NAME 'prompt' ...]"""
import base64, json, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'site/art/assets'
REF = OUT / 'werebear_idle.png'
MODEL = 'google/gemini-3-pro-image'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")

TAIL = """
Match the painterly semi-realistic 3D-render style of the reference image
(dark charcoal-brown grizzly fur, warm amber rim light, muted Nordic folklore
palette). Keep the subject's identity, pose and framing recognizably the same
character. Solid pure white background, full figure with empty margin on all
four sides, no shadow, no vignette."""

def key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def gen(name, prompt):
    src = OUT / f'{name}.png'
    imgs = [{'type': 'text', 'text': prompt + '\n' + TAIL}]
    for path in (src, REF):
        raw = base64.b64encode(path.read_bytes()).decode()
        imgs.append({'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{raw}'}})
    body = {'model': MODEL, 'messages': [{'role': 'user', 'content': imgs}]}
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    out = data['choices'][0]['message'].get('images') or []
    if not out: raise RuntimeError('no image: ' + (data['choices'][0]['message'].get('content') or '')[:200])
    (OUT / f'{name}.png').write_bytes(base64.b64decode(out[0]['image_url']['url'].split(',', 1)[1]))

if __name__ == '__main__':
    args = sys.argv[1:]
    assert len(args) % 2 == 0, 'name prompt pairs expected'
    for i in range(0, len(args), 2):
        name, prompt = args[i], args[i + 1]
        for attempt in (1, 2):
            try:
                gen(name, prompt)
                subprocess.run([sys.executable, str(ROOT / 'tools/keyout_white.py'), str(OUT / f'{name}.png')], check=True)
                print('regenerated:', name)
                break
            except Exception as e:
                print(f'{name} attempt {attempt} failed: {e}', file=sys.stderr)
                if attempt == 2: raise
                time.sleep(5)
