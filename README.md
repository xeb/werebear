# Werebear — The Ursa Codex

An atmospheric visual study and curated codex of the **Top 10 Coolest Werebears** across classic fantasy art, animation & cartoons, and cinema-grade photorealism.

Created as the thematic sister project to [Werwulf](https://werwulf.xeb.ai) (`~/p/werwulf` and `~/x/werwulf.html`).

---

## The Ten Folios

| Folio | Title | Category | Artist / Source | Medium |
| :--- | :--- | :--- | :--- | :--- |
| **I** | **The Right to Bear Arms** | Classic Fantasy Art | Carl Critchlow (*Magic: The Gathering*, Odyssey 2001) | Acrylic & Ink Illustration |
| **II** | **The Primal Unleashed** | Dark Fantasy Art | Filip Burburan (*Magic: The Gathering*, Eternal Masters 2016) | Digital Gouache |
| **III** | **The Polar Shaman** | High Fantasy Art | Borja Pindado (*Commander Legends: Battle for Baldur's Gate*, 2022) | Digital Masterwork |
| **IV** | **The Spirit of Bǫðvarr Bjarki** | Mythic Norse Saga | Classical Saga Oil Study (*Hrólfs saga kraka* & *Bjarkamál*) | Epic Oil Painting |
| **V** | **The Boreal Apex** | Photorealistic | Boreal Wildlife Specimen Archive | 8K Photorealistic Render |
| **VI** | **The River Sovereign** | Photorealistic | Pacific Northwest Wilderness Study | High-Speed Action Photography |
| **VII** | **The Earth Warder** | Epic Game Art | High-Fantasy Key Art Studio (Inspired by WoW Mage Tower & Diablo) | Digital Key Art |
| **VIII** | **Saturday Morning Savage** | 1990s Action Cartoon | Vintage Cel-Shade Animation Studio | Cel-Shaded Keyframe |
| **IX** | **The Twilight Sentinel** | Animated Feature Concept | Feature Animation Visual Development Team | Lyrical Concept Art |
| **X** | **The Ruined Abbey** | Gothic Horror Comic | Graphic Novel Ink Master (Mignola / Chiaroscuro Style) | Heavy Ink & Chiaroscuro |

---

## Features

- **Interactive Scene Switcher**: Switch the hero background dynamically across all 10 werebears.
- **Still-Only Mode**: Hide all UI for distraction-free art and wallpaper appreciation (`View Still`).
- **Category Filtering**: Seamless instant filtering by *Fine Art & Lore*, *Photorealistic*, *Cartoons & Comics*, and *Game Art*.
- **Fullscreen Lightbox**: Keyboard-navigable (`←` / `→` arrows, `Esc` to dismiss) high-resolution modal with complete lore annotations.
- **Dual Wallpaper Downloads**: Every piece is rendered into:
  - **Desktop Wallpaper**: 1920 × 1080 (16:9)
  - **Mobile / iPhone Wallpaper**: 1320 × 2868 (9:19.5, centered lockscreen composition)
  - **Master Artwork**: Direct lossless image file
- **Scholarly Bestiary & Marginalia**:
  - Latin source folio: *De Hominibus Qui Fuerunt Ursi* (Brother Aelfric of Northumbria, c. 1240).
  - 6 deep marginalia notes exploring the Old Norse *ber-sarkr* ("bear-shirt") etymology, Tolkien's Beorn, D&D's Lawful Good alignment divergence, Carl Critchlow's legendary pun, and Blizzard's Mage Tower "Hulk Bear".

---

## Wallpaper Generator

Generate or refresh all desktop, mobile, and WebP previews:

```bash
python3 build_wallpapers.py
```

Outputs are automatically organized into `assets/wallpapers/` and `assets/*.webp`.

---

## Deployment

Deployable to **Cloudflare Pages** with zero build steps:

```bash
wrangler pages deploy . --project-name=werebear-xeb --branch=main --commit-dirty=true
```

Or copy directly into `~/x/` (`xeb.ai`) for single-domain routing.
