# UPGRADE.md — Wear the Bear: Comprehensive Upgrade Plan

> **Status:** implementation blueprint, not a claim that the upgrade is built.
> **Goal:** a responsive, illustrated dark Norse action-adventure in which a fragile man earns ninety seconds of overwhelming power, changes the forest permanently, and survives the debt when the shape breaks.
> **Scope:** one complete, interconnected Elderwold. Use Metroidvania-inspired exploration without replacing the game's identity with generic ability collecting or a new multi-region campaign.
> **Execution rule:** preserve working contracts, deliver one verified playable slice at a time, and expand only after that slice is worth playing. No ground-up engine rewrite by default.

---

## 0. Read This Before Implementing

### 0.1 Source of truth

This plan incorporates all repository Markdown files: `README.md`, `GAME.md`, the previous `UPGRADE.md`, and `artifacts/evaluation.md`. Its baseline also checks the current simulation, renderer, input, audio, saves, service worker, and evaluation harness.

Use this precedence:

1. New explicit user decisions.
2. The latest applicable decision in `GAME.md`. **D18 supersedes the older honey passages:** dark horror, no Honey, no Honeycomb Pouch, no heal-on-demand consumable. The former bee-tree opens a stone cache.
3. The preserved gameplay contracts below and applicable `GAME.md` acceptance criteria.
4. This document's upgrade requirements and milestone gates.
5. Tuning candidates and optional experiments, which are not approved replacements for locked rules.

Code establishes what currently exists, not whether it satisfies the intended design. Historical status sections and generated reports are not current verification. Record and obtain a decision on changes that contradict preserved contracts; do not silently weaken tests.

Before a gameplay release, reconcile stale honey/control/save examples and historical test counts in `README.md` and `GAME.md`, preserving the decision history and attribution. This planning update changes only `UPGRADE.md`.

### 0.2 Preserved contracts

| Contract | Required behavior |
|---|---|
| Identity and scope | Bjarki, the Bearkin, the Long Sleep, one authored Elderwold, and Old Thorngut. The man/bear contrast and permanent forest changes remain central. |
| Death | Last lit den, dawn, full base Health, cloth only, no equipment or stones, zero Rage; permanent world progress survives. No currency, levels, corpse run, or retained combat upgrades. |
| Healing | No honey or on-demand healing consumable. Dens restore Health; bear kills reduce Wounds. Account explicitly for existing equipment-derived max-Health behavior. |
| Rage | 100 points, four 25-point segments; completed segments do not decay. Human tap skills normally cost 25, or 20 with Antler Crown. |
| Gestures | Human tap under 250 ms selects Swipe/Slam/Roar by direction; hold at least 450 ms with 100 Rage begins transformation. Intermediate-duration release never accidentally spends Rage. |
| Bear duration | 90 seconds of active gameplay simulation after entry, or 60 with Iron Nail. Kills never extend it. Pause, intentional cut-ins, and hit-stop do not consume gameplay time. |
| Wounds | Bear damage accrues as Wounds at the defined hide multiplier; kills reduce debt; remaining debt comes off Health on breaking form. Assist prevents lethal repayment. |
| Exhaustion | A distinct three-second post-bear vulnerability: reduced movement, no dodge, no Rage gain, no tap skills. Do not confuse this with ordinary low stamina or replace it without approval. |
| Cycle | 30 s dawn, 300 s day, 30 s dusk, 240 s night; night Rage multiplier 1.5; moonrise adds a flat, capped 25. Bear availability is never moon-locked. |
| Progression | Felled trees, opened shortcuts, broken walls, lit checkpoints, secrets, and completed boss persist as applicable. Ordinary inventory does not survive death. |
| Re-arming | Every checkpoint has a guaranteed basic weapon and stone cache within one screen; unarmed combat remains viable. No unavoidable resource softlock. |
| Boss | Three meaningful phases; beatable without full transformation. Tree play rewards the bear but is not mandatory for victory. |
| Platform | Static vanilla ES modules; deterministic 60 Hz simulation; Canvas presentation; keyboard, gamepad, two-thumb landscape touch; local saves and offline support. No mandatory backend/runtime framework. |
| Routes | Preserve `/`, `/research/`, `/art/`, and `/guardian/`, existing gallery credits, and AI-generation labels. |

**Assist discrepancy:** current code also prevents ordinary lethal human damage, while older design text describes a narrower Wound safeguard and obsolete starting Honey. Record the current behavior, decide and describe the intended behavior, and test it. Do not quietly nerf an accessibility option.

### 0.3 Non-goals and optional experiments

Do not add currencies, stat levelling, crafting, hunger, multiplayer, mandatory accounts, a second campaign, or permanent inventory progression. Reference games may inform readability, atmosphere, and shortcut discovery; do not copy their assets or replace this game's identity with theirs.

Ledge climbing, stealth, player-placed traps, bone darts, explosive cinders, a new bear Roar binding, and invulnerable ripostes are **optional experiments**, not prerequisites. Trial at most one after the core slice passes, then retain it only if player evidence justifies its controls, art, balance, and maintenance. Do not automatically change normal parry Rage from the current +8 to +15.

---

## 1. Evidence-Based Diagnosis

The previous plan described several working systems as missing and prescribed large effects before proving the loop. Replace that diagnosis with reproducible evidence.

| Area | Verified baseline | Problem to investigate |
|---|---|---|
| Simulation | `site/sim/world.js` already implements fixed steps, seeded RNG, forms, Wounds, exhaustion, combat, trees, checkpoints, and a boss. | Responsibilities are concentrated; horizontal-distance interactions will not suffice for vertical rooms. Extract incrementally, not by discarding working behavior. |
| Movement | Variable jump gravity, 100 ms coyote time, and 120 ms jump buffering already exist. Horizontal input immediately assigns speed, with friction on release. | Measure acceleration, braking, reversal, jump arc, collision, and real input latency. Adding named features alone does not prove improvement. |
| Impact | Human, bear, and tree hit-stop already exist and freeze the gameplay step. | Standardize confirmed-hit feedback, distinguish misses, and prevent multi-target freezes from becoming sluggish. |
| Animation | `site/render/sprites.js` uses several single-pose assets with cross-fades, bob, lean, squash, and transformation blending. | Produce planted footfalls, distinct action phases, credible enemy tells, and coherent animation; retain restrained procedural follow-through. |
| Environment | Painted day/night/foreground plates already exist, with repeated mirrored parallax. | Improve composition, variation, depth, landmarks, and coordinate-space correctness—not merely add a night image. |
| Scale | Simulation heights are 72/150 logical px; sprite draw heights are currently 118/205. | Reconcile art footprint, collision, camera, and phone readability rather than silently enlarging actors. |
| Level | A 57,600 px-wide Elderwold with 27 trees, 25 initial enemies, and three checkpoints; predominantly horizontal with some special routes. | Compress empty traversal, author vertical loops, and give major trees/encounters navigational purpose. Raw width is not content density. |
| Boss | HP thresholds and a no-bear damage path exist; AI is much simpler than the charge/canopy/thorn-storm design. | Build and test the real fight through public controls. A phase number or `noBearViable` flag is not proof. |
| Persistence | Validated v1 saves restore at a checkpoint. Browser writes occur at checkpoint, sleep, death, and completion. | Mutations after the last write can be lost on immediate reload; a new map requires stable-ID migration and safe spawning. |
| Audio | Synthesized effects, compressor, and adaptive oscillator layers already exist. | Improve cue hierarchy, material identity, lifecycle reliability, variation, and phone-speaker translation. |
| Tests | This planning audit ran `npm run test`: **47 passed, zero failed**. | Source-regex shell tests/helper probes do not establish real touch geometry, full progression, FPS, or enjoyment. |

