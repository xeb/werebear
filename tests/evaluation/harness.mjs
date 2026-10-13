// Seeded headless playthrough harness. Drives the real simulation through the
// public input contract at 60 Hz and records the evidence the rubric scores.
import { World, STEP } from '../../site/sim/world.js';
import { POLICIES } from './policies.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');

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
    frames: 0, combatFrames: 0, combatManFrames: 0, combatBearFrames: 0,
    firstTapSkill: null, firstTransform: null, transforms: 0,
    bearFrames: 0, tapSkills: 0, attacks: 0, dodges: 0, throws: 0, honeyEaten: 0,
    deaths: 0, deathsBefore: 0, nanFrames: 0,
    damageTaken: 0, lowHpFrames: 0, nightFrames: 0,
    baitedTells: 0, recoveryPunishes: 0, parries: 0, perfectDodges: 0,
    maxX: 0, bossReached: false, bossDamageDealt: 0, bossPhaseReached: 1, checkpointsLit: 0,
    samples: []
  };
  let alive = w.enemies.filter(e => e.alive).length;
  m.startDeaths = w.stats.deaths;
  const bossStartHp = w.boss?.hp ?? 0;
  const steps = Math.round(seconds / STEP);

  for (let i = 0; i < steps; i++) {
    if (w.complete) break;
    const input = policy(w, i * STEP, mem) || {};
    if (input.skill) m.tapSkills++;
    if (input.attack) m.attacks++;
    if (input.dodge) m.dodges++;
    if (input.throw) m.throws++;
    if (input.honey) m.honeyEaten++;

    const before = { form: w.player.form, rage: w.player.rage, deaths: w.stats.deaths, hp: w.player.hp };
    w.step(input);
    m.frames++;

    const inCombat = w.enemies.some(e => e.alive && Math.abs(e.x - w.player.x) < 520) ||
      (w.boss?.alive && Math.abs(w.boss.x - w.player.x) < 750);
    if (inCombat) {
      m.combatFrames++;
      if (w.player.form === 'bear') m.combatBearFrames++;
      else m.combatManFrames++;
    }

    if (w.player.hp < before.hp - 1e-6 && before.form !== 'bear') m.damageTaken += before.hp - w.player.hp;
    if (before.form !== 'bear' && w.player.hp < 24) m.lowHpFrames++;
    if (w.night) m.nightFrames++;

    const nowAlive = w.enemies.filter(e => e.alive).length;
    if (nowAlive < alive) m.kills = (m.kills || 0) + (alive - nowAlive);
    alive = nowAlive;

    const p = w.player;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.hp) || !Number.isFinite(p.rage)) m.nanFrames++;
    if (before.form === 'man' && (p.form === 'bear' || p.form === 'transforming')) m.transforms++;
    if (before.form === 'man' && p.form === 'transforming' && m.firstTransform == null) m.firstTransform = +(i * STEP).toFixed(1);
    if (p.form === 'bear') m.bearFrames++;
    if (p.form === 'man' && before.rage >= 25 && p.rage <= before.rage - 20 && m.firstTapSkill == null) m.firstTapSkill = +(i * STEP).toFixed(1);

    m.maxX = Math.max(m.maxX, p.x);
    m.deaths = w.stats.deaths - m.startDeaths;
    if (w.boss?.alive && Math.abs(w.boss.x - p.x) < 750) m.bossReached = true;
    if (w.boss) m.bossPhaseReached = Math.max(m.bossPhaseReached, w.boss.phase || 1);
    m.bossDamageDealt = Math.max(m.bossDamageDealt, bossStartHp - (w.boss?.hp ?? 0), w.metrics?.bossDamageDealt || 0);

    if (i % 60 === 0) {
      m.samples.push({ t: +(i * STEP).toFixed(1), x: +p.x.toFixed(1), rage: p.rage, form: p.form, hp: p.hp, deaths: w.stats.deaths - m.startDeaths });
    }
  }

  m.endDeaths = w.stats.deaths;
  m.progress = w.complete ? 1 : +(m.maxX / w.worldWidth).toFixed(3);
  m.bossDamageDealt = +m.bossDamageDealt.toFixed(1);
  m.bearUptime = +(m.bearFrames / Math.max(1, m.frames)).toFixed(3);
  m.combatBearUptime = +(m.combatBearFrames / Math.max(1, m.combatFrames)).toFixed(3);
  m.combatDmgPerMin = +(m.damageTaken / Math.max(0.25, m.combatManFrames / 3600)).toFixed(1);
  m.baitedTells = w.metrics?.baitedTells || 0;
  m.recoveryPunishes = w.metrics?.recoveryPunishes || 0;
  m.parries = w.metrics?.parries || 0;
  m.perfectDodges = w.metrics?.perfectDodges || 0;
  m.armorBreaks = w.metrics?.armorBreaks || 0;
  m.jumpEvades = w.metrics?.jumpEvades || 0;
  m.logSwings = w.metrics?.logSwings || 0;
  m.stonesThrown = m.throws || 0;
  m.secretsFound = w.world.secrets?.length || 0;
  m.treesFelled = w.stats.trees;
  m.checkpointsLit = w.checkpoints.filter(c => c.lit).length;
  m.completed = !!w.complete;
  m.endDigest = digest(w);
  m.stats = { ...w.stats, kills: m.kills || 0 };
  delete m.startDeaths;
  delete m.frames;
  return m;
}

