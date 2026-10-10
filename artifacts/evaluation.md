# Wear the Bear — automated play evaluation (adventure-rubric-v1)

**Score: 85 / 100 — meets the adventure rubric target**

Level: 57600px wide, 27 trees, 25 enemies, 3 checkpoints. 900s sim per policy, seed 7.

| Row | Weight | Rating | Points | Evidence |
|-----|--------|--------|--------|----------|
| The level can be traversed | 25 | 4/4 | 25.0 | best policy berserker reached 100% of the Elderwold; checkpoints lit: 3/3 |
| Combat tools earn their keep | 15 | 4/4 | 15.0 | 35 kills in 900s as berserker; attack frames 13924, dodge frames 111 |
| Rage economy: spend or save is a real choice | 15 | 0/4 | 0.0 | tap skills fired: 2, full transformations: 0, first at 3s; contract rage/tap-costs-25 PASS |
| The world remembers the bear | 10 | 4/4 | 10.0 | 14 trees felled in one run; felled-tree persistence contract PASS |
| Death is a teacher, not a grind | 10 | 4/4 | 10.0 | death/strips-inventory PASS; total bot deaths 0 (bots that die keep their world changes) |
| Different intents, different runs | 10 | 4/4 | 10.0 | progress spread across policies 97 points (berserker 100% vs pacifist 3%): the spend/save decision changes the run |
| Seeded, stable, replayable | 10 | 4/4 | 10.0 | all 7 contracts pass, incl. byte-identical seed replay and zero NaN frames |
| Bear rhythm near §4 targets | 5 | 4/4 | 5.0 | bear uptime 19.5% of a full best run (target ~25% ± 25%); first transformation 3.1 min (bot is superhuman; human target 9–13 min) |

## Runs

| Policy | Progress | Kills | Trees | Taps | Transforms | First transform | Bear uptime | Deaths |
|--------|----------|-------|-------|------|------------|-----------------|-------------|--------|
| speedrun | 7% | 1 | 0 | 1 | 0 | — | 0.0% | 0 |
| berserker | 100% | 35 | 14 | 0 | 0 | 3.1 min | 19.5% | 0 |
| cautious | 7% | 3 | 0 | 0 | 0 | — | 0.0% | 0 |
| pacifist | 3% | 1 | 0 | 1 | 0 | — | 0.0% | 0 |

## Contracts (7/7 pass)

- ✅ determinism/replay — 3838.00|513.86|80.00|0.00|0.00|89.75|0.00|0.00|0.00|0.00|1.00 vs 3838.00|513.86|80.00|0.00|0.00|89.75|0.00|0.00|0.00|0.00|1.00
- ✅ death/strips-inventory — {"hand":null,"body":null,"charms":[],"stones":0,"honey":0,"honeyPouch":false,"bracers":false}
- ✅ death/world-persists — tree tree_00
- ✅ bear/fixed-duration — 1.000s per sim-second
- ✅ bear/damage-to-wounds — hp 80
- ✅ stability/no-nan — 0 nan frames
- ✅ rage/tap-costs-25 — rage 25

Scope: Automated mechanical evidence from seeded headless bots over the real simulation; human enjoyment and device feel remain unreviewed (same split as readysetsanta).
