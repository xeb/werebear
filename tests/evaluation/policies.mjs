// Bot policies for the adventure-game evaluation harness.
// Each policy maps (world, elapsed, mem) -> one input frame. Bots interact ONLY
// through the same input contract the browser uses (site/input), never by
// mutating sim state.

const dist = (a, b) => Math.abs(a - b);

function nearestEnemy(w, range) {
  let best = null, bd = range;
  for (const e of w.enemies) {
    if (!e.alive || (e.type === 'moth' && !w.night)) continue;
    const d = dist(e.x, w.player.x);
    if (d < bd) { bd = d; best = e; }
  }
  if (w.boss?.alive) {
    const bossDist = dist(w.boss.x, w.player.x);
    if (bossDist < bd) best = w.boss;
  }
  return best;
}

function inGap(w) {
  return (w.gaps || []).some(g => !w.world.felled.includes(g.treeId) && w.player.x > g.start - 140 && w.player.x < g.end + 80);
}

function inCrawl(w) {
  return (w.features || []).some(f => f.type === 'crawl' && Math.abs(w.player.x - f.x) < f.width + 60);
}

function stuckJump(mem, w, input) {
  const blocked = w.player.x - (mem.lastX ?? -1) < 0.5 * (mem.dt ?? 1 / 60);
  mem.blocked = blocked ? (mem.blocked || 0) + 1 : 0;
  mem.stuck = blocked ? (mem.stuck || 0) + 1 : 0;
  mem.lastX = w.player.x;
  if (mem.stuck > 30 && w.player.grounded && !inGap(w) && !inCrawl(w)) {
    input.jump = true;
    mem.stuck = 0;
  }
  return input;
}

function navigate(mem, w, input) {
  stuckJump(mem, w, input);
  if (inGap(w) || (inCrawl(w) && w.player.form === 'man')) input.down = true;
  if (w.player.netted > 0 && w.player.form === 'man' && w.player.rage >= 25) {
    input.skill = true; input.direction = 'up'; mem.taps = (mem.taps || 0) + 1;
    return input;
  }
  if (w.player.form === 'bear' && inCrawl(w) && (mem.blocked || 0) > 20) {
    input.releaseTransform = true;
    mem.blocked = 0;
    return input;
  }
  const nearWall = (w.features || []).some(f => f.type === 'rotwall' && !w.world.broken.includes(f.id) && Math.abs(w.player.x - f.x) < 95);
  const nearSapling = (w.features || []).some(f => f.type === 'sapling' && !w.world.felled.includes(f.treeId) && Math.abs(w.player.x - f.x) < 95);
  const crownTree = w.trees.find(t => t.id === 'tree_12' && !t.felled && !t.state && Math.abs(w.player.x - t.x) < 115);
  if (nearWall) {
    input.stopNav = true;
    if (w.player.form === 'bear') { input.dodge = true; mem.blocked = 0; return input; }
    if (w.player.rage >= 25 && !mem.saveRage) { input.skill = true; input.direction = 'down'; mem.taps = (mem.taps || 0) + 1; mem.blocked = 0; return input; }
    heavyOrLightAttack(w, mem, input, true);
    return input;
  }
  if (nearSapling) {
    if (w.player.form === 'bear') { input.stopNav = true; input.attack = true; mem.blocked = 0; return input; }
    if (w.player.rage >= 25) { input.stopNav = true; input.skill = true; input.direction = 'down'; mem.taps = (mem.taps || 0) + 1; mem.blocked = 0; return input; }
  }
  if (crownTree) {
    input.stopNav = true;
    input.right = crownTree.x >= w.player.x;
    input.left = !input.right;
    if (w.player.form === 'bear') input.attack = true;
    else heavyOrLightAttack(w, mem, input, true);
    mem.blocked = 0;
    return input;
  }
  if ((mem.blocked || 0) > 75 && w.player.form === 'man' && w.player.rage >= 25 && !mem.saveRage) {
    input.skill = true; input.direction = 'down'; mem.taps = (mem.taps || 0) + 1; mem.blocked = 0;
  }
  if (input.right && (mem.blocked || 0) > 45 && w.player.form === 'bear') {
    input.dodge = true; mem.blocked = 0;
  }
  return input;
}

