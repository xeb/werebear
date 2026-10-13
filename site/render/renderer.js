import { SpriteBank } from './sprites.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const lerp = (a, b, t) => a + (b - a) * t;

const ART = {
  grub: '/art/assets/rot_grub.webp?v=12',
  sporecap: '/art/assets/sporecap.webp?v=12',
  hound: '/art/assets/mire_hound.webp?v=12',
  moth: '/art/assets/gloom_moth.webp?v=12',
  stag: '/art/assets/husk_stag.webp?v=12',
  trapper: '/art/assets/hollow_trapper.webp?v=12',
  brute: '/art/assets/rotwood_brute.webp?v=12',
  boss: '/art/assets/old_thorngut.webp?v=12',
  tree_elderwood: '/art/assets/tree_elderwood.webp?v=12',
  tree_sapling: '/art/assets/tree_sapling.webp?v=12',
  tree_bee: '/art/assets/tree_bee.webp?v=12',
  checkpoint: '/art/assets/checkpoint_den.webp?v=12',
  world_night: '/art/assets/world_night.webp?v=12',
  world_day: '/art/assets/world_day.webp?v=12',
  world_fore: '/art/assets/world_fore.webp?v=12'
};

const ART_H = {
  grub: 88,
  sporecap: 120,
  hound: 98,
  moth: 104,
  stag: 158,
  trapper: 128,
  brute: 170,
  boss: 228
};

const ITEM_LABELS = {
  stick: 'ASHWOOD CLUB',
  stones: 'RIVER STONES',
  hide_wrap: 'HIDE WRAPS',
  bone_knife: 'BONE KNIFE',
  bracers: 'PARRY BRACERS',
  antler_crown: 'ANTLER CROWN',
  iron_nail: 'IRON NAIL',
  tooth_necklace: 'TOOTH NECKLACE'
};

function loadArt() {
  const imgs = {};
  for (const [key, url] of Object.entries(ART)) {
    const img = new Image();
    img.decoding = 'async';
    img.src = url;
    imgs[key] = img;
  }
  return imgs;
}

export class Renderer {
  constructor(canvas, world, settings = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.world = world;
    this.settings = settings;
    this.camera = 0;
    this.dpr = 1;
    this.w = 1280;
    this.h = 720;
    this.t = 0;
    this.shakeTime = 0;
    this.fx = [];
    this.titanArt = new Image();
    this.titanArt.src = '/assets/titan.webp';
    this.sprites = new SpriteBank();
    this.art = loadArt();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = this.dpr = Math.min(2, devicePixelRatio || 1), width = window.innerWidth, height = window.innerHeight;
    let w = width, h=w*9/16;
    if (h > height) { h = height; w=h*16/9; }
    const left = (width - w) / 2, top = (height - h) / 2;
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = `${left}px`;
    this.canvas.style.top = `${top}px`;
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.canvas.width = Math.max(1, Math.round(w * dpr));
    this.canvas.height = Math.max(1, Math.round(h * dpr));
    const hud = document.getElementById('hud');
    if (hud) {
      hud.style.inset = 'auto';
      hud.style.left = `${left}px`;
      hud.style.top = `${top}px`;
      hud.style.width = `${w}px`;
      hud.style.height = `${h}px`;
    }
  }

  render(dt = 0) {
    const c = this.ctx, w = this.world, p = w.player;
    this.t += dt;
    this.sprites.update(p, dt);
    this._ingestEvents(w.events, dt);
    c.setTransform(this.canvas.width / 1280, 0, 0, this.canvas.height / 720, 0, 0);

    // §12.1: zoom out 10% while the bear is loose (ease the zoom, not a snap)
    const targetZoom = (p.form === 'bear' || p.form === 'transforming') ? 0.9 : 1;
    this.zoom = this.zoom === undefined ? 1 : this.zoom + (targetZoom - this.zoom) * (1 - Math.exp(-dt * 5));
    const target = clamp(p.x - 475 + (p.facing * 100), 0, w.worldWidth - 1280);
    this.camera = Math.abs(target - this.camera) > 1800 ? target : lerp(this.camera, target, 1 - Math.exp(-dt * 4.5));

    const impactful = w.events.some(event => event.type === 'treeFall' || event.type === 'complete' || event.type === 'bossStagger' || (event.type === 'hit' && p.form === 'bear'));
    if (impactful) this.shakeTime = .14;
    this.shakeTime = Math.max(0, this.shakeTime - dt);
    const shake = (this.settings.reduced ? .25 : 1) * (this.shakeTime > 0 ? Math.sin(this.t * 90) * 11 * this.shakeTime / .14 : 0);

    const blend = this.dayBlend();
    this.sky(blend);
    c.save();
    c.translate(-this.camera + shake, shake * .4);
    if (this.zoom < 0.999) {
      c.translate(this.camera + 640, 360);
      c.scale(this.zoom, this.zoom);
      c.translate(-(this.camera + 640), -360);
    }
    this.forest(blend);
    this.trees();
    this.terrain();
    this.entities();
    this.effects();
    c.restore(); this.bossHud();
    this.foreground(blend);
    if (new URLSearchParams(location.search).has('hitboxes')) this.hitboxes();
    if (new URLSearchParams(location.search).has('trees')) this.treeDebug();
    this.cutIn();
  }

