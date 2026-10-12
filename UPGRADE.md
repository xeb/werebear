# UPGRADE.md — The Master Blueprint for *Wear the Bear*
## Transforming a Flawed Prototype into an Uncompromising Dark Adventure Masterpiece

> **Direct Prompt Directive**:  
> You are tasked with executing a comprehensive, ground-up overhaul of **Wear the Bear** (`werebear.xeb.ai`).  
> The current version suffers from severe limitations: flat repetitive parallax wallpaper, cardboard-cutout AI sprites that slide without weight, floaty platforming, unresponsive combat lacking visceral punch, and a boring 45-screen linear horizontal treadmill.  
> Your mission is to rebuild this game into an atmospheric, brutally smooth, deeply immersive **Dark Norse Action-Adventure / Metroidvania** in the vein of *Bloodborne*, *Blasphemous*, *Mörk Borg*, and *Hollow Knight*.  
> Follow the precise architectural blueprints, physics formulas, art pipeline requirements, and level designs specified below.

---

## 1. The Diagnosis: Why the Current Game Feels Terrible

| System | Current Implementation | Why It Fails | The Required Upgrade |
| :--- | :--- | :--- | :--- |
| **Art & Sprites** | Static single-frame transparent WebP cutouts with procedural scaling/squashing (`site/render/sprites.js`). | Characters look like cheap paper puppets sliding over butter. Halo artifacts, jagged cutouts, mismatched art styles (whimsical trees vs gritty beasts). | **Hand-crafted multi-frame sprite sheets** with dedicated keyframes for every attack, skid, recovery, and hit-flinch. Dark silhouette clarity with sub-pixel positioning. |
| **World & Environment** | 3 mirrored parallax stripes repeating across 45 screens of a flat floor (`floorY = 610`). | A repetitive horizontal treadmill. Zero sense of exploration, depth, or gothic discovery. | **Interconnected multi-biome adventure map** with vertical caverns, barrows, canopies, and subterranean rot-wells. Dynamic tile-based foregrounds and atmospheric depth. |
| **Physics & Movement** | Basic Euler integration with floaty jump parabola and abrupt linear horizontal velocity. | Floaty, disconnected, and clumsy. Jumping feels like floating in space; landing has zero kinetic weight; footfalls don't plant. | **Tuned kinematic controller**: crisp acceleration curves, variable jump height with heavy gravity on descent, skid dust, landing squash, and ledge climbing. |
| **Combat & "Juice"** | Instant bounding-box collision check with 0.13s camera shake on bear hits; no micro-freezes. | Attacks have no tactile impact. Slashing feels like waving a feather through air; enemies don't stagger or flinch believably. | **Visceral Game Feel Engine**: 3–6 frame hitstop (micro-freezes), directional camera impulse, blood/rot particle splatters, dynamic slash trails, and enemy wall-splat physics. |
| **Transformation** | An opacity crossfade, a 10% camera zoom, and a static cut-in illustration. | Anti-climactic. The transformation should be a terrifying, earth-shattering primal horror, but feels like an awkward sprite swap. | **Cinematic Primal Metamorphosis**: Temporal chromatic aberration, screen desaturation, bone-crunching audio, radial shockwaves felling nearby trees, screen-tearing claws. |
| **Level Structure** | Linear 1D corridor from $x=0$ to $x=57,600$. | Not an adventure game. It's an endless runner. | **Nonlinear Metroidvania World Design**: Hidden routes, vertical shafts, rot-locked shortcuts, secret shrines, and environmental puzzles. |
| **Lighting & Mood** | Flat canvas linear gradients and simple drawn circles for sun/moon. | Looks like MS Paint lighting. No shadows, no god-rays, no bioluminescent gloom, no oppressive darkness. | **2D Dynamic Lighting & Volumetric Mist Engine**: Point lights (torches, glowing amber eyes, rot nodes), directional moonlight shafts, darkness shroud at night. |

---

## 2. Core Pillars of the Dark Adventure Vision