### 1.1 Why the existing score is not a release verdict

`artifacts/evaluation.md` reports 83.8/100, but that is historical automated evidence. Its art rows describe weak tone, cohesion, silhouettes, and cutout quality.

The planning audit ran the four existing policies in memory with seed 7 and a 900-second horizon, without rewriting evaluation artifacts:

- No policy completed the level or dealt boss damage.
- The berserker reached the boss and reported horizontal progress of 1.0, but `completed` remained false.
- Its first transformation occurred at approximately 185.27 seconds, not the report's misleading `3s`: the rubric converts to minutes and appends a seconds label.
- Requested taps, held dodge frames, and total-run bear uptime do not necessarily mean successful actions, mastered defense, or combat-area uptime.
- The replay digest rounds a small subset of state; it is not byte-identical whole-state verification.
- The no-comfort rubric row is a constant rating while obsolete honey input/policy fields remain.

Fix these instruments before tuning against them. Automated reports cannot certify fun, visual quality, device performance, or full completion by themselves.

---

## 2. The Experience to Build

### 2.1 North star

**A vulnerable journey through a hostile forest that becomes a remembered landscape of the player's own violence.** The bear changes traversal, sound, animation, crowd behavior, light, and the next life—not just damage numbers.

1. **Responsive fragility:** Bjarki immediately answers input; committed attacks and readable threats demand judgment. Difficulty comes from decisions, not dropped controls or invisible damage.
2. **Earned catharsis:** the bear feels stronger, heavier, and more expressive without burying the player in effects or obscuring the arena.
3. **Spend-or-save tension:** a tap solves present danger; banking Rage enables a larger environmental opportunity. Neither choice is universally correct.
4. **An altered world:** notice a blocked path, later fell its tree, then use the changed route after death. That payoff matters more than tree count.
5. **Dread with fairness:** uncertain encounters, composition, and sound create fear; silhouettes, contact boundaries, and punishable recovery maintain trust.
6. **One coherent illustrated place:** actors, rooms, HUD, and audio share a dark Norse material language, with deliberate quiet and warmth at dens.

### 2.2 Three signature moments

**The promise:** the 30-second playable Long Sleep lets players maul a few threats and fell one great tree. Waking strips that power away. Dream mutations, kills, play time, and transformations cannot contaminate real-world persistence/pacing. Define an accessible skip/replay policy after first viewing.

**The first earned bear:** teach the tap decision before full Rage; place the first real transformation beside a previously noticed Elderwood opportunity. The player's action creates a wanted bridge/return loop. Explain duration and Wound debt before the shape breaks, not after an unexplained death.

**The return:** death leads to a safe den, nearby basic gear, and a visibly opened route. The player loses inventory, not all meaningful progress. Re-arming should be brief and purposeful, not an obligatory farming circuit.

### 2.3 Pacing hypotheses

Retain `GAME.md`'s targets until evidence supports an approved change:

| Metric | Target | Measurement |
|---|---|---|
| First usable tap | About 2–3 minutes | Record availability and successful use separately after waking; not attempted button presses. |
| First earned full bear | About 9–13 minutes | Exclude dream/menus; distinguish hit-stop-inclusive player time from active simulation time. |
| Bear combat uptime | About 25% | Bear time in active encounters / all active-encounter time, not a run padded with safe traversal or post-win idle. |
| First successful full run | About 20–30 minutes; deaths additional | Report completion, attempts, and retry time separately. Farthest x is not completion. |
| Re-arming | Weapon and stones within one screen | Measure actual traversal from each den; provisional feel goal: useful equipment within 30 seconds, excluding menus. |
| Shortcut payoff | Meaningfully shorter repeat trip | Compare the same journey before/after mutation, including encounters avoided. |

Use novices for first-time pacing and experienced players for mastery ceilings. Apply GAME A13's tolerance to agreed measures; do not loosen bands to make the current bots pass. Align encounters with the actual clock, not an assumed section-specific time of day.

---

## 3. Priorities and Scope Discipline

### P0 — Protect trust and truthful evidence

Public input, lifecycle pause, event delivery, deterministic timing, 2D collision, durable mutations, stable IDs/migration, safe spawning, resource-softlock prevention, and corrected evaluation. Resolve Assist, obsolete bindings, scale, and spec/code discrepancies explicitly.

### P1 — Make the core game compelling

Tuned movement, committed combat, distinct tells/recoveries, a polished man → tap decision → bear → tree → break → death/return slice, interconnected Elderwold, three-phase boss, coherent animation/environment art, two-thumb usability, accessible readable atmosphere, audio, and measured device performance.

### P2 — Expand expression after P1 works

Optional secrets, decorative variation, replay challenges, and one justified experimental move. Additional lighting/particles must fit budgets.

If scope slips, cut P2 first, then reduce room/asset variation. Never cut responsiveness, persistent-world payoffs, public boss victory paths, accessibility, or verification. Do not pad the world to retain 45 screens if fewer, denser spaces play better.

For each intentional rule change record: problem, current contract, proposal, evidence, affected tests/saves/tutorials, approval, and rollback. Tuning candidates below do not silently override D1–D18.

---

## 4. Architecture: Improve the Existing Game

### 4.1 Boundaries and incremental extraction

`site/main.js` orchestrates composition/lifecycle; `site/input/` normalizes devices; `site/sim/` owns gameplay; `site/render/` presents it; `site/audio/` consumes feedback; the save adapter owns storage.

Extract responsibilities from `site/sim/world.js` only when needed. These are **proposed new files**, not existing APIs or mandatory scaffolding:

| Proposed path | Responsibility |
|---|---|
| `site/sim/movement.js` | Controller, movement state, collision responses. |
| `site/sim/combat.js` | Attack timelines, damage, costs, stagger, events. |
| `site/sim/enemies.js`, `site/sim/boss.js` | Actor state machines. |
| `site/sim/level.js` | Validated authored rooms, graph, stable world IDs. |
| `site/levels/elderwold.json` | Room bounds, colliders, encounters, trees, checkpoints, landmarks. |
| `site/render/animation.js`, `site/render/lighting.js` | Atlas playback and presentation-only compositing. |
| `tests/browser/` | Future public-path checks using a declared development-only runner. |

Keep the public `World.step(input)` seam; migrate callers/tests incrementally. No speculative ECS, engine package, bundler, full editor, or backend. Current `package.json` has no browser-test runner, linter, or build script; do not invent commands or assume dependencies.

### 4.2 Timing and event contracts

- Fixed 60 Hz gameplay, bounded accumulator/catch-up, presentation-only interpolation.
- Distinguish browser elapsed time, active gameplay ticks, and presentation time; specify gesture, buffer, hit-stop, clock, and statistics ownership.
- Prefer tick-based new attack/state durations; test exact boundaries with documented fixed-step rounding.
- Record normalized input transitions against ticks; the same seed/stream reproduces combat, AI, drops, mutations, and event order.
- Hit-stop pauses gameplay timers, including bear time and day/night. Input collection continues; bounded buffers retain intent without repeating one-shots.
- Retain one-shot actions in a pending queue until an eligible simulation tick accepts or explicitly rejects them. Renderer sampling must not consume an edge on a frame with zero fixed steps, and a hit-stop early return must not discard it. Define buffer expiry, ordering, and cancellation; test zero-step/multi-step frames and 30/60/120/144 Hz display schedules against the same 60 Hz simulation.
- `world.events` resets each step. Preserve every step's events in a bounded presentation queue so catch-up does not erase important feedback.
- Give events tick/stable identity; audio, particles, haptics, and camera consume each once even with several renders per step.
- Cosmetic randomness never consumes simulation RNG. Replay coverage includes authoritative entities, timers, pending actions, and RNG state or an equivalent reproducible representation.

