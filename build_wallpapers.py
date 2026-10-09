"""Generate desktop wallpapers (1920x1080), iPhone wallpapers (1320x2868), and optimized WebP preview assets."""

import os
from pathlib import Path
from PIL import Image, ImageFilter, ImageOps

ASSETS = Path('/home/xeb/p/werebear/assets')
OUT_DIR = ASSETS / 'wallpapers'
OUT_DIR.mkdir(exist_ok=True)

ITEMS = [
    ("01_carl_critchlow_odyssey", "The Right to Bear Arms (Carl Critchlow)"),
    ("02_filip_burburan_eternal", "The Primal Feral (Filip Burburan)"),
    ("03_borja_pindado_polar", "The Polar Shaman (Borja Pindado)"),
    ("04_norse_bodvar_bjarki_spirit", "The Spirit of Bodvar Bjarki"),
    ("05_photoreal_blizzard_apex", "The Boreal Apex"),
    ("06_photoreal_river_rapids", "The River Sovereign"),
    ("07_primalist_werebear_ann_novak", "The Primalist Titan (Ann Novak / Last Epoch)"),
    ("08_90s_action_cartoon_werebear", "Saturday Morning Savage"),
    ("09_animated_feature_werebear", "The Twilight Sentinel"),
    ("10_gothic_comic_graphic_novel", "The Ruined Abbey"),
]

def make_desktop_wallpaper(src_img: Image.Image, target_size=(1920, 1080)) -> Image.Image:
    """Create a 16:9 1920x1080 wallpaper, filling canvas cleanly with blurred backdrop if needed."""
    tw, th = target_size
    src_ratio = src_img.width / src_img.height
    target_ratio = tw / th
    
    if abs(src_ratio - target_ratio) < 0.05:
        # Close to 16:9 already (e.g. 1376x768 is ~1.792 vs 1.777)
        return ImageOps.fit(src_img, target_size, method=Image.Resampling.LANCZOS)
    else:
        # Dramatic difference (e.g. card art crop). Create blurred atmospheric backdrop + centered artwork.
        bg = ImageOps.fit(src_img, target_size, method=Image.Resampling.BILINEAR)
        bg = bg.filter(ImageFilter.GaussianBlur(radius=25))
        # darken bg slightly
        bg = Image.blend(bg, Image.new('RGB', target_size, (10, 12, 11)), 0.55)
        
        # Scale foreground to fit height with some padding
        pad_h = int(th * 0.90)
        fg_w = int(src_img.width * (pad_h / src_img.height))
        fg = src_img.resize((fg_w, pad_h), resample=Image.Resampling.LANCZOS)
        
        pos_x = (tw - fg_w) // 2
        pos_y = (th - pad_h) // 2
        bg.paste(fg, (pos_x, pos_y))
        return bg

def make_iphone_wallpaper(src_img: Image.Image, target_size=(1320, 2868)) -> Image.Image:
    """Create a portrait iPhone wallpaper (1320x2868) with intelligent composition."""
    tw, th = target_size
    # Create rich atmospheric blurred background
    bg = ImageOps.fit(src_img, target_size, method=Image.Resampling.BILINEAR)
    bg = bg.filter(ImageFilter.GaussianBlur(radius=30))
    bg = Image.blend(bg, Image.new('RGB', target_size, (8, 10, 9)), 0.6)
    
    # Scale foreground to fit width nicely (85% of target width)
    fg_w = int(tw * 0.92)
    fg_h = int(src_img.height * (fg_w / src_img.width))
    fg = src_img.resize((fg_w, fg_h), resample=Image.Resampling.LANCZOS)
    
    # Position in upper-middle half for mobile lockscreen ergonomics
    pos_x = (tw - fg_w) // 2
    pos_y = int(th * 0.30)
    bg.paste(fg, (pos_x, pos_y))
    return bg

print("Generating wallpapers...")
for base_name, label in ITEMS:
    src_path = ASSETS / f"{base_name}.jpg"
    if not src_path.exists():
        print(f"Skipping {src_path} (not found)")
        continue
    
    with Image.open(src_path) as img:
        img = img.convert('RGB')
        
        # 1. Desktop Wallpaper (1920x1080)
        desktop_img = make_desktop_wallpaper(img, (1920, 1080))
        desktop_out = OUT_DIR / f"{base_name}-desktop-1920x1080.jpg"
        desktop_img.save(desktop_out, quality=94, optimize=True)
        
        # 2. iPhone Wallpaper (1320x2868)
        iphone_img = make_iphone_wallpaper(img, (1320, 2868))
        iphone_out = OUT_DIR / f"{base_name}-iphone-1320x2868.jpg"
        iphone_img.save(iphone_out, quality=94, optimize=True)
        
        # 3. Optimized WebP for fast web display
        webp_out = ASSETS / f"{base_name}.webp"
        img.save(webp_out, 'WEBP', quality=88, method=6)
        
        print(f"Generated assets for {base_name}: desktop, iphone, webp")

print("Done! Wallpapers generated in:", OUT_DIR)
