// Bot policies for the adventure-game evaluation harness.
// Each policy maps (world, elapsed) -> one input frame. Bots interact ONLY
// through the same input contract the browser uses (site/input), never by
// mutating sim state — the same rule readysetsanta's gameplay bots follow.

const dist = (a, b) => Math.abs(a - b);

function nearestEnemy(w, range) {
  let best = null, bd = range;
  for (const e of w.enemies) {
    if (!e.alive) continue;
    const d = dist(e.x, w.player.x);
    if (d < bd) { bd = d; best = e; }
  }
  return best;
}

function inGap(w) {
  return (w.gaps || []).some(g => w.player.x > g.start - 140 && w.player.x < g.end + 80);
}

function stuckJump(mem, w, input) {
  // jump when horizontal progress stalls (walls, roots, gaps) — never inside a
  // root-way tunnel, where crouch-walking is slow by design and jump = stand up
  const blocked = w.player.x - (mem.lastX ?? -1) < 0.5 * (mem.dt ?? 1 / 60);
  mem.blocked = blocked ? (mem.blocked || 0) + 1 : 0; // monotonic: drives mode switches
  mem.stuck = blocked ? (mem.stuck || 0) + 1 : 0;     // resettable: drives hops
  mem.lastX = w.player.x;
  if (mem.stuck > 30 && w.player.grounded && !inGap(w)) { input.jump = true; mem.stuck = 0; }
  return input;
}

function navigate(mem, w, input) {
  stuckJump(mem, w, input);
  // root-way gaps require crouching through the lower route (spec §5.2 A)
  if (inGap(w)) input.down = true;
  // hard-blocked for ~1.5s: spend 25 Rage on Bear Slam (fells Rotwood saplings)
  // — skipped while the policy is banking for the full transformation
  if (input.right && (mem.blocked || 0) > 90 && w.player.form === 'man' && w.player.rage >= 25 && !mem.saveRage) {
    input.skill = true; input.direction = 'down'; mem.taps = (mem.taps || 0) + 1; mem.blocked = 0;
  }
  // bear blocked ~1s: Charge (bear dodge) breaks rot-walls and fells trees
  if (input.right && (mem.blocked || 0) > 60 && w.player.form === 'bear') {
    input.dodge = true; mem.blocked = 0;
  }
  return input;
}

function bearFrame(w, input, mem) {
  // as the bear: maul constantly, push right
  input.right = true; input.attack = true;
  navigate(mem, w, input);
  return input;
}

export const POLICIES = {
  // Push right as fast as possible, fight whatever is in the way.
  speedrun: (w, t, mem) => {
    const input = { right: true };
    navigate(mem, w, input);
    const e = nearestEnemy(w, 150);
    if (e) { input.attack = true; if (w.player.rage >= 25 && w.player.form === 'man') { input.skill = true; input.direction = 'forward'; mem.taps = (mem.taps || 0) + 1; } }
    if (w.player.form === 'bear') return bearFrame(w, input, mem);
    if (w.player.rage >= 100 && w.player.form === 'man') input.transform = true; // one-step hold
    const f = nearestEnemy(w, 260);
    if (f && f.state === 'tell') { input.dodge = true; input.right = true; }
    return input;
  },

  // Souls-like farm loop: push right; when a bear-gate blocks the man, walk
  // back to the last lit den, sleep to respawn the rot, farm Rage, transform,
  // then push again. Exercises the whole core loop, not just movement.
  berserker: (w, t, mem) => {
    const input = { right: true };
    mem.saveRage = true; // banking for the full transformation
    navigate(mem, w, input);
    if (w.player.form === 'bear') { mem.mode = 'push'; return bearFrame(w, input, mem); }
    mem.mode = mem.mode || 'push';
    if (w.player.form === 'transforming') return input;
    if (mem.mode === 'push') {
      if ((mem.blocked || 0) > 240 && w.player.rage < 100) { mem.mode = 'retreat'; mem.blocked = 0; }
      if (w.player.rage >= 100) { input.transform = true; mem.mode = 'push'; return input; }
      const e = nearestEnemy(w, 220);
      if (e) { input.attack = dist(e.x, w.player.x) < 130; }
      return input;
    }
    if (mem.mode === 'retreat') {
      const den = w.checkpoints.filter(c => c.lit).sort((a, b) => b.x - a.x)[0];
      input.right = false;
      if (w.player.x > den.x + 90) { input.left = true; return input; }
      if (t - (mem.lastSleep || -99) > 20) { input.interact = true; mem.lastSleep = t; mem.mode = 'grind'; }
      return input;
    }
    // grind: chase and kill the respawned rot until the bar is full
    const e = nearestEnemy(w, 700);
    if (e && (mem.blocked || 0) < 180) {
      input.right = e.x > w.player.x; input.left = !input.right;
      input.attack = dist(e.x, w.player.x) < 130;
    } else {
      if (w.player.rage >= 100) { mem.mode = 'push'; input.transform = true; }
      else if (t - (mem.lastSleep || -99) > 25) {
        const den = w.checkpoints.filter(c => c.lit).sort((a, b) => b.x - a.x)[0];
        input.right = false;
        if (w.player.x > den.x + 90) { input.left = true; return input; }
        input.interact = true; mem.lastSleep = t;
      }
    }
    if (w.player.rage >= 100 && !e) { input.transform = true; mem.mode = 'push'; }
    return input;
  },

  // Souls-inspired: respect tells, dodge, punish recoveries only.
  cautious: (w, t, mem) => {
    const input = {};
    navigate(mem, w, input);
    const e = nearestEnemy(w, 320);
    if (e) {
      const d = dist(e.x, w.player.x);
      if (e.state === 'tell') { input.dodge = true; input.left = e.x > w.player.x; input.right = e.x < w.player.x; }
      else if (d < 95 && e.state !== 'recovery') { input.attack = true; input.right = e.x > w.player.x; }
      else if (d < 170 && e.state === 'recovery') { input.attack = true; input.right = e.x > w.player.x; }
      else input.right = true;
      if (w.player.rage >= 50 && w.player.form === 'man' && d < 110) { input.skill = true; input.direction = 'forward'; mem.taps = (mem.taps || 0) + 1; }
    } else input.right = true;
    if (w.player.form === 'bear') return bearFrame(w, input, mem);
    if (w.player.rage >= 100 && w.player.form === 'man') input.transform = true;
    if (w.player.hp < 25 && (w.player.items.honey || 0) > 0) input.honey = true;
    return input;
  },

  // Pacifist route: what does the level look like if you avoid everything?
  pacifist: (w, t, mem) => {
    const input = { right: true };
    navigate(mem, w, input);
    const e = nearestEnemy(w, 220);
    if (e) { input.left = e.x > w.player.x; input.right = !input.left; }
    if (w.player.form === 'bear') input.right = true;
    return input;
  }
};