  _ingestEvents(events, dt) {
    for (const ev of events || []) {
      if (ev.type === 'hit' || ev.type === 'armorBreak') {
        const count = ev.type === 'armorBreak' ? 12 : 7;
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
          const spd = 80 + (i % 4) * 45;
          this.fx.push({
            kind: 'spark',
            x: ev.x ?? this.world.player.x,
            y: this.world.floorY - 45,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 60,
            color: ev.type === 'armorBreak' ? '#e7b15a' : '#d65a47',
            r: ev.type === 'armorBreak' ? 3.5 : 2.6,
            life: 0.28,
            maxLife: 0.28
          });
        }
      } else if (ev.type === 'shockwave') {
        this.fx.push({ kind: 'ring', x: ev.x ?? this.world.player.x, y: this.world.floorY - 6, r: 20, maxR: 210, life: 0.32, maxLife: 0.32, color: '#e6a84e' });
      } else if (ev.type === 'parry') {
        this.fx.push({ kind: 'ring', x: ev.x ?? this.world.player.x, y: this.world.floorY - 48, r: 10, maxR: 85, life: 0.24, maxLife: 0.24, color: '#ffe094' });
      } else if (ev.type === 'kill') {
        for (let i = 0; i < 14; i++) {
          const ang = -Math.PI * (0.1 + 0.8 * (i / 14));
          const spd = 65 + (i % 5) * 38;
          this.fx.push({
            kind: 'spark',
            x: ev.x ?? this.world.player.x,
            y: this.world.floorY - 38,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 40,
            color: i % 2 ? '#8f475b' : '#d99b4e',
            r: 3.2,
            life: 0.42,
            maxLife: 0.42
          });
        }
      }
    }
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i];
      f.life -= dt;
      if (f.kind === 'spark') {
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 360 * dt;
      }
      if (f.life <= 0) this.fx.splice(i, 1);
    }
  }

  dayBlend() {
    const clock = this.world.clock % 600;
    if (clock < 30) return clock / 30;
    if (clock < 330) return 1;
    if (clock < 360) return 1 - (clock - 330) / 30;
    return 0;
  }

  sky(day) {
    const c = this.ctx;
    const night = ['#05080f', '#0f1824', '#1d2830'];
    const sun = ['#26231f', '#4f4638', '#73654e'];
    const color = (a, b, t) => {
      const h = s => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
      const x = h(a), y = h(b);
      return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], t))).join(',')})`;
    };
    const gradient = c.createLinearGradient(0, 0, 0, 720);
    gradient.addColorStop(0, color(night[0], sun[0], day));
    gradient.addColorStop(.52, color(night[1], sun[1], day));
    gradient.addColorStop(1, color(night[2], sun[2], day));
    c.fillStyle = gradient;
    c.fillRect(0, 0, 1280, 720);

    // Night stars & atmospheric silver crescent moon
    if (day < 0.99) {
      const nAlpha = 1 - day;
      c.save();
      c.globalAlpha = nAlpha * 0.55;
      for (let i = 0; i < 60; i++) {
        const x = (i * 193 + 27) % 1280, y = (i * 83 + 25) % 340;
        const twinkle = 0.55 + 0.45 * Math.sin(this.t * 1.8 + i);
        c.fillStyle = i % 4 ? `rgba(195,212,224,${twinkle.toFixed(2)})` : `rgba(218,190,142,${twinkle.toFixed(2)})`;
        c.fillRect(x, y, i % 5 === 0 ? 2 : 1.4, i % 5 === 0 ? 2 : 1.4);
      }
      // Moon outer corona & silver-mist halo emanating from (1020, 114)
      c.globalAlpha = nAlpha;
      const outerCorona = c.createRadialGradient(1020, 114, 14, 1020, 114, 280);
      outerCorona.addColorStop(0, 'rgba(218, 228, 240, 0.45)');
      outerCorona.addColorStop(0.28, 'rgba(154, 178, 204, 0.18)');
      outerCorona.addColorStop(0.65, 'rgba(88, 112, 138, 0.06)');
      outerCorona.addColorStop(1, 'rgba(10, 16, 26, 0)');
      c.fillStyle = outerCorona;
      c.beginPath();
      c.arc(1020, 114, 280, 0, Math.PI * 2);
      c.fill();

      // Silver moon disc with soft radial limb shading
      const moonDisc = c.createRadialGradient(1012, 106, 4, 1020, 114, 32);
      moonDisc.addColorStop(0, '#e6edf4');
      moonDisc.addColorStop(0.68, '#beccd9');
      moonDisc.addColorStop(1, 'rgba(148, 166, 184, 0.86)');
      c.fillStyle = moonDisc;
      c.beginPath();
      c.arc(1020, 114, 31, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Veiled Nordic amber sun & diagonal canopy god-rays by day
    if (day > 0.01) {
      c.save();
      c.globalAlpha = day;
      const sunHalo = c.createRadialGradient(250, 124, 8, 250, 124, 195);
      sunHalo.addColorStop(0, 'rgba(236, 188, 112, 0.48)');
      sunHalo.addColorStop(0.38, 'rgba(184, 132, 68, 0.18)');
      sunHalo.addColorStop(1, 'rgba(54, 42, 30, 0)');
      c.fillStyle = sunHalo;
      c.beginPath();
      c.arc(250, 124, 195, 0, Math.PI * 2);
      c.fill();
      const sunDisc = c.createRadialGradient(246, 120, 4, 250, 124, 32);
      sunDisc.addColorStop(0, '#f2d294');
      sunDisc.addColorStop(0.7, '#d49e54');
      sunDisc.addColorStop(1, 'rgba(186, 126, 58, 0.78)');
      c.fillStyle = sunDisc;
      c.beginPath();
      c.arc(250, 124, 31, 0, Math.PI * 2);
      c.fill();
      // Soft diagonal amber sunbeams filtering through the elderwood
      for (let r = 0; r < 4; r++) {
        const rx = 180 + r * 240 - (this.camera * 0.04) % 240;
        const rayG = c.createLinearGradient(rx, 0, rx + 140, 580);
        rayG.addColorStop(0, 'rgba(224, 178, 104, 0.055)');
        rayG.addColorStop(1, 'rgba(224, 178, 104, 0)');
        c.fillStyle = rayG;
        c.beginPath();
        c.moveTo(rx, 0);
        c.lineTo(rx + 85, 0);
        c.lineTo(rx + 250, 580);
        c.lineTo(rx + 115, 580);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
  }

  forest(day) {
    const c = this.ctx;
    const a = k => this.art[k]?.complete && this.art[k].naturalWidth;
    if (a('world_night') && a('world_day')) {
      // Draw full-bleed painted world plates in viewport-anchored space covering [-180..1460]
      c.save();
      c.translate(this.camera, 0);
      const pass = (key, parallax, baseY, h, alpha) => {
        if (alpha <= 0.01) return;
        const img = this.art[key];
        const w = Math.round((img.naturalWidth / img.naturalHeight) * h);
        const shift = this.camera * parallax;
        const startI = Math.floor((shift - 180) / w) - 1;
        const endI = Math.floor((shift + 1460) / w) + 1;
        c.save();
        c.globalAlpha = alpha;
        for (let i = startI; i <= endI; i++) {
          const x0 = Math.round(i * w - shift);
          if (x0 > 1470 || x0 + w < -190) continue;
          c.drawImage(img, x0, baseY - h, w + 2, h);
        }
        c.restore();
      };
      const N = 1 - day, D = day;
      // Full-bleed painted Nordic forest backdrop (includes volumetric silver moon / amber sun,
      // gnarled moss-draped ancient oaks, and luminous mid-plane fog bank for silhouette pop)
      pass('world_night', .15, 745, 780, N);
      pass('world_day', .15, 745, 780, D);

      // Subtle mid-ground mist veil right behind the playfield (y = 430..615) so dark foreground
      // character and enemy silhouettes read with razor-sharp contrast
      const g = c.createLinearGradient(0, 420, 0, 616);
      g.addColorStop(0, 'rgba(20, 28, 32, 0)');
      g.addColorStop(0.55, day > 0.5 ? 'rgba(64, 56, 42, 0.22)' : 'rgba(34, 46, 54, 0.24)');
      g.addColorStop(1, 'rgba(8, 12, 14, 0.42)');
      c.fillStyle = g;
      c.fillRect(-180, 420, 1640, 196);

      // Ambient drifting forest spores / embers
      c.fillStyle = day > 0.5 ? 'rgba(224, 198, 136, 0.30)' : 'rgba(168, 196, 214, 0.26)';
      for (let i = 0; i < 24; i++) {
        const px = ((i * 173 + this.t * (14 + (i % 5) * 3) - this.camera * 0.45) % 1280 + 1280) % 1280;
        const py = 180 + ((i * 97 + Math.sin(this.t * 0.9 + i) * 28) % 410);
        c.beginPath();
        c.arc(px, py, 1.3 + (i % 3) * 0.6, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();

      // Moon shafts where a canopy tree was felled
      if (day < 0.85) {
        for (const t of this.world.trees) {
          if (t.shaft) {
            const x = t.x;
            c.save();
            const gl = c.createLinearGradient(x, 60, x, 610);
            gl.addColorStop(0, 'rgba(202, 223, 255, 0)');
            gl.addColorStop(.55, `rgba(198, 222, 245, ${(0.18 * (1 - day * 0.7)).toFixed(3)})`);
            gl.addColorStop(1, `rgba(220, 238, 255, ${(0.08 * (1 - day * 0.7)).toFixed(3)})`);
            c.fillStyle = gl;
            c.beginPath();
            c.moveTo(x - 28, 60);
            c.lineTo(x + 68, 60);
            c.lineTo(x + 240, 610);
            c.lineTo(x - 130, 610);
            c.closePath();
            c.fill();
            c.restore();
          }
        }
      }
      return;
    }

    // Procedural fallback if world plates are still loading
    for (let layer = 0; layer < 3; layer++) {
      const parallax = [.11, .24, .41][layer], base = [480, 540, 605][layer], step = [420, 280, 190][layer], offset = this.camera * parallax;
      c.save();
      c.translate(this.camera * (1 - parallax), 0);
      c.fillStyle = ['#1a2724', '#14201d', '#0e1715'][layer];
      for (let x = Math.floor(offset / step) * step - step; x < offset + 1560 + step; x += step) {
        const v = Math.sin(x * .017 + layer) * .5 + .5, tall = 220 + v * 190 + layer * 25;
        c.beginPath();
        c.moveTo(x - step * .55, base);
        c.lineTo(x, base - tall);
        c.lineTo(x + step * .1, base - tall * .66);
        c.lineTo(x + step * .5, base);
        c.closePath();
        c.fill();
      }
      c.restore();
    }
  }

  trees() {
    const c = this.ctx;
    for (const t of this.world.trees) {
      const x = t.x;
      if (x < this.camera - 260 || x > this.camera + 1540) continue;
      c.save();
      if (t.felled) {
        if (!t.log) { c.restore(); continue; }
        const gap = this.world.gaps?.find(g => g.treeId === t.id);
        const logY = gap ? this.world.floorY - 28 : 610;
        c.translate(x, logY);
        c.rotate(-.025);
        // Gnarled felled timber log with bark ridges and moss
        const logG = c.createLinearGradient(0, -30, 0, 4);
        logG.addColorStop(0, t.type === 'elderwood' ? '#634f38' : '#4a5240');
        logG.addColorStop(0.5, t.type === 'elderwood' ? '#433424' : '#31382b');
        logG.addColorStop(1, '#1d1812');
        c.fillStyle = logG;
        c.beginPath();
        c.roundRect(-150, -28, 300, 30, 8);
        c.fill();
        c.strokeStyle = '#8f794f';
        c.lineWidth = 2.5;
        c.beginPath();
        c.moveTo(-138, -23);
        c.lineTo(138, -23);
        c.stroke();
        // Splintered stump at trunk origin
        c.restore();
        c.fillStyle = '#3b2e20';
        c.beginPath();
        c.moveTo(x - 24, logY);
        c.lineTo(x - 18, logY - 24);
        c.lineTo(x - 6, logY - 16);
        c.lineTo(x + 8, logY - 26);
        c.lineTo(x + 22, logY);
        c.closePath();
        c.fill();
        continue;
      }

      const h = t.type === 'elderwood' ? 560 : t.type === 'bee' ? 360 : t.type === 'sapling' ? 210 : 350;
      const w = t.type === 'elderwood' ? 52 : 30;
      const artKey = t.type === 'elderwood' ? 'tree_elderwood' : t.type === 'bee' ? 'tree_bee' : 'tree_sapling';
      const rootY = 626;
      if (t.state === 'fall') {
        const progress = 1 - t.timer / .8;
        c.translate(x, 614);
        c.rotate((t.fallDir || 1) * progress * Math.PI * .48);
        if (this.art[artKey]?.complete && this.art[artKey].naturalWidth) {
          const img = this.art[artKey];
          const ww = (img.naturalWidth / img.naturalHeight) * h;
          c.drawImage(img, -ww / 2, -h, ww, h);
          c.restore();
          continue;
        }
        c.fillStyle = t.type === 'elderwood' ? '#6b5536' : '#485044';
        c.fillRect(-w * 0.3, -h, w * 0.6, h);
        c.restore();
        continue;
      }
      if (t.state === 'creak') {
        c.translate(x, 614);
        c.rotate((t.fallDir || 1) * Math.sin((.35 - t.timer) * 24) * .035);
        c.translate(-x, -614);
      }
      if (this.art[artKey]?.complete && this.art[artKey].naturalWidth) {
        const img = this.art[artKey];
        const ww = (img.naturalWidth / img.naturalHeight) * h;
        // Deep ground root shadow under tree
        c.fillStyle = 'rgba(4, 7, 9, 0.56)';
        c.beginPath();
        c.ellipse(x, 614, ww * 0.38, 13, 0, 0, Math.PI * 2);
        c.fill();
        c.drawImage(img, x - ww / 2, rootY - h, ww, h);
        // Dark earth-and-moss mound blending over the bottom root tips so the tree is rooted in soil
        const moundG = c.createRadialGradient(x, rootY - 2, 8, x, rootY - 2, ww * 0.44);
        moundG.addColorStop(0, 'rgba(10, 14, 12, 0.78)');
        moundG.addColorStop(0.65, 'rgba(12, 16, 14, 0.45)');
        moundG.addColorStop(1, 'rgba(10, 14, 12, 0)');
        c.fillStyle = moundG;
        c.beginPath();
        c.ellipse(x, rootY - 2, ww * 0.44, 16, 0, 0, Math.PI * 2);
        c.fill();
        if (t.state === 'creak') {
          c.fillStyle = '#ffd185';
          c.font = 'bold 20px Georgia';
          c.textAlign = 'center';
          c.fillText('!', x, rootY - h + 28);
        }
        c.restore();
        continue;
      }
      c.fillStyle = '#2b241b';
      c.fillRect(x - w * 0.4, 610 - h, w * 0.8, h);
      c.restore();
    }
  }

  terrain() {
    const c = this.ctx;
    const floor = this.world.floorY;
    const camL = this.camera - 180;
    const camW = 1640;
    const foreImg = this.art.world_fore;

    // Feathered dark peat & root bed that blends seamlessly with the painted roots of world_night/world_day (no hard horizontal line)
    const earthG = c.createLinearGradient(0, floor - 18, 0, floor + 140);
    earthG.addColorStop(0, 'rgba(10, 14, 12, 0)');
    earthG.addColorStop(0.18, 'rgba(11, 15, 13, 0.52)');
    earthG.addColorStop(0.38, 'rgba(9, 13, 11, 0.82)');
    earthG.addColorStop(1, '#050807');
    c.fillStyle = earthG;
    c.fillRect(camL, floor - 18, camW, 158);

    // Undulating organic dark root-and-moss mounds along the walkable floor plane
    const step = 140;
    const startM = Math.floor(camL / step) * step;
    c.fillStyle = 'rgba(13, 18, 15, 0.72)';
    c.beginPath();
    c.moveTo(startM, floor + 26);
    for (let mx = startM; mx <= camL + camW + step; mx += step) {
      const hOff = Math.sin(mx * 0.019) * 5 + Math.cos(mx * 0.043) * 3;
      c.quadraticCurveTo(mx + step * 0.5, floor - 5 + hOff, mx + step, floor + 3 - hOff * 0.5);
    }
    c.lineTo(camL + camW + step, floor + 28);
    c.closePath();
    c.fill();

    // Gaps & Root-way underpass
    for (const gap of this.world.gaps || []) {
      const felled = this.world.world.felled.includes(gap.treeId);
      const gw = gap.end - gap.start;
      // Deep chasm void
      const chasmG = c.createLinearGradient(0, floor, 0, floor + 130);
      chasmG.addColorStop(0, '#0d1312');
      chasmG.addColorStop(1, '#040607');
      c.fillStyle = chasmG;
      c.fillRect(gap.start, floor - 3, gw, 133);
      if (!felled) {
        // Lower root-way tunnel floor
        c.fillStyle = '#4e3f2b';
        c.fillRect(gap.start - 18, floor + 78, gw + 36, 18);
        // Arching gnarled roots forming the crawl ceiling
        c.strokeStyle = '#6e5a3e';
        c.lineWidth = 10;
        c.beginPath();
        c.moveTo(gap.start - 10, floor + 68);
        c.quadraticCurveTo((gap.start + gap.end) / 2, floor + 14, gap.end + 10, floor + 68);
        c.stroke();
        c.fillStyle = '#c4ab76';
        c.font = '600 12px Georgia';
        c.textAlign = 'center';
        c.fillText('ROOT WAY · CROUCH', gap.start + gw * 0.5, floor + 56);
      } else {
        c.strokeStyle = '#9d8555';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(gap.start, floor - 28);
        c.lineTo(gap.end, floor - 28);
        c.stroke();
      }
    }

    // World features: breakable branches, crawl roots, and rotwalls
    for (const feature of this.world.features) {
      const x = feature.x;
      if (x < this.camera - 260 || x > this.camera + 1540) continue;
      if (feature.type === 'branch') {
        const broken = this.world.world.broken.includes(feature.id);
        c.strokeStyle = broken ? '#5c4b38' : '#7c6744';
        c.lineWidth = 11;
        c.beginPath();
        if (broken) {
          c.moveTo(x - 145, 548);
          c.lineTo(x - 36, 558);
          c.moveTo(x + 36, 558);
          c.lineTo(x + 145, 548);
        } else {
          c.moveTo(x - 145, 548);
          c.quadraticCurveTo(x, 532, x + 145, 548);
        }
        c.stroke();
      } else if (feature.type === 'crawl') {
        // Low gnarled root-archway that blocks the bear but allows human crouch
        c.fillStyle = '#1b1d17';
        c.beginPath();
        c.moveTo(x - 110, floor);
        c.lineTo(x - 95, 495);
        c.lineTo(x, 468);
        c.lineTo(x + 95, 495);
        c.lineTo(x + 110, floor);
        c.lineTo(x + 76, floor);
        c.lineTo(x + 58, 548);
        c.lineTo(x - 58, 548);
        c.lineTo(x - 76, floor);
        c.closePath();
        c.fill();
        c.strokeStyle = '#5c4c35';
        c.lineWidth = 5;
        c.stroke();
      } else if (feature.type === 'rotwall' && !this.world.world.broken.includes(feature.id)) {
        // Gnarled thorn-and-mycelium briar barricade
        c.save();
        for (let b = -2; b <= 2; b++) {
          const bx = x + b * 18;
          c.strokeStyle = b % 2 === 0 ? '#2b1f22' : '#3d2b2e';
          c.lineWidth = 14 - Math.abs(b) * 1.5;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(bx - 8, floor + 4);
          c.bezierCurveTo(bx - 22, floor - 52, bx + 20, floor - 105, bx + b * 4, floor - 152 + Math.abs(b) * 12);
          c.stroke();
          // Jagged thorns along each briar trunk
          c.strokeStyle = '#6d5646';
          c.lineWidth = 3;
          for (let ty = floor - 24; ty > floor - 138; ty -= 28) {
            const dir = (ty + b) % 2 === 0 ? 1 : -1;
            c.beginPath();
            c.moveTo(bx, ty);
            c.lineTo(bx + dir * 14, ty - 9);
            c.stroke();
          }
        }
        // Glowing violet-amber rot shelf-fungi and pustules embedded in the briars
        for (let i = 0; i < 6; i++) {
          const px = x - 28 + (i % 3) * 26 + (i % 2) * 5;
          const py = 488 + Math.floor(i / 3) * 54 + (i % 2) * 12;
          c.fillStyle = '#6b3b68';
          c.beginPath();
          c.ellipse(px, py, 12, 7, (i - 2) * 0.15, 0, Math.PI * 2);
          c.fill();
          c.fillStyle = '#e5a44c';
          c.beginPath();
          c.arc(px, py - 1, 3.8, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    // Elevated craggy slate & root ledges with painted moss undergrowth
    for (const p of this.world.platforms.slice(1)) {
      if (p.x + p.w < this.camera - 180 || p.x > this.camera + 1460) continue;
      c.save();
      const midX = p.x + p.w * 0.5;
      // Jagged dark slate & gnarled root crag tapering into the shadows
      const cragG = c.createLinearGradient(p.x, p.y, p.x, p.y + 68);
      cragG.addColorStop(0, '#272c22');
      cragG.addColorStop(0.25, '#191a16');
      cragG.addColorStop(1, 'rgba(10, 12, 11, 0)');
      c.fillStyle = cragG;
      c.beginPath();
      c.moveTo(p.x - 4, p.y + 4);
      c.lineTo(p.x + p.w + 4, p.y + 4);
      c.lineTo(p.x + p.w - 18, p.y + 34);
      c.lineTo(midX + p.w * 0.18, p.y + 62);
      c.lineTo(midX, p.y + 44);
      c.lineTo(midX - p.w * 0.22, p.y + 66);
      c.lineTo(p.x + 16, p.y + 32);
      c.closePath();
      c.fill();

      // Painted fern/moss rim along the ledge using world_fore
      if (foreImg?.complete && foreImg.naturalWidth) {
        c.save();
        c.beginPath();
        c.rect(p.x - 4, p.y - 18, p.w + 8, 34);
        c.clip();
        c.globalAlpha = 0.72;
        const fh = 34;
        const fw = Math.round((foreImg.naturalWidth / foreImg.naturalHeight) * fh);
        for (let fx = p.x - 8; fx < p.x + p.w + 8; fx += fw) {
          c.drawImage(foreImg, fx, p.y - 14, fw + 2, fh);
        }
        c.restore();
      }
      c.strokeStyle = '#3d4732';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(p.x, p.y + 1);
      c.lineTo(p.x + p.w, p.y + 1);
      c.stroke();
      c.restore();
    }

    // Checkpoints (Ancient Runestones / Den Hearths)
    for (const cp of this.world.checkpoints) {
      const x = cp.x;
      if (x < this.camera - 150 || x > this.camera + 1430) continue;
      if (cp.lit) {
        const glow = c.createRadialGradient(x, floor - 42, 6, x, floor - 42, 76);
        glow.addColorStop(0, `rgba(255, 194, 98, ${(0.36 + Math.sin(this.t * 3.2) * 0.08).toFixed(3)})`);
        glow.addColorStop(1, 'rgba(255, 150, 50, 0)');
        c.fillStyle = glow;
        c.beginPath();
        c.arc(x, floor - 42, 76, 0, Math.PI * 2);
        c.fill();
      }
      if (this.art.checkpoint?.complete && this.art.checkpoint.naturalWidth) {
        const img = this.art.checkpoint, h = cp.lit ? 102 : 90, w = (img.naturalWidth / img.naturalHeight) * h;
        c.save();
        c.fillStyle = 'rgba(4, 7, 9, 0.58)';
        c.beginPath();
        c.ellipse(x, floor + 2, w * 0.42, 9, 0, 0, Math.PI * 2);
        c.fill();
        c.shadowColor = cp.lit ? 'rgba(245, 182, 84, 0.45)' : 'rgba(165, 190, 208, 0.28)';
        c.shadowBlur = cp.lit ? 12 : 6;
        c.drawImage(img, x - w / 2, floor - h + 6, w, h);
        c.restore();
        // Foreground moss & root tufts overlapping the shrine base
        c.fillStyle = '#141b16';
        for (let k = -3; k <= 3; k++) {
          c.beginPath();
          c.ellipse(x + k * 11, floor + 3, 9, 4.5, k * 0.08, 0, Math.PI * 2);
          c.fill();
        }
      } else {
        c.fillStyle = cp.lit ? '#d58f49' : '#5f6454';
        c.fillRect(x - 25, floor - 50, 50, 50);
      }
    }

    // Visible World Pickups (weapons, stones, wraps, bracers, charms)
    this._drawPickups(c, floor);
  }

  _drawPickups(c, floor) {
    for (const pk of this.world.pickups || []) {
      if (pk.taken) continue;
      if (pk.requiresTree && !this.world.world.felled.includes(pk.requiresTree)) continue;
      if (pk.x < this.camera - 100 || pk.x > this.camera + 1380) continue;

      const x = pk.x;
      const bob = Math.sin(this.t * 3.4 + x * 0.02) * 3.5;
      const y = floor - 16 + bob;

      c.save();
      // Warm amber/bone relic aura so pickups read clearly against dark earth
      const aura = c.createRadialGradient(x, y, 3, x, y, 28);
      const isCharm = ['antler_crown', 'iron_nail', 'tooth_necklace'].includes(pk.item);
      aura.addColorStop(0, isCharm ? 'rgba(235, 175, 82, 0.55)' : 'rgba(218, 200, 152, 0.42)');
      aura.addColorStop(1, 'rgba(20, 18, 14, 0)');
      c.fillStyle = aura;
      c.beginPath();
      c.arc(x, y, 28, 0, Math.PI * 2);
      c.fill();

      c.translate(x, y);
      if (pk.item === 'stick') {
        c.rotate(-0.35);
        c.strokeStyle = '#8d6840';
        c.lineWidth = 6;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(-16, 4);
        c.lineTo(16, -4);
        c.stroke();
        c.strokeStyle = '#c8a668';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(8, -2);
        c.lineTo(15, -7);
        c.stroke();
      } else if (pk.item === 'stones') {
        c.fillStyle = '#9aa2a6';
        for (const [sx, sy, sr] of [[-7, 3, 5.5], [5, 4, 5], [-1, -3, 4.8]]) {
          c.beginPath();
          c.arc(sx, sy, sr, 0, Math.PI * 2);
          c.fill();
        }
      } else if (pk.item === 'bone_knife') {
        c.rotate(-0.4);
        c.strokeStyle = '#e8e2d0';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(-14, 4);
        c.quadraticCurveTo(2, -6, 16, -2);
        c.stroke();
        c.strokeStyle = '#7a4b38';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(-14, 4);
        c.lineTo(-6, 1);
        c.stroke();
      } else if (pk.item === 'hide_wrap') {
        c.fillStyle = '#756046';
        c.beginPath();
        c.roundRect(-12, -8, 24, 16, 5);
        c.fill();
        c.strokeStyle = '#b89b6a';
        c.lineWidth = 2;
        c.strokeRect(-9, -5, 18, 10);
      } else if (pk.item === 'bracers') {
        c.strokeStyle = '#b4b8b8';
        c.lineWidth = 4;
        c.strokeRect(-10, -7, 8, 14);
        c.strokeRect(2, -7, 8, 14);
      } else {
        // Charm talisman
        c.fillStyle = '#e5a94c';
        c.beginPath();
        c.arc(0, 0, 8, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#fff0cb';
        c.lineWidth = 2;
        c.stroke();
      }
      c.restore();

      // Show item label when player is within 240px
      if (Math.abs(this.world.player.x - x) < 240) {
        c.save();
        c.fillStyle = '#ebd7a7';
        c.font = '600 11px Georgia';
        c.textAlign = 'center';
        c.fillText(ITEM_LABELS[pk.item] || pk.item.toUpperCase(), x, floor - 36 + bob * 0.5);
        c.restore();
      }
    }
  }

  entities() {
    const c = this.ctx;
    for (const e of this.world.enemies) {
      if (!e.alive || (e.type === 'moth' && !this.world.night)) continue;
      if (e.x < this.camera - 150 || e.x > this.camera + 1430) continue;
      this.enemy(c, e);
    }
    this._drawProjectiles(c);
    this.playerSprite(c);
    this.bossSprite(c);
  }

  _drawProjectiles(c) {
    for (const proj of this.world.projectiles || []) {
      c.save();
      c.translate(proj.x, proj.y);
      if (proj.type === 'stone') {
        c.fillStyle = '#b8c0c4';
        c.beginPath();
        c.arc(0, 0, 5.5, 0, Math.PI * 2);
        c.fill();
      } else if (proj.type === 'thorn') {
        c.rotate(Math.atan2(proj.vy, proj.vx));
        c.fillStyle = '#9c4b68';
        c.strokeStyle = '#e7a955';
        c.lineWidth = 1.5;
        c.beginPath();
        c.moveTo(12, 0);
        c.lineTo(-10, -4.5);
        c.lineTo(-6, 0);
        c.lineTo(-10, 4.5);
        c.closePath();
        c.fill();
        c.stroke();
      } else if (proj.type === 'dart') {
        c.rotate(Math.atan2(proj.vy, proj.vx));
        c.strokeStyle = '#c895e0';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(-10, 0);
        c.lineTo(10, 0);
        c.stroke();
      }
      c.restore();
    }
  }

  enemy(c, e) {
    const x = e.x;
    // Anchor all ground enemies firmly into the moss on floorY (610); moth hovers in the air
    const footY = e.type === 'moth'
      ? e.y + 28 + Math.sin(this.t * 6.5 + e.spawnX * 0.03) * 9
      : this.world.floorY + 6;

    // Sporecap lingering toxic spore cloud
    if (e.type === 'sporecap' && (e.cloudTimer > 0 || e.state === 'tell')) {
      const cloudK = e.cloudTimer > 0 ? clamp(e.cloudTimer / 0.65, 0, 1) : clamp(e.tell / e.tellDuration, 0, 1) * 0.45;
      c.save();
      const rad = e.cloudTimer > 0 ? 165 : 70 + cloudK * 80;
      const cg = c.createRadialGradient(x, footY - 42, 10, x, footY - 42, rad);
      cg.addColorStop(0, `rgba(164, 88, 148, ${(cloudK * 0.48).toFixed(3)})`);
      cg.addColorStop(0.6, `rgba(214, 152, 68, ${(cloudK * 0.26).toFixed(3)})`);
      cg.addColorStop(1, 'rgba(30, 16, 28, 0)');
      c.fillStyle = cg;
      c.beginPath();
      c.arc(x, footY - 42, rad, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    const artKey = { grub: 'grub', sporecap: 'sporecap', hound: 'hound', moth: 'moth', stag: 'stag', trapper: 'trapper', brute: 'brute' }[e.type];
    if (artKey && this.art[artKey]?.complete && this.art[artKey].naturalWidth) {
      const img = this.art[artKey];
      const baseH = ART_H[artKey];
      const face = e.facing || ((this.world.player.x >= e.x) ? 1 : -1);
      const speed = Math.abs(e.vx || 0);
      const walkPhase = this.t * (e.type === 'hound' || e.type === 'stag' ? 11 : 8) + e.spawnX * 0.05;
      const walkBob = speed > 5 ? Math.abs(Math.sin(walkPhase)) * -5.5 : Math.sin(this.t * 2.6 + e.spawnX) * 1.8;
      const tellK = e.state === 'tell' ? clamp(e.tell / (e.tellDuration || 0.5), 0, 1) : 0;

      // Ground contact shadow + subtle atmospheric silhouette separation mist
      c.save();
      const w = (img.naturalWidth / img.naturalHeight) * baseH;
      const mistR = Math.max(46, baseH * 0.66);
      const backMist = c.createRadialGradient(x, footY - baseH * 0.52, 6, x, footY - baseH * 0.52, mistR);
      backMist.addColorStop(0, 'rgba(176, 200, 218, 0.20)');
      backMist.addColorStop(0.55, 'rgba(112, 136, 154, 0.08)');
      backMist.addColorStop(1, 'rgba(10, 14, 18, 0)');
      c.fillStyle = backMist;
      c.beginPath();
      c.arc(x, footY - baseH * 0.52, mistR, 0, Math.PI * 2);
      c.fill();

      c.fillStyle = 'rgba(4, 7, 9, 0.58)';
      c.beginPath();
      c.ellipse(x, this.world.floorY + 1, Math.min(62, w * 0.42), e.type === 'moth' ? 5 : 9.5, 0, 0, Math.PI * 2);
      c.fill();

      c.translate(x, footY + walkBob);
      c.scale(face, 1);
      c.shadowColor = e.state === 'tell' ? '#e36251' : 'rgba(182, 208, 226, 0.42)';
      c.shadowBlur = e.state === 'tell' ? 18 + tellK * 14 : 7;
      // State-driven posture: coil back on tell, slump forward on recovery, lean into charge
      if (e.state === 'tell') {
        c.scale(1 + tellK * 0.08, 1 - tellK * 0.06);
        c.rotate(-0.09 * tellK);
      } else if (e.state === 'recovery') {
        c.scale(0.96, 0.94);
        c.rotate(0.11);
      } else if (e.state === 'charge') {
        c.rotate(0.12);
      } else if (speed > 5) {
        c.rotate(Math.sin(walkPhase) * 0.045);
      }
      if ((e.hitFlash || 0) > 0) {
        c.filter = 'brightness(1.85) contrast(1.15)';
      }

      // Articulated 2-slice stride for walking ground enemies
      if (speed > 8 && e.type !== 'moth' && e.type !== 'grub' && e.type !== 'sporecap') {
        const nw = img.naturalWidth, nh = img.naturalHeight;
        const splitSrc = Math.floor(nh * 0.62);
        const splitDst = baseH * 0.62;
        const strideShift = Math.sin(walkPhase) * w * 0.07;
        c.drawImage(img, 0, splitSrc, nw, nh - splitSrc, -w / 2 + strideShift, -(baseH - splitDst), w, baseH - splitDst);
        c.drawImage(img, 0, 0, nw, splitSrc + 14, -w / 2, -baseH, w, splitDst + 3);
      } else {
        c.drawImage(img, -w / 2, -baseH, w, baseH);
      }
      c.filter = 'none';
      c.restore();

      // Organic dark moss/root overlap along the base of rooted/crawling creatures
      if (e.type !== 'moth') {
        c.fillStyle = '#141b16';
        for (let k = -2; k <= 2; k++) {
          c.beginPath();
          c.ellipse(x + k * (w * 0.14), this.world.floorY + 3, 8, 3.8, k * 0.06, 0, Math.PI * 2);
          c.fill();
        }
      }

      // Rotwood Brute intact bark-armor aura
      if (e.armor) {
        c.save();
        const ag = c.createRadialGradient(x, footY - baseH * 0.56, 8, x, footY - baseH * 0.56, 48);
        ag.addColorStop(0, 'rgba(197, 161, 98, 0.16)');
        ag.addColorStop(1, 'rgba(197, 161, 98, 0)');
        c.fillStyle = ag;
        c.beginPath();
        c.arc(x, footY - baseH * 0.56, 48, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }

      // Enemy health bar when injured
      if (e.hp < e.maxHp) {
        const bw = Math.clamp ? 44 : Math.max(36, Math.min(64, w * 0.55));
        c.fillStyle = 'rgba(12, 15, 16, 0.82)';
        c.fillRect(x - bw / 2, footY - baseH - 12, bw, 5);
        c.fillStyle = '#c85242';
        c.fillRect(x - bw / 2 + 1, footY - baseH - 11, (bw - 2) * clamp(e.hp / e.maxHp, 0, 1), 3);
      }

      // Telegraph cue above enemy during committed tell
      if (e.state === 'tell') {
        c.save();
        c.fillStyle = '#ffbe6b';
        c.font = 'bold 15px Georgia';
        c.textAlign = 'center';
        c.fillText('!', x, footY - baseH - 18);
        c.restore();
      }
      return;
    }

    // Vector fallback
    c.save();
    c.translate(x, footY - 42);
    c.fillStyle = e.state === 'tell' ? '#d35b4a' : '#7b7462';
    c.beginPath();
    c.arc(0, 20, 22, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }

  eye(c, x, y) {
    c.fillStyle = '#f3bf60';
    c.beginPath();
    c.arc(x, y, 3.2, 0, 7);
    c.fill();
  }

  playerSprite(c) {
    const p = this.world.player, x = p.x + 14, y = p.y + p.h;
    if (this.sprites.draw(c, p, x, y, this.t)) return;
    c.save();
    c.translate(x, y);
    if (p.facing < 0) c.scale(-1, 1);
    c.fillStyle = p.form === 'bear' ? '#171a18' : '#c49a70';
    c.fillRect(-14, -p.h, 28, p.h);
    c.restore();
  }

  bossSprite() {
    const b = this.world.boss;
    if (!b?.alive || Math.abs(b.x - this.camera) > 1450) return;
    const c = this.ctx, x = b.x, y = this.world.floorY;
    if (this.art.boss?.complete && this.art.boss.naturalWidth) {
      const img = this.art.boss, h = ART_H.boss, w = (img.naturalWidth / img.naturalHeight) * h;
      const pulse = Math.sin(this.t * 3.2) * 3.5;
      const speed = Math.abs(b.vx || 0);
      const strideBob = speed > 10 ? Math.abs(Math.sin(this.t * 9)) * -7 : 0;
      const face = b.facing || (this.world.player.x < b.x ? -1 : 1);

      // Boss ground shadow
      c.save();
      c.fillStyle = 'rgba(4, 6, 8, 0.58)';
      c.beginPath();
      c.ellipse(x, y, w * 0.42, 14, 0, 0, Math.PI * 2);
      c.fill();

      if (b.tell > .2) {
        const tg = c.createRadialGradient(x, y - h * 0.45, 16, x, y - h * 0.45, 165);
        tg.addColorStop(0, 'rgba(218, 92, 68, 0.28)');
        tg.addColorStop(0.55, 'rgba(232, 162, 78, 0.12)');
        tg.addColorStop(1, 'rgba(20, 12, 14, 0)');
        c.fillStyle = tg;
        c.beginPath();
        c.arc(x, y - h * 0.45, 165, 0, Math.PI * 2);
        c.fill();
      }

      c.translate(x, y + strideBob);
      c.scale(face, 1);
      if (b.pin > 0) {
        c.rotate(0.18);
        c.scale(1.04, 0.88);
      } else if (b.state === 'tell') {
        c.rotate(-0.07);
        c.shadowColor = '#d86842';
        c.shadowBlur = 22;
      } else if (b.state === 'charge') {
        c.rotate(0.11);
      }
      if ((b.hitFlash || 0) > 0) c.filter = 'brightness(1.65)';
      c.drawImage(img, -w / 2 - pulse * .5, -h - pulse * .3, w + pulse, h + pulse);
      c.filter = 'none';
      c.restore();

      if (b.state === 'tell' || b.state === 'recovery') {
        c.fillStyle = b.state === 'tell' ? '#ffd185' : '#d0d8b0';
        c.font = 'bold 16px Georgia';
        c.textAlign = 'center';
        c.fillText(b.state === 'tell' ? 'THORNGUT WINDS UP' : 'RECOVERING', x, y - 225);
      }
      return;
    }
    c.save();
    c.translate(x, y);
    c.fillStyle = '#2e2927';
    c.beginPath();
    c.ellipse(0, -82, 150, 68, 0, 0, 7);
    c.fill();
    c.restore();
    if (b.state === 'tell' || b.state === 'recovery') {
      c.fillStyle = b.state === 'tell' ? '#ffd185' : '#d0d8b0';
      c.font = 'bold 16px Georgia';
      c.textAlign = 'center';
      c.fillText(b.state === 'tell' ? 'THORNGUT WINDS UP' : 'RECOVERING', x, y - 220);
    }
  }

  bossHud() {
    const b = this.world.boss;
    if (!b?.alive || Math.abs(b.x - this.camera) > 1450) return;
    const c = this.ctx;
    c.fillStyle = '#151817cc';
    c.fillRect(820,72,380,20);
    c.fillStyle = '#9d4939';
    c.fillRect(822, 74, 376 * (b.hp / b.maxHp), 16);
    c.strokeStyle = '#d5bc8c';
    c.strokeRect(820,72,380,20);
    c.fillStyle = '#f0e5d1';
    c.font = '17px Georgia';
    c.textAlign = 'center';
    c.fillText('OLD THORNGUT · PHASE ' + b.phase, 1010, 62);
  }

  effects() {
    const c = this.ctx;
    for (const f of this.fx) {
      const a = clamp(f.life / f.maxLife, 0, 1);
      c.save();
      c.globalAlpha = a;
      if (f.kind === 'spark') {
        c.fillStyle = f.color;
        c.beginPath();
        c.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        c.fill();
      } else if (f.kind === 'ring') {
        const curR = lerp(f.r, f.maxR, 1 - a);
        c.strokeStyle = f.color;
        c.lineWidth = 3.5 * a;
        c.beginPath();
        c.ellipse(f.x, f.y, curR, curR * 0.28, 0, 0, Math.PI * 2);
        c.stroke();
      }
      c.restore();
    }
    for (const ev of this.world.events) {
      if (ev.type === 'moonrise') {
        c.fillStyle = '#e8e5d3';
        c.globalAlpha = this.settings.reduced ? .08 : .26;
        c.fillRect(this.camera, 0, 1280, 720);
        c.globalAlpha = 1;
      }
      if (ev.type === 'treeFall') {
        c.fillStyle = '#d5b16b';
        for (let i = 0; i < 22; i++) {
          const x = this.camera + (i * 83 + this.t * 80) % 1280, y = (i * 49 + this.t * 22) % 500;
          c.globalAlpha = .7;
          c.fillRect(x, y, 3, 3);
        }
        c.globalAlpha = 1;
      }
    }
    if (this.world.hitStop > 0) {
      c.fillStyle = '#fff';
      c.globalAlpha = this.settings.reduced ? .02 : .06;
      c.fillRect(this.camera, 0, 1280, 720);
      c.globalAlpha = 1;
    }
  }

  treeDebug() {
    const c = this.ctx;
    c.save();
    c.font = '12px monospace';
    c.textAlign = 'center';
    for (const t of this.world.trees) {
      const x = t.x - this.camera;
      if (x < 0 || x > 1280) continue;
      c.strokeStyle = t.felled ? '#83dcac' : '#f8bd61';
      c.strokeRect(x - 25, 610 - (t.type === 'elderwood' ? 560 : 330), 50, t.type === 'elderwood' ? 560 : 330);
      c.fillStyle = '#fff';
      c.fillText(`${t.id} ${t.hp}`, x, 520);
    }
    c.restore();
  }

  cutIn() {
    const p = this.world.player;
    if (p.form !== 'transforming') return;
    const c = this.ctx, elapsed = 1 - p.transformTimer;
    if (elapsed > .52) return;
    const alpha = Math.min(1, elapsed / .08) * Math.max(0, 1 - elapsed / .6), flash = this.settings.reduced ? .2 : .42;
    c.save();
    c.fillStyle = `rgba(234,226,205,${alpha * flash})`;
    c.fillRect(0, 0, 1280, 720);
    if (this.titanArt.complete && this.titanArt.naturalWidth) {
      const slide = clamp((.5 - elapsed) / .5, 0, 1);
      c.globalAlpha = alpha;
      c.drawImage(this.titanArt, 690 + slide * 520, 40, 500, 650);
    }
    c.globalAlpha = alpha * .92;
    c.fillStyle = '#f0d59b';
    c.font = '700 26px Georgia';
    c.textAlign = 'left';
    c.fillText('THE BEAR REMEMBERS', 72, 600);
    c.restore();
  }

  foreground(day) {
    const c = this.ctx;
    const g = c.createLinearGradient(0, 620, 0, 720);
    g.addColorStop(0, 'rgba(12, 18, 15, 0)');
    g.addColorStop(1, day > 0.5 ? 'rgba(9, 13, 10, 0.78)' : 'rgba(5, 8, 12, 0.86)');
    c.fillStyle = g;
    c.fillRect(0, 620, 1280, 100);

    // Subtle foreground flora band at the bottom edge (82px high, seamless screen-space tiling)
    const img = this.art.world_fore;
    if (img?.complete && img.naturalWidth) {
      const fh = 82;
      const fw = Math.round((img.naturalWidth / img.naturalHeight) * fh);
      const shift = this.camera * 1.18;
      const baseY = 738;
      const startI = Math.floor(shift / fw) - 1;
      const endI = Math.floor((shift + 1280) / fw) + 1;
      c.save();
      c.globalAlpha = 0.44;
      for (let i = startI; i <= endI; i++) {
        const x0 = Math.round(i * fw - shift);
        if (x0 > 1290 || x0 + fw < -10) continue;
        c.save();
        if (((i % 2) + 2) % 2 === 1) {
          c.translate(x0 + fw, baseY);
          c.scale(-1, 1);
          c.drawImage(img, 0, -fh, fw + 2, fh);
        } else {
          c.translate(x0, baseY);
          c.drawImage(img, 0, -fh, fw + 2, fh);
        }
        c.restore();
      }
      c.restore();
      return;
    }
    c.fillStyle = day ? '#242e20' : '#182020';
    for (let i = 0; i < 22; i++) {
      const x = (i * 71 - this.camera * 1.18 % 1280 + 1280) % 1280;
      c.beginPath();
      c.moveTo(x, 720);
      c.quadraticCurveTo(x - 8, 668 - i % 4 * 6, x + 18, 650 - i % 3 * 8);
      c.quadraticCurveTo(x + 10, 684, x + 36, 720);
      c.fill();
    }
  }

  hitboxes() {
    const c = this.ctx, p = this.world.player;
    c.strokeStyle = '#ff4e55';
    c.strokeRect(p.x - this.camera, p.y, p.w, p.h);
    c.strokeStyle = '#e4e85a';
    for (const e of this.world.enemies) if (e.alive) c.strokeRect(e.x - this.camera - 28, this.world.floorY - 58, 56, 58);
  }
}
