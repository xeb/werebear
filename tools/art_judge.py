#!/usr/bin/env python3
"""Art judge: an automated art-direction review of Wear the Bear's visual
output. Scores four weighted rows (0-4 each) against the DARK EPIC bar:
  tone      — dark, grim, epic Norse horror; nothing cheerful or silly
  silhouette— characters read clearly at game scale
  cohesion  — one consistent painted style across world and sprites
  craft     — clean cutouts, framing, no artifacts
Evidence: sprite contact sheet + live in-game captures. Writes
artifacts/art-judgment.json. Vision model via OpenRouter.
Usage: python3 tools/art_judge.py [model]
"""
import base64, json, sys, subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
EV = ROOT / 'artifacts/art-evidence'
OUT = ROOT / 'artifacts/art-judgment.json'
MODEL = sys.argv[1] if len(sys.argv) > 1 else 'google/gemini-2.5-flash'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")

def key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def contact_sheet():
    """One sheet with every character sprite on a mid-dark backdrop."""
    from PIL import Image
    A = ROOT / 'site/art/assets'
    names = ['human_idle', 'human_run', 'werebear_idle', 'werebear_maul', 'werebear_roar',
             'rot_grub', 'sporecap', 'mire_hound', 'gloom_moth', 'husk_stag',
             'hollow_trapper', 'rotwood_brute', 'old_thorngut', 'transform_stage4',
             'tree_elderwood', 'tree_sapling', 'tree_bee', 'checkpoint_den']
    W = 240
    cols, rows = 6, 3
    sheet = Image.new('RGB', (cols * W, rows * W), (22, 30, 33))
    for i, n in enumerate(names):
        p = A / f'{n}.png'
        if not p.exists(): continue
        im = Image.open(p).convert('RGBA')
        r = (W - 10) / max(im.size)
        im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
        sheet.paste(im, ((i % cols) * W + (W - im.width) // 2, (i // cols) * W + (W - im.height) // 2), im)
    out = EV / 'contact_sheet.jpg'
    sheet.save(out, quality=88)
    return out

def main():
    sheet = contact_sheet()
    shots = [EV / 'hollow_night.png', EV / 'deeper_wood_night.png', EV / 'bear_form.png']
    content = [{'type': 'text', 'text': f"""You are a demanding AAA art director reviewing Wear the Bear, a dark Norse-horror action game ("grim folklore, amber sun and silver moon, mud and moss — NOT cute, NOT silly"). Image 1 is a contact sheet of all character/environment sprites (row-major: human idle/run, werebear idle/maul/roar, rot grub, sporecap, mire hound, gloom moth, husk stag, hollow trapper, rotwood brute, Old Thorngut boss, stage-4 titan, elderwood/sapling/bee trees, checkpoint shrine). Images 2-4 are live in-game captures (night waking hollow, deeper wood at night, bear form).

Judge STRICTLY against a dark-and-epic bar. Score each row 0-4 (4 = shippable AAA quality, 3 = strong, 2 = passable, 1 = weak, 0 = fails the bar):

tone       (25%): dark, grim, epic horror mood across sprites AND world. Penalize: cheerful colours, flat cartoon shapes, toy-like proportions, cute details, bright saturated greens/yellows that read as friendly.
silhouette (25%): every character reads instantly as a clear dark shape at game scale (sprites are drawn ~40-130px tall in-game).
cohesion   (20%): one consistent painted style and palette across sprites and the world layer; flag any sprite that looks like it is from a different game.
craft      (30%): clean alpha cutouts (no halos/white pockets), correct framing (nothing cropped), no malformed anatomy/artifacts.

In your evidence, name specific sprites and be brutal and specific. Also list up to 6 prioritized concrete fixes (which asset, what change, e.g. "tree_elderwood: repaint darker and more epic").

Answer ONLY with JSON:
{{"rows":[{{"id":"tone","rating":0,"evidence":"..."}},{{"id":"silhouette","rating":0,"evidence":"..."}},{{"id":"cohesion","rating":0,"evidence":"..."}},{{"id":"craft","rating":0,"evidence":"..."}}],"fixes":["..."]}}""" }]
    for img in [sheet, *shots]:
        raw = base64.b64encode(img.read_bytes()).decode()
        content.append({'type': 'image_url', 'image_url': {'url': f'data:image/jpeg;base64,{raw}'}})
    body = {'model': MODEL, 'messages': [{'role': 'user', 'content': content}]}
    req = urllib = None
    import urllib.request
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    text = data['choices'][0]['message'].get('content') or ''
    j = text[text.find('{'):text.rfind('}') + 1]
    parsed = json.loads(j)
    parsed['model'] = MODEL
    OUT.write_text(json.dumps(parsed, indent=2))
    for row in parsed['rows']:
        print(row['id'].ljust(11), f"{row['rating']}/4", '|', row['evidence'][:100])
    for i, f in enumerate(parsed.get('fixes', []), 1):
        print(f'fix {i}:', f[:120])

if __name__ == '__main__':
    main()
