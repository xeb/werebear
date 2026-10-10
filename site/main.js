import { World, STEP } from './sim/world.js';
import { saveWorld, loadWorld, clearSave } from './sim/save.js';
import { BrowserInput } from './input/browser.js';
import { Renderer } from './render/renderer.js';
import { ForestAudio } from './audio/audio.js';

const $ = (q) => document.querySelector(q), canvas=$('#world'), hud=$('#hud'), touchRoot=$('#touch');
const params=new URLSearchParams(location.search), seed=params.has('seed')?(Number(params.get('seed'))>>>0):Math.floor(Math.random()*0xffffffff);
const settings={assist:localStorage.getItem('wtb_assist')==='true',reduced:localStorage.getItem('wtb_reduced')==='true',music:Number(localStorage.getItem('wtb_music')??.6),sfx:Number(localStorage.getItem('wtb_sfx')??.8)};
const world=new World({seed,assist:settings.assist,debugRage:params.has('rage')});
if(params.has('time')&&params.get('time')==='night'){world.clock=390;world.phase='night';world.rageMultiplier=1.5}
if(params.get('cp')==='den'){world.checkpoints[1].lit=true;world.checkpoint=world.checkpoints[1].id;world.player.x=world.checkpoints[1].x;world.player.y=world.floorY-world.player.h}
if(params.has('rage'))world.player.rage=100;
const renderer=new Renderer(canvas,world,settings),audio=new ForestAudio();audio.setLevels(settings.music,settings.sfx);
const input=new BrowserInput(canvas,touchRoot,(reason)=>{if(reason==='lifecycle'){clearSimulationInputs();if(mode==='play')pause();}else if(mode==='play')pause();else if(mode==='pause')resume();else if(mode==='settings'||mode==='howto'){mode=menuReturn;screen(mode)}});
let mode='title', dream=false, dreamTimer=0,acc=0,last=0,lastDeaths=0,menuReturn='title',pauseEdge=false,attackEdge=false,skillSerial=0,wasBear=false;
// Narrow automation hook for browser QA; it does not override input or simulation.
globalThis.__wearTheBear={world,input,get mode(){return mode},get dream(){return dream}};
const SCREEN=['title','howto','settings','pause','complete'];
function screen(name){for(const n of SCREEN)$('#'+n).hidden=n!==name;}
function enableContinue(){const button=$('#continueBtn');button.disabled=false;button.style.opacity='1';}
function haptic(pattern=35){if(!settings.reduced&&navigator.vibrate)navigator.vibrate(pattern)}
function startGame(continueSave=false){audio.unlock();if(continueSave&&loadWorld(world)){dream=false}else{clearSave();$('#continueBtn').disabled=true;$('#continueBtn').style.opacity='.45';world.reset({assist:settings.assist});world.player.x=120;world.player.y=world.floorY-world.player.h;world.player.hp=80;dream=!params.has('cp')&&!params.has('time');if(dream){world.player.form='bear';world.player.h=150;world.player.w=58;world.player.y=world.floorY-world.player.h;world.player.formTimer=90;world.player.formLength=90;world.player.rage=100;world.clock=510;world.phase='night';world.rageMultiplier=1.5;world.stats.berserks=1;dreamTimer=30;world.enemies=[];world.spawnEnemy('grub',440,{id:'dream_grub'});world.spawnEnemy('hound',640,{id:'dream_hound'});world.spawnEnemy('stag',880,{id:'dream_stag'});world.trees=[{id:'dream_oak',x:720,type:'elderwood',hp:3,felled:false,canopy:true,shaft:false,log:false}];}if(params.get('cp')==='den'){world.checkpoints[1].lit=true;world.checkpoint=world.checkpoints[1].id;world.player.x=world.checkpoints[1].x}if(params.get('time')==='night'){world.clock=390;world.phase='night';world.rageMultiplier=1.5}}
  mode='play';hud.hidden=false;touchRoot.style.display=('ontouchstart'in window||navigator.maxTouchPoints>0)?'block':'none';screen('');lastDeaths=world.stats.deaths;skillSerial=world.player.skillSerial||0;wasBear=false;$('#hint').textContent=dream?'THE LONG SLEEP · Break the rot before you wake':'WASD move · Space jump · J strike · I bear skill · E interact';
}
function pause(){if(mode!=='play')return;mode='pause';world.paused=true;audio.pause();screen('pause');}
function resume(){mode='play';world.paused=false;screen('');audio.unlock();}
function clearSimulationInputs(){const p=world.player;for(const key of ['jumpWasDown','skillHeld','heavyHeld','dodgeHeld','throwHeld','interactHeld','pouncing'])p[key]=false;p.jumpBuffer=0;p.skill=null;p.chargeTimer=0;p.dodging=false;p.dodgeTimer=0;p.parry=0;pauseEdge=false;attackEdge=false;}
function show(name){menuReturn=mode;mode=name;world.paused=true;screen(name);}
function update(dt){if(mode==='pause'){const actions=input.sample(world.player);if(actions.pause&&!pauseEdge)resume();pauseEdge=!!actions.pause;return;}if(mode!=='play')return;
  if(params.has('rage'))world.player.rage=100;
  const actions=input.sample(world.player); if(actions.pause&&!pauseEdge)pause(); pauseEdge=!!actions.pause;
  if(actions.attack&&!attackEdge)audio.event('attack');attackEdge=!!actions.attack;
  if(mode!=='play')return;
  acc+=Math.min(.25,dt);let steps=0;
  while(acc>=STEP&&steps<15){world.step(actions);acc-=STEP;steps++;
    for(const ev of world.events){if(ev.type==='moonrise'){audio.event('moonrise');haptic([30,40,80])}if(ev.type==='treeFall'){audio.event('treeFall');haptic(90)}if(ev.type==='treeCreak')audio.event('treeCreak');if(ev.type==='treeSnap')audio.event('treeSnap');if(ev.type==='hit'){audio.event('hit');if(world.player.form==='bear')haptic(40)}if(ev.type==='parry'){audio.event('parry');haptic(24)}if(ev.type==='complete')audio.event('complete');if(ev.type==='checkpoint'){saveWorld(world);enableContinue()}if(ev.type==='sleep'){saveWorld(world);enableContinue()}}
    if((world.player.skillSerial||0)!==skillSerial){audio.event('skill');skillSerial=world.player.skillSerial}
    if(world.player.form==='bear'&&!wasBear){audio.event('bear');haptic([45,35,95])}wasBear=world.player.form==='bear';
    if(world.stats.deaths!==lastDeaths){lastDeaths=world.stats.deaths;saveWorld(world);enableContinue();audio.event('hurt')}
    if(dream){dreamTimer-=STEP;if(dreamTimer<=0){dream=false;world.player.form='man';world.player.w=28;world.player.h=72;world.player.formTimer=0;world.player.x=120;world.player.y=world.floorY-world.player.h;world.player.rage=0;world.player.wounds=0;world.player.items={hand:null,body:null,charms:[],stones:0};world.world.felled=[];world.stats.trees=0;world.stats.berserks=0;world._buildLevel();world.clock=0;world.phase='dawn';world.rageMultiplier=1;world.events.push({type:'wake'});$('#hint').textContent='A/D move · Space jump · J strike · K heavy · L dodge · I bear skill';}}
    if(world.complete){mode='complete';world.paused=true;saveWorld(world);enableContinue();$('#summary').textContent=`Time ${(world.stats.playTime/60).toFixed(1)} min · ${world.stats.deaths} deaths · ${world.stats.trees} trees felled · ${world.stats.berserks} transformations · ${world.world.secrets.length} secrets`;hud.hidden=true;screen('complete');break;}
  }
  updateHud();
  audio.setMood({combat:world.enemies.some(e=>e.alive&&Math.abs(e.x-world.player.x)<500),rage:world.player.rage,bear:world.player.form==='bear',boss:world.player.x>37*1280&&world.boss.alive,night:world.night});
}
function updateHud(){const p=world.player;$('#health').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;$('#stamina').style.width=`${p.stamina}%`;$('#woundsText').hidden=p.form!=='bear';$('#wounds').style.width=`${Math.min(100,p.wounds/Math.max(1,p.hp)*100)}%`;const paw=$('.touch-btn.paw');paw.classList.toggle('ready',p.form==='bear'||p.rage>=25);paw.classList.toggle('full',p.rage>=100&&!settings.reduced);paw.setAttribute('aria-label',p.form==='bear'?'Hold for one second to end bear form':p.rage>=100?'Hold to transform':'Bear skill; needs 25 Rage');
  [...$('#rage').children].forEach((s,i)=>{s.classList.toggle('on',p.rage>i*25);s.style.opacity=p.form==='bear'?String(Math.max(.2,p.formTimer/90)):'1'});
  const phase=world.phase.toUpperCase();$('#clock').textContent=`${world.night?'☾':'☼'} ${phase}${p.form==='bear'?` · ${Math.ceil(p.formTimer)}s`:''}`;
  const hand=p.items.hand?.replace('_',' ').toUpperCase()||'FISTS';$('#items').textContent=`${hand} · ${p.items.stones} STONES${p.items.body==='hide_wrap'?' · HIDE WRAP':''}${p.items.bracers?' · BRACERS':''}`;
  $('#section').textContent=dream?'The Long Sleep':world.section;
}
function frame(now){const dt=last?Math.min(.05,(now-last)/1000):0;last=now;update(dt);renderer.render(dt);requestAnimationFrame(frame)}
requestAnimationFrame(frame);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

