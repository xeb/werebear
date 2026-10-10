import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const renderer=await readFile(new URL('../../site/render/renderer.js',import.meta.url),'utf8');
const sw=await readFile(new URL('../../site/sw.js',import.meta.url),'utf8');
const html=await readFile(new URL('../../site/index.html',import.meta.url),'utf8');
const input=await readFile(new URL('../../site/input/browser.js',import.meta.url),'utf8');
const main=await readFile(new URL('../../site/main.js',import.meta.url),'utf8');

test('boss health draws after leaving the translated world context',()=>{
  assert.match(renderer,/c\.restore\(\);\s*this\.bossHud\(\)/);
  assert.match(renderer,/bossHud\(\).*fillRect\(820,72,380,20\)/s);
  assert.match(renderer,/THORNGUT WINDS UP/);assert.match(renderer,/RECOVERING/);
});

test('game viewport is 16:9 letterboxed and pause touch target is at least 56px',()=>{
  assert.match(renderer,/h=w\*9\/16/);assert.match(renderer,/w=h\*16\/9/);
  assert.match(html,/\.hud-pause\{[^}]*min-width:56px;min-height:56px/);
});

test('service worker caches only shell paths, excludes research and uses network-first navigation',()=>{
  assert.match(sw,/wear-the-bear-20261011b/);assert.match(sw,/url\.pathname\.startsWith\('\/research\/'\)/);
  assert.match(sw,/if \(!SHELL_PATHS\.has\(url\.pathname\)\) return/);assert.match(sw,/url\.search !== '\?v=20261011b'/);assert.match(sw,/fetch\(request\)[\s\S]*catch\(\(\) => caches\.match\(request\)/);
  assert.match(html,/main\.js\?v=20261011b/);
});

test('lifecycle loss clears input and only pauses; explicit gamepad Start can resume',()=>{
  assert.match(input,/addEventListener\('blur',\s*\(\) => this\.lifecycleLoss\(\)\)/);
  assert.match(input,/if \(document\.hidden\) this\.lifecycleLoss\(\)/);assert.match(input,/clearInputState\(this\)/);
  assert.match(main,/reason==='lifecycle'.*mode==='play'\)pause\(\)/s);assert.match(main,/mode==='pause'\)\{const actions=input\.sample/);
});
