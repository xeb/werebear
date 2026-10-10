#!/usr/bin/env python3
"""Generate transparent sprite art for every remaining game asset (enemies,
boss, trees, checkpoint stones) with nano banana via OpenRouter, keyed to
true alpha by tools/keyout_white.py. Style-anchored on the werebear sprite."""
import base64, json, subprocess, sys, time, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'site/art/assets'
REF = OUT / 'werebear_idle.png'
KEY_CMD = ("sudo systemd-creds decrypt --name=openrouter-tmux-not-invented-here.cred "
           "/home/xeb/.config/blue/credentials/openrouter-tmux-not-invented-here.cred -")
MODEL = 'google/gemini-3-pro-image'

STYLE = """Match the painterly semi-realistic 3D-render style of the reference
image: dark charcoal-brown grizzly fur, warm amber rim light, muted Nordic
folklore palette (moss green, ochre, bone, charcoal), soft painterly shading.
All on a solid pure white background, full figure with empty margin on all
four sides (nothing cut off at any edge), single character centred, standing
on an implied ground line, no shadow, no vignette."""

ASSETS = [
    ('rot_grub', 'A single fat CORRUPTED GRUB monster: pale grey-green segmented worm, bloated, curled lunge pose, small black eyes, wet glistening skin with faint violet bruise tint (the rot). Side view. Game enemy sprite.', 512),
    ('sporecap', 'A single CORRUPTED SPORE FUNGUS creature: short mushroom-monster, bruised violet-grey cap with glowing pale pustules, stubby trunk body, small mean eyes. Slight forward menace pose. Game enemy sprite.', 512),
    ('mire_hound', 'A single CORRUPTED BOG HOUND: lean wolf-like predator of grey-green matted fur, dripping moss and mud, bruised violet accents, low stalking crouch, teeth bared, sickly pale eyes. Side view. Game enemy sprite.', 512),
    ('gloom_moth', 'A single NIGHT MOTH monster: large grey-blue moth, dull phosphorescent wing spots, small dark body, wings spread wide, hovering pose. Cold pale glow. Game enemy sprite.', 512),
    ('husk_stag', 'A single HOLLOW STAG monster: gaunt elk with cracked grey-brown hide, patchy fur, too many jagged antlers, pale glowing eyes, standing tall. The rot shows as grey-green staining. Game enemy sprite.', 640),
    ('hollow_trapper', 'A single HOLLOW TRAPPER hunter-monster: gaunt hunched humanoid trapper in desaturated blue-grey weathered leathers and rusted iron jaw-trap paraphernalia, coiled net in one hand, rusted iron teeth on its belt, pale eyes under a hood. Game enemy sprite.', 560),
    ('rotwood_brute', 'A single ROTWOOD BRUTE monster: massive hulking bipedal creature with thick grey bark-like bark-plated hide growing over a beast frame, glowing fungal pustules in the bark, huge arms, tiny pale eyes, rooted super-armour stance. Game enemy sprite.', 640),
    ('old_thorngut', 'A single huge ROT-BOAR BOSS: enormous boar matriarch, dark bristled hide with long thorns and brambles grown through the skin, bruised violet rot patches glowing faintly, massive curved tusks, small furious pale eyes, wide stance facing left. Imposing, 900-hit-point boss energy. Game boss sprite.', 768),
    ('tree_elderwood', 'A single massive healthy ELDERWOOD TREE: towering ancient oak, dark mossy green canopy, sturdy bark-brown trunk, subtle runic knots in the bark, full spread of branches. Front view, whole tree from roots to crown visible with margin. Game background-layer sprite.', 1024),
    ('tree_sapling', 'A single CORRUPTED ROTWOOD SAPLING: small sick grey-barked young tree, wilting, faint glowing fungal pustules on the trunk, sparse pale leaves. Whole tree visible with margin. Game background-layer sprite.', 512),
    ('tree_bee', 'A single BEE-TREE: medium wild tree with a dark hollow knothole, a small golden honeycomb glowing at the hollow, a few fat bees circling it. Whole tree visible with margin. Game background-layer sprite.', 640),
    ('checkpoint_den', 'A single CARVED BEAR-SHRINE CHECKPOINT STONE: standing mossy granite stone shaped and carved with a bears-head motif, faint amber rune glow in the carved lines, small offerings at its base, cave-mouth feel. Unlit-when-cold look. Game checkpoint sprite.', 512),
]

def key():
    import subprocess
    return subprocess.run(KEY_CMD.split(), capture_output=True, text=True).stdout.strip()[-73:]

def gen(name, prompt, size):
    raw = base64.b64encode(REF.read_bytes()).decode()
    body = {'model': MODEL, 'messages': [{'role': 'user', 'content': [
        {'type': 'text', 'text': f"{prompt}\n\n{STYLE}"},
        {'type': 'image_url', 'image_url': {'url': f'data:image/png;base64,{raw}'}},
    ]}]}
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions',
        data=json.dumps(body).encode(),
        headers={'Authorization': f'Bearer {key()}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=300) as r:
        data = json.load(r)
    imgs = data['choices'][0]['message'].get('images') or []
    if not imgs: raise RuntimeError('no image returned')
    b64 = imgs[0]['image_url']['url'].split(',', 1)[1]
    p = OUT / f'{name}.png'
    p.write_bytes(base64.b64decode(b64))
    return p

def main():
    only = sys.argv[1:] or None
    for name, prompt, size in ASSETS:
        if only and name not in only: continue
        out = OUT / f'{name}.png'
        if out.exists():
            print(f'skip (exists): {name}'); continue
        for attempt in (1, 2, 3):
            try:
                p = gen(name, prompt, size)
                subprocess.run([sys.executable, str(ROOT / 'tools/keyout_white.py'), str(p)], check=True)
                print(f'generated: {name}')
                break
            except Exception as e:
                print(f'{name} attempt {attempt} failed: {e}', file=sys.stderr)
                if attempt == 3: raise
                time.sleep(5)

if __name__ == '__main__':
    main()
