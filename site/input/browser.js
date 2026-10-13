import { TouchStick, normalizeGamepad, normalizeKeyboard, clearInputState } from './controls.js';

const KEY = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyJ: 'attack', KeyK: 'heavy', KeyL: 'dodge', ShiftLeft: 'dodge', ShiftRight: 'dodge', KeyU: 'throw', KeyE: 'interact'
};

export class BrowserInput {
  constructor(canvas, touchRoot, onPause) {
    this.keys = new Set(); this.buttons = new Set(); this.stick = new TouchStick(); this.skillPress = null; this.skillFired = false; this.skillThreshold = 450; this.padSkillPress = null; this.padSkillFired = false; this.padSkillThreshold = 450; this.form = 'man'; this.onPause = onPause;
    this.canvas = canvas; this.touchRoot = touchRoot; this.knob = touchRoot.querySelector('.stick-knob');
    addEventListener('keydown', e => {
      if (KEY[e.code] || ['KeyI','Escape','Enter'].includes(e.code)) e.preventDefault();
      if (e.code === 'Escape' && !e.repeat) onPause('escape');
      if (KEY[e.code]) this.keys.add(KEY[e.code]);
      if (e.code === 'KeyI' && !e.repeat) this.beginSkill();
    });
    addEventListener('keyup', e => { if (KEY[e.code]) this.keys.delete(KEY[e.code]); if (e.code === 'KeyI') this.endSkill(); });
    addEventListener('blur', () => this.lifecycleLoss());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.lifecycleLoss(); });
    const stick = touchRoot.querySelector('.touch-stick');
    stick.addEventListener('pointerdown', e => { e.preventDefault(); stick.setPointerCapture(e.pointerId); this.stick.start(e.pointerId, e.clientX, e.clientY); this.drawKnob(); });
    stick.addEventListener('pointermove', e => { this.stick.move(e.pointerId, e.clientX, e.clientY); this.drawKnob(); });
    stick.addEventListener('pointerup', e => { this.stick.end(e.pointerId); this.drawKnob(); });
    stick.addEventListener('pointercancel', e => { this.stick.end(e.pointerId); this.drawKnob(); });
    touchRoot.querySelectorAll('[data-control]').forEach(button => {
      button.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); button.setPointerCapture(e.pointerId); const action = button.dataset.control; this.buttons.add(action); button.classList.add('held'); if (action === 'skill') this.beginSkill(); });
      const release = e => { const action = button.dataset.control; this.buttons.delete(action); button.classList.remove('held'); if (action === 'skill') this.endSkill(); };
      button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release);
    });
  }
  lifecycleLoss(){clearInputState(this);for(const button of this.touchRoot.querySelectorAll('[data-control]'))button.classList.remove('held');this.drawKnob();this.onPause('lifecycle');}
  drawKnob() { const { x, y } = this.stick.sample(); this.knob.style.transform = `translate(${x * 42}px,${y * 42}px)`; }
  beginSkill() { if (!this.skillPress) { this.skillPress = performance.now(); this.skillFired = false; this.skillThreshold = this.form === 'bear' ? 1000 : 450; } }
  endSkill() { if (!this.skillPress) return; const held = performance.now() - this.skillPress; this.skillPress = null; if (this.skillFired) this.releaseRequested = true; else if (held < 250) this.tapRequested = true; }
  sample(player = null) {
    if(player?.form)this.form=player.form;
    const stick = this.stick.sample(); const pad = navigator.getGamepads?.().find(p => p?.connected); let gp = normalizeGamepad(pad);
    if(this.suppressUntilNeutral){const neutral=!gp.left&&!gp.right&&!gp.up&&!gp.down&&!gp.jump&&!gp.attack&&!gp.heavy&&!gp.dodge&&!gp.throw&&!gp.transform&&!gp.pause&&!gp.interact;if(neutral)this.suppressUntilNeutral=false;else gp={};}
    const keyboard=normalizeKeyboard({left:this.keys.has('left'),right:this.keys.has('right'),up:this.keys.has('up'),down:this.keys.has('down'),space:this.keys.has('jump')});
    const left = keyboard.left || stick.x < -.25 || gp.left;
    const right = keyboard.right || stick.x > .25 || gp.right;
    const up = keyboard.up || stick.y < -.45 || gp.up; const down = keyboard.down || stick.y > .45 || gp.down;
    const data = { left, right, up, down };
    for (const name of ['jump','attack','heavy','dodge','throw','interact','pause']) data[name] = (name==='jump'?keyboard.jump:this.keys.has(name)) || this.buttons.has(name) || !!gp[name];
    if (this.skillPress && !this.skillFired && performance.now() - this.skillPress >= this.skillThreshold) { data.transform = true; this.skillFired = true; }
    if (this.tapRequested) { data.skill = true; data.direction = keyboard.direction==='up'||up ? 'up' : keyboard.direction==='down'||down ? 'down' : right || left ? 'forward' : 'neutral'; this.tapRequested = false; }
    if (this.releaseRequested) { data.releaseTransform = true; this.releaseRequested = false; }
    if (gp.transform && !this.padSkillPress) { this.padSkillPress = performance.now(); this.padSkillFired = false; this.padSkillThreshold = this.form === 'bear' ? 1000 : 450; }
    if (gp.transform && this.padSkillPress && !this.padSkillFired && performance.now() - this.padSkillPress >= this.padSkillThreshold) { data.transform = true; this.padSkillFired = true; }
    if (!gp.transform && this.padSkillPress) { const held = performance.now() - this.padSkillPress; if (this.padSkillFired) data.releaseTransform = true; else if (held < 250) data.skill = true; this.padSkillPress = null; }
    return data;
  }
}