### 4.3 Real 2D collision before vertical rooms

Attacks, hazards, projectiles, thrown actors, boss attacks, tree falls, and platform contacts respect room membership and vertical overlap, not x distance alone.

Use straightforward swept/sub-stepped kinematic collision before general rigid-body physics. Prove walls, ceilings, corners, one-way platforms, charges, roots, and logs. Actors on separate floors cannot hit each other because their x coordinates match.

---

## 5. Movement That Feels Immediate and Deliberate

### 5.1 Required controller behavior

- Bounded acceleration, braking, reversal, and air control; no uncontrolled release sliding.
- Short/full variable-height jumps; holding gives one jump, never repeated auto-jumps.
- Coyote and landing buffers tested at edges on all inputs.
- Faster descent than ascent, capped fall speed, explicit drop-through. Fast-fall remains optional and cannot conflict with crouch/Slam.
- Consistent terrain/log/root/platform collision. A drawn ramp needs matching supported geometry.
- Preserve human agility and bear weight; initially retain approximately 1.25× human speed and 60% human jump height for bear.
- Landing communicates mass without an unannounced control lock. Optional ledge assistance cannot swallow jump/dodge/attack.

### 5.2 Starting tuning candidates

| Parameter | Baseline | Candidate / method |
|---|---|---|
| Human speed | 210 logical px/s | Trial 250–290; keep baseline comparison; re-author gaps/encounters from measured travel. |
| Bear speed | 262.5 logical px/s | Derive from approved human speed ×1.25, not an unrelated 440 constant. |
| Acceleration | Immediate assignment | Trial top speed in 6–8 active ticks; compare reversal and precise corrections. |
| Braking | Per-step multiplier | Explicit rates and bounded stop distance, typically 4–6 ticks. |
| Human jump | Existing variable gravity | Trial 145–165 px apex and 0.30–0.36 s time to apex; derive, then measure. |
| Coyote | 100 ms | Preserve initially: six 60 Hz ticks. |
| Jump buffer | 120 ms | Preserve or explicitly trial eight ticks, about 133 ms. |
| Attack buffer | No full timeline system | Trial 6–9 ticks for legal follow-ups; no accidental commitment cancellation. |
| Defense | Spec/code differ | Audit stamina cost, invulnerability, and parry timing before retuning. |

Derive `gravity_up = 2 * jump_height / time_to_apex²` and `jump_impulse = -gravity_up * time_to_apex` as starting values, then measure fixed-step output. A constants block is not proof of smoothness.

**Gate:** repeatable course covering short/full jumps, buffered landings, coyote edges, reversal, ceilings, fast motion, logs, and form-specific passages. Compare input/state traces and normal-speed video on desktop and short landscape phone.

---

## 6. Combat: Read, Commit, Answer, Punish

### 6.1 Authoritative action timelines

Define startup → active → recovery, hit shape, reach, damage, stamina/Rage cost, movement allowance, interrupt/cancel rules, combo windows, and feedback profile for each attack.

- Damage occurs in active windows aligned with visible contact.
- One target hit per strike unless explicitly multi-hit. No duplicate kill/Rage/Wound rewards.
- Distinguish misses, guards, armor breaks, interruptions, parries, wall impacts, and kills.
- Commit costs once; insufficient stamina cannot create a free heavy/dodge.
- Build fists, light combos, charged heavy, and defense first. Stick provides reach; knife provides speed/bleed; bracers provide parry.
- Perfect defense earns rewards only through actual timing/collision success.
- Do not make shields, invulnerable ripostes, or additional throwables mandatory for the upgrade.

### 6.2 Fair pressure

Every tell uses pose plus a cue plus shape/color distinction. It remains readable with mute, color deficiency, and reduced motion. Night raises pressure without erasing reaction windows.

Introduce isolated threats before combinations; coordinate packs to avoid unavoidable simultaneous hits; indicate later off-screen/ranged danger; respect documented invulnerability/parry consistently; prevent stun locks, unreachable actors, and encounter migration. Attribute damage so players can explain deaths.

Compare equivalent encounters and successful progression. Raising damage to improve an automated danger score does not establish better horror. Disciplined play should beat reckless trading without rewarding endless retreat/sleep farming as the only sensible strategy.

### 6.3 Bear moves must genuinely differ

- **Maul:** multi-target arc and readable knockback.
- **Rend:** ground effect/shockwave and appropriate tree damage.
- **Charge:** authoritative movement and eligible wall break; no accidental per-tick repeat damage.
- **Pounce:** advertised airborne input, one impact on landing.
- **Grab & Hurl:** eligible actor carried and thrown along an actual trajectory; collision damage defined once per target. A displacement shortcut is not a finished hurl system.
- **Uproot:** visible log acquisition and three club swings. Protect traversal-critical logs or guarantee another permanent crossing first.
- **Waking Roar:** defined stun/knockback on entry. Auto-felling saplings, clearing poison/projectiles, and a new bear tap-Roar are separate balance decisions, not decorative effects.

### 6.4 Bounded impact hierarchy

Initial hit-stop candidates, to tune through play:

| Confirmed event | Active ticks | Feedback priority |
|---|---|---|
| Human light | 2–3 | Contact transient, small directional kick, restrained rot/spark mark. |
| Knife/heavy | 3–6 | Distinct contact pose, stronger sound, readable stagger. |
| Perfect parry | 4–6 | Bracer clack, amber shape cue, clear punish opening. |
| Bear maul | 6 | Low weight plus phone-audible crunch, displacement, claw trail. |
| Bear slam | 6–8 | Ground shockwave, material debris, bounded camera response. |
| Great-tree impact | 7–8 | Creak → crack → fall → boom; birds/dust. |

Use the maximum concurrent freeze, not a sum per victim. Cap camera impulses, particles, flashes, and voices. Freeze contact animation with gameplay; avoid a bobbing frozen actor. Impact on misses must be clearly different from confirmed hits.

Reduced motion removes punch zoom/chromatic distortion/intense shake/full-screen flashes but preserves timing and local readable effects. Rot, peat, sap, and splinters provide weight without a new gore requirement.

---

## 7. Transformation, Debt, and Breaking Form

Treat transformation as a short playable climax, not an unskippable control interruption.

1. Charge ring communicates commitment; early release is safe.
2. One-second invulnerable entry has crouch, eruption, half-bear, and rise poses; register feet and validate expanding collision against geometry.
3. Restrained cut-in, inhale/crunch/roar, pressure wave, and eased 10% camera zoom establish power while keeping UI readable.
4. Timer starts after entry and displays 90/60 correctly; kills never extend it.
5. Wounds display debt relative to current Health; warn before lethal debt and visibly show kill-driven recovery. Never rely only on a red outline/sub-bass.
6. Final ten seconds foreshadow return. Manual release needs a fresh one-second bear hold; releasing the original transform press cannot instantly break the new form.
7. Break poses, repayment, and three-second exhaustion communicate consequence without hiding the transaction or removing all control.

