// SpriteBank: transparent character art for the player, with smooth
// procedural animation layered on top of single-pose art — pose cross-fades,
// run bounce, lean, landing squash, attack lunge and transform morphing.
// Rendering only: it reads player state, never owns gameplay truth.

const MAN_SPRITES = {
  idle: '/art/assets/human_idle.webp',
  run: '/art/assets/human_run.webp',
  attack: '/art/assets/human_attack.webp',
  jump: '/art/assets/human_jump.webp',
  dodge: '/art/assets/human_dodge.webp',
  crouch: '/art/assets/human_lean_crouch.webp'
};
const BEAR_SPRITES = {
  idle: '/art/assets/werebear_idle.webp',
  maul: '/art/assets/werebear_maul.webp',
  roar: '/art/assets/werebear_roar.webp'
};

const POSE_FADE = 0.14;   // seconds to cross-fade between poses
const DRAW_H = { man: 118, bear: 205, transforming: 190 };

export class SpriteBank {
  constructor() {
    this.images = new Map();
    for (const url of [...Object.values(MAN_SPRITES), ...Object.values(BEAR_SPRITES)]) {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      this.images.set(url, img);
    }
    // pose: {key, t} current and previous, for cross-fade
    this.pose = null; this.prevPose = null;
    this.bobPhase = 0; this.runPhase = 0;
    this.wasGrounded = true; this.squash = 0;
    this.attackLunge = 0; this.wasAttacking = false;
  }
  ready(url) { const img = this.images.get(url); return img && img.complete && img.naturalWidth > 0; }

  // Pick the pose key from simulation state (read-only).
  poseKey(p) {
    if (p.form === 'bear') {
      if (p.formLength && p.formTimer > p.formLength - 0.7) return 'roar'; // apex roar on entry
      if (p.pouncing || (p.attackCd > 0.12)) return 'maul';
      return 'idle';
    }
    if (p.form === 'transforming') return 'idle'; // human pose fades out under the morph
    if (p.dodging) return 'dodge';
    if (!p.grounded) return 'jump';
    if (p.attackCd > 0.16) return 'attack';
    if (p.crouching) return 'crouch';
    if (Math.abs(p.vx) > 40) return 'run';
    return 'idle';
  }

  // Advance the animator. dt in seconds.
  update(p, dt) {
    const key = this.poseKey(p);
    if (key !== this.pose) { this.prevPose = this.pose; this.pose = key; this.blend = 0; }
    this.blend = Math.min(1, (this.blend ?? 1) + dt / POSE_FADE);

    const attacking = p.attackCd > 0.16;
    if (attacking && !this.wasAttacking) this.attackLunge = 1;
    this.wasAttacking = attacking;
    this.attackLunge = Math.max(0, this.attackLunge - dt * 4.5);

    if (this.wasGrounded && !p.grounded) this.squash = -0.5;      // takeoff stretch
    if (!this.wasGrounded && p.grounded) this.squash = 0.55;      // landing squash
    this.wasGrounded = p.grounded;
    this.squash *= Math.exp(-dt * 9);

    this.runPhase += Math.abs(p.vx) * dt * 0.055;
    this.bobPhase += dt;
  }

  // Draw the player. (x, y) = feet centre, same anchor the vector renderer used.
  draw(c, p, x, y, t) {
    const bear = p.form === 'bear';
    const set = bear ? BEAR_SPRITES : MAN_SPRITES;
    if (!this.ready(set[this.pose]) || (this.prevPose && this.prevPose !== this.pose && !this.ready(set[this.prevPose]))) return false;

    const morphK = p.form === 'transforming' ? 1 - clamp_(p.transformTimer, 0, 1) : 1;
    const baseH = p.form === 'transforming' ? 118 + (DRAW_H.bear - 118) * morphK : (bear ? DRAW_H.bear : DRAW_H.man);
    const h = baseH * (1 + this.squash * 0.08);
    const w = h * 0.75; // poses are roughly 3:4; aspect handled per-image below
    const img = this.images.get(set[this.pose]);

    // procedural motion
    const speed = Math.abs(p.vx);
    const runBob = bear ? 0 : Math.abs(Math.sin(this.runPhase)) * -Math.min(9, speed * 0.035);
    const breathe = Math.sin(this.bobPhase * 2.1) * (speed < 40 ? 2.2 : 0.7);
    const lean = clamp_(p.vx * (bear ? 0.00018 : 0.00042), -0.16, 0.16);
    const lunge = this.attackLunge * this.attackLunge * (bear ? 26 : 16) * p.facing;
    const drawW = (img.naturalWidth / img.naturalHeight) * h;

    c.save();
    c.translate(x + lunge, y);
    // shadow at true ground position (undo any air offset handled by caller via y)
    c.rotate(lean);
    c.scale(p.facing < 0 ? -1 : 1, 1);
    const sq = this.squash;
    c.scale(1 + sq * 0.06, 1 - sq * 0.06);

    const draw = (key, alpha) => {
      const im = this.images.get(set[key]);
      if (!this.ready(set[key])) return;
      const ww = (im.naturalWidth / im.naturalHeight) * h;
      c.globalAlpha = alpha;
      c.drawImage(im, -ww / 2, -h + runBob + breathe - (bear ? 0 : 0), ww, h);
    };
    if (this.prevPose && this.prevPose !== this.pose && this.blend < 1) {
      draw(this.prevPose, 1 - this.blend);
      draw(this.pose, this.blend);
    } else {
      draw(this.pose, 1 - (p.form === 'transforming' ? morphK * 0.6 : 0));
    }
    c.globalAlpha = 1;

    // transformation cross-fade: human ghost fading into the rising bear
    if (p.form === 'transforming') {
      const k = morphK;
      c.globalAlpha = k * 0.9;
      c.save();
      c.scale(1 + k * 0.55, 1 + k * 0.55);
      const bearImg = this.images.get(BEAR_SPRITES.idle);
      if (this.ready(BEAR_SPRITES.idle)) {
        const bw = (bearImg.naturalWidth / bearImg.naturalHeight) * h;
        c.drawImage(bearImg, -bw / 2, -h, bw, h);
      }
      c.restore();
      // amber surge around the morph
      c.globalAlpha = (1 - Math.abs(k * 2 - 1)) * 0.5;
      c.fillStyle = '#e5a64c';
      c.beginPath(); c.arc(0, -h * 0.55, h * 0.55, 0, Math.PI * 2); c.fill();
      c.globalAlpha = 1;
    }
    c.restore();
    return true;
  }
}

const clamp_ = (n, a, b) => Math.max(a, Math.min(b, n));
