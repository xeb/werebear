import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../../site/sim/world.js';

test('Wounds take half damage, kills heal wounds, shape break charges wounds and Assist prevents death', () => {
  const w = new World(); w.enemies = [];
  w.player.rage = 100; w.beginTransform(); w.advance(1);
  w.hurt(40); assert.equal(w.player.wounds, 20); assert.equal(w.player.hp, 80);
  const e = w.spawnEnemy('grub', w.player.x + 20); w.player.wounds = 30; w.killEnemy(e);
  assert.equal(w.player.wounds, 20);
  w.breakForm(); assert.equal(w.player.hp, 60);
  const assist = new World({ assist: true }); assist.enemies = []; assist.player.hp = 10; assist.player.wounds = 30; assist.player.form = 'bear'; assist.breakForm();
  assert.equal(assist.player.hp, 1);
});

test('Exhaustion lasts three seconds and disables dodge and Rage gain', () => {
  const w = new World(); w.enemies = []; w.player.form = 'bear'; w.breakForm();
  assert.equal(w.player.form, 'exhausted'); assert.equal(w.dodge(), false);
  const rage = w.player.rage; w.gainRage(20); assert.equal(w.player.rage, rage);
  w.advance(3.1); assert.equal(w.player.form, 'man');
});

test('parry, perfect dodge, enemy tells, night-only moths and roster drops work', () => {
  const w = new World(); w.enemies = [];
  w.player.items.body = 'bracers';
  assert.equal(w.dodge(true), true); assert.ok(w.player.parry > 0);
  w.spawnEnemy('moth', w.player.x + 10); w.advance(1); assert.equal(w.enemies[0].hp, 16);
  w.clock = 400; w.phase = 'night'; w.advance(.1); assert.equal(w.enemies[0].state, 'tell');
  for (const type of ['grub','sporecap','hound','moth','stag','trapper','brute']) assert.ok(w.spawnEnemy(type, 300));
  const trapper = w.spawnEnemy('trapper', 300); w.killEnemy(trapper); assert.ok(w.pickups.some(i => i.item === 'bracers'));
  w.player.items.bracers = true;
});

test('sporecap clouds and moth darts threaten at range while their tells remain interruptible',()=>{
  const w=new World();w.enemies=[];const cap=w.spawnEnemy('sporecap',w.player.x+160);cap.tell=cap.tellDuration-.01;w.advance(.02);assert.ok(w.player.hp<80);
  w.player.hp=80;w.player.x=1000;w.clock=390;w.phase='night';w.rageMultiplier=1.5;const moth=w.spawnEnemy('moth',w.player.x+120);moth.tell=moth.tellDuration-.01;w.advance(.02);assert.ok(w.player.hp<80);
});

test('trees persist as logs through death, shafts open at night, sleep and save restore', () => {
  const w = new World(); w.enemies = [];
  const t = w.trees.find(tree=>tree.id==='tree_01');t.x=200;t.canopy=true;
  w.hitTree(t); w.hitTree(t); w.hitTree(t);
  w.advance(1.2);
  assert.equal(t.log, true); assert.equal(t.shaft, true);
  w.checkpoints[1].lit=true;w.checkpoint = 'cp1_den'; w.die(); assert.ok(w.world.felled.includes('tree_01'));
  const saved = w.serialize(); const loaded = new World(); assert.equal(loaded.restore(saved), true);
  assert.ok(loaded.trees.some(tree => tree.id === 'tree_01')); assert.equal(loaded.checkpoint, 'cp1_den');
});

test('checkpoint touch lights without time; sleep restores health at dawn; death strips all gear', () => {
  const w = new World(); w.enemies = [];
  const cp = w.checkpoints[1]; w.player.x = cp.x; w.clock = 400; w.step();
  assert.equal(w.checkpoint, cp.id); assert.equal(w.clock > 400, true);
  w.player.hp = 12; w.player.rage = 60; w.player.items.honey = 2; w.sleep();
  assert.equal(w.clock, 0); assert.equal(w.player.hp, w.player.maxHp); assert.equal(w.player.rage, 60);
  w.die(); assert.equal(w.player.items.honey, 0); assert.equal(w.player.rage, 0); assert.equal(w.player.x, cp.x);
});