```
                   THE DARK ADVENTURE ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────┐
 │                   THE UNYIELDING NORTH (Atmosphere)              │
 │   Deep Crushed Blacks · Moss & Ash · Iron & Rot · Moonlight     │
 └─────────────────┬─────────────────────────────┬─────────────────┘
                   │                             │
 ┌─────────────────▼───────────────┐ ┌───────────▼─────────────────┐
 │    KINETIC COMBAT ENGINE        │ │  INTERCONNECTED LEVEL DESIGN │
 │ • 3–6 Frame Hitstop on Impact   │ │ • Non-linear Vertical Map   │
 │ • Directional Camera Recoil     │ │ • Destructible Root Gates   │
 │ • Visceral Blood & Splinter FX  │ │ • Secret Barrows & Shrines  │
 │ • Meaty Parry Riposte Windows   │ │ • Shortcut Loops to Dens    │
 └─────────────────┬───────────────┘ └───────────┬─────────────────┘
                   │                             │
 ┌─────────────────▼─────────────────────────────▼─────────────────┐
 │                  PRIMAL SHIFT DUALITY (Gameplay)                │
 │  FRAGILE, LETHAL MAN (Agile, parry, stealth, climb, throw)      │
 │                              VS                                 │
 │  UNSTOPPABLE WEREBEAR TITAN (Colossal weight, tree-shattering)  │
 └─────────────────────────────────────────────────────────────────┘
```

1. **Brutal, Grounded Fragility (The Man)**:
   - Bjarki is human, barefoot, shivering, and mortal. Two direct bites from a Mire Hound should put him at death's door.
   - Every human victory is earned through surgical parries, rolling under lunges, climbing into high branches, and setting traps.
2. **Terrifying Primal Wrath (The Bear)**:
   - When the bear wakes, the entire genre shifts from survival horror to unstoppable cataclysm.
   - Trees don't just gently fall—they crack like thunder, sending splinters and birds scattering. Enemies caught in your paw are hurled across the screen and pulverized against stone walls.
3. **The Oppressive Elderwold (Dark Norse Folklore)**:
   - No cheerful cartoon greens or friendly yellows. The color palette is dominated by **crushed slate black (`#070a09`)**, **decaying heartwood brown (`#2e1f18`)**, **sickly bruised violet rot (`#381c3b`)**, and **cold silver starlight (`#a3b8b0`)**, pierced only by the **furious golden amber of Bjarki's eyes and rage (`#e5a93b`)**.

---

## 3. The Art & Animation Overhaul

### 3.1 Eliminating the Cardboard-Cutout Pipeline
The single biggest flaw of the current renderer is reliance on single-pose WebP cutouts with procedural rotation. The upgraded visual pipeline requires **sprite-sheet animation with discrete hand-crafted keyframes**:

#### Player Sprite Sets (Human Form):
- **Idle (4 frames, 8 fps)**: Heavy, ragged breathing in freezing air, chest rising and falling, vapor puffs emitting from the mouth.
- **Run (8 frames, 12 fps)**: Forward-leaning, desperate sprint, mud kicking up behind the heels, toes digging into the turf.
- **Skid / Turnaround (2 frames)**: Abrupt brake, heels sliding through peat moss, weight shifting backward.
- **Jump Arc (3 phases)**:
  - *Anticipation & Launch (2 frames)*: Deep crouch into powerful upward spring.
  - *Apex (2 frames)*: Tucked legs, arms outspread, momentary zero-G silhouette.
  - *Descent & Landing (3 frames)*: Coat tails fluttering upward, deep knee-bend impact squash with dust shockwave.
- **Attack Combo (3 distinct swings)**:
  - *Jab (Stick/Dagger, 3 frames)*: Fast, sharp thrust with lingering white-hot trail.
  - *Cleave (Bone Knife, 4 frames)*: Wide arc cutting downward-right, trailing motion blur.
  - *Heavy Overhead Slam (6 frames)*: 2-frame charge hold with trembling arms, violent downward cleave that sparks on the ground.
- **Parry / Shield (3 frames)**: Snap bracers forward; on contact, frame freezes with brilliant amber spark ring and counter-strike transition.
- **Ledge Grab & Hoist (4 frames)**: Grabbing mossy rock ledges, pulling body up onto higher platforms.
- **Hurt / Stagger (3 frames)**: Brutal recoil backward, blood spatters across the floor, teeth clenched.

