# Wear the Bear — automated play evaluation (adventure-rubric-v5-complete)

**Score: 98.8 / 100 — meets the dark-horror challenge target**

Level: 57600px wide, 27 trees, 31 enemies, 3 checkpoints, 19 elevated platforms. 900s sim per policy, seed 7.

| Row | Weight | Rating | Points | Evidence |
|-----|--------|--------|--------|----------|
| The dark can be traversed & Thorngut felled | 12 | 4/4 | 12.0 | berserker/cautious/human_challenger reached 100% (Old Thorngut defeated, 900 boss dmg); no-bear route: COMPLETE (0 transforms); checkpoints 3/3 |
| The forest punishes the careless | 12 | 4/4 | 12.0 | worst-exposed policy takes 125.6 dmg/min in man form (combat-active: 281.2 dmg/min); reckless deaths: speedrun 11, berserker 0 |
| Skill, spacing, parries & jump-evades are rewarded | 12 | 4/4 | 12.0 | cautious (0.5 dmg/min, 214 dodges, 26 baited, 46 punishes, 3 parries, 3 jump-evades) beats careless by 125.1 dmg/min |
| Full combat arsenal exercised (5/5 tools) | 8 | 4/4 | 8.0 | 5/5 combat tools exercised across runs: parries=10, jumpEvades=104, armorBreaks=23, stones=70, logSwings=8 |
| Spend or save under fear | 8 | 4/4 | 8.0 | taps fired 266, berserks 6, first transform at 30s; combat bear uptime 36.2% (§4 target ~25%) |
| The world remembers the bear & hides secrets | 8 | 4/4 | 8.0 | up to 16 trees felled per run, 2 secrets found; persistence contract PASS; boss tree-pin contract PASS |
| Audio: filtered Nordic synthesis & telegraph cues | 8 | 4/4 | 8.0 | BiquadFilter=true, pulse/heartbeat=true, synthesized cues=22/22, main.js telegraphs wired=7/7 |
| Seeded, stable, replayable dread (16 contracts) | 4 | 4/4 | 4.0 | all 16/16 rigorous contracts pass, incl. committed tells, armor cracking, 2D evasion, audio synthesis, full arsenal, and no-bear completion |
| Intent changes the run | 4 | 4/4 | 4.0 | progress spread 98 percentage points across policies (100% berserker vs 3% pacifist) |
| No comfort mechanics remain | 4 | 4/4 | 4.0 | verified dynamically: zero honey/heal-on-demand references in sim, HUD, input, and docs; healing exists only at dens and via bear kill-driven wound recovery |
| Art: dark, grim, epic tone | 6 | 4/4 | 6.0 | The overall mood is successfully dark, grim, and epic horror. The character sprites, especially the transformed stages and enemies like the 'rot grub', 'mire hound', and 'hollow trapper', evoke a strong sense of dread and decay. The environments in Image 2, 3, and 4 with the ancient, twisted trees, moonlit skies, and murky fog reinforce the grim folklore aesthetic. There are no cheerful colors, flat cartoon shapes, or cute details; everything aligns with the 'NOT cute, NOT silly' directive. The glow on 'Old Thorngut boss' (Image 4) is an effective highlight, not a detractor. [judge: google/gemini-2.5-flash] |
| Art: silhouettes read at game scale | 5 | 3/4 | 3.8 | Character silhouettes are generally strong. The human character (top row, first sprite) and werebear forms (second row, last three sprites) have clear, distinct shapes. Enemies like the 'rot grub', 'sporecap', 'mire hound', and 'husk stag' are instantly recognizable. However, in Image 2 and 3, the human character, when small at ~45-50px tall, sometimes blends a bit with the very busy, dark forest backdrop, especially around the legs and lower torso. The 'gloom moth' silhouette is also a bit intricate, which could reduce readability at smaller sizes, though it works well at this resolution. [judge: google/gemini-2.5-flash] |
| Art: one consistent dark style | 4 | 4/4 | 4.0 | There is a remarkable consistency in style and palette. The sprites and environment layers share a dark painterly aesthetic, utilizing charcoals, weathered bones (evident in the 'husk stag' and human character's gear), muted mosses ('sporecap', trees), and bruised violets/ambers ('rot grub', 'Old Thorngut'). The transformation effects (Image 3) and the glowing element of the 'Old Thorngut' (Image 4) also fit seamlessly within this established palette without feeling out of place. The texture work on all elements suggests a unified artistic vision. [judge: google/gemini-2.5-flash] |
| Art: craft (cutouts, framing, anatomy) | 5 | 4/4 | 5.0 | The craft is consistently high. Alpha cutouts are clean across all sprites; there are no visible white halos or pixelated edges. Framing is excellent; characters and creatures are grounded, and environmental elements like trees have natural roots. Anatomy is solid and detailed for both human and monstrous forms, showing a clear understanding of musculature and structure (e.g., human idle, werebear maul, rotwood brute). The level of detail in elements like the fur on the 'werebear' and the texture on the 'rot grub' and 'Old Thorngut boss' is impressive. [judge: google/gemini-2.5-flash] |

## Runs

| Policy | Progress | Completed | Boss Dmg | Kills | Baited Tells | Punishes | Trees | Taps | Transforms | First Transform | Bear Uptime | Deaths |
|--------|----------|-----------|----------|-------|--------------|----------|-------|------|------------|-----------------|-------------|--------|
| speedrun | 95% | — | 5082.4 | 90 | 0 | 2966 | 4 | 215 | 0 | — | 0.0% | 11 |
| berserker | 100% | ✅ | 900 | 30 | 99 | 37 | 15 | 2 | 3 | 30s | 40.7% | 0 |
| cautious | 100% | ✅ | 900 | 30 | 26 | 46 | 16 | 1 | 3 | 39s | 53.7% | 0 |
| human_challenger | 100% | ✅ | 900 | 31 | 21 | 486 | 2 | 47 | 0 | — | 0.0% | 0 |
| pacifist | 3% | — | 0 | 1 | 0 | 0 | 0 | 1 | 0 | — | 0.0% | 0 |

## Contracts (16/16 pass)

- ✅ determinism/replay — 17061.88|538.00|83.75|84.17|0.00|88.38|0.00|2.00|2.00|1.00|1.00 vs 17061.88|538.00|83.75|84.17|0.00|88.38|0.00|2.00|2.00|1.00|1.00
- ✅ death/strips-inventory — {"hand":null,"body":null,"charms":[],"stones":0,"bracers":false}
- ✅ death/world-persists — tree tree_00
- ✅ bear/fixed-duration — 1.000s per sim-second
- ✅ bear/damage-to-wounds — hp 80, wounds 15
- ✅ bear/exhaustion-lockout — exhausted -> man
- ✅ stability/no-nan — 0 nan frames
- ✅ rage/tap-costs-25 — rage 25
- ✅ combat/committed-tells — state=recovery, hp=80, baited=1
- ✅ combat/armor-requires-heavy-or-bear — lightHp=120, heavyHp=103
- ✅ combat/2d-vertical-evasion — hp=80, state=recovery
- ✅ boss/phases-and-tree-pin — hp=420, pin=2.98
- ✅ boss/no-bear-completable — transforms=0, completed=true, bossDmg=900
- ✅ horror/no-comfort-heal — zero honey/heal-consumable references in sim, HUD, input, and README
- ✅ audio/filtered-synthesis-and-tells — biquad=true, pulse=true, events=22/22, wired=7/7
- ✅ combat/full-arsenal-exercised — parries=10, jumpEvades=104, armorBreaks=23, stones=70, logSwings=8

Scope: Automated mechanical evidence from 5 seeded headless bot policies + 16 gameplay/audio/architecture contracts + vision-model art judgment.