test('boss phases, tree pin damage, and no-bear victory route are represented', () => {
  const w = new World(); w.enemies = [];
  assert.equal(w.boss.hp, 900); w.hitBoss(360); assert.equal(w.boss.phase, 2);
  const t = w.addTree('boss_tree', w.boss.x, 'rotwood'); w.hitTree(t); w.advance(1.2); assert.equal(w.addBossTreeHit(t.id), true);
  assert.equal(w.boss.hp, 300); assert.equal(w.boss.pin, 3);
  w.hitBoss(480); assert.equal(w.complete, true); assert.equal(w.world.boss, true);
  assert.equal(w.boss.noBearViable, true);
});

test('Iron Nail shortens transformation to exactly 60 seconds; moon shafts feed Rage and checkpoint caches re-arm', () => {
  const w = new World(); w.enemies=[]; w.player.items.charms.push('iron_nail'); w.player.rage=100; w.beginTransform(); w.advance(1);
  assert.equal(w.player.formTimer, 60); w.advance(59.99); assert.equal(w.player.form, 'bear'); w.advance(.02); assert.notEqual(w.player.form, 'bear');
  w.clock=390; w.phase='night'; w.rageMultiplier=1.5; w.player.form='man'; w.player.exhaustion=0; w.player.rage=0; w.player.x=200;
  const shaft=w.addTree('shaft_test',200,'elderwood',{canopy:true}); w.hitTree(shaft);w.hitTree(shaft);w.hitTree(shaft);w.advance(1.2);
  w.hitStop=0;
  w.advance(2); assert.ok(w.player.rage >= 2.9);
  assert.ok(w.pickups.some(p=>p.x>17*1280&&p.item==='stick'));
  assert.ok(w.pickups.some(p=>p.x>36*1280&&p.item==='stones'));
});

test('parry cancels a tell, a net prevents transformation until Roar, and human attacks can finish the boss', () => {
  const w = new World(); w.enemies=[]; w.player.items.body='bracers'; w.player.items.bracers=true;
  const e=w.spawnEnemy('grub',w.player.x+30); e.tell=e.tellDuration-.01; w.player.parry=.18; w.player.rage=0;
  w.advance(.03); assert.equal(e.state,'recovery'); assert.equal(w.player.rage,8);
  w.player.netted=1;w.player.rage=100;assert.equal(w.beginTransform(),false);w.player.rage=25;w.tapSkill('up');assert.equal(w.player.netted,0);
  w.boss.x=w.player.x+20;w.boss.recovery=1000;w.player.rage=0;w.player.items.hand=null;
  for(let i=0;i<150;i++){w.attack();w.advance(.45)} assert.equal(w.complete,true);
});

test('seeded integration sequence replays to identical state and death preserves felling but strips resources', () => {
  const run=()=>{const w=new World({seed:123});w.enemies=[];for(let i=0;i<90;i++)w.step({right:i<60,jump:i===3});w.player.rage=25;w.tapSkill('forward');w.addTree('path_oak',600,'elderwood');for(let i=0;i<3;i++)w.hitTree(w.trees.at(-1));w.advance(1.2);w.player.items.honey=2;w.player.items.stones=4;w.die();return w.serialize()};
  assert.deepEqual(run(),run()); const result=run();assert.ok(result.world.felled.includes('path_oak'));assert.equal(result.player.items.honey,0);assert.equal(result.player.items.stones,0);
});

test('felled tree uses a creak and fall window before opening a shaft and becoming a log collider',()=>{
  const w=new World();w.enemies=[];const tree=w.addTree('timed_oak',900,'elderwood',{canopy:true});w.hitTree(tree);w.hitTree(tree);w.hitTree(tree);
  assert.equal(tree.state,'creak');assert.equal(tree.felled,false);w.advance(.34);assert.equal(tree.state,'creak');w.advance(.02);assert.equal(tree.state,'fall');w.advance(.79);assert.equal(tree.felled,false);w.advance(.03);assert.equal(tree.felled,true);assert.equal(tree.log,true);assert.equal(tree.shaft,true);assert.ok(w.world.felled.includes('timed_oak'));
});

test('compressed level exposes every named beat and bear form is rejected by crawl roots', () => {
  const w=new World();assert.deepEqual(w.sections.map(s=>s.name),['The Waking Hollow','The Thicket','The Den','The Deeper Wood',"The Trappers' Run",'The Deep Stone','The Rotted Clearing']);
  const crawl=w.features.find(f=>f.type==='crawl');w.player.form='bear';w.player.x=crawl.x-10;w.step({right:true});assert.ok(w.player.x<crawl.x-crawl.width+1);
  w.player.form='man';w.player.x=crawl.x-10;w.step({right:true,down:true});assert.ok(w.player.x>crawl.x-crawl.width);
});

