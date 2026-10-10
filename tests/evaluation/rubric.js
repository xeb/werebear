// Adventure-game rubric — adapted from readysetsanta's character rubric
// (weighted 0-4 ratings over automated evidence, contract failures become
// blockers, human review caps ratings). Rated rows are mechanical only;
// fun/feel stays explicitly unreviewed.
export const RUBRIC_VERSION = 'adventure-rubric-v1';

const ratingFromBands = (v, bands) => {
  for (const [threshold, rating] of bands) if (v >= threshold) return rating;
  return 0;
};

export function scoreAdventure(runs, contracts, levelInfo) {
  const by = Object.fromEntries(runs.map(r => [r.policy, r]));
  const best = runs.reduce((a, b) => (b.progress > a.progress ? b : a));
  const spread = Math.max(...runs.map(r => r.progress)) - Math.min(...runs.map(r => r.progress));
  const fails = contracts.filter(c => !c.pass);

  // §4 rhythm targets: bear uptime ~25% over combat time (±25% → .1875–.3125)
  const uptime = best.bearUptime;
  const uptimeOk = uptime >= 0.1875 && uptime <= 0.3125;

  const rows = [
    {
      id: 'progression', name: 'The level can be traversed', weight: 25,
      rating: ratingFromBands(best.progress, [[0.95, 4], [0.6, 3], [0.3, 2], [0.05, 1]]),
      evidence: `best policy ${best.policy} reached ${(best.progress * 100).toFixed(0)}% of the Elderwold${best.completed ? ' (level complete)' : ''}; checkpoints lit: ${best.checkpointsLit}/3`
    },
    {
      id: 'combat', name: 'Combat tools earn their keep', weight: 15,
      rating: ratingFromBands((best.kills || 0) / (best.seconds / 60), [[1.5, 4], [0.8, 3], [0.3, 2], [0.05, 1]]),
      evidence: `${best.kills} kills in ${best.seconds}s as ${best.policy}; attack frames ${best.attacks}, dodge frames ${best.dodges}`
    },
    {
      id: 'rage', name: 'Rage economy: spend or save is a real choice', weight: 15,
      rating: ratingFromBands(best.tapSkills + best.transforms * 5, [[10, 4], [5, 3], [2, 2], [1, 1]]),
      evidence: `tap skills fired: ${runs.reduce((n, r) => n + r.tapSkills, 0)}, full transformations: ${runs.reduce((n, r) => n + r.transforms, 0)}, first at ${best.firstTransform ? (best.firstTransform / 60).toFixed(0) + 's' : 'never'}; contract rage/tap-costs-25 ${contracts.find(c => c.id === 'rage/tap-costs-25')?.pass ? 'PASS' : 'FAIL'}`
    },
    {
      id: 'world', name: 'The world remembers the bear', weight: 10,
      rating: ratingFromBands(best.treesFelled, [[10, 4], [5, 3], [2, 2], [1, 1]]),
      evidence: `${best.treesFelled} trees felled in one run; felled-tree persistence contract ${contracts.find(c => c.id === 'death/world-persists')?.pass ? 'PASS' : 'FAIL'}`
    },
    {
      id: 'deathloop', name: 'Death is a teacher, not a grind', weight: 10,
      rating: fails.some(c => c.id.startsWith('death/')) ? 1 : ratingFromBands(runs.reduce((n, r) => n + r.deaths, 0) === 0 ? 4 : 3, [[3, 4]]),
      evidence: `death/strips-inventory ${contracts.find(c => c.id === 'death/strips-inventory')?.pass ? 'PASS' : 'FAIL'}; total bot deaths ${runs.reduce((n, r) => n + r.deaths, 0)} (bots that die keep their world changes)`
    },
    {
      id: 'agency', name: 'Different intents, different runs', weight: 10,
      rating: ratingFromBands(spread, [[0.5, 4], [0.25, 3], [0.1, 2], [0.02, 1]]),
      evidence: `progress spread across policies ${(spread * 100).toFixed(0)} points (berserker ${(by.berserker.progress * 100).toFixed(0)}% vs pacifist ${(by.pacifist.progress * 100).toFixed(0)}%): the spend/save decision changes the run`
    },
    {
      id: 'determinism', name: 'Seeded, stable, replayable', weight: 10,
      rating: fails.length === 0 ? 4 : fails.some(c => c.id === 'determinism/replay' || c.id === 'stability/no-nan') ? 1 : 3,
      evidence: fails.length === 0 ? `all ${contracts.length} contracts pass, incl. byte-identical seed replay and zero NaN frames` : fails.map(f => f.id).join(', ')
    },
    {
      id: 'pacing', name: 'Bear rhythm near §4 targets', weight: 5,
      rating: uptimeOk ? 4 : ratingFromBands(uptime, [[0.1, 3], [0.05, 2], [0.01, 1]]),
      evidence: `bear uptime ${(uptime * 100).toFixed(1)}% of a full best run (target ~25% ± 25%); first transformation ${best.firstTransform ? (best.firstTransform / 60).toFixed(1) + ' min (bot is superhuman; human target 9–13 min)' : 'never'}`
    },
  ].map(r => ({ ...r, points: r.weight * r.rating / 4 }));

  const points = rows.reduce((n, r) => n + r.points, 0);
  const blockers = [
    ...fails.map(f => f.id),
    ...(best.progress < 0.3 ? ['no-policy-can-traverse'] : []),
    ...(best.treesFelled === 0 ? ['signature-system-unexercised'] : [])
  ];
  const verdict = blockers.length
    ? `blocked by: ${blockers.join(', ')}`
    : points >= 75 && ['progression', 'combat', 'agency'].every(id => rows.find(r => r.id === id).rating >= 3)
      ? 'meets the adventure rubric target'
      : 'needs core gameplay improvements';

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
    scope: 'Automated mechanical evidence from seeded headless bots over the real simulation; human enjoyment and device feel remain unreviewed (same split as readysetsanta).'
  };
}