Test entry/return under ceilings, on logs, over gaps, in nets, near checkpoints, in hit-stop, during backgrounding, and near lethal Wounds. Form changes cannot teleport feet, tunnel through geometry, or create an unrecoverable trapped state.

Dream effects/statistics remain separate. Reduced cut-in intensity cannot change combat timing or create an accessibility-dependent advantage.

---

## 8. Interconnected Elderwold, Not an Inflated Campaign

### 8.1 Preserve the journey; add depth within it

Keep Waking Hollow → Thicket → Den → Deeper Wood → Trappers' Run → Deep Stone → Rotted Clearing. Sunken Barrows, High Canopy, and Rot-Wells are sub-areas/optional loops inside that Elderwold, not five new campaign regions.

```text
Waking Hollow ── Thicket ── Den (CP1) ── Deeper Wood ── Trappers' Run
   │                │                       │               │
   └─ root path ────┘                  canopy/barrow loop ────┘
                                            │               │
                                  felled-tree return ─────── Den
                                                            │
                                             Deep Stone (CP2)
                                                            │
                                              Rotted Clearing
                                                Old Thorngut
```

This is a connectivity brief, not final geometry. Author an explicit graph with bidirectional, one-way, gated, and mutation-dependent edges. Preserve CP0/CP1/CP2 identities unless migration mapping is supplied.

### 8.2 Every room needs a purpose and contract

Specify stable ID/name, bounds, exits, camera limits, safe spawns, a primary purpose (teach/test/reveal/recover/choose/reward), terrain/colliders, traversal/form constraints, falls/recovery, encounters/tethers/drops/reset, tree/gate IDs and effects, resources/replenishment, landmark/composition/day-night/audio, and an acceptance test/viewpoint.

No corridor exists merely to fill width. Substantial journeys contain a landmark, decision, encounter, reveal, or deliberate short respite. Do not confuse two equivalent corridors with meaningful exploration.

| Area | Atmosphere | Gameplay purpose |
|---|---|---|
| Waking Hollow | Cold stone, low roots, breath/drips, visible exit. | Movement/fists/stick/stones; noticed tree route with a fair lower human path. |
| Thicket | Thorn silhouettes, constricted trunks, spore haze, growls. | Isolated tells become combinations; directional tap and sapling payoff. |
| Den | Sparse warm fire, protective stone, quieter ambience. | Checkpoint, sleep choice, guaranteed re-arm, shift foreshadowing. |
| Deeper Wood / barrows | Tall Elderwood, burial stones, silver shafts, hollow roots. | First real bear, return shortcut, knife encounter, optional risk/reward. |
| Trappers' Run / canopy | Rust, nets, chimes, wind above the forest. | Bracers, signaled traps, human route, optional cursed Nail/crown. |
| Deep Stone | Recognizable quiet landmark before the clearing. | Final checkpoint, rapid guaranteed boss re-arm. |
| Clearing | Diseased Mother Oak, broad readable ground, vulnerable trees. | Combine combat, crowd control, and mutation without mandatory bear victory. |

Water may change movement/material response, but compulsory lethal wading is not approved. Trap concealment cannot make phone play guesswork.

### 8.3 Navigation and anti-softlock rules

- Landmark-based orientation; add a lightweight discovered-route map/journal only if testing warrants it. Do not expose every secret by default.
- Gates communicate the needed form/skill before the player wastes all Rage.
- Every checkpoint offers re-arm and renewed Rage acquisition without only waiting for night/shafts.
- Last-Rage spending at a required gate leaves a fair recovery route. Test zero resources, exhausted nearby encounters, and changed trees.
- Bear expiry in a form-specific passage permits retreat, human exit, or authored recovery.
- Broken branches and consumed logs never sever all routes permanently.
- Each important shortcut visibly shortens a repeat journey; cosmetic destruction alone fails the signature-system gate.

---

## 9. Trees and Durable World Changes

Preserve tree destruction rules: tap Slam for saplings/former bee-tree; full bear for great Elderwood. Renaming presentation cannot lose saved identity or the stone-cache role.

### 9.1 One authoritative fall

Crack decals → directional creak → base-anchored fall/depth transition → readable falling-arc warning → one impact transaction → matching log/stump/shaft and one feedback event. Damage follows actual geometry, not x proximity alone.

Bridge/log colliders derive from authored endpoints and match visuals on vertical terrain. Save final fall direction, route/bridge state, consumed-log state, and other required mutation data; a tree-ID list alone may not reproduce a redesigned crossing.

### 9.2 Separate world durability from inventory snapshots

Keep inventory/Rage snapshots at safe design boundaries while promptly committing irreversible world changes. Design a versioned checkpoint/resource snapshot plus world-mutation journal, or an equally simple equivalent.

Confirmed falls, gate breaks, checkpoint unlocks, secret discoveries, and boss completion persist through the storage adapter. Pending creaks/partial damage do not count as permanent mutations. Never save from rendering.

A mutation write cannot accidentally grant a mid-fight inventory checkpoint, fresh Health, or escape from Wound debt. Define reload while bear/transforming/exhausted: retain valid checkpoint resources/world progress, clear transients, and do not bank a draining bear timer as free human Rage.

**Required test:** change a tree/gate, reload before another checkpoint, and observe the same safe world topology. In-memory death persistence alone is insufficient.

### 9.3 Migration and failure recovery

- Validate complete schema before live mutation; reject unknown future versions safely. Separate save-schema version from world-content version, and persist a deliberate stable data-transfer object rather than every transient player field.
- Use immutable authored IDs and a complete lightweight content-ID registry independent of loaded room chunks. A valid mutation in an unloaded room must not fail validation; never reuse an old ID for a different obstacle.
- Supply v1 fixtures and explicit old→new mappings for relocated checkpoints/trees/gates/secrets, removed content, and safe regional spawn fallback.
- Preserve old data until a migrated replacement validates and writes successfully; never delete it on parse failure.
- Remove legacy Honey through a narrow documented converter, not blanket extra-field acceptance.
- Reset unfinished enemies/boss and transient inputs on restore; retain completed progress.
- Show a storage-denied/quota warning and allow play rather than crashing or claiming saves succeeded. A missing/null storage adapter is failure, not a successful no-op; enable Continue only after a valid save is known to be available. Test storage access exceptions and settings access as well as write failures.
- Failed Continue must return to a recovery/menu state without falling through to New Game or clearing the original save. Distinguish absent data, invalid data, unsupported versions, and inaccessible storage; offer non-destructive recovery/export where practical.
- Confirm New Game before erasing permanent progress; keep settings independent.
- Restore to a safe room spawn, never inside a log, on a removed platform, behind an impossible gate, or outside bounds.

---

## 10. Distinct Enemies and a Memorable Old Thorngut

### 10.1 Complete the existing roster before adding more

| Enemy | Distinct behavior | Public-path proof |
|---|---|---|
| Grub | Coil/lunge, simple opening. | Recognizable tell, dodge, recovery punish. |
| Sporecap | Visible area cloud, interruptible preparation. | Leaving the boundary avoids damage; not an invisible distance check. |
| Hound | Fast lunge, coordinated pack commitments. | Dodge-through/spacing beat trading; no inevitable simultaneous bite. |
| Moth | Night-only aerial threat and visible darts. | Stones/movement answer it; no damage through floors. |
| Stag | Committed charge, hoof tell, terrain stun. | Actual wall collision creates a punish window. |
| Trapper | Readable traps/nets and accessible escape. | Nets block transformation; Roar or timed escape works even at low Rage; no mandatory rapid mash. |
| Brute | Explicit bark armor and vulnerable cracked state. | Fists cannot bypass intact armor; skills create real human follow-up. |

