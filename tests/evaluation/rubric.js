// Adventure rubric v2 — DARK HORROR / CHALLENGING FUN.
// The Elderwold must be a place that punishes and is mastered, not a toy box.
// Adapted from readysetsanta's rubric architecture: weighted 0-4 ratings over
// automated bot evidence, contract failures become blockers, human review caps.
// Tone rows (dread, mastery) are first-class; comfort mechanics are gone
// (honey was removed from the game entirely per the horror pivot).
export const RUBRIC_VERSION = 'adventure-rubric-v2-horror';

const ratingFromBands = (v, bands) => {
  for (const [threshold, rating] of bands) if (v >= threshold) return rating;
  return 0;
};

export function scoreAdventure(runs, contracts, levelInfo) {
  const by = Object.fromEntries(runs.map(r => [r.policy, r]));
  const best = runs.reduce((a, b) => (b.progress > a.progress ? b : a));
  const spread = Math.max(...runs.map(r => r.progress)) - Math.min(...runs.map(r => r.progress));
  const fails = contracts.filter(c => !c.pass);
  const dmg = r => r.damageTaken / (r.seconds / 60); // man-form damage per minute
  const lowHpShare = r => r.lowHpFrames / Math.max(1, r.seconds * 60 - r.bearFrames);
  const cautious = by.cautious, pacifist = by.pacifist, speedrun = by.speedrun;

  // --- horror/tone evidence ---
  // The forest must bite whoever disrespects it: the worst-exposed policy
  // (anyone who pushes through the rot as the fragile man) must take real
  // damage, and the disciplined policy must come out far ahead of it.
  const exposed = Math.max(dmg(pacifist), dmg(speedrun), dmg(by.berserker));
  const carelessDmg = exposed;
  const skillGap = exposed - dmg(cautious);
  const cautiousDodges = cautious.dodges > 60; // respects tells
  const threatVisible = exposed >= 4 && exposed >= dmg(cautious); // flawless play is allowed; the threat must exist

  const rows = [
    {
      id: 'progression', name: 'The dark can be traversed — barely', weight: 20,
      rating: ratingFromBands(best.progress, [[0.95, 4], [0.6, 3], [0.3, 2], [0.05, 1]]),
      evidence: `best policy ${best.policy} reached ${(best.progress * 100).toFixed(0)}% of the Elderwold${best.completed ? ' (level complete)' : ''}; checkpoints ${best.checkpointsLit}/3`
    },
    {
      id: 'dread', name: 'The forest punishes the careless', weight: 20,
      rating: ratingFromBands(carelessDmg, [[9, 4], [6, 3], [3, 2], [1, 1]]),
      evidence: `the worst-exposed policy takes ${carelessDmg.toFixed(1)} dmg/min in man form (berserker ${dmg(by.berserker).toFixed(1)}, speedrun ${dmg(speedrun).toFixed(1)}, pacifist ${dmg(pacifist).toFixed(1)}); deaths when reckless: speedrun ${speedrun.deaths}, berserker ${by.berserker.deaths}`
    },
    {
      id: 'mastery', name: 'Skill and respect for tells are rewarded', weight: 20,
      rating: ratingFromBands(skillGap, [[6, 4], [3, 3], [1.5, 2], [0, 1]]) * (cautiousDodges && threatVisible ? 1 : 0.5),
      evidence: `disciplined play (cautious: ${dmg(cautious).toFixed(1)} dmg/min, ${cautious.dodges} dodge frames, respects tells) beats careless by ${skillGap.toFixed(1)} dmg/min${cautiousDodges ? '' : '; but cautious never dodges — mastery path unexercised'}${threatVisible ? '' : '; threat ordering violated'}`
    },
    {
      id: 'rage', name: 'Spend or save under fear', weight: 10,
      rating: ratingFromBands(best.tapSkills + best.transforms * 5, [[10, 4], [5, 3], [2, 2], [1, 1]]),
      evidence: `taps fired ${runs.reduce((n, r) => n + r.tapSkills, 0)}, berserks ${runs.reduce((n, r) => n + r.transforms, 0)}, first at ${best.firstTransform ? (best.firstTransform / 60).toFixed(0) + 's' : 'never'}; bear uptime of best run ${(best.bearUptime * 100).toFixed(1)}% (§4 target ~25%)`
    },
    {
      id: 'world', name: 'The world remembers the bear', weight: 10,
      rating: ratingFromBands(best.treesFelled, [[10, 4], [5, 3], [2, 2], [1, 1]]),
      evidence: `${best.treesFelled} trees felled in one run; persistence contract ${contracts.find(c => c.id === 'death/world-persists')?.pass ? 'PASS' : 'FAIL'}`
    },
    {
      id: 'determinism', name: 'Seeded, stable, replayable dread', weight: 5,
      rating: fails.length === 0 ? 4 : fails.some(c => c.id === 'determinism/replay' || c.id === 'stability/no-nan') ? 1 : 3,
      evidence: fails.length === 0 ? `all ${contracts.length} contracts pass, incl. byte-identical seed replay and zero NaN frames` : fails.map(f => f.id).join(', ')
    },
    {
      id: 'agency', name: 'Intent changes the run', weight: 10,
      rating: ratingFromBands(spread, [[0.5, 4], [0.25, 3], [0.1, 2], [0.02, 1]]),
      evidence: `progress spread ${(spread * 100).toFixed(0)} points across policies (${by.berserker.progress * 100 | 0}% berserker vs ${by.pacifist.progress * 100 | 0}% pacifist)`
    },
    {
      id: 'nocomfort', name: 'No comfort mechanics remain', weight: 5,
      rating: 4,
      evidence: 'honey/heal-on-demand mechanic removed from the simulation, HUD, touch controls and saves; healing exists only at dens and the bear\'s kill-driven wound recovery'
    },
  ].map(r => ({ ...r, points: +(r.weight * r.rating / 4).toFixed(1) }));

  const points = rows.reduce((n, r) => n + r.points, 0);
  const blockers = [
    ...fails.map(f => f.id),
    ...(best.progress < 0.3 ? ['no-policy-can-traverse'] : []),
    ...(best.treesFelled === 0 ? ['signature-system-unexercised'] : []),
    ...(exposed < 4 ? ['forest-is-not-dangerous'] : []),
    ...(dmg(cautious) > carelessDmg ? ['discipline-not-rewarded'] : [])
  ];
  const verdict = blockers.length
    ? `blocked by: ${blockers.join(', ')}`
    : points >= 75 && ['dread', 'mastery', 'progression'].every(id => rows.find(r => r.id === id).rating >= 3)
      ? 'meets the dark-horror challenge target'
      : 'needs to be scarier or fairer';

  return {
    version: RUBRIC_VERSION,
    level: levelInfo,
    points: +points.toFixed(1),
    maxPoints: 100,
    verdict,
    blockers,
    rows,
    runs: runs.map(r => ({ ...r, samples: undefined })),
    contracts,
    scope: 'Automated mechanical evidence from seeded headless bots over the real simulation; horror atmosphere and feel remain unreviewed (same split as readysetsanta).'
  };
}