#### Player Sprite Sets (Werebear Form):
- **Bear Idle (6 frames, 8 fps)**: Massive 2.5-meter bulk hunched forward, knuckles resting on the ground, deep abdominal heaving, amber veins pulsing in fur.
- **Bear Quadrupedal Gallop (8 frames, 14 fps)**: Earth-shaking sprint, massive shoulders rolling, claws gouging trenches into the dirt.
- **Bear Maul (5 frames)**: Huge sideways backhand swipe with red claw trails that sends light enemies flying.
- **Bear Overhead Ground Slam (7 frames)**: Rearing onto hind legs, full silhouette towering over screen, slamming both fists down to rupture the terrain with flying rock shards.
- **Bear Roar (6 frames)**: Snout pointed skyward, jaws unhinging, visible acoustic shockwave rings distorting the screen.
- **Bear Tree Uproot (5 frames)**: Seizing a tree trunk with two massive paws, ripping it from the root ball with tearing fiber effects.

### 3.2 Dynamic 2D Lighting & Volumetric Atmosphere Engine
Replace the flat canvas draw calls with a multi-layered lighting and fog compositor in `site/render/renderer.js`:

```javascript
// Upgraded Multi-Pass Lighting Pipeline
class LightingCompositor {
  constructor(width, height) {
    this.lightCanvas = document.createElement('canvas');
    this.lightCanvas.width = width;
    this.lightCanvas.height = height;
    this.lightCtx = this.lightCanvas.getContext('2d');
  }

  renderLightingPass(world, cameraX, cameraY, dayCycle) {
    const ctx = this.lightCtx;
    // 1. Ambient Darkness Layer (Darker at night, brooding slate during day)
    const ambientDarkness = dayCycle === 'night' ? 'rgba(4, 7, 6, 0.94)' : 'rgba(14, 20, 18, 0.45)';
    ctx.fillStyle = ambientDarkness;
    ctx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);

    // 2. Additive Point Lights (BlendMode: 'destination-out' to carve holes in darkness)
    ctx.globalCompositeOperation = 'destination-out';
    
    // Checkpoint Dens (Warm glowing fire)
    world.activeFires.forEach(fire => {
      this.drawLightRadial(ctx, fire.x - cameraX, fire.y - cameraY, fire.radius, 1.0, '#ffd175');
    });

    // Player Amber Rage Eyes (Glows when Rage > 50)
    if (world.player.rage > 50) {
      const eyeIntensity = (world.player.rage - 50) / 50;
      this.drawLightRadial(ctx, world.player.x - cameraX, world.player.y - cameraY - 40, 80 * eyeIntensity, 0.7, '#ffaa33');
    }

    // Moonlight Shafts (God-rays cutting through canopy at night)
    if (dayCycle === 'night') {
      world.moonShafts.forEach(shaft => {
        this.drawLightShaft(ctx, shaft.x - cameraX, shaft.width, shaft.angle);
      });
    }

    ctx.globalCompositeOperation = 'source-over';
  }
}
```

---

## 4. The Kinematics & Game Feel Engine: Making It "Smooth"

"Smoothness" in high-end action games is not just 60 fps; it is the mathematical relationship between **input buffering**, **responsive acceleration**, **kinetic weight**, and **impact hitstop**.

### 4.1 Tuned Physics Formulas
Replace the floaty jump with asymmetric gravity kinematics:

```javascript
// Precision Platforming Constants
const PHYSICS = {
  // Horizontal Kinematics (Crisp, zero-sluggishness)
  RUN_SPEED_MAX: 290,           // px/sec (Man)
  BEAR_RUN_SPEED_MAX: 440,      // px/sec (Titan)
  ACCEL_GROUND: 2200,          // Reach max speed in ~0.13 seconds
  DECEL_GROUND: 2600,          // Stop on a dime when releasing keys
  ACCEL_AIR: 1300,             // Responsive air control
  DECEL_AIR: 400,

  // Asymmetric Jump Arc (Crisp upward velocity, heavy satisfying descent)
  JUMP_VELOCITY: -620,         // Initial impulse
  GRAVITY_RISE: 1450,          // Upward deceleration
  GRAVITY_FALL: 2200,          // Faster downward pull (eliminates "moon gravity")
  GRAVITY_FASTFALL: 3100,      // Pressing Down/S while falling pulls down faster
  MAX_FALL_SPEED: 850,

  // Fluid Input Windows
  COYOTE_TIME: 0.12,           // 7 frames of forgiveness after stepping off ledges
  JUMP_BUFFER: 0.14,           // 8 frames of pre-landing jump memory
  PARRY_WINDOW: 0.16           // 10 frames of active parry before vulnerability
};
```