Drops reacquire tools after death without duplicates or permanently inaccessible equipment. Each enemy needs different animation, sound, and attack geometry—not just different HP.

### 10.2 Build the fight, not phase labels

Begin with 900 HP and 60%/25% transitions; tune through evidence.

- **Phase 1 — Charge:** scrape tell, committed charge, tusk sweep, controlled grub summons, actual trunk/wall opening.
- **Phase 2 — Canopy:** trees/moths create a clear bear opportunity; tree impacts pin. Human players instead bait collisions, handle adds, and punish normal recovery.
- **Phase 3 — Thorn Storm:** marked projectile lanes/bursts, faster but reactable charges, decisive recoveries. Recombine learned responses, not random damage aura.

Reconcile current 120 tree damage with GAME's 60 damage plus three-second pin; use the spec value initially unless a recorded balance decision approves another. One fallen tree cannot reapply damage through repeated helper calls.

An unfinished boss resets while permanent trees remain changed. Prove victory with every arena tree already felled/eligible logs consumed. Adds cannot create infinite Wound recovery or resource starvation. Test pin/phase ordering and simultaneous boss death/lethal repayment so outcome is defined once.

**Gates:** ordinary public-controls full victory, no-full-transformation victory without debug resources, altered-tree retry, low-gear re-arm, day/night entry, death/reset, and correct completion persistence.

### 10.3 Ending and replay reason

On victory, stop hostile outcomes, commit completion once, show the promised sunrise, award Tooth Necklace once, and report actual play time/deaths/successful transformations/unique trees/secrets against real totals.

Offer Return to Title and confirmed New Game. Future optional challenge goals may reward fewer deaths/transforms or alternate routes without permanent stat inflation.

---

## 11. Art and Animation Production

### 11.1 Approve a style bible before mass generation

Use the Titan's charcoal fur, amber eyes, bone/leather, and imposing silhouette. Bjarki starts lean and exposed, not permanently armored or wearing a painted coat; items are visible acquisitions.

Palette anchors: slate `#070a09`, heartwood `#2e1f18`, violet rot `#381c3b`, silver `#a3b8b0`, Rage amber `#e5a93b`. These guide composition, not a ban on daylight, muted moss, or warm den fire. Dark folklore does not require maximum gore or unreadable blacks.

Approve Bjarki/bear/hound/sporecap/tree/den/foreground together in one day/night room at gameplay scale. Fix cohesion before generating the roster. Required paths, collision boundaries, and tell poses must remain legible.

### 11.2 Animation manifests, not scaled copies

Use authored multi-frame contact poses with restrained procedural follow-through. Hand-authored or corrected AI-assisted sources are acceptable; identical scaled poses are not a run cycle.

Clips specify frame rectangles, foot/pivot baseline, sockets, duration/loop rules, action mapping, and contact landmarks. Simulation controls startup/active/recovery; renderer frames cannot award hits or alter timing.

| Actor | Required final coverage |
|---|---|
| Human | Idle/run/start-stop-turn; jump/land; crouch/crawl; dodge; three strikes; heavy charge/release; throw; parry; hurt/net/death; sleep/wake; three half-shifts. |
| Bear | Idle/run/jump/fall/land; three mauls; Rend/Charge/Pounce; grab/hurl; uproot/three swings; roar; debt feedback; return. |
| Shift | Four meaningful entry poses, cut-in, readable break/revert. |
| Each enemy | Motion, tell, attack, recovery, hurt/stagger, death, plus behavioral states. |
| Boss | Locomotion, scrape/charge/sweep, collision stun, pin, transitions, thorns, defeat. |
| Trees | Standing/cracks/stump/log/consumed variants and correctly anchored fall. |

Use GAME §12 frame lists as estimates, not quotas excusing bad movement. Prioritize footplant, contact, tells, and shift. Cross-fades help compatible transitions but cannot smear contact timing or replace needed drawings.

### 11.3 Pipeline and acceptance

- Extend `docs/art-prompts.json` with approved references, corrections, clip metadata, and provenance.
- Keep large raw sources/regeneration tools outside the critical payload; export optimized atlases normally ≤2048².
- Inspect alpha/edge pixels before keying/erosion; never amputate fur, claws, weapons, antlers.
- Check light/dark/colored backdrops for halos, cropped feet, anatomy errors, scale inconsistency, and socket drift.
- Initially retain approximate 72/150 px logical scale; approve art/camera/rooms together if changing it for phones.
- Human hand/body/charm overlays align per frame; bear uses remembered accents, not human equipment layers. Art and actual gear agree.
- Review normal-speed phone-sized clips; contact sheets alone cannot approve animation.
- Label generated art honestly; preserve MTG/gallery credits and do not attribute generated substitutes to real artists.

---

## 12. Camera, Lighting, and Environmental Composition

### 12.1 Camera contract

Stable two-axis follow, horizontal look-ahead, vertical dead zones, room limits, restrained spring/easing. Show landing zones before drops/jumps without losing the player. Preserve eased 10% bear zoom.

Apply world transforms exactly once. Parallax, particles, trees, masks, and debug overlays share a documented world→screen conversion; restore before HUD/menus. Verify origin, far x, vertical rooms, bear zoom, and boss. Camera shake is presentation-only, bounded, accessibility-adjustable, and never shifts collision/input coordinates.

### 12.2 Canvas compositor before an engine rewrite

Cached room layers, low-resolution darkness masks, separately colored glow, painted shafts, drifting mist, and sparse particles can establish depth without real volumetric rendering or WebGL.

- Clear offscreen buffers/reset blend state each frame; no accumulated darkness or leaked `destination-out`.
- Alpha subtraction creates visibility, not colored light; use a separate bounded emissive/color pass.
- Derive lights from real defined room/simulation emitters, not invented `world.activeFires` fields.
- Viewport-sized masks, off-screen culling, downsampling; never a level-width canvas.
- Preserve platforms/hazards/interactables/tell silhouettes. Fade foliage where it obscures combat.
- Cross-fade painted day/night variants and grades over existing transitions; underground rooms retain plausible local lighting.
- Opened canopy light matches the gameplay shaft/Rage location.

**Gate:** readable landmarks/paths in all phases and accessibility modes; far/vertical screenshots and pixel checks; no HUD drift/double camera offsets. Darkness cannot substitute for environmental composition.

---

## 13. Audio That Carries Information and Weight

Keep synthesized Web Audio as baseline. Layered envelopes/textures can improve it without licensed songs or large downloads. Recorded/paid assets require provenance, permission, budget, and authorization.

