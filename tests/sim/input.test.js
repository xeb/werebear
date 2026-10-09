import test from 'node:test';
import assert from 'node:assert/strict';
import { TouchStick, normalizeGamepad } from '../../site/input/controls.js';

test('touch stick captures its pointer and samples normalized directions with dead zone', () => {
  const stick = new TouchStick({ deadZone: .18 });
  stick.start(4, 100, 100); stick.move(9, 180, 100);
  assert.deepEqual(stick.sample(), { x: 0, y: 0 });
  stick.move(4, 200, 120);
  assert.ok(stick.sample().x > .9); assert.ok(stick.sample().y > 0);
  stick.end(9); assert.notEqual(stick.sample().x, 0); stick.end(4); assert.deepEqual(stick.sample(), { x: 0, y: 0 });
});

test('gamepad mapping normalizes axes, buttons and triggers into shared actions', () => {
  const pad = { axes: [-.7, .1], buttons: Array.from({ length: 8 }, (_, i) => ({ pressed: [0, 2, 3, 4, 7].includes(i), value: i === 7 ? .8 : 0 })) };
  const input = normalizeGamepad(pad);
  assert.equal(input.left, true); assert.equal(input.jump, true); assert.equal(input.attack, true); assert.equal(input.heavy, true); assert.equal(input.transform, true);
});

test('W and Up are jump inputs while directional skill taps keep their direction',async()=>{
  const {normalizeKeyboard}=await import('../../site/input/controls.js');
  assert.equal(normalizeKeyboard({up:true}).jump,true);assert.equal(normalizeKeyboard({up:true}).up,true);assert.equal(normalizeKeyboard({space:true}).jump,true);
  assert.equal(normalizeKeyboard({up:true}).direction,'up');
});

test('gamepad Start has a pause edge and pause controls do not remain held after lifecycle clearing',async()=>{
  const {normalizeGamepad,clearInputState}=await import('../../site/input/controls.js');
  assert.equal(normalizeGamepad({buttons:Array.from({length:10},(_,i)=>({pressed:i===9}))}).pause,true);
  const state={keys:new Set(['left']),buttons:new Set(['attack']),stick:{pointer:4},skillPress:10,skillFired:true,padSkillPress:10,padSkillFired:true,releaseRequested:true,tapRequested:true};clearInputState(state);
  assert.equal(state.keys.size,0);assert.equal(state.buttons.size,0);assert.equal(state.stick.pointer,null);assert.equal(state.skillPress,null);assert.equal(state.padSkillPress,null);assert.equal(state.tapRequested,false);assert.equal(state.releaseRequested,false);
});