### 4.2 The Hitstop (Micro-Freeze) Matrix
When a strike connects, time must **freeze** for several frames to register physical mass:

| Attack Type | Hitstop Duration | Camera Shake Type | Visual Effect |
| :--- | :--- | :--- | :--- |
| **Human Stick Jab** | 2 frames (33ms) | 2px micro-kick | 4 white sparks, 1 drop of rot |
| **Human Bone Knife Slash** | 4 frames (66ms) | 4px directional impulse | Crescent slash arc, crimson blood spray |
| **Human Heavy Overhead** | 6 frames (100ms) | 8px vertical bounce | Ground dust ring, enemy knocked airborne |
| **Perfect Parry Riposte** | 8 frames (133ms) | Radial punch zoom (3%) | Screen flash white, gold spark circle, enemy staggered |
| **Bear Claw Maul** | 7 frames (116ms) | 12px horizontal recoil | Heavy gouging claw trails, meat tear, enemy hurled backward |
| **Bear Ground Slam** | 10 frames (166ms) | 18px traumatic rumble | Shockwave ripple across floor, screen flashes, rock debris |
| **Felling an Elderwood Tree** | 12 frames (200ms) | 22px deep low-frequency rumble | Screen blur, splinter shower, falling leaves, dust cloud |

### 4.3 Directional Camera Physics
Ditch simple linear camera interpolation (`lerp(camera, target, 0.1)`). Implement an elastic look-ahead spring camera with trauma-based shake:

$$\text{LookAhead} = \text{Facing} \times \min\left(140, \; |\text{Velocity}_x| \times 0.4\right)$$
$$\text{Trauma} = \max\left(0, \; \text{Trauma} - \Delta t \times 1.2\right)$$
$$\text{ShakeOffset}_x = \text{Trauma}^2 \times \text{Random}(-1, 1) \times \text{MaxShake}$$

This ensures that running fast pans the screen forward so players see incoming threats, and landing heavy bear slams produces exponential, natural-feeling impacts.

---

## 5. From Linear Corridor to Non-Linear Dark Adventure

The current game forces the player to walk straight along a single 45-screen line. A true dark adventure game requires an interconnected map with elevation, subterranean descents, locked gates, and circular shortcuts.

### 5.1 The New Multi-Region World Map

```
                                  [ THE HIGH CANOPY & ROOTS ]
                                       ▲              ▲
                                       │ (Vine Climb) │ (Felled Pine)
                                       │              │
[ THE WAKING HOLLOW ] ──────► [ THE BLACKTHORN THICKET ] ◄──── (Rot Barrier Shortcut)
        │                              │                              │
        ▼ (Sinkhole Drop)              ▼ (Sunken Cave)                │
[ THE SUNKEN BARROWS ] ────► [ THE MIRE & ROT-WELLS ] ────────► [ THE DEN OF THE FIRST BEAR ]
        │                                                             │
        └─────────────────► [ THE DEEP CRAGS ] ───────────────────────┼────────┐
                                                                      │        │
                                                                      ▼        ▼
                                                       [ THE ROTTED HEARTWOOD (BOSS) ]
```

### 5.2 The 5 Distinct Biomes:

1. **The Waking Hollow (The Crypt of Roots)**:
   - *Atmosphere*: Cramped, subterranean, cold limestone walls, roots hanging from low ceilings, water dripping into stagnant pools.
   - *Mechanics*: Tutorial space where Bjarki learns to climb ledges, crawl through narrow fissures, and scavenge his first flint knife.