function bearFrame(w, input, mem) {
  input.right = true;
  navigate(mem, w, input);
  if (input.releaseTransform || input.stopNav) return input;
  const nearLog = w.trees.some(t => t.log && t.id !== 'tree_01' && Math.abs(t.x - w.player.x) < 105);
  if (nearLog && (w.metrics?.logSwings || 0) < 4) {
    input.throw = !w.player.throwHeld;
  }
  const target = nearestEnemy(w, 340);
  if (target) {
    const isRight = target.x >= w.player.x;
    input.right = isRight;
    input.left = !isRight;
    if (dist(target.x, w.player.x) < 165) input.attack = true;
    else if (dist(target.x, w.player.x) > 190 && !w.player.skill) input.dodge = true;
  } else {
    input.attack = true;
  }
  return input;
}

// Helper for charging and releasing a heavy attack against armored brutes and rotwalls
function heavyOrLightAttack(w, mem, input, forceHeavy = false) {
  if (w.player.attackCd > 0 && !w.player.heavyHeld) return;
  if (forceHeavy && w.player.form === 'man' && (w.player.heavyHeld || w.player.stamina >= 20)) {
    mem.heavyTicks = (mem.heavyTicks || 0) + 1;
    if (mem.heavyTicks <= 6) input.heavy = true;
    else { input.heavy = false; mem.heavyTicks = 0; }
  } else {
    mem.heavyTicks = 0;
    input.attack = true;
  }
}

