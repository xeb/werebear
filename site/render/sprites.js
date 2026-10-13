// SpriteBank: transparent character art for the player, with articulated
// upper/lower-body stride animation, multi-stage transformation sequencing,
// equipment-aware sprite sets (unarmored lean vs. geared), weapon/claw slash
// arcs, and footfall dust particles.
// Rendering only: it reads player state, never owns gameplay truth.

const MAN_LEAN_SPRITES = {
  idle: '/art/assets/human_lean_idle.webp',
  run: '/art/assets/human_lean_run.webp',
  attack: '/art/assets/human_lean_punch.webp',
  jump: '/art/assets/human_jump.webp',
  dodge: '/art/assets/human_dodge.webp',
  crouch: '/art/assets/human_lean_crouch.webp',
  halfshift: '/art/assets/human_halfshift.webp'
};

const MAN_GEAR_SPRITES = {
  idle: '/art/assets/human_idle.webp',
  run: '/art/assets/human_run.webp',
  attack: '/art/assets/human_attack.webp',
  jump: '/art/assets/human_jump.webp',
  dodge: '/art/assets/human_dodge.webp',
  crouch: '/art/assets/human_lean_crouch.webp',
  halfshift: '/art/assets/human_halfshift.webp'
};

const TRANSFORM_SPRITES = [
  '/art/assets/transform_stage1.webp',
  '/art/assets/transform_stage2.webp',
  '/art/assets/transform_stage3.webp',
  '/art/assets/transform_stage4.webp'
];

const BEAR_SPRITES = {
  idle: '/art/assets/werebear_idle.webp',
  maul: '/art/assets/werebear_maul.webp',
  slam: '/art/assets/werebear_slam.webp',
  roar: '/art/assets/werebear_roar.webp'
};

const POSE_FADE = 0.11;
const DRAW_H = { man: 146, bear: 220, transforming: 200 };

