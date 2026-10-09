export const STEP = 1 / 60;
export const PHASES = Object.freeze({ DAWN: 'dawn', DAY: 'day', DUSK: 'dusk', NIGHT: 'night' });
export const SECTIONS = Object.freeze([
  { id: 'waking_hollow', name: 'The Waking Hollow', start: 0, end: 5 * 1280 },
  { id: 'thicket', name: 'The Thicket', start: 5 * 1280, end: 14 * 1280 },
  { id: 'den', name: 'The Den', start: 14 * 1280, end: 15 * 1280 },
  { id: 'deeper_wood', name: 'The Deeper Wood', start: 15 * 1280, end: 25 * 1280 },
  { id: 'trappers_run', name: "The Trappers' Run", start: 25 * 1280, end: 36 * 1280 },
  { id: 'deep_stone', name: 'The Deep Stone', start: 36 * 1280, end: 37 * 1280 },
  { id: 'rotted_clearing', name: 'The Rotted Clearing', start: 37 * 1280, end: 45 * 1280 }
]);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export function phaseAt(seconds) {
  const t = ((seconds % 600) + 600) % 600;
  if (t < 30) return PHASES.DAWN;
  if (t < 330) return PHASES.DAY;
  if (t < 360) return PHASES.DUSK;
  return PHASES.NIGHT;
}

const ITEMS = ['stick', 'stones', 'hide_wrap', 'honey_pouch', 'bone_knife', 'bracers', 'antler_crown', 'iron_nail', 'tooth_necklace'];
const ENEMY_DATA = {
  grub: { hp: 12, speed: 48, damage: 6, tell: .45, drop: null }, sporecap: { hp: 20, speed: 0, damage: 7, tell: .6, drop: null },
  hound: { hp: 28, speed: 92, damage: 9, tell: .4, drop: 'hide_wrap' }, moth: { hp: 16, speed: 76, damage: 7, tell: .5, night: true, drop: null },
  stag: { hp: 60, speed: 130, damage: 16, tell: .7, drop: 'bone_knife' }, trapper: { hp: 45, speed: 55, damage: 10, tell: .55, drop: 'bracers' },
  brute: { hp: 120, speed: 25, damage: 18, tell: .8, drop: null, armor: true }
};

