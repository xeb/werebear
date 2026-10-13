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
    names = [
        'human_idle', 'human_run', 'human_attack', 'human_dodge', 'human_jump', 'human_halfshift',
        'human_lean_crouch', 'transform_stage1', 'transform_stage4', 'werebear_idle', 'werebear_maul', 'werebear_slam',
        'werebear_roar', 'rot_grub', 'sporecap', 'mire_hound', 'gloom_moth', 'husk_stag',
        'hollow_trapper', 'rotwood_brute', 'old_thorngut', 'tree_elderwood', 'tree_sapling', 'checkpoint_den'
    ]
    W = 300
    cols, rows = 6, 4
    sheet = Image.new('RGB', (cols * W, rows * W), (22, 30, 33))
    for i, n in enumerate(names):
        p = A / f'{n}.png'
        if not p.exists(): continue
        im = Image.open(p).convert('RGBA')
        r = (W - 14) / max(im.size)
        im = im.resize((max(1, int(im.width * r)), max(1, int(im.height * r))), Image.LANCZOS)
        sheet.paste(im, ((i % cols) * W + (W - im.width) // 2, (i // cols) * W + (W - im.height) // 2), im)
    out = EV / 'contact_sheet.jpg'
    sheet.save(out, quality=95)
    return out

def main():
    sheet = contact_sheet()
    shots = [EV / 'hollow_night.png', EV / 'deeper_wood_night.png', EV / 'bear_form.png']
    content = [{'type': 'text', 'text': f"""You are an experienced game art director reviewing Wear the Bear, a dark Norse-horror 2D action-platformer ("grim folklore, amber sun and silver moon, mud and moss — NOT cute, NOT silly"). Image 1 is a 24-sprite contact sheet of character and environment sprites (6x4 grid: human idle/run/attack/dodge/jump/halfshift, crouch, transform stage 1 & 4, werebear idle/maul/slam/roar, rot grub, sporecap, mire hound, gloom moth, husk stag, hollow trapper, rotwood brute, Old Thorngut boss, elderwood/sapling trees, checkpoint shrine). Images 2-4 are live in-game captures (night waking hollow, deeper wood at night, bear form in boss clearing).

Score each row 0-4 using these calibrated anchors:
  4 = Excellent: cohesive, atmospheric dark-fantasy 2D game art; clear silhouettes and clean cutouts across the roster.
  3 = Strong: meets the grim dark-Norse horror bar with only minor stylistic or readability nitpicks on 1-2 assets.
  2 = Passable/Mixed: noticeable style clashes, flat placeholder elements, or moderate readability issues.
  1 = Weak: cheerful/cartoonish colours, broken cutouts, or disparate asset-flip look.
  0 = Fails the bar: broken/missing art.

Criteria:
tone       (25%): dark, grim, epic horror mood across sprites AND world. Penalize cheerful colours, flat cartoon shapes, toy-like proportions, or cute details.
silhouette (25%): characters read clearly as distinct shapes at game scale (~45-210px tall in-game) against the forest backdrop.
cohesion   (20%): consistent dark painterly style and palette (charcoal, weathered bone, muted moss, bruised violet/amber rot) across sprites and world layers.
craft      (30%): clean alpha cutouts (no white halos/boxes), good framing (feet/roots grounded, nothing awkwardly cropped), solid anatomy.

In your evidence, cite specific sprites and in-game captures honestly (praising what works and noting any real flaws). Also list up to 4 concrete polish suggestions.

Answer ONLY with JSON:
{{"rows":[{{"id":"tone","rating":0,"evidence":"..."}},{{"id":"silhouette","rating":0,"evidence":"..."}},{{"id":"cohesion","rating":0,"evidence":"..."}},{{"id":"craft","rating":0,"evidence":"..."}}],"fixes":["..."]}}""" }]
    for img in [sheet, *shots]:
        raw = base64.b64encode(img.read_bytes()).decode()
        mime = 'image/png' if img.suffix.lower() == '.png' else 'image/jpeg'
        content.append({'type': 'image_url', 'image_url': {'url': f'data:{mime};base64,{raw}'}})
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
