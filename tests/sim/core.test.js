import test from 'node:test';
import assert from 'node:assert/strict';
import { World, PHASES } from '../../site/sim/world.js';

test('clock follows 30s dawn, 300s day, 30s dusk, 240s night; moonrise grants exactly 25 Rage', () => {
  const w = new World({ seed: 7 });
  w.clock = 359;
  w.player.rage = 90;
  w.advance(2);
  assert.equal(w.phase, PHASES.NIGHT);
  assert.equal(w.player.rage, 100);
  assert.equal(w.stats.moonrises, 1);
  assert.equal(w.rageMultiplier, 1.5);
});

test('human movement, jump buffer, coyote time, collision and stamina are deterministic', () => {
  const w = new World({ seed: 9 });
  w.player.x = 20;
  w.step({ right: true, jump: true, heavy: true });
  assert.ok(w.player.vx > 0);
  assert.ok(w.player.vy < 0);
  assert.equal(w.player.stamina, 80);
  w.player.x = w.worldWidth - 1;
  w.advance(1, { right: true });
  assert.ok(w.player.x <= w.worldWidth);
  w.advance(2);
  assert.ok(w.player.stamina > 80);
});

test('jump buffer catches a landing, coyote expires after 100ms, and stamina waits half a second to recover',()=>{
  const w=new World();w.enemies=[];w.player.y=w.floorY-w.player.h-4;w.player.vy=120;w.player.grounded=false;w.player.coyote=0;w.step({jump:true});w.advance(.08);assert.ok(w.player.vy<0);
  const c=new World();c.player.grounded=false;c.player.coyote=.1;c.player.y=c.floorY-c.player.h-20;c.step({jump:true});assert.ok(c.player.vy<0);
  const expired=new World();expired.player.grounded=false;expired.player.coyote=0;expired.player.y=expired.floorY-expired.player.h-20;expired.step({jump:true});assert.ok(expired.player.vy>0);
  const stamina=new World();stamina.enemies=[];stamina.dodge();const spent=stamina.player.stamina;stamina.advance(.4);assert.equal(stamina.player.stamina,spent);stamina.advance(.2);assert.ok(stamina.player.stamina>spent);
});

test('holding jump extends one jump but does not auto-jump again on landing',()=>{
  const w=new World();w.enemies=[];for(let i=0;i<100;i++)w.step({jump:true});assert.equal(w.player.grounded,true);assert.equal(w.player.jumpBuffer,0);
});

test('rage gains use night multiplier; partial rage decays after combat grace; completed segments stay', () => {
  const w = new World();
  w.enemies = [];
  w.gainRage(20, 'test');
  assert.equal(w.player.rage, 20);
  w.advance(9);
  assert.ok(Math.abs(w.player.rage - 18) < .05);
  w.player.rage = 31;
  w.combatTimer = 0;
  w.advance(12);
  assert.equal(w.player.rage, 25);
  w.clock = 400;
  w.phase = PHASES.NIGHT; w.rageMultiplier = 1.5;
  w.gainRage(4, 'test');
  assert.equal(w.player.rage, 31);
});

test('directional taps spend one segment; a full held paw transforms for exactly 90 seconds', () => {
  const w = new World();
  w.player.rage = 50;
  w.tapSkill('down');
  assert.equal(w.player.lastSkill, 'slam');
  assert.equal(w.player.rage, 25);
  w.player.rage = 100;
  w.beginTransform();
  w.advance(1);
  assert.equal(w.player.form, 'bear');
  w.advance(89.99);
  assert.equal(w.player.form, 'bear');
  w.advance(0.02);
  assert.notEqual(w.player.form, 'bear');
});

test('a held input frame that spans several fixed steps triggers a directional skill only once',()=>{
  const w=new World();w.player.rage=100;w.enemies=[];w.advance(.1,{skill:true,direction:'up'});assert.equal(w.player.rage,75);assert.equal(w.player.lastSkill,'roar');
});

test('heavy attack charges on hold and resolves once on release; held item actions consume once', () => {
  const w=new World();w.enemies=[];const target=w.spawnEnemy('grub',w.player.x+25);const hp=target.hp;
  w.step({heavy:true});w.advance(.5,{heavy:true});assert.equal(target.hp,hp);
  w.step({heavy:false});assert.ok(target.hp<hp);
  w.player.items.stones=5;for(let i=0;i<10;i++)w.step({throw:true});assert.equal(w.player.items.stones,4);
  w.player.hp=30;w.player.items.honey=2;for(let i=0;i<10;i++)w.step({honey:true});assert.equal(w.player.items.honey,2);w.advance(1.1);assert.equal(w.player.items.honey,1);assert.equal(w.player.hp,65);
});