export class World {
  constructor({ seed = 1, assist = false, debugRage = false } = {}) {
    this.seed = seed >>> 0; this.random = mulberry32(this.seed); this.assist = assist; this.debugRage = debugRage;
    this.worldWidth = 45 * 1280; this.floorY = 610; this.clock = 0; this.phase = PHASES.DAWN; this.rageMultiplier = 1;
    this.player = { id: 'bjarki', x: 120, y: this.floorY - 72, vx: 0, vy: 0, w: 28, h: 72, facing: 1, grounded: true, coyote: .1, jumpBuffer: 0, hp: 80, maxHp: 80, stamina: 100, staminaDelay: 0, rage: 0, wounds: 0, form: 'man', formTimer: 0, netted: 0, exhaustion: 0, invuln: 0, items: { hand: null, body: null, charms: [], stones: 0, honey: 0, honeyPouch: false, bracers: false }, combo: 0, attackCd: 0, lastSkill: null, crouching: false };
    this.enemies = []; this.trees = []; this.platforms = [{ x: 0, y: this.floorY, w: this.worldWidth, h: 200 }];
    this.checkpoints = [{ id: 'cp0_hollow', x: 100, lit: true }, { id: 'cp1_den', x: 14 * 1280, lit: false }, { id: 'cp2_deep_stone', x: 36 * 1280, lit: false }]; this.checkpoint = 'cp0_hollow';
    this.world = { felled: [], broken: [], boss: false, secrets: [] }; this.stats = { deaths: 0, berserks: 0, secrets: 0, playTime: 0, moonrises: 0, trees: 0 };
    this.combatTimer = 0; this.accumulator = 0; this.paused = false; this.complete = false; this.events = []; this.hitStop = 0; this.section = 'The Waking Hollow'; this.sections = SECTIONS; this.features = [{ id: 'crawl_root', type: 'crawl', x: 18 * 1280, width: 100 }, { id: 'thin_branch', type: 'branch', x: 29 * 1280, width: 220 }, { id: 'sapling_gate', treeId: 'tree_03', type: 'sapling', x: 6950, width: 44 }];
    this._buildLevel();
  }
  reset({ assist = this.assist } = {}) { const fresh = new World({ seed: this.seed, assist, debugRage: this.debugRage }); Object.assign(this, fresh); return this; }
  _buildLevel() {
    this.enemies = []; this.trees = [];
    const types = ['grub','grub','sporecap','hound','hound','moth','sporecap','trapper','brute','stag','grub','hound','sporecap','moth','hound','stag','trapper','brute','grub','moth','hound','sporecap','stag','trapper','brute'];
    const encounterScreens = [.35,1.4,3,5.5,7,8,10,12,13.4,15.5,16.5,18,19.5,21,23.5,25.5,27,29,31,33.5,35,37.7,39.5,41.2,42.5];
    types.forEach((type, i) => this.spawnEnemy(type, encounterScreens[i] * 1280, { id: `enemy_${String(i + 1).padStart(2, '0')}`, leader: type === 'hound' && (i === 4 || i === 14) }));
    for (let i = 0; i < 20; i++) this.addTree(`tree_${String(i).padStart(2, '0')}`, 800 + i * 2050, i === 1 || i === 12 ? 'elderwood' : i === 3 ? 'sapling' : i === 6 ? 'bee' : 'rotwood', { canopy: i % 3 === 0 });
    this.addTree('deepstone_oak', 36.7 * 1280, 'elderwood', {canopy:true});
    this.addTree('deepstone_rotwood', 38.2 * 1280, 'rotwood', {canopy:true});
    for (let i = 0; i < 5; i++) this.addTree(`grove_${String(i).padStart(2,'0')}`, 43 * 1280 - 620 + i * 300, i % 2 ? 'elderwood' : 'rotwood', { canopy: i === 1 || i === 3 });
    this.pickups = [{ id: 'cache_stick', x: 700, item: 'stick' }, { id: 'cache_stones', x: 1050, item: 'stones' }, { id: 'bee_honey', x: 13150, item: 'honey_pouch', requiresTree: 'tree_06' }, { id: 'den_stick', x: 14.5 * 1280, item: 'stick' }, { id: 'den_stones', x: 14.7 * 1280, item: 'stones' }, { id: 'deep_stick', x: 36.35 * 1280, item: 'stick' }, { id: 'deep_stones', x: 36.55 * 1280, item: 'stones' }, { id: 'secret_crown', x: 26500, item: 'antler_crown', requiresTree: 'tree_12' }, { id: 'iron_nail', x: 30700, item: 'iron_nail' }];
    this._platformAt(4, 530, 250); this._platformAt(12, 490, 250); this._platformAt(23, 520, 300); this._platformAt(37, 500, 350);
    this.boss = { id: 'old_thorngut', x: 43 * 1280, y: this.floorY - 130, hp: 900, maxHp: 900, phase: 1, tell: 0, recovery: 0, pin: 0, alive: true, noBearViable: true, state:'approach', attackDamage:18 };
    this.gaps=[{id:'first_gap',start:2700,end:3000,treeId:'tree_01',treeX:2850,lowerFloor:this.floorY+100}];
    this.features.push({id:'root_route_01',type:'root',x:2735,width:76,gapId:'first_gap'});this.features.push({id:'rot_wall_01',type:'rotwall',x:3900,width:62});
  }
  _platformAt(screen, y, w) { this.platforms.push({ x: screen * 1280, y, w, h: 18 }); }
  addTree(id, x, type = 'elderwood', { canopy = false } = {}) { const tree = { id, x, type, hp: type === 'elderwood' ? 3 : 1, felled: this.world.felled.includes(id), canopy, shaft: this.world.felled.includes(id) && canopy, log: this.world.felled.includes(id) }; this.trees.push(tree); return tree; }
  spawnEnemy(type, x, options = {}) {
    const d = ENEMY_DATA[type]; if (!d) throw new Error(`Unknown enemy type: ${type}`);
    const e = { id: options.id || `e_${this.enemies.length}_${Math.floor(x)}`, type, x, spawnX: x, tether:options.tether??320, y: this.floorY - (type === 'moth' ? 130 : 42), hp: d.hp, maxHp: d.hp, speed: d.speed, damage: d.damage, tellDuration: d.tell, tell: 0, recovery: 0, state: 'approach', active:false, leader: !!options.leader, armor: !!d.armor, netted: false, alive: true, rng: this.random() };
    this.enemies.push(e); return e;
  }
  get night() { return this.phase === PHASES.NIGHT; }
  _phase() { const before = this.phase; this.phase = phaseAt(this.clock); this.rageMultiplier = this.night ? 1.5 : 1; if (before !== PHASES.NIGHT && this.phase === PHASES.NIGHT) { this.gainRage(25, 'moonrise', true); this.stats.moonrises++; this.events.push({ type: 'moonrise' }); } }
  gainRage(amount, source = 'combat', flat = false) { const p = this.player; if (p.form === 'bear' || p.exhaustion > 0) return p.rage; this.combatTimer = 0; p.rage = clamp(p.rage + amount * (flat ? 1 : this.rageMultiplier), 0, 100); return p.rage; }
  advance(seconds, input = {}) { let n = Math.max(0, Math.round(seconds / STEP)); for (let i = 0; i < n; i++) this.step(input); }
  step(input = {}) {
    const p = this.player; this.events = [];
    if (this.paused || this.complete) return;
    const dt = STEP; if (this.hitStop > 0) { this.hitStop = Math.max(0, this.hitStop - dt); return; } this.clock += dt; this.stats.playTime += dt; this._phase();
    this.section = this.sections.find(section => this.player.x >= section.start && this.player.x < section.end)?.name ?? 'The Rotted Clearing';
    p.invuln = Math.max(0, p.invuln - dt); p.attackCd = Math.max(0, p.attackCd - dt); p.coyote = p.grounded ? .1 : Math.max(0, p.coyote - dt); p.jumpBuffer = input.jump && !p.jumpWasDown ? .12 : Math.max(0, p.jumpBuffer - dt);p.jumpWasDown=!!input.jump;
    p.halfShift = Math.max(0, (p.halfShift || 0) - dt);
    if (input.skill && !p.skillHeld) this.tapSkill(input.direction || (input.up ? 'up' : input.down ? 'down' : 'forward'));p.skillHeld=!!input.skill;
    if (input.transform) this.beginTransform(); if (input.releaseTransform) this.endTransform();
    if (input.attack && p.attackCd <= 0) { p.healing = 0; if(p.form==='bear'&&!p.grounded){p.pouncing=true;p.skill='pounce';}else this.attack(false); }
    if (input.heavy && !p.heavyHeld) { p.healing = 0; p.heavyHeld = true; p.heavyCharge = 0; if (p.form === 'man') { p.stamina = Math.max(0, p.stamina - 20); p.staminaDelay = .5; } }
    if (input.heavy && p.heavyHeld) p.heavyCharge = Math.min(1, (p.heavyCharge || 0) + dt);
    if (!input.heavy && p.heavyHeld) { p.heavyHeld = false; if (p.form !== 'exhausted' && p.attackCd <= 0) this.attack(true); p.heavyCharge = 0; }
    if (input.dodge && !p.dodgeHeld) { p.healing = 0; const toward = input.towardAttack ?? ((input.right && p.facing > 0) || (input.left && p.facing < 0)); this.dodge(toward); } p.dodgeHeld = !!input.dodge;
    if (input.throw && !p.throwHeld) { p.healing = 0; this.throwStone(); } if (input.honey && !p.honeyHeld) this.eatHoney(); if (input.interact && !p.interactHeld) this.interact();
    p.throwHeld = !!input.throw; p.honeyHeld = !!input.honey; p.interactHeld = !!input.interact;
    if ((input.left || input.right || input.jump) && p.healing > 0) p.healing = 0;
    this._playerPhysics(input, dt); if(p.pouncing&&p.grounded)this._bearPounce();if(p.form==='bear'&&p.skill==='charge')this._bearCharge(dt);this._updateTrees(dt); this._updateEnemies(dt); this._updateBoss(dt); this._updatePickups(); this._updateCheckpointTouch();
    if (p.healing > 0) { p.healing -= dt; if (p.healing <= 1e-8) { p.items.honey--; p.hp = Math.min(p.maxHp, p.hp + 35); p.healing = 0; } }
    let enteredBear = false;
    if (p.form === 'transforming') { p.transformTimer -= dt; if (p.transformTimer <= 0) { p.form = 'bear'; p.y -= 78; p.h = 150; p.w = 58; p.formTimer = p.items.charms.includes('iron_nail') ? 60 : 90; p.formLength = p.formTimer; p.rage = 100; p.wounds = 0; enteredBear = true; for (const e of this.enemies) if (e.alive && Math.abs(e.x - p.x) < 520) { e.state = 'recovery'; e.recovery = 1.5; } } }
    if (this.combatTimer < 8) this.combatTimer += dt; else if (p.rage % 25 > 0) p.rage = Math.max(Math.floor(p.rage / 25) * 25, p.rage - 2 * dt);
    if (p.form === 'bear' && !enteredBear) { p.formTimer -= dt; p.rage = Math.max(0, 100 * p.formTimer / p.formLength); if (p.formTimer <= 1e-8) this.breakForm(); }
    if (p.form === 'exhausted') { p.exhaustion -= dt; if (p.exhaustion <= 0) p.form = 'man'; }
    p.staminaDelay = Math.max(0, p.staminaDelay - dt);
    if (p.stamina < 100 && p.staminaDelay <= 0 && !p.heavyHeld && !p.dodging) p.stamina = Math.min(100, p.stamina + 40 * dt);
    if (this.night && p.form === 'man' && this.trees.some(t => t.shaft && Math.abs(t.x - p.x) < 100)) this.gainRage(dt, 'moonlight');
  }
  _playerPhysics(input, dt) {
    const p = this.player; let speed = p.form === 'bear' ? 262.5 : p.form === 'exhausted' ? 126 : 210;
    const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0); p.crouching = !!input.down && p.form !== 'bear';
    if (dir) { p.facing = dir; p.vx = dir * speed; } else p.vx *= .78;
    if (p.dodging) { p.dodgeTimer -= dt; p.vx = p.facing * speed * 2.1; if (p.dodgeTimer <= 0) p.dodging = false; }
    if (p.jumpBuffer > 0 && p.coyote > 0 && p.form !== 'exhausted') { p.vy = p.form === 'bear' ? -660 : -760; p.grounded = false; p.coyote = 0; p.jumpBuffer = 0; }
    p.vy += (p.form === 'bear' ? 2350 : input.jump && p.vy < 0 ? 1230 : 1850) * dt; p.x = clamp(p.x + p.vx * dt, 0, this.worldWidth - p.w); p.y += p.vy * dt;
    for (const feature of this.features) if (feature.type === 'sapling' && !this.world.felled.includes(feature.treeId) && Math.abs(p.x - feature.x) < feature.width && p.vx !== 0) { p.x = feature.x - Math.sign(p.vx) * feature.width; p.vx = 0; }
    for (const feature of this.features) if (feature.type === 'crawl' && p.form === 'bear' && Math.abs(p.x - feature.x) < feature.width && p.vx !== 0) { p.x = feature.x - Math.sign(p.vx) * feature.width; p.vx = 0; }
    for (const feature of this.features) if(feature.type==='rotwall'&&!this.world.broken.includes(feature.id)&&Math.abs(p.x-feature.x)<feature.width&&p.vx!==0){p.x=feature.x-Math.sign(p.vx)*feature.width;p.vx=0;}
    for (const feature of this.features) if (feature.type === 'branch' && p.form === 'bear' && Math.abs(p.x - feature.x) < feature.width && !this.world.broken.includes(feature.id)) { this.world.broken.push(feature.id); this.events.push({ type: 'branchSnap', id: feature.id }); }
    let floor = this.floorY;
    const gap=this.gaps?.find(g=>p.x+p.w>g.start&&p.x<g.end);
    if(gap&&!this.world.felled.includes(gap.treeId)) {
      const root=this.features.find(f=>f.type==='root'&&f.gapId===gap.id);
      if(p.crouching&&root&&p.x>gap.start-160&&p.x<gap.end+160) floor=gap.lowerFloor;
      else floor=Infinity;
    }
    for(const route of this.gaps||[])if(p.crouching&&p.x>route.start-160&&p.x<route.end+160)floor=route.lowerFloor;
    for (const platform of this.platforms.slice(1)) if (p.x + p.w > platform.x && p.x < platform.x + platform.w && p.y + p.h >= platform.y && p.y + p.h - p.vy * dt <= platform.y && p.vy >= 0) floor = Math.min(floor, platform.y);
    for (const tree of this.trees) if (tree.log && p.x + p.w > tree.x - 150 && p.x < tree.x + 150) floor = Math.min(floor, this.floorY - 28);
    if (p.y + p.h >= floor) { p.y = floor - p.h; p.vy = 0; p.grounded = true; } else p.grounded = false;
    if(p.y>this.floorY+360)this.die();
  }
  attack(heavy = false) {
    const p = this.player; if (p.attackCd > 0) return false;
    p.attackCd = heavy ? .8 : .38; p.combo = (p.combo % 3) + 1;
    const reach = (p.form === 'bear' ? 155 : p.items.hand === 'stick' ? 72 : 52);
    const damage = p.form === 'bear' ? 65 : heavy ? 17 : p.items.hand === 'bone_knife' ? 10 : p.items.hand === 'stick' ? 9 : 6;
    for (const e of this.enemies) if (e.alive && Math.abs(e.x - p.x) < reach && (e.x - p.x) * p.facing >= -18) this.damageEnemy(e, damage, heavy || p.form === 'bear');
    if (this.boss?.alive && Math.abs(this.boss.x - p.x) < reach + 130 && (this.boss.x - p.x) * p.facing >= -30) this.hitBoss(damage);
    if (p.form === 'bear') { this.hitStop = Math.max(this.hitStop, heavy ? .1 : .06); for (const t of this.trees) if (!t.felled && Math.abs(t.x - p.x) < reach) this.hitTree(t, true); if(heavy)this._bearShockwave(damage); }
    return true;
  }
  damageEnemy(e, damage, breakArmor = false) { if (!e.alive) return; if (e.armor && !breakArmor) return; e.hp -= damage; e.state = 'recovery'; e.recovery = .5; this.events.push({type:'hit',id:e.id}); this.gainRage(damage > 12 ? 3 : 1, 'hit'); if (this.player.form === 'bear') this.hitStop = Math.max(this.hitStop, .1);else this.hitStop=Math.max(this.hitStop,.04); if (e.hp <= 0) this.killEnemy(e); }
  killEnemy(e) { if (!e.alive) return; e.alive = false; const d = ENEMY_DATA[e.type]; this.gainRage((e.type === 'trapper' || e.type === 'stag' ? 15 : 6) + (this.player.items.charms.includes('tooth_necklace') ? 3 : 0), 'kill'); if (this.player.form === 'bear') this.player.wounds = Math.max(0, this.player.wounds - (e.type === 'trapper' ? 25 : 10) - (this.player.items.charms.includes('tooth_necklace') ? 5 : 0)); if (d.drop && !this.player.items[d.drop]) this.pickups.push({ id: `drop_${e.id}`, x: e.x, item: d.drop }); }
  tapSkill(direction = 'forward') { const p = this.player; if(p.form==='bear'){p.skill=direction==='up'?'pounce':direction==='down'?'slam':'charge';p.skillSerial=(p.skillSerial||0)+1;if(p.skill==='charge')p.chargeTimer=.55;if(p.skill==='slam')this._bearSlam();return true;} if (p.form !== 'man' || p.exhaustion > 0) return false; const skill = direction === 'up' ? 'roar' : direction === 'down' ? 'slam' : 'swipe'; if (p.netted > 0 && skill !== 'roar') return false; const cost = p.items.charms.includes('antler_crown') ? 20 : 25; if (p.rage < cost) return false; p.rage -= cost; p.lastSkill = skill; p.skillSerial=(p.skillSerial||0)+1; p.halfShift = .15; this.combatTimer = 0;
    if (p.lastSkill === 'roar') { p.netted = 0; for (const e of this.enemies) if (e.alive && Math.abs(e.x - p.x) < 520) { e.state = 'recovery'; e.recovery = 1; e.tell = 0; } }
    else if (p.lastSkill === 'slam') { for (const e of this.enemies) if (e.alive && Math.abs(e.x - p.x) < 145) this.damageEnemy(e, 34, true); for (const t of this.trees) if (!t.felled && Math.abs(t.x - p.x) < 125 && ['sapling','bee'].includes(t.type)) this.hitTree(t, true); }
    else this.attackSkill();
    return true;
  }
  attackSkill() { const p = this.player; for (const e of this.enemies) if (e.alive && Math.abs(e.x - p.x) < 155 && (e.x - p.x) * p.facing >= -30) this.damageEnemy(e, 85, true); }
  _bearCharge(dt){const p=this.player;if(p.chargeTimer>0){p.chargeTimer-=dt;p.vx=p.facing*600;for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<48){this.damageEnemy(e,45,true);e.x=clamp(e.x+p.facing*115,e.spawnX-e.tether,e.spawnX+e.tether);}for(const t of this.trees)if(!t.felled&&Math.abs(t.x-p.x)<72)this.hitTree(t,true);for(const f of this.features)if(f.type==='rotwall'&&Math.abs(f.x-p.x)<80&&!this.world.broken.includes(f.id)){this.world.broken.push(f.id);this.events.push({type:'wallBreak',id:f.id});}}else p.skill=null;}
  _bearPounce(){const p=this.player;p.pouncing=false;for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<180)this.damageEnemy(e,60,true);this._bearShockwave(40);}
  _bearShockwave(damage){const p=this.player;for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<200)this.damageEnemy(e,damage,true);this.events.push({type:'shockwave',x:p.x});}
  _bearSlam(){const p=this.player;for(const e of this.enemies)if(e.alive&&Math.abs(e.x-p.x)<190)this.damageEnemy(e,75,true);for(const t of this.trees)if(!t.felled&&Math.abs(t.x-p.x)<180&&(t.type==='bee'||t.type==='sapling')){t.hp=1;this.hitTree(t,true);}this._bearShockwave(45);}
  _groundAt(x,form='man',rootRoute=false){const gap=this.gaps.find(g=>x>=g.start&&x<=g.end);if(gap&&this.world.felled.includes(gap.treeId)&&Math.abs(x-gap.treeX)<=150)return this.floorY-28;if(rootRoute&&form==='man'&&this.gaps.some(g=>x>g.start-160&&x<g.end+160))return this.gaps.find(g=>x>g.start-160&&x<g.end+160).lowerFloor;if(!gap)return this.floorY;return null;}
  beginTransform() { const p = this.player; if (p.form !== 'man' || p.rage < 100 || p.netted > 0) return false; p.form = 'transforming'; p.transformTimer = 1; p.invuln = 1; p.rage = 0; this.stats.berserks++; return true; }
  endTransform() { if (this.player.form === 'bear') this.breakForm(); }
  breakForm() { const p = this.player; if (p.form !== 'bear' && p.form !== 'transforming') return; p.hp -= p.wounds; p.wounds = 0; if (p.items.honeyPouch) p.hp = Math.min(p.maxHp, p.hp + 15); if (p.hp <= 0) { if (this.assist) p.hp = 1; else return this.die(); } if(p.h>72){p.y+=p.h-72;p.h=72;p.w=28;} p.form = 'exhausted'; p.exhaustion = 3; p.formTimer = 0; }
  dodge(towardAttack = false) { const p = this.player; if (p.form === 'bear') { p.skill='charge'; p.chargeTimer=.55; p.skillSerial=(p.skillSerial||0)+1; return true; } if (p.stamina < 25 || p.form === 'exhausted') return false; if ((p.items.bracers || p.items.body === 'bracers') && towardAttack) { p.parry = .18; p.stamina -= 15; p.staminaDelay = .5; return true; } p.stamina -= 25; p.staminaDelay = .5; p.dodging = true; p.dodgeTimer = .32; p.invuln = .25; return true; }
  throwStone() { const p = this.player; if (p.form === 'bear') { const e = this.enemies.find(e => e.alive && Math.abs(e.x - p.x) < 115 && (e.x - p.x) * p.facing >= -20); if (e) { this.damageEnemy(e, 40, true); e.x += p.facing * 150; return true; } const log = this.trees.find(t => t.log && Math.abs(t.x - p.x) < 110); if (log) { log.clubHits = (log.clubHits || 0) + 1; for (const target of this.enemies) if (target.alive && Math.abs(target.x - p.x) < 250) this.damageEnemy(target, 50, true); if (log.clubHits >= 3) { log.log = false; const key = `log_${log.id}`; if (!this.world.broken.includes(key)) this.world.broken.push(key); } return true; } return false; } if (p.form !== 'man' || p.items.stones < 1) return false; p.items.stones--; const e = this.enemies.find(e => e.alive && Math.abs(e.x - p.x) < 450 && (e.x - p.x) * p.facing >= 0); if (e) { this.damageEnemy(e, 6); this.gainRage(1, 'stone'); } return true; }
  eatHoney() { const p = this.player; if (!p.items.honey || p.form !== 'man' || p.healing > 0 || p.hp >= p.maxHp) return false; p.healing = 1.2; return true; }
  _updateEnemies(dt) {
    const p = this.player;
    p.parry = Math.max(0, (p.parry || 0) - dt);
    p.netted = Math.max(0, p.netted - dt);
    for (const e of this.enemies) {
      if (!e.alive || (e.type === 'moth' && !this.night)) continue;
      if(!e.active){if(Math.abs(p.x-e.spawnX)>720)continue;e.active=true;}
      if (e.recovery > 0) { e.recovery -= dt; continue; }
      const dx = p.x - e.x, distance = Math.abs(dx);
      if (e.state === 'charge') {
        e.x = clamp(e.x + e.chargeDirection * e.speed * 3 * dt,e.spawnX-e.tether,e.spawnX+e.tether);
        e.chargeTimer -= dt;
        if (Math.abs(p.x - e.x) < 32 && p.invuln <= 0 && !p.dodging) { this.hurt(e.damage); e.recovery = 1.2; e.state = 'recovery'; }
        else if (e.chargeTimer <= 0) { e.recovery = p.invuln > 0 || p.dodging ? 1.5 : .7; e.state = 'recovery'; }
        continue;
      }
      const reach = e.type === 'sporecap' ? 175 : e.type === 'moth' ? 140 : 55;
      if (distance > reach) {
        e.x = clamp(e.x + Math.sign(dx) * e.speed * (this.night ? 1 : .9) * dt,e.spawnX-e.tether,e.spawnX+e.tether);
        e.state = 'approach';
      } else {
        e.tell += dt; e.state = 'tell';
        if (e.tell < e.tellDuration) continue;
        const dodged = p.invuln > 0 || p.dodging;
        if (p.parry > 0) { this.gainRage(8, 'parry'); this.events.push({ type: 'parry' }); }
        else if (dodged) { if (p.dodging && e.tellDuration - (e.tell - dt) <= .15) this.gainRage(6, 'perfect_dodge'); }
        else if (e.type === 'trapper') { p.netted = 1.5; this.events.push({ type: 'net' }); }
        else this.hurt(e.damage * (this.night ? 1 : .85));
        e.tell = 0;
        if (e.type === 'stag') { e.state = 'charge'; e.chargeDirection = Math.sign(dx) || 1; e.chargeTimer = .3; }
        else { e.recovery = e.type === 'sporecap' ? 1.1 : .7; e.state = 'recovery'; }
      }
    }
  }
  hurt(amount) { const p = this.player; p.healing = 0; if (p.form === 'bear') p.wounds += amount * (p.items.body === 'hide_wrap' ? .45 : .5); else { p.hp -= amount; this.gainRage(5, 'hurt'); if (p.hp <= 0 && !this.assist) this.die(); else if (this.assist) p.hp = Math.max(1, p.hp); } }
  _updateBoss(dt) { const b = this.boss; if (!b?.alive) return; b.pin = Math.max(0, b.pin - dt); if (b.pin > 0) return; b.phase = b.hp > 540 ? 1 : b.hp > 225 ? 2 : 3; if (b.recovery > 0) {b.state='recovery';b.recovery -= dt;return;} b.state='tell';b.tell += dt;if(b.tell>(b.phase===1?1.05:.82)){b.tell=0;b.recovery=b.phase===1?1.35:1.05;const p=this.player;if(Math.abs(p.x-b.x)<300){if(p.parry>0){this.gainRage(12,'parry');this.events.push({type:'parry'});}else if(p.invuln<=0&&!p.dodging)this.hurt(b.attackDamage);}} }
  hitBoss(damage) { const b = this.boss; if (!b?.alive) return; b.hp = Math.max(0, b.hp - damage); b.phase = b.hp > 540 ? 1 : b.hp > 225 ? 2 : 3; if (b.hp <= 0) { b.alive = false; this.world.boss = true; this.complete = true; this.clock = 30; this.phase = PHASES.DAY; if (!this.player.items.charms.includes('tooth_necklace')) this.player.items.charms.push('tooth_necklace'); this.events.push({ type: 'complete' }); } }
  addBossTreeHit(treeId) { const t = this.trees.find(t => t.id === treeId); if (!t || !t.felled || !this.boss?.alive) return false; this.hitBoss(120); this.boss.pin = 3; this.boss.state='recovery';this.boss.tell=0;return true; }
  hitTree(tree, skill = false) { if (!tree || tree.felled || tree.state) return false; if (tree.type === 'sapling' && !skill) return false; tree.hp--; this.events.push({ type: 'treeHit', id: tree.id }); if (tree.hp <= 0) { tree.state = 'creak'; tree.timer = .35; tree.fallDir = this.player.x <= tree.x ? 1 : -1; this.events.push({ type: 'treeCreak', id: tree.id }); } return true; }
  _updateTrees(dt) { for (const tree of this.trees) { if (!tree.state) continue; tree.timer -= dt; if (tree.state === 'creak' && tree.timer <= 1e-8) { tree.state = 'fall'; tree.timer = .8; this.events.push({ type: 'treeSnap', id: tree.id }); } else if (tree.state === 'fall' && tree.timer <= 1e-8) { tree.state = 'felled'; tree.felled = true; tree.log = true; tree.shaft = tree.canopy; if (!this.world.felled.includes(tree.id)) this.world.felled.push(tree.id); this.stats.trees++; this.hitStop = Math.max(this.hitStop, .12); this.events.push({ type: 'treeFall', id: tree.id });const reach=tree.type==='elderwood'?450:260;for(const e of this.enemies)if(e.alive&&Math.abs(e.x-(tree.x+tree.fallDir*reach*.5))<reach*.65)this.damageEnemy(e,90,true);if(Math.abs(this.player.x-(tree.x+tree.fallDir*reach*.5))<85&&this.player.invuln<=0){this.hurt(22);this.events.push({type:'treeImpact',id:tree.id});}if (this.boss?.alive && Math.abs(this.boss.x-(tree.x+tree.fallDir*reach*.5))<reach) this.addBossTreeHit(tree.id); } } }
  _updatePickups() { const p = this.player; for (const item of this.pickups) if (!item.taken && (!item.requiresTree || this.world.felled.includes(item.requiresTree)) && Math.abs(item.x - p.x) < 42) { item.taken = true; this.pickup(item.item); } }
  pickup(item) { const p = this.player; if (item === 'stones') p.items.stones = Math.min(5, p.items.stones + 5); else if (item === 'honey_pouch') { p.items.honey = Math.min(3, p.items.honey + 2); p.items.honeyPouch = true; } else if (item === 'stick' || item === 'bone_knife') p.items.hand = item; else if (item === 'hide_wrap') { p.items.body = item; p.maxHp = 105; p.hp = Math.min(p.maxHp, p.hp + 25); } else if (item === 'bracers') p.items.bracers = true; else if (['antler_crown','iron_nail','tooth_necklace'].includes(item)) { if (!p.items.charms.includes(item)) p.items.charms.push(item); if (item === 'antler_crown' && !this.world.secrets.includes(item)) this.world.secrets.push(item); } }
  _updateCheckpointTouch() { const cp = this.checkpoints.find(c => Math.abs(c.x - this.player.x) < 48); if (cp && !cp.lit) { cp.lit = true; this.checkpoint = cp.id; this.events.push({ type: 'checkpoint', id: cp.id }); } }
  interact() { if (this.player.form !== 'man') return false; const cp = this.checkpoints.find(c => Math.abs(c.x - this.player.x) < 110); if (!cp) return false; if (!cp.lit) { cp.lit = true; this.checkpoint = cp.id; } this.sleep(); return true; }
  _resetBossEncounter(){if(this.world.boss)return;Object.assign(this.boss,{hp:this.boss.maxHp,phase:1,tell:0,recovery:0,pin:0,alive:true,state:'approach'});}
  _resetEncounter(){this._resetBossEncounter();this.enemies.forEach(e=>{e.alive=true;e.hp=e.maxHp;e.x=e.spawnX;e.tell=0;e.recovery=0;e.state='approach';e.active=false;e.chargeTimer=0;});this.pickups.forEach(i=>i.taken=false);}
  sleep() { this.player.hp = this.player.maxHp; this.clock = 0; this.phase = PHASES.DAWN; this.rageMultiplier=1;this._resetEncounter();this.events.push({type:'sleep'}); this.saveSnapshot = this.serialize(); }
  die() { const cp = this.checkpoints.find(c => c.id === this.checkpoint); this.stats.deaths++; this.player.w = 28;this.player.h=72; this.player.x = cp?.x ?? 100; this.player.y = this.floorY - this.player.h; this.player.maxHp = 80; this.player.hp = 80; this.player.rage = 0; this.player.wounds = 0; this.player.form = 'man'; this.player.items = { hand: null, body: null, charms: [], stones: 0, honey: this.assist ? 1 : 0, honeyPouch: false, bracers: false }; this.clock = 0; this.phase = PHASES.DAWN;this.rageMultiplier=1;this._resetEncounter(); }
  serialize() { return { v: 1, seed: this.seed, checkpoint: this.checkpoint, lit: this.checkpoints.filter(c => c.lit).map(c => c.id), world: structuredClone(this.world), player: structuredClone(this.player), clock: this.clock, stats: structuredClone(this.stats), assist: this.assist }; }
  restore(save) {
    if (!validSave(save,this)) return false;
    const world=structuredClone(save.world),stats=structuredClone(save.stats),player=structuredClone(save.player);
    const cp=this.checkpoints.find(c=>c.id===save.checkpoint);
    const maxHp=player.items.body==='hide_wrap'?105:80;
    Object.assign(player,{x:cp.x,y:this.floorY-72,vx:0,vy:0,w:28,h:72,grounded:true,coyote:.1,jumpBuffer:0,jumpWasDown:false,hp:maxHp,maxHp,form:'man',formTimer:0,formLength:0,wounds:0,exhaustion:0,netted:0,invuln:0,dodging:false,dodgeTimer:0,parry:0,healing:0,heavyHeld:false,heavyCharge:0,dodgeHeld:false,throwHeld:false,honeyHeld:false,interactHeld:false,skillHeld:false,skill:null,pouncing:false,chargeTimer:0,attackCd:0,halfShift:0});
    this.seed=save.seed;this.random=mulberry32(this.seed);this.checkpoint=save.checkpoint;this.checkpoints.forEach(c=>c.lit=save.lit.includes(c.id));this.world=world;this.player=player;this.clock=save.clock;this.stats=stats;this.assist=save.assist;this.phase=phaseAt(this.clock);this.rageMultiplier=this.phase===PHASES.NIGHT?1.5:1;
    this.trees.forEach(t=>{t.felled=world.felled.includes(t.id);t.log=t.felled&&!world.broken.includes(`log_${t.id}`);t.shaft=t.felled&&t.canopy;t.state=null;t.timer=0;});
    this._resetEncounter();this.complete=!!world.boss;if(this.complete){this.boss.alive=false;this.boss.hp=0;}return true;
  }
}

