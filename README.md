# Wear the Bear 🐻

**Play it: [werebear.xeb.ai](https://werebear.xeb.ai/)**

*Wake with nothing. Earn the fury.*

A Norse-folklore action-RPG platformer for the browser. You are **Bjarki**, the last
*hamrammr* of the Bearkin, waking half-naked in a rotting forest. Fight corrupted
creatures to fill the **Rage** bar, spend it in small bites (a bear paw for one
crushing swipe), or save it all — and when it's full, hold the button and **wear
the bear**: for ninety seconds you are a 2.5-metre Primalist Titan who fells
background trees, and the forest **stays felled** even after you die.

- Full design spec & acceptance criteria: [GAME.md](GAME.md) (v1.0, locked)
- Art review & live engine-moves simulator: [werebear.xeb.ai/art/](https://werebear.xeb.ai/art/)
- The lore gallery, *The Ursa Codex*: [werebear.xeb.ai/research/](https://werebear.xeb.ai/research/)
- The WoW Guardian Druid Top 20: [werebear.xeb.ai/guardian/](https://werebear.xeb.ai/guardian/)

---

## The game

| | |
|---|---|
| **One level** | *The Elderwold* — ~45 screens: waking hollow → thicket → den → deeper wood → trappers' run → the Rotted Clearing |
| **Day/night cycle** | 10-minute clock; the rot is bolder at night, Rage builds ×1.5, moonrise grants +25 |
| **Rage** | 4 segments of 25. Tap = a directional bear skill (Swipe / Slam / Roar). Hold at 100 = the 90-second Titan |
| **Wounds** | The bear takes no Health damage — wounds accrue instead and come due when the shape breaks |
| **Persistent world** | Felled trees become permanent bridges, shortcuts and weapons. Death strips your gear; the world remembers |
| **Boss** | Old Thorngut, a rot-boar matriarch with three phases — beatable without transforming, if you're brave |
| **Checks** | Souls-like tells, recoveries, dens for checkpoints, and sleep that skips to dawn |

Death respawn: last lit den, at dawn, loincloth only, 0 Rage — but every
felled tree, broken wall and opened shortcut survives.

## Controls

Desktop, gamepad and two-thumb landscape touch are all supported.

| Key | Action |
|---|---|
| A/D or ←/→ | Move |
| Space / W | Jump |
| S | Crouch / crawl |
| J | Strike |
| K | Heavy (hold to charge) |
| L / Shift | Dodge (bear: Charge) · hold toward an attack = parry |
| U | Throw (bear: Grab & Hurl) |
| **I** | **Tap: bear skill · Hold at 100 Rage: WEAR THE BEAR · Hold as bear: release** |
| E | Interact / sleep at dens |
| Esc | Pause |

## Technical highlights

- **No build step, no runtime dependencies** — vanilla ES modules served statically
  (Cloudflare Pages), with an offline service-worker shell.
- **Deterministic 60 Hz simulation** (`site/sim/`) fully isolated from DOM, Canvas,
  audio and wall-clock time, with a seeded RNG — reproducible runs and headless tests.
- **Renderer reads, never owns** gameplay truth (`site/render/`): 1280×720 logical
  canvas, DPR-aware backing, parallax forest, persistent tree layer, day/night grading.
- **Sprite art pipeline** (first slice of spec §12.2): AI-generated transparent
  character art driven by *key poses + procedural motion* — pose cross-fades, run
  bounce, lean, squash & stretch, an eased human→bear morph, and the 10% bear zoom-out.
- **Synthesised audio** (`site/audio/`): adaptive Web Audio layers (explore, combat,
  rage heartbeat, full berserk war-drums), no licensed tracks.
- **Validated saves**: versioned localStorage schema, fail-closed migration, safe respawn.
- **Accessibility**: reduced-motion mode, Assist toggle, readable pose+sound+colour tells.

## Development

```sh
npm test                                        # 48 deterministic sim/input/save/shell tests
python3 -m http.server -d site                  # serve locally (any static server works)
python3 build_wallpapers.py                     # regenerate codex wallpapers into site/research/assets/
```

```
GAME.md               full design spec + project history (not deployed)
docs/art-prompts.json AI-art prompt registry (spec §12.2)
site/                 Cloudflare Pages deploy root (werebear.xeb.ai)
  index.html          game shell, HUD, menus, touch controls
  main.js             fixed-step loop and composition root
  sim/                deterministic world + save validation
  render/             canvas renderer + sprite animator
  input/              keyboard, gamepad, multi-pointer touch
  audio/              synthesised Web Audio
  art/                transparent character sprites + engine-moves simulator
  research/           The Ursa Codex gallery
  sw.js               offline game shell
tools/                art regeneration / background-keying / morph-builder scripts
tests/                node --test suites for the simulation and shell
```

Debug flags: `?hitboxes`, `?trees`, `?rage`, `?time=night`, `?cp=den`, `?seed=N`.

## Art & attribution

All game concept art, sprites and cut-ins are **AI-generated** (see
`docs/art-prompts.json`; the Stage 4 Titan was regenerated with nano banana /
Gemini image). Folios I–III of the Ursa Codex are real Magic: The Gathering card
art, © the credited artists and Wizards of the Coast — their credits are kept
deliberately.

| Folio | Title | Source |
| :--- | :--- | :--- |
| I–III | The Right to Bear Arms · The Primal Unleashed · The Polar Shaman | Published MTG card art: Carl Critchlow (Odyssey 2001), Filip Burburan (Eternal Masters 2016), Borja Pindado (Commander Legends 2022) |
| IV–X | The Spirit of Bǫðvarr Bjarki · The Boreal Apex · The River Sovereign · The Primalist Titan · Saturday Morning Savage · The Twilight Sentinel · The Ruined Abbey | AI-generated, no artist credit |

Folio VII, *The Primalist Titan*, is the visual reference for the bear form, the
title-screen hero and the transformation cut-in.

## Deploy

```sh
wrangler pages deploy site --project-name=werebear-xeb --branch=main --commit-dirty=true
```

---

Sister project to [Werwulf](https://werwulf.xeb.ai). Built by [xeb](https://xeb.ai).