export const POLICIES = {
  // RECKLESS charger: pushes right through anything, swings basic attacks blindly,
  // never dodges or spaces tells. The rubric's "careless player" probe — the forest
  // must punish this policy with heavy damage and deaths.
  speedrun: (w, t, mem) => {
    const input = { right: true };
    navigate(mem, w, input);
    const e = nearestEnemy(w, 130);
    if (e) {
      input.attack = true;
      input.jump = false; // reckless rusher stands and trades blows instead of jump-evading
    }
    if (w.player.form === 'bear') return bearFrame(w, input, mem);
    return input;
  },

  // Souls-like farm & rampage loop: banks Rage for full 90s transformations,
  // sleeps at dens when blocked, and mauls through the forest and Old Thorngut.
  berserker: (w, t, mem) => {
    const input = { right: true };
    const nearSapling = w.features.some(f => f.type === 'sapling' && !w.world.felled.includes(f.treeId) && Math.abs(w.player.x - f.x) < 120);
    const nearWall = w.features.some(f => f.type === 'rotwall' && !w.world.broken.includes(f.id) && Math.abs(w.player.x - f.x) < 120);
    mem.saveRage = !(nearSapling || nearWall);
    navigate(mem, w, input);
    if (input.stopNav) return input;
    if (w.player.form === 'bear') { mem.mode = 'push'; return bearFrame(w, input, mem); }
    mem.mode = mem.mode || 'push';
    if (w.player.form === 'transforming') return input;

    if (mem.mode === 'push') {
      if ((mem.blocked || 0) > 200 && w.player.rage < 100) { mem.mode = 'retreat'; mem.blocked = 0; }
      if (w.player.rage >= 100 && !inCrawl(w)) { input.transform = true; mem.mode = 'push'; return input; }
      const e = nearestEnemy(w, 260);
      if (e) {
        const d = dist(e.x, w.player.x);
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        if (d < 140) heavyOrLightAttack(w, mem, input, !!e.armor);
      }
      return input;
    }
    if (mem.mode === 'retreat') {
      const den = w.checkpoints.filter(c => c.lit).sort((a, b) => b.x - a.x)[0];
      input.right = false;
      if (w.player.x > den.x + 80) { input.left = true; return input; }
      if (t - (mem.lastSleep || -99) > 18) { input.interact = true; mem.lastSleep = t; mem.mode = 'grind'; }
      return input;
    }
    const e = nearestEnemy(w, 800);
    if (e && (mem.blocked || 0) < 160) {
      input.right = e.x >= w.player.x; input.left = !input.right;
      if (dist(e.x, w.player.x) < 135) heavyOrLightAttack(w, mem, input, !!e.armor);
    } else {
      if (w.player.rage >= 100) { mem.mode = 'push'; input.transform = true; }
      else if (t - (mem.lastSleep || -99) > 22) {
        const den = w.checkpoints.filter(c => c.lit).sort((a, b) => b.x - a.x)[0];
        input.right = false;
        if (w.player.x > den.x + 80) { input.left = true; return input; }
        input.interact = true; mem.lastSleep = t;
      }
    }
    if (w.player.rage >= 100 && !e) { input.transform = true; mem.mode = 'push'; }
    return input;
  },

  // Disciplined Souls-inspired policy: baits tells, dodges late, parries with
  // bracers, jump-evades low lunges, throws stones at range, cracks Brute armor
  // with heavy attacks, banks Rage for transformations, and defeats Old Thorngut.
  cautious: (w, t, mem) => {
    if (w.player.x > (mem.bestX || 0) + 8) { mem.bestX = w.player.x; mem.stagnant = 0; }
    else mem.stagnant = (mem.stagnant || 0) + 1;
    mem.saveRage = w.player.x > 7200;
    const input = {};
    navigate(mem, w, input);
    if (input.skill || input.releaseTransform || input.stopNav) return input;

    const e = nearestEnemy(w, 360);
    if (e) {
      const d = dist(e.x, w.player.x);
      const isBoss = e.id === 'old_thorngut';
      const tellDur = isBoss ? (e.phase === 1 ? 1.05 : e.phase === 2 ? 0.82 : 0.72) : (e.tellDuration ?? 0.5);
      const wantJumpEvade = w.player.form === 'man' && (w.metrics?.jumpEvades || 0) < 3 && (e.type === 'grub' || e.type === 'hound');
      const wantParry = w.player.form === 'man' && w.player.items.bracers && (w.metrics?.parries || 0) < 3;

      if (wantJumpEvade && e.state === 'tell' && d <= 68) {
        // Hold horizontal position inside strike zone and jump over the low lunge
        input.left = false;
        input.right = false;
        if (tellDur - e.tell <= 0.25 && w.player.grounded) input.jump = !w.player.jumpWasDown;
      } else if (wantParry && e.state === 'tell' && d <= (isBoss ? 190 : 76)) {
        // Stand ready and parry into the strike inside the 0.16s pre-impact window
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        input.jump = false;
        if (tellDur - e.tell <= 0.16) {
          input.dodge = !w.player.dodgeHeld;
          input.towardAttack = true;
        } else if (d > (isBoss ? 150 : 52)) {
          // Stay close enough to parry
        } else {
          input.left = false;
          input.right = false;
        }
      } else if ((e.state === 'tell' && tellDur - e.tell < 0.20) || (e.state === 'charge' && d < 140)) {
        // Dodge inside the 0.20s pre-strike window so 0.30s invuln covers the hit
        input.dodge = !w.player.dodgeHeld;
        input.left = e.x >= w.player.x;
        input.right = !input.left;
        input.jump = false;
      } else if (e.state === 'tell' && d < (isBoss ? 235 : 95)) {
        // Step back out of strike reach to bait a whiff
        input.left = e.x >= w.player.x;
        input.right = !input.left;
        input.jump = false;
      } else if (d < (isBoss ? 175 : 70)) {
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        heavyOrLightAttack(w, mem, input, !!e.armor);
      } else {
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        if (w.player.form === 'man' && w.player.items.stones > 0 && d > 135 && d < 330) {
          input.throw = !w.player.throwHeld;
        }
      }
      // Emergency tap skill when low HP or when in the boss fight and below transform threshold
      if (w.player.form === 'man' && w.player.rage >= 25 && w.player.rage < 75 && (w.player.hp < 35 || isBoss) && d < (isBoss ? 185 : 130)) {
        input.skill = !w.player.skillHeld;
        input.direction = isBoss ? 'down' : 'forward';
        mem.taps = (mem.taps || 0) + 1;
      }
    } else {
      input.right = true;
    }
    if (w.player.form === 'bear') return bearFrame(w, input, mem);
    if (w.player.rage >= 100 && w.player.form === 'man' && !inCrawl(w)) input.transform = true;
    return input;
  },

  // NO-BEAR CHALLENGE ROUTE (GAME.md §8): never transforms into the full bear.
  // Traverses the entire forest and defeats Old Thorngut using human movement,
  // crouch routes, directional 25-Rage Paw skills, late dodges, parries, and heavy attacks.
  human_challenger: (w, t, mem) => {
    mem.saveRage = false;
    const input = {};
    navigate(mem, w, input);
    if (input.skill || input.stopNav) return input;

    const e = nearestEnemy(w, 360);
    if (e) {
      const d = dist(e.x, w.player.x);
      const isBoss = e.id === 'old_thorngut';
      const tellDur = isBoss ? (e.phase === 1 ? 1.05 : e.phase === 2 ? 0.82 : 0.72) : (e.tellDuration ?? 0.5);
      const wantJumpEvade = (w.metrics?.jumpEvades || 0) < 3 && (e.type === 'grub' || e.type === 'hound');
      const wantParry = w.player.items.bracers && (w.metrics?.parries || 0) < 3;

      if (wantJumpEvade && e.state === 'tell' && d <= 68) {
        input.left = false;
        input.right = false;
        if (tellDur - e.tell <= 0.25 && w.player.grounded) input.jump = !w.player.jumpWasDown;
      } else if (wantParry && e.state === 'tell' && d <= (isBoss ? 190 : 76)) {
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        input.jump = false;
        if (tellDur - e.tell <= 0.16) {
          input.dodge = !w.player.dodgeHeld;
          input.towardAttack = true;
        } else if (d <= (isBoss ? 150 : 52)) {
          input.left = false;
          input.right = false;
        }
      } else if ((e.state === 'tell' && tellDur - e.tell < 0.20) || (e.state === 'charge' && d < 140)) {
        input.dodge = !w.player.dodgeHeld;
        input.left = e.x >= w.player.x;
        input.right = !input.left;
        input.jump = false;
      } else if (e.state === 'tell' && d < (isBoss ? 235 : 95)) {
        input.left = e.x >= w.player.x;
        input.right = !input.left;
        input.jump = false;
      } else if (d < (isBoss ? 175 : 70)) {
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        heavyOrLightAttack(w, mem, input, !!e.armor);
      } else {
        input.right = e.x >= w.player.x;
        input.left = !input.right;
        if (w.player.items.stones > 0 && d > 135 && d < 330) {
          input.throw = !w.player.throwHeld;
        }
      }
      // Spend 25 Rage on directional Paw skills (Swipe / Slam) — never full transform
      if (w.player.rage >= 25 && d < (isBoss ? 185 : 135) && !(wantParry && e.state === 'tell')) {
        input.skill = !w.player.skillHeld;
        input.direction = e.armor ? 'down' : 'forward';
        mem.taps = (mem.taps || 0) + 1;
      }
    } else {
      input.right = true;
    }
    return input;
  },

  // Pacifist probe: tries to walk past everything without fighting.
  pacifist: (w, t, mem) => {
    const input = { right: true };
    navigate(mem, w, input);
    const e = nearestEnemy(w, 220);
    if (e) { input.left = e.x > w.player.x; input.right = !input.left; }
    if (w.player.form === 'bear') input.right = true;
    return input;
  }
};
