# Wear the Bear — automated play evaluation (adventure-rubric-v2-horror)

**Score: 95 / 100 — meets the dark-horror challenge target**

Level: 57600px wide, 27 trees, 25 enemies, 3 checkpoints. 900s sim per policy, seed 7.

| Row | Weight | Rating | Points | Evidence |
|-----|--------|--------|--------|----------|
| The dark can be traversed — barely | 20 | 4/4 | 20.0 | best policy berserker reached 100% of the Elderwold; checkpoints 3/3 |
| The forest punishes the careless | 20 | 4/4 | 20.0 | the worst-exposed policy takes 10.9 dmg/min in man form (berserker 10.9, speedrun 0.4, pacifist 0.0); deaths when reckless: speedrun 0, berserker 0 |
| Skill and respect for tells are rewarded | 20 | 3/4 | 15.0 | disciplined play (cautious: 5.2 dmg/min, 336 dodge frames, respects tells) beats careless by 5.7 dmg/min |
| Spend or save under fear | 10 | 4/4 | 10.0 | taps fired 4, berserks 5, first at 3s; bear uptime of best run 19.5% (§4 target ~25%) |
| The world remembers the bear | 10 | 4/4 | 10.0 | 14 trees felled in one run; persistence contract PASS |
| Seeded, stable, replayable dread | 5 | 4/4 | 5.0 | all 7 contracts pass, incl. byte-identical seed replay and zero NaN frames |
| Intent changes the run | 10 | 4/4 | 10.0 | progress spread 97 points across policies (100% berserker vs 2% pacifist) |
| No comfort mechanics remain | 5 | 4/4 | 5.0 | honey/heal-on-demand mechanic removed from the simulation, HUD, touch controls and saves; healing exists only at dens and the bear's kill-driven wound recovery |

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