- Separate master/music/SFX/ambience; compressor/limiter; bounded voices.
- Tells/debt warnings outrank ambience; impacts outrank drone; UI does not mask combat.
- Footsteps reflect peat/mud/logs/stone/water and believable contact landmarks, not an unbounded timer.
- Bear hits combine bass weight with midrange details that translate to phone speakers; sub-bass alone is insufficient.
- Distinct creak/crack/fall/impact and breath/cloth/shift/roar envelopes/timings.
- Evoke bowed lyre/horn/flute/vocal formants without falsely calling oscillators authentic recordings.
- Smooth exploration/combat/high-Rage/bear/break/boss layers; intentional silence at death and safety at dens.
- Reuse noise buffers, dispose finished nodes, and cap allocation/voices.
- Unlock from trusted gestures; degrade gracefully without audio support.
- Gate delayed resume/scheduled cues by active mode/generation; backgrounding cannot revive sound. Pause/menu handling is consistent, with no multiplying ambience timers.

**Gate:** headphones and phone-speaker clarity, mute/sliders, repeated resume, backgrounding, no clipping/node/timer growth, and readable combat with sound off.

---

## 14. Input, UX, and Accessibility

### 14.1 One shared action contract

Held actions and edges from keyboard/gamepad/touch drive the same sim. Buffers are consumed once across catch-up; no duplicated throw, Rage spend, defense, or heavy release.

- Test advertised bindings; update tutorial/HUD/settings/labels with approved remaps.
- Remove obsolete Honey normalization/policy/help/save fields, not just buttons.
- Identical tap/hold/dead-band/fresh-release behavior, charge progress, insufficient-resource cues.
- Explicit per-pointer ownership; Attack release never cancels movement. Handle capture loss, cancellation, overlapping buttons, and handoff.
- Cancellation is not ordinary release: `pointercancel`, lost capture, and lifecycle cleanup discard the cancelled gesture without firing a tap, charged heavy, transform, or bear release. Test this separately from successful `pointerup`.
- Clear held/buffered input on pause, blur, hidden, resize/orientation, pointer cancellation, and controller disconnect.
- Lifecycle force-pause is idempotent: blur+hidden cannot toggle back to play. Foreground requires explicit Resume.
- Suppress held gamepad actions until neutral after resume.
- Remappable keyboard, gamepad hints, suitable dead zones, and an alternative to sustained holds/rapid mashing without changing gameplay timing.

### 14.2 Two-thumb landscape layout

Keep movement left, necessary combat cluster right; avoid a third finger for common combinations. Make directional skills and Interact discoverable. Measure actual post-transform `getBoundingClientRect()` dimensions: primary targets ≥56 CSS px.

Respect safe areas/notches/browser chrome, short phones, and left-handed needs where feasible. Controls cannot obscure critical tells/landing zones. Reposition/prioritize rather than shrink below minimum. Portrait offers rotation guidance and pauses; rotation cannot advance combat invisibly. Touch capability depends on device inputs and geometry, not width alone.

### 14.3 Readable state and honest assistance

Health/stamina/segments/timer/debt use labels/shapes as well as color. Context prompts are brief/device-specific/dismissible. Explain debt before it kills; describe actual Assist behavior honestly.

Settings support reduced motion, flash reduction, shake intensity, music/SFX/ambience, remaps, and readable UI scaling where feasible. Respect initial `prefers-reduced-motion` and retain explicit choices. Menus provide keyboard focus/sensible return.

Test mute, color deficiency/grayscale, dim brightness, larger text, and reduced motion. Required information survives each without accidental simulation changes.

---

## 15. Performance, Loading, and Offline Delivery

### 15.1 Budgets and proof

Runtime thresholds below are **proposed release gates**, measured on agreed devices rather than asserted from headless tests.

| Budget | Target / measurement |
|---|---|
| First playable transfer | ≤6 MB for shell/dream/opening; count every critical request. |
| Complete game transfer | ≤30 MB for deployed game art/audio/data; galleries/wallpapers separate and never implicitly prefetched. |
| Atlases | Normally ≤2048²; track decoded memory too: one RGBA atlas at that size is about 16 MiB. |
| Frame pacing | Target 60 fps on iPhone 12 and an agreed 2021 mid-range Android; record browser/DPR/tier and a ten-minute representative run. |
| Main-thread / frames | Trial gate: update+render p95 ≤12 ms, presented-frame p95 ≤20 ms, fewer than 1% above 33.3 ms at 60 Hz. Report sustained stalls, not only averages. |
| Cold first play | Trial gate: usable input within 8 s at documented 10 Mbps/100 ms latency; include fetch/decode. |
| Memory | Record resident decoded images/buffers and trends; set a device-tested cap at M0/M3, enforce unloading/pooling. Compressed bytes do not prove safety. |
| Lifecycle stability | No catch-up explosion or listener/audio/particle/timer growth across backgrounding and repeated runs. |

Cull by room/camera, pool effects, cache static drawing, stage next-room/night assets, release distant textures, and avoid synchronous combat-time decode. Test phones at the earliest slice, not after art completion.

Quality tiers can reduce mist/glow resolution/particles/DPR, never tells, collisions, AI, simulation timing, or permanent-world meaning.

### 15.2 Honest offline readiness

The current worker caches shell/Titan but excludes `/art/`, where many game images live. A procedural fallback does not prove illustrated assets are offline-ready.

Define/display:

1. **Offline-playable core:** shell, complete gameplay data, required fallback presentation; offline reload can complete the level.
2. **Full illustrated offline pack:** all release-specific game assets, explicit download progress/size/retry/readiness; optional bulk download does not burden first play.

Record this staged behavior as a refinement of GAME A12. If fully illustrated offline immediately after first load is instead required, explicitly account for the full download; do not claim incompatible budgets/readiness.

Use exact release asset allowlists. Permit needed game images in `/art/assets/` without caching the art gallery document, research, Guardian, wallpapers, or arbitrary requests. Bound caches and handle partial installation.

### 15.3 Consistent releases

Update worker cache, HTML module version, transitive module/asset identities, and release tests together. New modules need explicit `site/_headers` rules; do not assume suffix globs provide correct revalidation.

Keep network-first navigation/fallback. Test old installed version → new version, not just fresh context. Avoid mixed new HTML/old modules and forced reload during combat; offer safe update boundaries and compatible save rollback.

---

## 16. Repair Evaluation Before Balance Tuning

### 16.1 Instrumentation requirements

- Count successful emitted actions/damage/unique kills/defenses/transformations/mutations/phase wins, not requested inputs. Damage events record the actual accepted damage before death restores Health; a before/after HP delta alone misses fatal hits.
- Separate active sim, playing elapsed, human/bear exposure, encounter time, traversal, dens, dream, and menus.
- Stop/exclude post-completion frames; no diluted danger/uptime.
- Use graph milestones/rooms/gates/boss phases/true completion; retain x progress only as legacy diagnostic.
- Fix seconds/minutes labels and valid zero timestamps.
- Compare equivalent traversed encounters with actual human exposure; different reach is not fair mastery comparison.
- Measure Wounds/repayment/lethal break/tree pin/re-arm/shortcut savings.
- Validate all authoritative numbers/bounds and stuck/unreachable/runaway states.
- Replace rounded partial digest claims with canonical state/event replay. State cross-browser float equivalence honestly.
- Replace hard-coded no-comfort scores with behavior/schema/UI checks; distinguish unknown from pass/fail.
- Bind reports to commit/release/seed/policy/duration/schema/environment/capture/model provenance; reject stale art judgment as current evidence. Review the actual deployed asset format and current animation, not only source PNGs or old captures.
- Validate judgment/report schema, unique expected row IDs, finite ratings within 0–4, and rubric weights totaling 100. Missing or invalid art evidence leaves the visual gate unreviewed regardless of the aggregate mechanical score.