test('honey takes 1.2 seconds, heals 35 on completion, and an incoming hit interrupts it',()=>{
  const w=new World();w.enemies=[];w.player.hp=30;w.player.items.honey=2;assert.equal(w.eatHoney(),true);assert.equal(w.player.items.honey,2);w.advance(1.19);assert.equal(w.player.hp,30);w.advance(.02);assert.equal(w.player.hp,65);assert.equal(w.player.items.honey,1);
  w.player.hp=20;w.eatHoney();w.advance(.4);w.hurt(1);w.advance(1);assert.equal(w.player.hp,19);assert.equal(w.player.items.honey,1);
});

test('transform animation survives release; holding again as the bear ends the form',()=>{
  const w=new World();w.enemies=[];w.player.rage=100;w.beginTransform();w.endTransform();w.advance(1);assert.equal(w.player.form,'bear');assert.equal(w.player.h,150);w.endTransform();assert.equal(w.player.form,'exhausted');assert.equal(w.player.h,72);
});

test('bear can uproot a felled tree, swing it three times, and its destruction persists',()=>{
  const w=new World();w.enemies=[];const tree=w.trees[0];tree.felled=true;tree.log=true;w.world.felled.push(tree.id);w.player.form='bear';w.player.x=tree.x-10;
  assert.equal(w.throwStone(),true);assert.equal(tree.log,true);w.throwStone();assert.equal(tree.log,true);w.throwStone();assert.equal(tree.log,false);
  const restored=new World();restored.restore(w.serialize());assert.equal(restored.trees.find(t=>t.id===tree.id).log,false);
});

test('equipment slot effects coexist: wraps raise health, bracers parry, honey pouch rewards shape break',()=>{
  const w=new World();w.enemies=[];w.pickup('hide_wrap');w.pickup('bracers');w.pickup('honey_pouch');assert.equal(w.player.maxHp,105);assert.equal(w.player.items.body,'hide_wrap');assert.equal(w.player.items.bracers,true);assert.equal(w.player.items.honeyPouch,true);
  w.player.hp=50;w.player.wounds=0;w.player.form='bear';w.player.h=150;w.player.w=58;w.breakForm();assert.equal(w.player.hp,65);assert.equal(w.player.h,72);w.advance(3.1);assert.equal(w.dodge(true),true);assert.ok(w.player.parry>0);
  w.die();assert.equal(w.player.maxHp,80);assert.equal(w.player.items.honeyPouch,false);
});

test('the first rotwood sapling gates the route until a bear slam permanently fells it',()=>{
  const w=new World();w.enemies=[];const gate=w.features.find(f=>f.type==='sapling'),tree=w.trees.find(t=>t.id===gate.treeId);w.player.x=gate.x-20;w.step({right:true});assert.ok(w.player.x<gate.x);
  w.player.x=gate.x-100;w.player.rage=25;assert.equal(w.tapSkill('down'),true);assert.equal(tree.state,'creak');w.advance(1.2);w.hitStop=0;w.player.x=gate.x-1;w.step({right:true});assert.ok(w.player.x>gate.x);assert.ok(w.world.felled.includes(tree.id));
});

test('felled tree logs have a solid playable collider that can be stood on',()=>{
  const w=new World();w.enemies=[];const tree=w.trees[0];tree.felled=true;tree.log=true;w.world.felled.push(tree.id);w.player.x=tree.x-149;w.player.y=w.floorY-w.player.h;w.player.grounded=true;w.step({right:true});assert.equal(w.player.grounded,true);assert.equal(w.player.y+w.player.h,w.floorY-28);
});

test('Thorngut respects invulnerability and parry and resets unfinished boss encounters',()=>{
  const w=new World();w.enemies=[];w.player.x=w.boss.x-100;w.player.invuln=1;w.boss.tell=2;w.advance(.02);assert.equal(w.player.hp,80);
  w.player.invuln=0;w.player.items.bracers=true;w.player.parry=1;w.boss.tell=2;w.boss.recovery=0;const rage=w.player.rage;w.advance(.02);assert.equal(w.player.hp,80);assert.ok(w.player.rage>rage);
  w.hitBoss(400);w.boss.tell=2;w.boss.recovery=3;w.sleep();assert.equal(w.boss.hp,900);assert.equal(w.boss.phase,1);assert.equal(w.boss.tell,0);assert.equal(w.boss.recovery,0);
  w.hitBoss(400);w.die();assert.equal(w.boss.hp,900);assert.equal(w.boss.phase,1);assert.equal(w.boss.alive,true);
  w.hitBoss(400);const loaded=new World();assert.equal(loaded.restore(w.serialize()),true);assert.equal(loaded.boss.hp,900);assert.equal(loaded.boss.phase,1);assert.equal(loaded.boss.tell,0);
});

