// Seeded headless playthrough harness. Drives the real simulation through the
// public input contract at 60 Hz and records the evidence the rubric scores.
import { World, STEP } from '../../site/sim/world.js';
import { POLICIES } from './policies.mjs';

const digest = (w) => {
  const p = w.player;
  return [p.x, p.y, p.hp, p.rage, p.formTimer, w.clock, w.stats.deaths, w.stats.trees,
    w.world.felled.length, w.world.broken.length, w.checkpoints.filter(c => c.lit).length]
    .map(v => Number(v).toFixed(2)).join('|');
};

export function runPolicy(policyName, { seed = 7, seconds = 600 } = {}) {
  const w = new World({ seed });
  const mem = { dt: STEP };
  const policy = POLICIES[policyName];
  const m = {
    policy: policyName, seed, seconds,
    frames: 0, firstTapSkill: null, firstTransform: null, transforms: 0,
    bearFrames: 0, tapSkills: 0, attacks: 0, dodges: 0, throws: 0, honeyEaten: 0,
    deaths: 0, deathsBefore: 0, nanFrames: 0,
    maxX: 0, bossReached: false, bossDamageDealt: 0, checkpointsLit: 0,
    samples: []
  };
  let alive = w.enemies.filter(e => e.alive).length; // local kill counter (sim has no kill stat)
  m.startDeaths = w.stats.deaths;
  const bossStartHp = w.boss?.hp ?? 0;
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    const input = policy(w, i * STEP, mem) || {};
    if (input.skill) m.tapSkills++;
    if (input.attack) m.attacks++;
    if (input.dodge) m.dodges++;
    if (input.throw) m.throws++;
    if (input.honey) m.honeyEaten++;
    const before = { form: w.player.form, rage: w.player.rage, deaths: w.stats.deaths };
    w.step(input);
    m.frames++;
    const nowAlive = w.enemies.filter(e => e.alive).length;
    if (nowAlive < alive) m.kills = (m.kills || 0) + (alive - nowAlive);
    alive = nowAlive;
    const p = w.player;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.hp) || !Number.isFinite(p.rage)) m.nanFrames++;
    if (before.form === 'man' && (p.form === 'bear' || p.form === 'transforming')) m.transforms++;
    if (before.form === 'man' && p.form === 'transforming' && m.firstTransform == null) m.firstTransform = i * STEP;
    if (p.form === 'bear') m.bearFrames++;
    if (p.form === 'man' && before.rage >= 25 && p.rage <= before.rage - 20 && m.firstTapSkill == null) m.firstTapSkill = i * STEP;
    m.maxX = Math.max(m.maxX, p.x);
    m.deaths = w.stats.deaths - m.startDeaths;
    if (w.boss?.alive && Math.abs(w.boss.x - p.x) < 700) m.bossReached = true;
    m.bossDamageDealt = Math.max(0, bossStartHp - (w.boss?.hp ?? 0));
    if (i % 60 === 0) m.samples.push({ t: +(i * STEP).toFixed(1), x: +p.x.toFixed(1), rage: p.rage, form: p.form, hp: p.hp, deaths: w.stats.deaths - m.startDeaths });
  }
  m.endDeaths = w.stats.deaths;
  m.progress = +(m.maxX / w.worldWidth).toFixed(3);
  m.bossDamageDealt = +(m.bossDamageDealt || (bossStartHp - (w.boss?.hp ?? bossStartHp))).toFixed(1);
  m.bearUptime = +(m.bearFrames / m.frames).toFixed(3);
  m.treesFelled = w.stats.trees;
  m.checkpointsLit = w.checkpoints.filter(c => c.lit).length;
  m.completed = !!w.complete;
  m.endDigest = digest(w);
  m.stats = { ...w.stats, kills: m.kills };
  delete m.startDeaths; delete m.frames;
  return m;
}

// Focused contract probes: small, self-contained evidence units the rubric
// turns into blockers when they fail (readysetsanta's "shared cases").
export function contracts() {
  const out = [];
  const check = (id, pass, detail) => out.push({ id, pass: !!pass, detail: detail || '' });

  // determinism: identical seed replays to an identical state
  const a = runPolicy('speedrun', { seed: 11, seconds: 90 });
  const b = runPolicy('speedrun', { seed: 11, seconds: 90 });
  check('determinism/replay', a.endDigest === b.endDigest && a.progress === b.progress, `${a.endDigest} vs ${b.endDigest}`);

  // death strips inventory; world changes persist
  {
    const w = new World({ seed: 3 });
    w.player.items.hand = 'stick'; w.player.items.body = 'hide_wrap';
    w.player.items.stones = 3; w.player.items.honey = 2; w.player.rage = 60;
    w.player.hp = 1; w.player.invuln = 0; w.player.dodging = false;
    w.hurt(50);
    const p = w.player;
    check('death/strips-inventory', !p.items.hand && !p.items.body && p.items.stones === 0 && p.items.honey === 0 && p.rage === 0, JSON.stringify(p.items));
  }

  // felled tree persists through death
  {
    const w = new World({ seed: 5 });
    const tree = w.trees.find(t => !t.felled);
    w.hitTree(tree, true); tree.hp = 0; tree.state = 'fall'; tree.timer = 0.01; w.advance(1);
    const felled = tree.felled;
    w.player.hp = 1; w.hurt(50);
    check('death/world-persists', felled && w.world.felled.includes(tree.id), `tree ${tree.id}`);
  }

  // bear lasts exactly 90s (60 with iron nail) and drains the bar as a timer
  {
    const w = new World({ seed: 9 });
    w.player.rage = 100; w.beginTransform(); w.advance(1);
    w.player.wounds = 0;
    const t0 = w.player.formTimer;
    w.advance(10);
    const perSec = (t0 - w.player.formTimer) / 10;
    check('bear/fixed-duration', Math.abs(perSec - 1) < 0.01, `${perSec.toFixed(3)}s per sim-second`);
    check('bear/damage-to-wounds', w.player.hp >= w.player.maxHp - 2, `hp ${w.player.hp}`);
  }

  // no numeric corruption over a long chaotic run
  {
    const r = runPolicy('berserker', { seed: 13, seconds: 300 });
    check('stability/no-nan', r.nanFrames === 0, `${r.nanFrames} nan frames`);
  }

  // a tap skill costs exactly 25
  {
    const w = new World({ seed: 2 });
    w.gainRage(50, 'test');
    w.tapSkill('forward');
    check('rage/tap-costs-25', w.player.rage === 25, `rage ${w.player.rage}`);
  }
  return out;
}

export const POLICY_NAMES = Object.keys(POLICIES);