2. **The Blackthorn Thicket (The Trapper's Forest)**:
   - *Atmosphere*: Dense, thorny undergrowth, abandoned iron bear traps half-hidden under fallen leaves, swinging bone chimes in the trees.
   - *Mechanics*: Stealth through tall reeds, baiting enemies into hunter traps, dodging snare tripwires.
3. **The Sunken Barrows & Rot-Wells**:
   - *Atmosphere*: Ancient burial mounds overgrown with necrotic purple fungus, shallow wading water that slows human movement by 40%, swarming Rot Grubs.
   - *Mechanics*: Water hazards. As human, wading is lethal; transformed into the Bear Titan, you charge through the water, parting it like a wave.
4. **The High Canopy & Root Bridges**:
   - *Atmosphere*: Perched 40 feet above the ground, howling northern winds, swaying branches, moonlight breaking through mist.
   - *Mechanics*: Precision platforming, felling trees to crash across chasms, creating permanent bridges that bypass dangerous barrows below.
5. **The Rotted Heartwood (Old Thorngut's Lair)**:
   - *Atmosphere*: A colossal, dead Mother Oak impaled with gigantic rusted iron spikes driven by hunters centuries ago. The soil is black, soaked in foul rot-pitch.
   - *Mechanics*: Multi-stage boss encounter requiring the player to fell the four surrounding sentinel oaks to pin the matriarch.

---

## 6. Combat Overhaul: Duality of the Man and the Beast

### 6.1 The Man: Precision, Parrying, and Survival
- **The Parry System (Bark Bracers)**:
  - Tapping Block right before an enemy strike connects halts the enemy with a metallic clatter.
  - A successful parry **instantly grants +15 Rage** and opens the enemy for a lethal **Riposte Counter-Attack** (deals $\times 3$ damage with an invulnerable stabbing animation).
- **The Throwing Arsenal**:
  - River Stones: Bounce off hard surfaces, ring hollowly against metal, and stun flying Gloom Moths.
  - Bone Darts: Inflict bleeding damage on unarmored targets.
  - Corrupted Cinders: Found in rot pits; explode on contact, burning spider webs and illuminating dark caverns.
- **Exhaustion System Refactor**:
  - The current 3-second lockout penalty feels terrible. Replace it with a **tactile stamina stagger**:
  - When stamina hits 0, Bjarki does not freeze; his attacks deal half damage and his dodge becomes a clumsy stumble, but he retains full control.

### 6.2 The Bear: Cataclysmic Titan Gameplay
- **Massive Destructible Physics**:
  - Any small enemy hit by Bear Maul becomes a **projectile weapon**, dealing damage to other enemies it collides with.
  - Breaking through rot-walls produces flying splinter projectiles that impale surrounding grubs.
- **Grab and Hurl (U-Key / Gamepad RB)**:
  - The bear can grab an enemy by the throat, lift them overhead, and violently slam them into the floor (creating an area-of-effect shockwave) or throw them into oncoming enemies.
- **The Titan Roar (I-Key / Gamepad RT Tap)**:
  - Emits a sonic blast that blows away fog, snuffs out poison clouds, dispels projectiles in mid-air, and stuns all nearby enemies for 2 seconds.

---

## 7. The Soundscape & Dark Norse Audio Pipeline

Currently, the synthesised Web Audio is tinny and minimal. Transform it into a rich, dark soundscape:

1. **Grounded Physical Footsteps**:
   - Dynamic footstep audio based on terrain: wet mud squelches, dry twig snaps on peat, hollow wooden reverberations on log bridges, splash sounds in flooded barrows.
2. **Authentic Dark Norse Acoustic Textures**:
   - Low droning *Tagelharpa* (bowed horsehair lyre) providing relentless subterranean tension.
   - *Bukkehorn* (ram horn) blasts heralding boss attacks and moonrise.
   - Bone flutes whistling through canopy winds.
   - Deep throat-singing vocal formants that trigger the moment Bjarki transforms into the Werebear.
3. **Visceral Impact Audio**:
   - Heavy sub-bass "kick" (40–60 Hz sine drop) on every bear hit, landing impact, and tree felling.
   - Distinct high-frequency crunch for parrying iron traps and splitting animal skulls.

---

## 8. Step-by-Step Technical Implementation Roadmap

```
                               UPGRADE EXECUTION PHASES
 ┌────────────────────────────────────────────────────────────────────────┐
 │ PHASE 1: KINEMATICS & INPUT FOUNDATION                                 │
 │ • Overhaul site/sim/world.js with precision acceleration & jump curves │
 │ • Implement 6-frame coyote buffer and responsive ledge grabs           │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │ PHASE 2: GAME FEEL & COMBAT JUICE                                      │
 │ • Implement hitstop micro-freezes and trauma-based camera shake        │
 │ • Add directional slash trails, blood splatters, and enemy flinch      │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │ PHASE 3: SPRITE & ART PIPELINE OVERHAUL                                │
 │ • Replace single-frame cutouts with multi-frame animated sprite sheets │
 │ • Repaint trees, enemies, and backgrounds to unified dark Norse tone  │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │ PHASE 4: 2D DYNAMIC LIGHTING & VOLUMETRIC MIST                         │
 │ • Implement additive light masks for dens, glowing eyes, and moon shafts│
 │ • Add drifting mist layers, falling ash, and low-health vignetting     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
 ┌───────────────────────────────────▼────────────────────────────────────┐
 │ PHASE 5: METROIDVANIA MAP & PUZZLE ARCHITECTURE                        │
 │ • Build multi-layered barrows, canopies, and rot-locked shortcuts      │
 │ • Add environmental physics: tree bridge ramps and destructible walls  │
 └────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: Kinematics & Input Foundation
- [ ] Refactor `site/sim/world.js` player physics to use asymmetric rising/falling gravity and instant ground deceleration.
- [ ] Add ledge detection and ledge-climb state to `player` in `site/sim/world.js`.
- [ ] Upgrade `site/input/controls.js` to support 100ms action buffering and smooth analog thumbstick deadzones.

### Phase 2: Game Feel & Combat Juice
- [ ] Implement `hitStop` frame counter in `site/sim/world.js` that halts animation and physics updates for 2–10 frames on impact.
- [ ] Add trauma-based elastic camera spring with directional impulse in `site/render/renderer.js`.
- [ ] Create a lightweight particle emitter pool for blood drops, wood splinters, and dust shockwaves.

### Phase 3: Sprite & Animation Overhaul
- [ ] Generate proper multi-frame sprite sheets for Human (Idle, Run, Jump, Attack1-3, Parry, Ledge, Hurt) and Werebear (Idle, Gallop, Maul, Slam, Roar).
- [ ] Clean all alpha halos using edge erosion and dark rim lighting.
- [ ] Replace cartoonish sporecaps and bright green trees with menacing, moss-strangled black oaks.

### Phase 4: 2D Dynamic Lighting & Environment
- [ ] Implement the `LightingCompositor` offscreen canvas pass in `site/render/renderer.js`.
- [ ] Add point light emitters to den campfires, moonlit shafts, and glowing amber eyes.
- [ ] Add 2 layers of drifting volumetric fog in the midground and foreground with subtle parallax.

### Phase 5: Metroidvania Map Expansion
- [ ] Redesign `SECTIONS` from a flat 45-screen line into an interconnected 5-biome map with vertical shafts.
- [ ] Implement destructible rot-gates, climbable brier walls, and fallen tree ramps.
- [ ] Connect shortcuts linking the high canopies and deep barrows back to the Den of the First Bear.

---

## 9. Verification & Quality Gates

Before declaring any upgrade complete, verify against these non-negotiable quality metrics:

1. **60 FPS Headless Tests**: All 47+ deterministic tests in `npm test` must continue to pass without race conditions or float precision errors.
2. **The "Juice" Test**: Striking an enemy with human heavy attack must produce at least 4 distinct sensory signals:
   - Audible bone crunch with bass kick.
   - 6-frame hitstop freeze.
   - Directional camera recoil.
   - Splatter of blood particles staining the ground.
3. **The Transformation Climax**: Transforming into the Werebear must feel like an unstoppable earthquake:
   - Screen flash and deep chromatic aberration.
   - Guttural throat-singing roar audible across the entire soundscape.
   - Immediate radial shockwave felling nearby saplings.
4. **Dark Atmosphere Verification**:
   - Zero cheerful pastel colors.
   - Every frame must look like an oil painting from a dark Norse chronicle.

---

*This document serves as the permanent architectural prompt and design contract for upgrading Wear the Bear into a legendary dark adventure game.*