document.addEventListener('pointerdown',()=>audio.unlock(),{once:true});document.addEventListener('keydown',()=>audio.unlock(),{once:true});
document.addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const action=button.dataset.action;
  if(action==='new')startGame(false);else if(action==='continue')startGame(true);else if(action==='howto')show('howto');else if(action==='settings')show('settings');else if(action==='pause')pause();else if(action==='back'){mode=menuReturn;world.paused=mode!=='play';screen(mode)}else if(action==='resume')resume();else if(action==='title'){mode='title';world.paused=false;hud.hidden=true;touchRoot.style.display='none';screen('title')}else if(action==='sleep'){const cp=world.checkpoints.find(c=>c.id===world.checkpoint);if(cp&&Math.abs(cp.x-world.player.x)<220){world.sleep();saveWorld(world);enableContinue();resume()}else {$('#hint').textContent='Find a lit den to sleep.';setTimeout(()=>$('#hint').textContent='WASD move · Space jump · J strike · I bear skill',1900)}}
});
$('#assist').checked=settings.assist;$('#reduced').checked=settings.reduced;$('#music').value=settings.music;$('#sfx').value=settings.sfx;
$('#assist').addEventListener('change',e=>{settings.assist=e.target.checked;world.assist=settings.assist;localStorage.setItem('wtb_assist',String(settings.assist))});
$('#reduced').addEventListener('change',e=>{settings.reduced=e.target.checked;localStorage.setItem('wtb_reduced',String(settings.reduced))});
$('#music').addEventListener('input',e=>{settings.music=Number(e.target.value);audio.setLevels(settings.music,settings.sfx);localStorage.setItem('wtb_music',String(settings.music))});
$('#sfx').addEventListener('input',e=>{settings.sfx=Number(e.target.value);audio.setLevels(settings.music,settings.sfx);localStorage.setItem('wtb_sfx',String(settings.sfx))});
$('#continueBtn').disabled=!localStorage.getItem('wear-the-bear-save-v1');$('#continueBtn').style.opacity=$('#continueBtn').disabled?'.45':'1';
