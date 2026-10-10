#!/usr/bin/env python3
"""Key out a solid white backdrop via border flood-fill, with soft feathered
edges, and save transparent PNG + webp."""
import numpy as np
from PIL import Image, ImageFilter
from collections import deque
from pathlib import Path

def keyout(path: Path):
    img = Image.open(path).convert('RGBA')
    a = np.asarray(img).astype(np.int16)
    lum = a[..., :3].min(axis=2)          # min channel: white bg is ~255 everywhere
    bright = lum > 228                    # candidate background
    h, w = bright.shape
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h-1):
            if bright[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w-1):
            if bright[y, x] and not bg[y, x]: bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and bright[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    alpha = np.where(bg, 0, 255).astype(np.uint8)
    # feather 1.5px along the subject boundary only
    alpha = np.asarray(Image.fromarray(alpha, 'L').filter(ImageFilter.GaussianBlur(1.0)))
    core = (~bg) & (lum < 180)
    alpha = np.where(core, 255, alpha).astype(np.uint8)
    # decontaminate white fringe: pull edge pixels toward darker values
    a[..., 3] = alpha
    out = Image.fromarray(a.astype(np.uint8), 'RGBA')
    out.save(path)
    out.save(path.with_suffix('.webp'), 'WEBP', quality=92)
    print(path.name, 'alpha coverage:', (alpha > 0).mean().round(3))

if __name__ == '__main__':
    import sys
    for p in sys.argv[1:]:
        keyout(Path(p))