### 16.2 Policy coverage and thresholds

Refine/add reckless challenger, disciplined tell-reader, tap spender, bank-and-berserk player, avoidant explorer, and human-only boss challenger. These are proposed policies, not existing coverage claims.

Use production actions and graph navigation. Direct setup is acceptable for isolated unit probes, never for progression proof. Run a recorded multi-seed set long enough for the 20–30-minute target; current single-seed 900 s is shorter. Report distributions, not only the best result.

Define bands from design hypotheses/player observations before final tuning. Investigate whether failure is bot, instrumentation, content, or balance; never move thresholds just to manufacture a pass. Any failed contract blocks shipping regardless of weighted score.

### 16.3 Separate evidence categories

Mechanical correctness, pacing, art/animation, device usability/performance, and human enjoyment need separate verdicts. Art models can flag flaws, not certify animation, fairness, provenance, or fun. Composite scores cannot hide an essential weak category.

Require current day/night, human/bear, transformed-camera, boss, phone captures and normal-speed clips. Record disagreements and fix reproduced problems, not only scores.

---

## 17. Human Playtesting

Begin with at least five novices across desktop/touch when feasible, plus an experienced combat player and reduced-motion/muted-audio coverage. This is formative evidence, not statistical proof. If recruitment is unavailable, mark gates unverified rather than substituting agent praise.

Observe an uncoached opening and complete progression attempt before explaining. Record:

- Time to confident controls, first item, tap availability/use, and real bear.
- Whether spend/save and Wound debt are understood before repayment death.
- Missed/accidental inputs, unclear exits/tells, repeated tutorial confusion.
- Death cause, the player's proposed answer, and whether retry improves mastery.
- Re-arm/shortcut return versus compulsory grinding.
- Recognition/use of permanent trees without prompting.
- Encounter distinctness, empty traversal, optional-route value.
- Bear power/readability/control, and boss-phase/human-answer clarity.

Provisional slice gate: at least four of five novices explain spend/save and forest persistence in their own words; no repeated input blocker, unavoidable introductory hit, or mandatory Rage grind. Do not require a death quota or penalize skilled survival.

Triage control/save/softlock defects first, repeated clarity/fairness second, preferences third. Change one major balance variable at a time; retain short before/after evidence.

---

## 18. Milestones and Exit Gates

Use RED → GREEN → REFACTOR for each changed gameplay behavior: focused failing test, verify intended failure, minimal implementation, focused/full regression. Build vertical slices, not all imagined tests followed by one giant rewrite.

Independent art preparation/read-only reviews can run in parallel against agreed interfaces. Movement/topology/migration/boss integration need an accountable integrator and full public-path recheck. Every milestone retains mobile/accessibility/performance checks.

### M0 — Baseline and decisions

- [ ] Re-read docs/code; preserve save fixtures; run actual tests.
- [ ] Resolve D18 cleanup, Assist, scale, defense costs/timing, boss tree damage, reload form/Rage, offline semantics.
- [ ] Correct metrics/completion and separate quality categories.
- [ ] Capture current opening/far-camera day/night/bear/boss/touch, loads, and device timing with provenance.

**Exit:** truthful baseline, ranked defects, approved contracts, evidence locations; no bulk art/map expansion first.

### M1 — Input, timing, collision, persistence

- [ ] Regress event delivery, time boundaries, gestures, lifecycle; remove obsolete controls.
- [ ] Extract only needed simulation responsibilities and prove 2D collision.
- [ ] Version/migrate saves; durably persist mutations between checkpoints.

**Exit:** no duplicated one-shots, resumed held inputs, cross-floor hits, clipping, lost world mutations, or tested resource/topology softlocks; preserved tests green.

### M2 — Movement/combat proof room

- [ ] Compare controller presets on the movement course.
- [ ] Implement timelines, stamina/defense, bounded impact, grub/hound/sporecap distinction.
- [ ] Verify human/bear/camera/tells/two-thumb combinations early on phone.

**Exit:** traces/video show response/contact correctness; disciplined play beats trading in equivalent encounters; reduced motion/mute remain readable.

### M3 — Signature vertical slice

- [ ] Roughly six to eight linked rooms, or fewer if stronger: wake/scavenge/tap/Den/bear/tree/break/death-return.
- [ ] Optional branch, man-only route, recoverable gate, recognizable permanent return loop.
- [ ] One human/bear set, enemy family, tree, day/night room, HUD/audio at final intended style.
- [ ] Purposeful 12–15-minute slice with real bear pacing intact, no free/debug Rage.
- [ ] Novice/touch, storage/offline, and device performance validation.

**Exit:** signature moments work through ordinary controls and players notice them. Do not scale weak combat/inconsistent art/confusing progression.

### M4 — Complete interconnected level

- [ ] Author graph/landmarks/loops/gates/checkpoints and selected canopy/barrow sub-areas.
- [ ] Match geometry to bridges/shafts/encounters/drop/reset logic.
- [ ] Migrate IDs and test changed-world routes, consumed logs, depleted-Rage recovery.

**Exit:** complete grey-box journey with real choices, safe retries, fast re-arm, no empty padding or permanent softlocks.

### M5 — Roster and three-phase Thorngut

- [ ] Complete distinct enemies/projectiles/traps/nets/collisions/drops.
- [ ] Charge/canopy/thorn-storm, one-shot pin, reset/altered-world retry.
- [ ] Normal/no-full-transform public victories and correct win transaction.

**Exit:** actual victory evidence, safe retry/persistence, fair encounter proof—not helper calls/flags.

### M6 — Production art, animation, audio

- [ ] Apply approved slice style to all required actors/rooms/items/phases.
- [ ] Correct framing/alpha/anatomy/sockets/scale/contact/contrast.
- [ ] Stream atlases, material sounds, bounded effects/accessibility variants.

**Exit:** no critical placeholders, unreadable tells, mixed style, or obvious wallpaper repetition in shipping path; transfer/device budgets pass.

### M7 — Pacing, balance, UX, players

- [ ] Multi-seed public-action bots with correct metrics/full horizons.
- [ ] Full novice runs/retries/spend-save/debt/routes/boss learning.
- [ ] Tune one variable at a time and reconcile docs/tutorials with decisions.

**Exit:** evidence supports targets/experience; repeated fairness/confusion failures resolved; limits stated.

### M8 — Release candidate and independent review

- [ ] Acceptance matrix, full tests/syntax/browser/device/save/offline/cache upgrade.
- [ ] Independent review with reproduced blockers treated as no-ship.
- [ ] Release identities/manifests/migration/rollback prepared.
- [ ] Deploy only when authorized, then read back canonical target/sibling routes.

**Exit:** working release backed by evidence. Missing device/player checks or authorization stays explicitly outstanding.

---

## 19. Acceptance Matrix and Evidence

Track each ID as implemented/verified/blocked/deferred with owner and evidence. These are future gates, not completed claims for this planning edit.