function validSave(s,w){
  if(!s||typeof s!=='object'||Object.keys(s).some(k=>!['v','seed','checkpoint','lit','world','player','clock','stats','assist'].includes(k))||s.v!==1||!Number.isInteger(s.seed)||s.seed<0||s.seed>0xffffffff||typeof s.assist!=='boolean'||!Number.isFinite(s.clock)||s.clock<0)return false;
  const cpIds=w.checkpoints.map(c=>c.id),treeIds=w.trees.map(t=>t.id),featureIds=w.features.map(f=>f.id);
  if(!cpIds.includes(s.checkpoint)||!Array.isArray(s.lit)||new Set(s.lit).size!==s.lit.length||s.lit.some(id=>!cpIds.includes(id))||!s.lit.includes('cp0_hollow')||!s.lit.includes(s.checkpoint))return false;
  if(!s.world||typeof s.world!=='object'||Object.keys(s.world).some(k=>!['felled','broken','boss','secrets'].includes(k))||!Array.isArray(s.world.felled)||new Set(s.world.felled).size!==s.world.felled.length||s.world.felled.some(id=>!treeIds.includes(id))||!Array.isArray(s.world.broken)||new Set(s.world.broken).size!==s.world.broken.length||s.world.broken.some(id=>!featureIds.includes(id)&&!treeIds.some(t=>id===`log_${t}`))||typeof s.world.boss!=='boolean'||!Array.isArray(s.world.secrets)||new Set(s.world.secrets).size!==s.world.secrets.length||s.world.secrets.some(id=>!['antler_crown'].includes(id)))return false;
  const playerKeys=['id','x','y','vx','vy','w','h','facing','grounded','coyote','jumpBuffer','hp','maxHp','stamina','staminaDelay','rage','wounds','form','formTimer','netted','exhaustion','invuln','items','combo','attackCd','lastSkill','crouching','jumpWasDown','halfShift','skillHeld','skillSerial','heavyHeld','heavyCharge','dodgeHeld','dodgeTimer','dodging','parry','throwHeld','honeyHeld','interactHeld','healing','transformTimer','formLength','chargeTimer','skill','pouncing'];
  if(!s.player||typeof s.player!=='object'||Object.keys(s.player).some(k=>!playerKeys.includes(k))||s.player.id!=='bjarki'||!['man','bear','transforming','exhausted'].includes(s.player.form)||!s.player.items||typeof s.player.items!=='object')return false;
  const p=s.player,i=p.items;
  if(Object.keys(i).some(k=>!['hand','body','charms','stones','honey','honeyPouch','bracers'].includes(k))||![null,'stick','bone_knife'].includes(i.hand)||![null,'hide_wrap'].includes(i.body)||!Array.isArray(i.charms)||new Set(i.charms).size!==i.charms.length||i.charms.some(x=>!['antler_crown','iron_nail','tooth_necklace'].includes(x))||!Number.isInteger(i.stones)||i.stones<0||i.stones>5||!Number.isInteger(i.honey)||i.honey<0||i.honey>3||typeof i.honeyPouch!=='boolean'||typeof i.bracers!=='boolean')return false;
  for(const k of ['x','y','vx','vy','w','h','coyote','jumpBuffer','hp','maxHp','stamina','staminaDelay','rage','wounds','formTimer','netted','exhaustion','invuln','combo','attackCd'])if(!Number.isFinite(p[k]))return false;
  for(const k of ['grounded','crouching'])if(typeof p[k]!=='boolean')return false;
  for(const k of ['jumpWasDown','skillHeld','heavyHeld','dodgeHeld','dodging','throwHeld','honeyHeld','interactHeld','pouncing'])if(k in p&&typeof p[k]!=='boolean')return false;
  for(const k of ['halfShift','heavyCharge','dodgeTimer','parry','healing','transformTimer','formLength','chargeTimer','skillSerial'])if(k in p&&(!Number.isFinite(p[k])||p[k]<0))return false;
  if((p.skill!==undefined&&p.skill!==null&&!['charge','pounce','slam'].includes(p.skill))||(p.lastSkill!==null&&!['roar','slam','swipe'].includes(p.lastSkill))||![-1,1].includes(p.facing)||p.w<=0||p.h<=0||p.stamina<0||p.stamina>100||p.maxHp<1||p.hp<0||p.hp>p.maxHp||p.rage<0||p.rage>100||p.wounds<0)return false;
  const statKeys=['deaths','berserks','secrets','playTime','moonrises','trees'];if(!s.stats||typeof s.stats!=='object'||Object.keys(s.stats).some(k=>!statKeys.includes(k))||statKeys.some(k=>!Number.isFinite(s.stats[k])||s.stats[k]<0))return false;
  return true;
}
