# Werebear — game + Ursa Codex

`werebear.xeb.ai` hosts two things:

| URL | What | Source |
| :--- | :--- | :--- |
| `https://werebear.xeb.ai/` | **Wear the Bear**: a werebear action-RPG platformer. Currently a "coming soon" page. Design spec: [GAME.md](GAME.md). | `site/index.html` |
| `https://werebear.xeb.ai/research/` | **The Ursa Codex**: a top-10 werebear art gallery. | `site/research/` |

`site/` is the Cloudflare Pages deploy root. Everything outside it (this README, `GAME.md`, `build_wallpapers.py`) is not published.

Created as the thematic sister project to [Werwulf](https://werwulf.xeb.ai) (`~/p/werwulf` and `~/x/werwulf.html`).

---

## The Ten Folios

Folios I–III are published Magic: The Gathering card art, © the credited artists and Wizards of the Coast. Folios IV–X are AI-generated images and carry no artist credit.

| Folio | Title | Category | Artist / Source | Medium |
| :--- | :--- | :--- | :--- | :--- |
| **I** | **The Right to Bear Arms** | Classic Fantasy Art | Carl Critchlow (*Magic: The Gathering*, Odyssey 2001) | Acrylic & Ink Illustration |
| **II** | **The Primal Unleashed** | Dark Fantasy Art | Filip Burburan (*Magic: The Gathering*, Eternal Masters 2016) | Digital Gouache |
| **III** | **The Polar Shaman** | High Fantasy Art | Borja Pindado (*Commander Legends: Battle for Baldur's Gate*, 2022) | Digital |
| **IV** | **The Spirit of Bǫðvarr Bjarki** | Mythic Norse Saga | AI-generated (inspired by *Hrólfs saga kraka*) | Oil-painting style |
| **V** | **The Boreal Apex** | Photorealistic | AI-generated | Photoreal style |
| **VI** | **The River Sovereign** | Photorealistic | AI-generated | Photoreal style |
| **VII** | **The Primalist Titan** | 3D Character Art | AI-generated (inspired by *Last Epoch*'s Primalist) | 3D-render style |
| **VIII** | **Saturday Morning Savage** | 1990s Action Cartoon | AI-generated | 90s cartoon style |
| **IX** | **The Twilight Sentinel** | Animated Feature Concept | AI-generated | Animated-feature style |
| **X** | **The Ruined Abbey** | Gothic Horror Comic | AI-generated | Gothic comic style |

Folio VII is the visual reference for the game's bear form, and the hero image on the coming-soon page (`site/assets/titan.*`).

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
- **Bestiary & Marginalia**:
  - A Latin "source folio", *De Hominibus Qui Fuerunt Ursi*. This is invented flavour text, not a real manuscript.
  - 6 marginalia notes exploring the Old Norse *ber-sarkr* ("bear-shirt") etymology, Tolkien's Beorn, the original D&D werebear's good alignment, Carl Critchlow's legendary pun, and Blizzard's Mage Tower "Hulk Bear".

---

## Wallpaper Generator

Generate or refresh all desktop, mobile, and WebP previews:

```bash
python3 build_wallpapers.py
```

Outputs are written to `site/research/assets/wallpapers/` and `site/research/assets/*.webp`.

---

## Deployment

Deployable to **Cloudflare Pages** with zero build steps. Deploy `site/`, not the repo root:

```bash
wrangler pages deploy site --project-name=werebear-xeb --branch=main --commit-dirty=true
```

The codex is also mirrored to `~/x/werebear/` (`xeb.ai/werebear/`): `rsync -a --delete site/research/ ~/x/werebear/`.
