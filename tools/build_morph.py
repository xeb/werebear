#!/usr/bin/env python3
"""Rebuild transformation_animated.webp/.gif from the 5 transformation
keyframes with smooth alpha cross-fades (bottom-center anchored)."""
from PIL import Image
import numpy as np
from pathlib import Path

A = Path(__file__).resolve().parent.parent / 'site/art/assets'
KEYS = ['transform_stage1', 'transform_stage2', 'transform_stage2_5',
        'transform_stage3', 'transform_stage4']
W, H = 896, 1200
HOLD = 7    # frames to hold each keyframe
FADE = 10   # cross-fade length between keyframes

def load(n):
    im = Image.open(A / f'{n}.png').convert('RGBA')
    if im.size != (W, H):
        im = im.resize((W, H), Image.LANCZOS)
    return im

imgs = [load(n) for n in KEYS]
frames = []
for i, im in enumerate(imgs):
    frames.append(im.copy())
    if i + 1 < len(imgs):
        nxt = imgs[i + 1]
        a = np.asarray(im, dtype=np.float32)
        b = np.asarray(nxt, dtype=np.float32)
        for f in range(1, FADE):
            t = f / FADE
            blended = a * (1 - t) + b * t
            frames.append(Image.fromarray(blended.astype(np.uint8), 'RGBA'))

# last frame: hold the final titan a beat longer
frames.append(imgs[-1].copy())
duration = 80
frames[0].save(A / 'transformation_animated.webp', save_all=True,
               append_images=frames[1:], duration=duration, loop=0, method=4)
pale = [f.convert('P', palette=Image.ADAPTIVE) for f in frames]
frames[0].save(A / 'transformation_animated.gif', save_all=True,
               append_images=pale[1:], duration=duration, loop=0, disposal=2, transparency=0)
print('frames:', len(frames))
