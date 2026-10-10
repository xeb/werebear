#!/usr/bin/env python3
"""Regenerate the Stage 4 titan sprite with nano banana (Gemini image) via
OpenRouter: no fire breathing, full figure uncropped, on a solid white
backdrop that we key out to true alpha."""
import base64, json, os, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'site/art/assets/transform_stage4.png'
OUT = ROOT / 'site/art/assets/transform_stage4.png'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")

MODEL = sys.argv[1] if len(sys.argv) > 1 else 'google/gemini-3-pro-image'

PROMPT = """Edit this character sprite. Keep the character design, pose style, fur,
leather harness, bone talismans and the amber lightning energy veins in the fur
EXACTLY as they are. Changes:
1. REMOVE the fire vortex / flames coming from the mouth completely. The mouth is
   open in a roar but emits nothing — no fire, no embers, no smoke, no sparks from the mouth.
2. Zoom out / reframe so the ENTIRE figure fits comfortably: nothing cut off at any
   canvas edge — full head with ears, both arms, both legs, all claws, and empty
   margin on all four sides.
3. Full body visible, standing on an implied ground line near the bottom edge (with margin).
4. Solid pure white (#FFFFFF) background, no gradient, no shadow, no vignette."""

def get_key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def main():
    raw = base64.b64encode(SRC.read_bytes()).decode()
    body = {
        'model': MODEL,
        'messages': [{'role': 'user', 'content': [
            {'type': 'text', 'text': PROMPT},
            {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{raw}'}},
        ]}],
    }
    req = urllib.request.Request(
        'https://openrouter.ai/api/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {get_key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    msg = data['choices'][0]['message']
    imgs = msg.get('images') or []
    if not imgs:
        print('NO IMAGE. text:', (msg.get('content') or '')[:500]); sys.exit(1)
    url = imgs[0]['image_url']['url']
    b64 = url.split(',', 1)[1]
    tmp = OUT.with_suffix('.gen.png')
    tmp.write_bytes(base64.b64decode(b64))
    print('saved', tmp, tmp.stat().st_size)

if __name__ == '__main__':
    main()