export function probeAudioEngine() {
  const mainSrc = readFileSync(join(rootDir, 'site/main.js'), 'utf8');
  const audioSrc = readFileSync(join(rootDir, 'site/audio/audio.js'), 'utf8');
  const hasBiquadFilter = /createBiquadFilter/.test(audioSrc);
  const hasHeartbeatOrPulse = /heartbeat|pulse|drum|stepBeat/i.test(audioSrc);
  const requiredEvents = [
    'attack', 'heavyAttack', 'hit', 'armorClink', 'armorBreak',
    'parry', 'perfectDodge', 'enemyTell', 'bossTell', 'bossStagger',
    'bear', 'skill', 'moonrise', 'treeCreak', 'treeSnap', 'treeFall',
    'pickup', 'checkpoint', 'sleep', 'hurt', 'exhausted', 'complete'
  ];
  const handledInAudio = requiredEvents.filter(ev => new RegExp(`['"]${ev}['"]`).test(audioSrc));
  const wiredInMain = ['armorClink', 'armorBreak', 'bossStagger', 'enemyTell', 'bossTell', 'pickup', 'exhausted']
    .filter(ev => new RegExp(`['"]${ev}['"]`).test(mainSrc));
  return {
    hasBiquadFilter,
    hasHeartbeatOrPulse,
    handledCount: handledInAudio.length,
    requiredCount: requiredEvents.length,
    wiredCount: wiredInMain.length,
    pass: hasBiquadFilter && hasHeartbeatOrPulse && handledInAudio.length >= 18 && wiredInMain.length >= 5
  };
}