| ID | Acceptance | Proof / GAME criterion |
|---|---|---|
| U01 | Isolated dream, cloth wake, early gear, fair first gap. | New-game browser + sim integration; A1. |
| U02 | Directional costs/Crown, gesture dead band, insufficient Rage. | Adapter boundaries and all devices; A2. |
| U03 | 90/60 active seconds, entry/fresh release, no kill extension. | Tick/pause/hit-stop/input integration; A3. |
| U04 | Clock/moonrise/night gain/shafts/painted transitions. | Arithmetic tests + captures; A4/A5. |
| U05 | Wounds/kill recovery/repayment/Assist/exhaustion. | Public combat + readable HUD; A6. |
| U06 | Geometry-aligned fall/log/shaft persists before next checkpoint. | Death/sleep/immediate reload; A7. |
| U07 | Death strips inventory/Rage, dawn/safe spawn, world retained. | All checkpoints/migrated fixtures; A8. |
| U08 | Re-arm/Rage recovery; no log/depleted-resource/expiry softlock. | Real traversal + changed graph; A9. |
| U09 | Form-specific spaces obey geometry. | Public boundary traversal/form transitions; A10. |
| U10 | Three boss phases/pin/normal and human-only win/changed-tree retry. | Full public recordings/traces; A11. |
| U11 | Controller/buffers/costs/contact/vertical separation; zero-step/hit-stop action retention. | Sim/input scheduling regressions + browser clips. |
| U12 | Dream→full progression→win with normal controls/resources. | Non-debug run; actual boss/summary, not max x. |
| U13 | Two-thumb inputs and measured ≥56 CSS px targets. | Simultaneous pointers/post-transform geometry; A12. |
| U14 | Idempotent lifecycle pause/clear/explicit resume. | Blur+hidden/orientation/disconnect/late audio. |
| U15 | Advancing renderer/far x-y/bear zoom/fixed HUD. | Errors + state + pixel/video probes. |
| U16 | Cohesive animated art/scale/gear/contact. | Current sheet/gameplay clips + human review. |
| U17 | Reduced motion/mute/non-color cues/focus/Assist playable. | Dedicated accessibility pass. |
| U18 | Schema/content migration, unloaded IDs, failed Continue and quota-safe saves. | Fixtures/reload; no live corruption or original-save deletion. |
| U19 | Transfer/frame/memory/long-run budgets. | Network/device traces, not headless FPS; A12. |
| U20 | Core offline completion/pack honesty/cache upgrade. | Offline cross-room run + old-version update; A12. |
| U21 | Valid pacing/uptime denominators/horizons. | Multi-seed/player distributions; A13. |
| U22 | Authoritative replay equivalence/no corruption. | Long/boundary/chaotic runs. |
| U23 | Game/codex/art/Guardian/assets/redirects preserved. | Canonical HTTP/browser + exclusions; A14 extended. |
| U24 | Essential quality reviews/no fabricated ship claims. | Independent blockers/provenance/rollback. |

### 19.1 Existing commands and limits

```sh
npm run test
npm run evaluate -- --seconds=1800
node --check site/main.js
node --check site/sim/world.js
node --check site/render/renderer.js
node --check site/render/sprites.js
git diff --check
python3 -m http.server 8000 --directory site
```

Evaluation rewrites tracked `artifacts/evaluation.json` and `.md`; run deliberately/review changes. Current runner still uses seed 7, not the proposed multi-seed suite. Syntax-check every changed JS/MJS file, not only examples. There is no declared browser command; add/document a development-only runner rather than invent `npm run browser` or assume Playwright is installed. Static serving alone verifies nothing about gameplay.

### 19.2 Browser/device matrix

Chromium plus actual Safari/iOS and agreed Android where available; unavailable platforms explicitly remain unverified. Desktop 1280×720/1440×900; portrait 390×844; landscape 844×390; short landscape 667×375; relevant safe areas/DPR.

Attach error/page listeners before navigation. Exercise start/continue, real keyboard/gamepad, simultaneous touch move/action, pause, death/sleep/save/reload, far/vertical camera, boss/win, and offline progression. State advances and canvas changes; a plausible frozen screenshot is not a pass.

Debug setups may accelerate isolated checks, but full progression and required human-only boss proof use ordinary resources/controls. Teleport/helper damage/infinite Rage is not completion evidence. Foreground an occluded tab before calling stalled rAF a renderer crash; separate cache-bypassed local QA from installed-worker upgrade tests.

### 19.3 Evidence package

A proposed location is `artifacts/upgrade/<milestone>/`: release/commit, commands/results, seeds/settings, browser/device/network/performance, screenshots/clips, input/state traces, save fixtures, player observations, known gaps. These paths are proposed, not artifacts created by this plan.

Do not reuse old successful evidence as new-code verification. Label automated, manually observed, human-reported, model-reviewed, and unverified claims separately.

---

## 20. Risks, Cuts, and Release Safety

| Trigger | Response |
|---|---|
| Engine rewrite precedes playable gain. | Keep public seam, narrow extraction, regressions, M3 first. |
| Bigger map without better choices. | Cut padding/rooms, preserve loop/shortcut; no extra campaign. |
| Art exceeds time/size. | Prioritize run/contact/tells/shift; reuse coherent modules, cut P2 variation. |
| Darkness/effects hide play. | Reduce masks/flash/fog; silhouettes/readability outrank spectacle. |
| Migration or mutation loses/severs progress. | Stable IDs/backups/safe spawns/changed-world reachability. |
| Phone slowdown/audio growth. | Pool/cull/cap/downsample cosmetics; do not slow simulation. |
| Bots reward farming/max x/inflated damage. | Correct instruments/comparability; require win/player evidence. |
| Mixed cached releases. | Version dependency graph; installed-version/offline update proof. |
| Optional moves overload controls. | Cut unless core slice improves across devices. |
| Device/player checks unavailable. | State gap, withhold claim, never fabricate substitutes. |

For an authorized release, retain known-good deploy/save rollback. Use the existing Pages project/domain, not a new one by default. Verify `https://werebear.xeb.ai/`, release marker, redirects, siblings, modules/assets, migration, and offline on the canonical domain—not only preview. Read back exact target before saying it shipped.

This document does not authorize commits, pushes, deployment, paid generation, credential changes, or destructive cleanup.

---

## 21. Copyable Next-Session Execution Brief

> Read all repository Markdown and apply the source-of-truth rules. Inspect real code/tests first. Preserve D18/no-Honey horror, fixed duration/Wounds/exhaustion, inventory loss/world persistence, and one complete Elderwold.
>
> Start at the earliest unverified milestone, normally M0. Name the public behavior and acceptance IDs. Do not rebuild working features based on guessed deficiencies; proposed files/optional moves are not existing APIs or blanket authorization.
>
> For changed gameplay, write a focused production-seam regression, observe the intended failure, implement the smallest vertical improvement, then run focused/full tests. Keep simulation pure/deterministic; presentation/audio/storage consume authoritative state/events. Verify gestures, event delivery, collision, saves, and lifecycle boundaries.
>
> Make man/bear contrast and permanent shortcuts excellent in a playable slice before expanding map/art. Use authored attacks/tells, coherent frame animation, readable darkness, bounded impact, meaningful routes, and early two-thumb/muted/reduced-motion checks.
>
> Correct evaluation before tuning against it. Keep correctness, pacing, art, performance, and enjoyment separate. Green tests, model scores, farthest-x bots, static captures, or debug kills do not prove a complete or great game.
>
> Finish milestones with working files and actual evidence: changes, accepted IDs, commands/browser/device/player results, blockers, next eligible milestone. Never fabricate output/waive unknowns. Do not commit/push/deploy/spend/erase progress without authorization.

**Success means:** players feel vulnerable but in control as Bjarki, deliberately spend or bank Rage, feel earned bear power, recognize the forest they changed, recover meaningfully after death, and defeat a fair, memorable Old Thorngut on supported devices with progress they can trust.
