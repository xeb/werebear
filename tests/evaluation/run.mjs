// Entry point: run every policy, gather contract evidence, score with the
// rubric, and write the report. Usage: npm run evaluate [-- --seconds=900]
import { runPolicy, contracts, POLICY_NAMES } from './harness.mjs';
import { scoreAdventure } from './rubric.js';
import { World } from '../../site/sim/world.js';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const argSeconds = Number((process.argv.find(a => a.startsWith('--seconds=')) || '').split('=')[1]) || 900;

const w = new World({ seed: 1 });
const levelInfo = { width: w.worldWidth, trees: w.trees.length, checkpoints: w.checkpoints.length, enemies: w.enemies.length };

console.error(`Evaluating Wear the Bear — level ${levelInfo.width}px, ${levelInfo.trees} trees, ${levelInfo.enemies} enemies`);
const runs = [];
for (const policy of POLICY_NAMES) {
  process.stderr.write(`  ${policy} ... `);
  const r = runPolicy(policy, { seed: 7, seconds: argSeconds });
  runs.push(r);
  console.error(`progress ${(r.progress * 100).toFixed(0)}% · ${r.kills || 0} kills · ${r.treesFelled} trees · ${r.transforms} transforms · ${r.deaths} deaths`);
}
process.stderr.write('  contracts ... ');
const contractsOut = contracts();
console.error(`${contractsOut.filter(c => c.pass).length}/${contractsOut.length} pass`);

// Merge the art judge's verdict if one is on file (run tools/art_judge.py first).
const judgePath = join(root, 'artifacts/art-judgment.json');
const artJudgment = existsSync(judgePath) ? JSON.parse(readFileSync(judgePath, 'utf8')) : null;
if (artJudgment) console.error(`art judge: ${artJudgment.rows.map(r => `${r.id} ${r.rating}/4`).join(' · ')}`);
else console.error('art judge: no artifacts/art-judgment.json — art rows score 0');

const score = scoreAdventure(runs, contractsOut, levelInfo, artJudgment);
mkdirSync(join(root, 'artifacts'), { recursive: true });
const jsonPath = join(root, 'artifacts/evaluation.json');
writeFileSync(jsonPath, JSON.stringify(score, null, 2));

const md = [
  `# Wear the Bear — automated play evaluation (${score.version})`,
  '',
  `**Score: ${score.points} / 100 — ${score.verdict}**`,
  '',
  `Level: ${levelInfo.width}px wide, ${levelInfo.trees} trees, ${levelInfo.enemies} enemies, ${levelInfo.checkpoints} checkpoints. ${runs[0].seconds}s sim per policy, seed 7.`,
  '',
  '| Row | Weight | Rating | Points | Evidence |',
  '|-----|--------|--------|--------|----------|',
  ...score.rows.map(r => `| ${r.name} | ${r.weight} | ${r.rating}/4 | ${r.points.toFixed(1)} | ${r.evidence} |`),
  '',
  '## Runs',
  '',
  '| Policy | Progress | Kills | Trees | Taps | Transforms | First transform | Bear uptime | Deaths |',
  '|--------|----------|-------|-------|------|------------|-----------------|-------------|--------|',
  ...runs.map(r => `| ${r.policy} | ${(r.progress * 100).toFixed(0)}% | ${r.kills || 0} | ${r.treesFelled} | ${r.tapSkills} | ${r.transforms} | ${r.firstTransform ? (r.firstTransform / 60).toFixed(1) + ' min' : '—'} | ${(r.bearUptime * 100).toFixed(1)}% | ${r.deaths} |`),
  '',
  `## Contracts (${contractsOut.filter(c => c.pass).length}/${contractsOut.length} pass)`,
  '',
  ...contractsOut.map(c => `- ${c.pass ? '✅' : '❌'} ${c.id}${c.detail ? ` — ${c.detail}` : ''}`),
  '',
  `Scope: ${score.scope}`
].join('\n');
const mdPath = join(root, 'artifacts/evaluation.md');
writeFileSync(mdPath, md + '\n');

console.log(`SCORE ${score.points}/100 — ${score.verdict}`);
console.log(`reports: ${jsonPath}\n         ${mdPath}`);
if (blockersCount(score) > 0) process.exitCode = 1;
function blockersCount(s) { return s.blockers.length; }
