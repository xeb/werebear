# Wear the Bear — automated play evaluation (adventure-rubric-v3-dark-epic)

**Score: 83.8 / 100 — meets the dark-horror challenge target**

Level: 57600px wide, 27 trees, 25 enemies, 3 checkpoints. 900s sim per policy, seed 7.

| Row | Weight | Rating | Points | Evidence |
|-----|--------|--------|--------|----------|
| The dark can be traversed — barely | 15 | 4/4 | 15.0 | best policy berserker reached 100% of the Elderwold; checkpoints 3/3 |
| The forest punishes the careless | 15 | 4/4 | 15.0 | the worst-exposed policy takes 10.9 dmg/min in man form (berserker 10.9, speedrun 0.4, pacifist 0.0); deaths when reckless: speedrun 0, berserker 0 |
| Skill and respect for tells are rewarded | 15 | 3/4 | 11.3 | disciplined play (cautious: 5.2 dmg/min, 336 dodge frames, respects tells) beats careless by 5.7 dmg/min |
| Spend or save under fear | 10 | 4/4 | 10.0 | taps fired 4, berserks 5, first at 3s; bear uptime of best run 19.5% (§4 target ~25%) |
| The world remembers the bear | 10 | 4/4 | 10.0 | 14 trees felled in one run; persistence contract PASS |
| Seeded, stable, replayable dread | 5 | 4/4 | 5.0 | all 7 contracts pass, incl. byte-identical seed replay and zero NaN frames |
| Intent changes the run | 5 | 4/4 | 5.0 | progress spread 97 points across policies (100% berserker vs 2% pacifist) |
| No comfort mechanics remain | 5 | 4/4 | 5.0 | honey/heal-on-demand mechanic removed from the simulation, HUD, touch controls and saves; healing exists only at dens and the bear's kill-driven wound recovery |
| Art: dark, grim, epic tone | 6 | 1/4 | 1.5 | The overall mood is far from 'dark-and-epic.' The 'amber sun and silver moon' are entirely absent, replaced by a cheap-looking, bright white crescent moon against a flat, lifeless black sky in the gameplay captures. The vibrant green moss and yellow glowing elements on the sporecap and checkpoint shrine, while trying to be grim, come across as sickly rather than foreboding. The 'rot grub' and 'gloom moth' are too cartoonish in their execution, failing to evoke true horror. The 'elderwood/sapling/bee trees' are particularly egregious, appearing as decorative whimsy rather than ancient, menacing flora. The 'husk stag' is just... a deer. Not epic, not horrifying. The human forms are just generic barbarians, lacking any distinct grim or horror elements beyond a rough texture. [judge: google/gemini-2.5-flash] |
| Art: silhouettes read at game scale | 5 | 2/4 | 2.5 | Many characters have decent silhouettes at their native scale, particularly the 'werebear' forms, 'rotwood brute,' and 'Old Thorngut boss' which present strong, recognizable shapes. However, at game scale, the 'rot grub' becomes an amorphous blob, indistinguishable from environmental debris. The 'gloom moth' is just a moth, not 'gloom.' The 'sporecap' is too busy and loses its form. The 'human' character in particular is very generic and bland as a silhouette; nothing about it screams 'protagonist' or 'horror hero'. [judge: google/gemini-2.5-flash] |
| Art: one consistent dark style | 4 | 1/4 | 1.0 | The contact sheet shows a range of rendering styles. The 'werebear' and larger enemies (Old Thorngut, Rotwood brute, Stage-4 titan) have a gritty, high-detail painted style. However, the 'sporecap' looks like it was plucked from a completely different, less serious game, with its bright, almost fluorescent elements. The 'gloom moth' feels like it belongs in a children's book about enchanted forests. The 'elderwood/sapling/bee trees' are particularly jarring; their simplistic, almost illustrative style clashes heavily with the grittiness of the creatures. The background elements in the live captures are also extremely flat and simplistic, especially the distant tree line and the ground, which do not match the detail level of the character sprites at all. It feels like assets from three different games were cobbled together. [judge: google/gemini-2.5-flash] |
| Art: craft (cutouts, framing, anatomy) | 5 | 2/4 | 2.5 | While most sprites exhibit clean alpha cutouts, the 'gloom moth' has some rough edges that could be cleaned up. The 'sporecap' also shows some pixelation around its glowing elements. The 'mire hound' and 'husk stag' appear slightly blurry, suggesting potential scaling issues or a lack of sharp rendering. The 'hollow trapper' and 'human' sprites have a noticeable halo effect, particularly around their outlines, which cheapens the overall presentation. The 'Old Thorngut boss' seems to be slightly cut off at the bottom. The 'werebear maul' animation has an awkward limb extension that looks malformed. [judge: google/gemini-2.5-flash] |

## Runs

| Policy | Progress | Kills | Trees | Taps | Transforms | First transform | Bear uptime | Deaths |
|--------|----------|-------|-------|------|------------|-----------------|-------------|--------|
| speedrun | 7% | 2 | 0 | 1 | 0 | — | 0.0% | 0 |
| berserker | 100% | 35 | 14 | 0 | 2 | 3.1 min | 19.5% | 0 |
| cautious | 65% | 49 | 9 | 2 | 3 | 3.2 min | 22.5% | 0 |
| pacifist | 3% | 1 | 0 | 1 | 0 | — | 0.0% | 0 |

## Contracts (7/7 pass)

- ✅ determinism/replay — 3838.00|387.15|74.05|0.00|0.00|89.70|0.00|0.00|0.00|0.00|1.00 vs 3838.00|387.15|74.05|0.00|0.00|89.70|0.00|0.00|0.00|0.00|1.00
- ✅ death/strips-inventory — {"hand":null,"body":null,"charms":[],"stones":0,"bracers":false}
- ✅ death/world-persists — tree tree_00
- ✅ bear/fixed-duration — 1.000s per sim-second
- ✅ bear/damage-to-wounds — hp 80
- ✅ stability/no-nan — 0 nan frames
- ✅ rage/tap-costs-25 — rage 25

Scope: Automated mechanical evidence from seeded headless bots over the real simulation; horror atmosphere and feel remain unreviewed (same split as readysetsanta).
