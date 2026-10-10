import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../../site/sim/world.js';
import { saveWorld,loadWorld,clearSave } from '../../site/sim/save.js';

function storage(){const m=new Map();return{getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)}}

test('local save round-trips the player, checkpoint, clock, stats and permanent world state',()=>{
  const store=storage(),w=new World({seed:77});w.checkpoints[1].lit=true;w.checkpoint='cp1_den';w.player.items.hand='bone_knife';w.player.items.stones=3;w.clock=411;w.world.felled.push('tree_01');
  assert.equal(saveWorld(w,store),true);const restored=new World({seed:1});assert.equal(loadWorld(restored,store),true);
  assert.equal(restored.seed,77);assert.equal(restored.player.items.hand,'bone_knife');assert.equal(restored.player.items.stones,3);assert.equal(restored.phase,'night');assert.equal(restored.checkpoint,'cp1_den');assert.ok(restored.trees.find(t=>t.id==='tree_01').felled);
  assert.equal(clearSave(store),true);assert.equal(loadWorld(restored,store),false);
});

test('malformed or unsupported saves fail safely without replacing live state',()=>{
  const store=storage(),w=new World();store.setItem('wear-the-bear-save-v1','{bad json');assert.equal(loadWorld(w,store),false);assert.equal(w.player.hp,80);
});

test('save validation rejects equipment in the wrong slot',()=>{
  const store=storage(),source=new World(),live=new World();live.player.x=4321;
  const wrongHand=source.serialize();wrongHand.player.items.hand='hide_wrap';store.setItem('wear-the-bear-save-v1',JSON.stringify(wrongHand));assert.equal(loadWorld(live,store),false);assert.equal(live.player.x,4321);
  const wrongBody=source.serialize();wrongBody.player.items.body='bone_knife';store.setItem('wear-the-bear-save-v1',JSON.stringify(wrongBody));assert.equal(loadWorld(live,store),false);assert.equal(live.player.x,4321);
});

test('valid JSON with invalid v1 structure is rejected without mutating the live world',()=>{
  const store=storage(),w=new World();w.player.x=987;const before=w.serialize();
  for(const save of [{v:1},{...before,player:{...before.player,items:{...before.player.items,charms:'bad'}}},{...before,world:{...before.world,felled:['not-a-tree']}},{...before,lit:['unknown']},{...before,seed:-1}]){
    store.setItem('wear-the-bear-save-v1',JSON.stringify(save));assert.equal(loadWorld(w,store),false);assert.deepEqual(w.serialize(),before);
  }
});

test('loading resumes at checkpoint as a healthy human and clears transient combat state',()=>{
  const store=storage(),saved=new World();saved.checkpoints[1].lit=true;saved.checkpoint='cp1_den';saved.player.x=432;saved.player.hp=12;saved.player.wounds=30;saved.player.form='bear';saved.player.h=150;saved.player.exhaustion=3;saved.player.invuln=2;saved.player.items.hand='stick';saved.player.items.stones=2;saved.player.rage=55;saved.world.felled.push('tree_01');
  saveWorld(saved,store);const loaded=new World();assert.equal(loadWorld(loaded,store),true);assert.equal(loaded.player.x,loaded.checkpoints[1].x);assert.equal(loaded.player.hp,loaded.player.maxHp);assert.equal(loaded.player.form,'man');assert.equal(loaded.player.h,72);assert.equal(loaded.player.wounds,0);assert.equal(loaded.player.exhaustion,0);assert.equal(loaded.player.invuln,0);assert.equal(loaded.player.items.hand,'stick');assert.equal(loaded.player.items.stones,2);assert.equal(loaded.player.rage,55);assert.ok(loaded.world.felled.includes('tree_01'));
});

test('v1 saves accept the cumulative in-game clock after several day cycles',()=>{
  const store=storage(),w=new World();w.clock=1842;assert.equal(saveWorld(w,store),true);const loaded=new World();assert.equal(loadWorld(loaded,store),true);assert.equal(loaded.clock,1842);assert.equal(loaded.phase,'day');
});