export class SpriteBank {
  constructor() {
    this.images = new Map();
    const allUrls = new Set([
      ...Object.values(MAN_LEAN_SPRITES),
      ...Object.values(MAN_GEAR_SPRITES),
      ...TRANSFORM_SPRITES,
      ...Object.values(BEAR_SPRITES)
    ]);
    for (const url of allUrls) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      this.images.set(url, img);
    }
    this.pose = 'idle';
    this.prevPose = null;
    this.blend = 1;
    this.bobPhase = 0;
    this.runPhase = 0;
    this.wasGrounded = true;
    this.squash = 0;
    this.attackLunge = 0;
    this.wasAttacking = false;
    this.dust = [];
  }

  ready(url) {
    const img = this.images.get(url);
    return img && img.complete && img.naturalWidth > 0;
  }

  activeManSet(p) {
    return p.crouching ? MAN_LEAN_SPRITES : MAN_GEAR_SPRITES;
  }

  poseKey(p) {
    if (p.form === 'bear') {
      if (p.formLength && p.formTimer > p.formLength - 0.65) return 'roar';
      if (p.skill === 'slam' || p.pouncing) return 'slam';
      if (p.skill === 'charge' || p.attackCd > 0.1) return p.combo % 2 === 0 ? 'slam' : 'maul';
      if (Math.abs(p.vx) > 45) {
        // Alternate stride poses while the bear bounds forward
        return Math.sin(this.runPhase * 0.75) > 0.25 ? 'maul' : 'idle';
      }
      return 'idle';
    }
    if (p.form === 'transforming') return 'idle';
    if ((p.halfShift || 0) > 0.01) return 'halfshift';
    if (p.dodging) return 'dodge';
    if (!p.grounded) return 'jump';
    if (p.attackCd > 0.12) return 'attack';
    if (p.crouching) return 'crouch';
    if (Math.abs(p.vx) > 35) return 'run';
    return 'idle';
  }

  update(p, dt) {
    const key = this.poseKey(p);
    if (key !== this.pose) {
      this.prevPose = this.pose;
      this.pose = key;
      this.blend = 0;
    }
    this.blend = Math.min(1, (this.blend ?? 1) + dt / POSE_FADE);

    const attacking = p.attackCd > 0.14 || (p.halfShift || 0) > 0.05;
    if (attacking && !this.wasAttacking) this.attackLunge = 1;
    this.wasAttacking = attacking;
    this.attackLunge = Math.max(0, this.attackLunge - dt * 4.8);

    if (this.wasGrounded && !p.grounded) this.squash = -0.45;
    if (!this.wasGrounded && p.grounded) {
      this.squash = 0.52;
      for (let i = 0; i < 5; i++) {
        this.dust.push({
          x: p.x + 14 + (i - 2) * 9,
          y: p.y + p.h,
          vx: (i - 2) * 32,
          vy: -24 - (i % 2) * 18,
          r: (p.form === 'bear' ? 7 : 4) + (i % 3),
          life: 0.32,
          maxLife: 0.32
        });
      }
    }
    this.wasGrounded = p.grounded;
    this.squash *= Math.exp(-dt * 9);

    const prevSin = Math.sin(this.runPhase);
    const strideRate = p.form === 'bear' ? 0.042 : 0.062;
    this.runPhase += Math.abs(p.vx) * dt * strideRate;
    const nextSin = Math.sin(this.runPhase);
    if (p.grounded && Math.abs(p.vx) > 60 && ((prevSin < 0 && nextSin >= 0) || (prevSin > 0 && nextSin <= 0))) {
      this.dust.push({
        x: p.x + 14 - p.facing * 8,
        y: p.y + p.h - 2,
        vx: -p.facing * (35 + Math.abs(p.vx) * 0.12),
        vy: -18,
        r: p.form === 'bear' ? 6.5 : 3.8,
        life: 0.26,
        maxLife: 0.26
      });
    }
    for (let i = this.dust.length - 1; i >= 0; i--) {
      const d = this.dust[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.life -= dt;
      if (d.life <= 0) this.dust.splice(i, 1);
    }
    this.bobPhase += dt;
  }

  // Articulated draw of a single character image with upper/lower body stride motion
  _drawArticulated(c, im, h, alpha, stride, runBob, breathe, isRunning) {
    const nw = im.naturalWidth;
    const nh = im.naturalHeight;
    const ww = (nw / nh) * h;
    c.save();
    c.globalAlpha = alpha;
    if (!isRunning) {
      c.drawImage(im, -ww / 2, -h + breathe, ww, h);
      c.restore();
      return;
    }
    // Split at waist (60% down the image) so legs swing and torso bobs naturally
    const splitSrcY = Math.floor(nh * 0.60);
    const splitDstH = h * 0.60;
    const lowerSrcH = nh - splitSrcY;
    const lowerDstH = h - splitDstH;

    // Secondary back-leg shadow pass during stride for genuine 2-leg cycling read
    const legSwing = Math.sin(stride) * ww * 0.11;
    const legLift = Math.max(0, -Math.cos(stride)) * 5.5;
    c.save();
    c.globalAlpha = alpha * 0.55;
    c.translate(-legSwing * 0.85, runBob * 0.5 - Math.max(0, Math.cos(stride)) * 4.5);
    c.drawImage(im, 0, splitSrcY, nw, lowerSrcH, -ww / 2, -lowerDstH, ww, lowerDstH);
    c.restore();

    // Primary lower body (legs)
    c.save();
    c.translate(legSwing * 0.65, runBob * 0.6 - legLift);
    c.drawImage(im, 0, splitSrcY, nw, lowerSrcH, -ww / 2, -lowerDstH, ww, lowerDstH);
    c.restore();

    // Upper body (torso, head, arms) with slight overlap (+3px) to prevent any seam
    c.save();
    c.translate(Math.sin(stride) * 1.8, runBob + breathe);
    c.rotate(Math.sin(stride) * 0.028);
    c.drawImage(im, 0, 0, nw, splitSrcY + 18, -ww / 2, -h, ww, splitDstH + 4);
    c.restore();

    c.restore();
  }

  draw(c, p, x, y, t) {
    const bear = p.form === 'bear';
    const set = bear ? BEAR_SPRITES : this.activeManSet(p);
    const activeUrl = set[this.pose] || set.idle;
    if (!this.ready(activeUrl)) return false;

    // Ground contact shadow + atmospheric silhouette separation mist + footfall dust
    c.save();
    const approxH = bear ? DRAW_H.bear : p.crouching ? 92 : DRAW_H.man;
    const backMist = c.createRadialGradient(x, y - approxH * 0.52, 6, x, y - approxH * 0.52, approxH * 0.68);
    backMist.addColorStop(0, 'rgba(176, 198, 214, 0.16)');
    backMist.addColorStop(0.55, 'rgba(110, 132, 148, 0.07)');
    backMist.addColorStop(1, 'rgba(10, 14, 18, 0)');
    c.fillStyle = backMist;
    c.beginPath();
    c.arc(x, y - approxH * 0.52, approxH * 0.68, 0, Math.PI * 2);
    c.fill();

    const shadowW = bear ? 56 : p.crouching ? 26 : 32;
    c.fillStyle = 'rgba(4, 7, 9, 0.52)';
    c.beginPath();
    c.ellipse(x, this.wasGrounded ? y - 2 : this._groundShadowY(p, y), shadowW, bear ? 11 : 7, 0, 0, Math.PI * 2);
    c.fill();
    for (const d of this.dust) {
      const a = Math.max(0, d.life / d.maxLife);
      c.fillStyle = `rgba(148, 134, 106, ${(a * 0.42).toFixed(3)})`;
      c.beginPath();
      c.arc(d.x, d.y, d.r * (1.3 - a * 0.4), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();

    // 4-stage dedicated transformation sequence
    if (p.form === 'transforming') {
      const morphK = 1 - clamp_(p.transformTimer, 0, 1);
      const stageIdx = Math.min(3, Math.floor(morphK * 4));
      const stageUrl = TRANSFORM_SPRITES[stageIdx];
      const h = 122 + (DRAW_H.bear - 122) * morphK;
      c.save();
      c.translate(x, y);
      c.scale(p.facing < 0 ? -1 : 1, 1);
      // Amber ritual aura + bone-shift shock rings
      const pulse = Math.sin(morphK * Math.PI);
      const grad = c.createRadialGradient(0, -h * 0.52, 8, 0, -h * 0.52, h * 0.68);
      grad.addColorStop(0, `rgba(238, 174, 78, ${(pulse * 0.55).toFixed(3)})`);
      grad.addColorStop(0.6, `rgba(168, 76, 48, ${(pulse * 0.28).toFixed(3)})`);
      grad.addColorStop(1, 'rgba(20, 12, 10, 0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, -h * 0.52, h * 0.68, 0, Math.PI * 2);
      c.fill();

      if (this.ready(stageUrl)) {
        const im = this.images.get(stageUrl);
        const ww = (im.naturalWidth / im.naturalHeight) * h;
        c.drawImage(im, -ww / 2, -h, ww, h);
      } else if (this.ready(BEAR_SPRITES.idle)) {
        const im = this.images.get(BEAR_SPRITES.idle);
        const ww = (im.naturalWidth / im.naturalHeight) * h;
        c.drawImage(im, -ww / 2, -h, ww, h);
      }
      c.restore();
      return true;
    }

    const baseH = bear ? DRAW_H.bear : p.crouching ? 92 : DRAW_H.man;
    const h = baseH * (1 + this.squash * 0.08);
    const speed = Math.abs(p.vx);
    const isRunning = p.grounded && speed > 38 && !p.dodging && !p.crouching;
    const runBob = isRunning
      ? Math.abs(Math.sin(this.runPhase)) * -Math.min(bear ? 11 : 8.5, speed * (bear ? 0.038 : 0.034))
      : 0;
    const breathe = Math.sin(this.bobPhase * 2.4) * (speed < 35 ? (bear ? 3.2 : 2.1) : 0.7);
    const lean = clamp_(p.vx * (bear ? 0.00024 : 0.00042), -0.15, 0.15);
    const lunge = this.attackLunge * this.attackLunge * (bear ? 28 : 18) * p.facing;

    c.save();
    c.translate(x + lunge, y);
    c.rotate(lean);
    c.scale(p.facing < 0 ? -1 : 1, 1);
    const sq = this.squash;
    c.scale(1 + sq * 0.06, 1 - sq * 0.06);

    // Exhaustion visual cue: pale cold sweat mist & heavy hunch
    if (p.form === 'exhausted') {
      c.rotate(0.11);
      c.filter = 'saturate(0.65) brightness(0.86)';
    } else if (p.invuln > 0.05 && !p.dodging) {
      c.globalAlpha = 0.72 + Math.sin(t * 38) * 0.22;
    }

    const drawKey = (key, alpha) => {
      const url = set[key] || set.idle;
      if (!this.ready(url)) return;
      const im = this.images.get(url);
      this._drawArticulated(c, im, h, alpha, this.runPhase, runBob, breathe, isRunning && (key === 'run' || bear));
    };

    if (this.prevPose && this.prevPose !== this.pose && this.blend < 1 && this.ready(set[this.prevPose])) {
      drawKey(this.prevPose, 1 - this.blend);
      drawKey(this.pose, this.blend);
    } else {
      drawKey(this.pose, 1);
    }
    c.filter = 'none';
    c.globalAlpha = 1;

    // Parry ward flash
    if ((p.parry || 0) > 0) {
      c.strokeStyle = '#f5cb78';
      c.lineWidth = 3.5;
      c.beginPath();
      c.arc(14, -h * 0.55, 34, -Math.PI * 0.42, Math.PI * 0.42);
      c.stroke();
    }

    // Half-shift spectral bear claw overlay on directional Paw skill
    if ((p.halfShift || 0) > 0) {
      const hsAlpha = clamp_(p.halfShift / 0.22, 0, 1);
      c.save();
      c.globalAlpha = hsAlpha * 0.85;
      c.strokeStyle = '#e7a94b';
      c.shadowColor = '#e7a94b';
      c.shadowBlur = 14;
      c.lineWidth = 4;
      for (let k = -1; k <= 1; k++) {
        c.beginPath();
        c.arc(24, -h * 0.52 + k * 9, 44, -0.65, 0.55);
        c.stroke();
      }
      c.restore();
    }

    // Visceral slash arc during melee attacks
    if (this.attackLunge > 0.18) {
      const k = this.attackLunge;
      c.save();
      c.globalAlpha = k * 0.82;
      const arcR = bear ? 96 : p.items?.hand === 'stick' ? 58 : 44;
      c.strokeStyle = bear ? '#e38742' : p.items?.hand === 'bone_knife' ? '#e6eef2' : '#d5b57a';
      c.lineWidth = bear ? 6 : 3.5;
      c.beginPath();
      c.arc(16, -h * 0.52, arcR, -0.75, 0.68);
      c.stroke();
      if (bear) {
        c.lineWidth = 3;
        c.strokeStyle = '#f6cb79';
        c.beginPath();
        c.arc(22, -h * 0.52 - 12, arcR * 0.92, -0.65, 0.58);
        c.arc(22, -h * 0.52 + 12, arcR * 0.92, -0.65, 0.58);
        c.stroke();
      }
      c.restore();
    }

    // Netted snare ropes visual when caught by a Hollow Trapper
    if (p.netted > 0) {
      c.strokeStyle = '#8e7d5a';
      c.lineWidth = 2.5;
      for (let row = 0; row < 4; row++) {
        const ny = -16 - row * 18;
        c.beginPath();
        c.moveTo(-18, ny);
        c.lineTo(18, ny - 6);
        c.moveTo(-16, ny - 6);
        c.lineTo(16, ny);
        c.stroke();
      }
    }

    c.restore();
    return true;
  }

  _groundShadowY(p, currentFeetY) {
    return Math.max(currentFeetY, 608);
  }
}

const clamp_ = (n, a, b) => Math.max(a, Math.min(b, n));