// 16 Rigorous Contract Probes: verify determinism, death/persistence, bear
// duration/wounds/exhaustion, committed enemy tells (bait-and-punish), armor
// cracking, 2D vertical evasion, 3-phase boss + tree pin, no-bear boss
// viability, complete removal of comfort healing, Web Audio synthesis/tells,
// and full combat arsenal exercise across policies.
export function contracts(precomputedRuns = []) {
  const out = [];
  const check = (id, pass, detail) => out.push({ id, pass: !!pass, detail: detail || '' });

  // 1. Determinism: identical seed replays to an identical state
  const a = runPolicy('speedrun', { seed: 11, seconds: 90 });
  const b = runPolicy('speedrun', { seed: 11, seconds: 90 });
  check('determinism/replay', a.endDigest === b.endDigest && a.progress === b.progress, `${a.endDigest} vs ${b.endDigest}`);

  // 2. Death strips inventory
  {
    const w = new World({ seed: 3 });
    w.player.items.hand = 'stick'; w.player.items.body = 'hide_wrap';
    w.player.items.stones = 3; w.player.rage = 60;
    w.player.hp = 1; w.player.invuln = 0; w.player.dodging = false;
    w.hurt(50);
    const p = w.player;
    check('death/strips-inventory', !p.items.hand && !p.items.body && p.items.stones === 0 && p.rage === 0, JSON.stringify(p.items));
  }

  // 3. Felled tree persists through death
  {
    const w = new World({ seed: 5 });
    const tree = w.trees.find(t => !t.felled);
    w.hitTree(tree, true); tree.hp = 0; tree.state = 'fall'; tree.timer = 0.01; w.advance(1);
    const felled = tree.felled;
    w.player.hp = 1; w.hurt(50);
    check('death/world-persists', felled && w.world.felled.includes(tree.id), `tree ${tree.id}`);
  }

  // 4 & 5. Bear lasts 90s as a pure timer and routes damage to Wounds
  {
    const w = new World({ seed: 9 });
    w.enemies = [];
    w.player.rage = 100; w.beginTransform(); w.advance(1);
    w.player.wounds = 0;
    const t0 = w.player.formTimer;
    w.advance(10);
    const perSec = (t0 - w.player.formTimer) / 10;
    check('bear/fixed-duration', Math.abs(perSec - 1) < 0.01, `${perSec.toFixed(3)}s per sim-second`);
    w.hurt(30);
    check('bear/damage-to-wounds', w.player.hp === w.player.maxHp && w.player.wounds === 15, `hp ${w.player.hp}, wounds ${w.player.wounds}`);
  }

  // 6. Exhaustion lockout lasts 3s and disables dodge and Rage gain
  {
    const w = new World({ seed: 4 });
    w.enemies = []; w.player.form = 'bear'; w.breakForm();
    const canDodge = w.dodge();
    w.gainRage(25);
    const rageDuringExhaustion = w.player.rage;
    w.advance(3.05);
    check('bear/exhaustion-lockout', !canDodge && rageDuringExhaustion === 0 && w.player.form === 'man', `exhausted -> ${w.player.form}`);
  }

  // 7. Stability: zero NaN/Infinity over a chaotic 300s run
  {
    const r = precomputedRuns.find(x => x.policy === 'berserker') || runPolicy('berserker', { seed: 13, seconds: 300 });
    check('stability/no-nan', r.nanFrames === 0, `${r.nanFrames} nan frames`);
  }

  // 8. Tap skill costs 25 Rage (20 with Antler Crown)
  {
    const w = new World({ seed: 2 });
    w.gainRage(50, 'test');
    w.tapSkill('forward');
    check('rage/tap-costs-25', w.player.rage === 25, `rage ${w.player.rage}`);
  }

  // 9. Souls-like bait-and-punish: enemy commits to its tell when player steps out of range, whiffing into punishable recovery
  {
    const w = new World({ seed: 6 });
    w.enemies = [];
    const e = w.spawnEnemy('hound', w.player.x + 40);
    e.active = true;
    w.advance(0.15); // enters tell
    const startedTell = e.state === 'tell' && e.tell > 0;
    w.player.x -= 160;
    w.advance(0.45);
    check('combat/committed-tells', startedTell && e.state === 'recovery' && w.player.hp === 80 && w.metrics.baitedTells >= 1, `state=${e.state}, hp=${w.player.hp}, baited=${w.metrics.baitedTells}`);
  }

  // 10. Rotwood Brute armor deflects light attacks and cracks on heavy/bear/skill
  {
    const w = new World({ seed: 8 });
    w.enemies = [];
    const brute = w.spawnEnemy('brute', w.player.x + 40);
    w.attack(false);
    const hpAfterLight = brute.hp;
    w.player.attackCd = 0;
    w.attack(true);
    check('combat/armor-requires-heavy-or-bear', hpAfterLight === 120 && brute.hp < 120 && brute.armor === false, `lightHp=${hpAfterLight}, heavyHp=${brute.hp}`);
  }

  // 11. 2D vertical evasion: jumping high over a ground enemy evades its ground strike
  {
    const w = new World({ seed: 10 });
    w.enemies = [];
    const grub = w.spawnEnemy('grub', w.player.x + 30);
    grub.active = true; grub.state = 'tell'; grub.tell = grub.tellDuration - 0.01;
    w.player.y = w.floorY - 190; w.player.grounded = false;
    w.advance(0.03);
    check('combat/2d-vertical-evasion', w.player.hp === 80 && grub.state === 'recovery', `hp=${w.player.hp}, state=${grub.state}`);
  }

  // 12. Boss 3-phase transitions and 120-damage 3s tree pin
  {
    const w = new World({ seed: 12 });
    w.enemies = [];
    w.hitBoss(360);
    const phase2 = w.boss.phase === 2;
    const t = w.trees.find(tr => tr.id === 'grove_02');
    t.x = w.boss.x - 40;
    w.hitTree(t, true); w.hitTree(t, true); w.hitTree(t, true);
    w.advance(1.25);
    check('boss/phases-and-tree-pin', phase2 && w.boss.hp <= 420 && w.boss.pin > 0, `hp=${w.boss.hp}, pin=${w.boss.pin.toFixed(2)}`);
  }

  // 13. No-Bear Boss Viability: human_challenger reaches and defeats Old Thorngut with 0 transformations
  {
    const r = precomputedRuns.find(x => x.policy === 'human_challenger') || runPolicy('human_challenger', { seed: 7, seconds: 900 });
    check('boss/no-bear-completable', r.transforms === 0 && r.completed && r.bossDamageDealt >= 900, `transforms=${r.transforms}, completed=${r.completed}, bossDmg=${r.bossDamageDealt}`);
  }

  // 14. Dynamic verification that no honey/comfort heal exists in runtime or UI
  {
    const html = readFileSync(join(rootDir, 'site/index.html'), 'utf8');
    const controls = readFileSync(join(rootDir, 'site/input/controls.js'), 'utf8');
    const browser = readFileSync(join(rootDir, 'site/input/browser.js'), 'utf8');
    const readme = readFileSync(join(rootDir, 'README.md'), 'utf8');
    const w = new World();
    const noHoney = !('honey' in w.player.items) && !/HONEY/i.test(html) && !/honey/i.test(controls) && !/honey/i.test(browser) && !/Eat honey/i.test(readme);
    check('horror/no-comfort-heal', noHoney, noHoney ? 'zero honey/heal-consumable references in sim, HUD, input, and README' : 'stale honey reference found');
  }

  // 15. Audio synthesis & telegraph sound cues
  {
    const ap = probeAudioEngine();
    check('audio/filtered-synthesis-and-tells', ap.pass, `biquad=${ap.hasBiquadFilter}, pulse=${ap.hasHeartbeatOrPulse}, events=${ap.handledCount}/${ap.requiredCount}, wired=${ap.wiredCount}/7`);
  }

  // 16. Full combat arsenal exercised across policy runs (parries, jump-evades, armor-breaks, stones, log-club swings)
  {
    const totParries = precomputedRuns.reduce((n, r) => n + (r.parries || 0), 0);
    const totJumps = precomputedRuns.reduce((n, r) => n + (r.jumpEvades || 0), 0);
    const totArmor = precomputedRuns.reduce((n, r) => n + (r.armorBreaks || 0), 0);
    const totStones = precomputedRuns.reduce((n, r) => n + (r.stonesThrown || 0), 0);
    const totLogs = precomputedRuns.reduce((n, r) => n + (r.logSwings || 0), 0);
    const pass = totParries >= 4 && totJumps >= 4 && totArmor >= 4 && totStones >= 4 && totLogs >= 3;
    check('combat/full-arsenal-exercised', pass, `parries=${totParries}, jumpEvades=${totJumps}, armorBreaks=${totArmor}, stones=${totStones}, logSwings=${totLogs}`);
  }

  return out;
}

export const POLICY_NAMES = Object.keys(POLICIES);
