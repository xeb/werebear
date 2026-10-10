#!/usr/bin/env python3
"""Remove near-black studio backgrounds from sprite PNGs via border flood-fill,
with soft alpha falloff so fur edges keep a natural feather. Regenerates webp."""
import numpy as np
from PIL import Image
from collections import deque
from pathlib import Path

ART = Path(__file__).resolve().parent.parent / 'site/art/assets'

def remove_black_bg(img: Image.Image) -> Image.Image:
    rgba = img.convert('RGBA')
    a = np.asarray(rgba).astype(np.int16)
    rgb = a[..., :3]
    lum = rgb.max(axis=2)  # max channel: background is near-0 everywhere
    dark = lum < 40        # candidate background pixels
    h, w = dark.shape
    # flood fill from all borders over dark candidates -> true background
    bg = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if dark[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if dark[y, x] and not bg[y, x]:
                bg[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y-1,x),(y+1,x),(y,x-1),(y,x+1)):
            if 0 <= ny < h and 0 <= nx < w and dark[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; q.append((ny, nx))
    # interior dark holes (gaps between legs etc.) connected to bg via flood only
    # soft alpha: inside subject keep full; near border of subject, feather over dark halo
    alpha = np.where(lum < 18, 0, 255).astype(np.uint8)  # kill residual deep-black halo
    alpha[~dark & (lum >= 18)] = 255
    alpha[bg] = 0
    # feather: blur alpha slightly only in the halo band (dark & not subject core)
    core = (~bg) & (lum >= 60)
    from PIL import ImageFilter
    alpha_img = Image.fromarray(alpha, 'L').filter(ImageFilter.GaussianBlur(1.2))
    alpha2 = np.asarray(alpha_img).astype(np.int16)
    alpha = np.where(core, 255, np.maximum(alpha2, np.where(lum >= 18, 0, 0))).astype(np.uint8)
    # don't let blur bleed alpha back into flooded bg
    alpha[bg] = np.minimum(alpha[bg], (lum[bg] * 4).clip(0, 60).astype(np.uint8))
    a[..., 3] = alpha
    out = Image.fromarray(a.astype(np.uint8), 'RGBA')
    return out

def main():
    pngs = sorted(ART.glob('*.png'))
    for p in pngs:
        if 'folio' in p.name:  # full illustration sheet, keep as-is
            continue
        img = Image.open(p)
        if img.mode == 'RGBA' and (np.asarray(img)[..., 3] < 250).mean() > 0.2:
            print(f'skip (already transparent): {p.name}')
            continue
        out = remove_black_bg(img)
        out.save(p)
        out.save(p.with_suffix('.webp'), 'WEBP', quality=92)
        cov = (np.asarray(out)[..., 3] > 0).mean()
        print(f'{p.name}: transparent, opaque coverage {cov:.2f}')

if __name__ == '__main__':
    main()
