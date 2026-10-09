const clamp = (n, low, high) => Math.max(low, Math.min(high, n));

export class TouchStick {
  constructor({ deadZone = .18, radius = 70 } = {}) {
    this.deadZone = deadZone; this.radius = radius; this.pointer = null; this.origin = null; this.point = null;
  }
  start(pointerId, x, y) { if (this.pointer !== null) return false; this.pointer = pointerId; this.origin = { x, y }; this.point = { x, y }; return true; }
  move(pointerId, x, y) { if (pointerId !== this.pointer) return false; this.point = { x, y }; return true; }
  end(pointerId) { if (pointerId !== this.pointer) return false; this.pointer = null; this.origin = this.point = null; return true; }
  sample() {
    if (!this.point) return { x: 0, y: 0 };
    let x = (this.point.x - this.origin.x) / this.radius, y = (this.point.y - this.origin.y) / this.radius;
    const mag = Math.min(1, Math.hypot(x, y)); if (mag < this.deadZone) return { x: 0, y: 0 };
    const scale = (mag - this.deadZone) / ((1 - this.deadZone) * Math.max(mag, 1e-6));
    x = clamp(x * scale, -1, 1); y = clamp(y * scale, -1, 1); return { x, y };
  }
}

export function normalizeGamepad(pad) {
  if (!pad) return {};
  const b = (i) => !!pad.buttons?.[i]?.pressed || (pad.buttons?.[i]?.value ?? 0) > .55;
  const x = pad.axes?.[0] ?? 0, y = pad.axes?.[1] ?? 0;
  return { left: x < -.3 || b(14), right: x > .3 || b(15), up: y < -.45 || b(12), down: y > .45 || b(13), jump: b(0), attack: b(2), heavy: b(3), dodge: b(1), throw: b(5), honey: b(4), transform: b(7), pause: b(9), interact: b(8) };
}

export function normalizeKeyboard(keys={}){const up=!!keys.up;return{...keys,up,jump:!!keys.space||up,direction:up?'up':keys.down?'down':keys.left||keys.right?'forward':'neutral'};}

export function clearInputState(state){state.keys?.clear();state.buttons?.clear();if(state.stick){state.stick.pointer=null;state.stick.origin=null;state.stick.point=null;}state.skillPress=null;state.skillFired=false;state.padSkillPress=null;state.padSkillFired=false;state.tapRequested=false;state.releaseRequested=false;state.suppressUntilNeutral=true;}