test('first gap has a lower human route and a felled Elderwood upper bridge',()=>{
  const w=new World();w.enemies=[];const gap=w.gaps?.[0];assert.ok(gap);w.player.x=gap.start+10;assert.equal(w._groundAt(w.player.x,'man'),null);assert.equal(w._groundAt(gap.start+10,'man',true),gap.lowerFloor);
  w.player.form='bear';w.player.x=gap.treeX;const tree=w.trees.find(t=>t.id===gap.treeId);tree.felled=true;tree.log=true;w.world.felled.push(tree.id);assert.equal(w._groundAt(w.player.x,'man'),w.floorY-28);
});

test('human can crouch through the first gap root route without dying',()=>{
  const w=new World();w.enemies=[];const gap=w.gaps[0];w.player.x=gap.start-12;w.advance(2.5,{right:true,down:true});assert.ok(w.player.x>gap.end);assert.equal(w.stats.deaths,0);
});

test('enemies remain dormant until nearby and cannot migrate beyond their encounter tether',()=>{
  const w=new World();const e=w.enemies[0];w.player.x=5000;w.advance(5);assert.equal(e.x,e.spawnX);assert.equal(e.active,false);
  w.player.x=e.spawnX+100;w.advance(1);assert.equal(e.active,true);w.player.x=e.spawnX+1000;w.advance(20);assert.ok(Math.abs(e.x-e.spawnX)<500);
});

test('bear charge, pounce and rend cause their advertised area effects; slam fells the bee tree',()=>{
  const w=new World();w.enemies=[];w.player.form='bear';w.player.formTimer=50;w.player.formLength=50;w.player.x=200;w.player.facing=1;const target=w.spawnEnemy('grub',240);w.tapSkill('forward');w.advance(.1);assert.ok(target.hp<12);assert.ok(target.x>240);
  const bee=w.trees.find(t=>t.id==='tree_06');w.player.x=bee.x;w.tapSkill('down');w.advance(1.4);assert.ok(bee.felled);
  const enemy=w.spawnEnemy('grub',w.player.x+60);enemy.hp=12;w.attack(true);assert.ok(enemy.hp<0||enemy.state==='recovery');
});

test('airborne bear attack pounces on landing and a warned falling tree can hurt the player',()=>{
  const w=new World();w.enemies=[];w.player.form='bear';w.player.formTimer=40;w.player.formLength=40;w.player.y=w.floorY-w.player.h-80;w.player.vy=480;w.player.grounded=false;const e=w.spawnEnemy('grub',w.player.x+20);e.active=true;w.step({attack:true});w.player.y=w.floorY-w.player.h+1;w.player.vy=100;w.advance(.1);assert.ok(e.hp<e.maxHp);
  const tree=w.trees.find(t=>t.id==='tree_00');tree.x=1000;tree.type='elderwood';tree.hp=3;w.player.x=800;w.hitTree(tree,true);w.hitTree(tree,true);w.hitTree(tree,true);w.advance(.5);assert.equal(tree.state,'fall');const wounds=w.player.wounds;w.player.x=1225;w.advance(1.1);assert.ok(w.player.wounds>wounds);
});

test('public traversal enforces the first gap route and bear Dodge performs Charge',()=>{
  const standing=new World();standing.enemies=[];const gap=standing.gaps[0];standing.player.x=gap.start-20;standing.advance(2.5,{right:true});assert.ok(standing.stats.deaths>0,'standing traversal must fall instead of crossing the upper gap');
  const charging=new World();charging.enemies=[];charging.player.form='bear';charging.player.formTimer=30;charging.player.formLength=30;charging.player.x=3830;charging.player.facing=1;charging.step({dodge:true});charging.advance(.3);assert.ok(charging.world.broken.includes('rot_wall_01'),'bear Dodge must map to Charge and break rot walls');
});

test('human Down plus Paw fells the bee-tree and exposes the Honeycomb Pouch',()=>{
  const w=new World();w.enemies=[];const bee=w.trees.find(t=>t.id==='tree_06');w.player.x=bee.x;w.player.rage=25;assert.equal(w.tapSkill('down'),true);w.advance(1.4);assert.ok(bee.felled);const pouch=w.pickups.find(p=>p.item==='honey_pouch');assert.equal(pouch.requiresTree,bee.id);w.player.x=pouch.x;w.step();assert.equal(w.player.items.honeyPouch,true);
});
