export class ForestAudio {
  constructor() { this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null; this.nodes = []; this.layers = {}; this.moodKey=''; this.ambienceRunning=false; this.levels = { music: .6, sfx: .8 }; this.enabled = true; }
  unlock() {
    if (this.ctx) { this.ctx.resume().then(()=>this.ambience()); return; }
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Ctx) return;
    this.ctx = new Ctx(); this.master = this.ctx.createGain(); this.master.gain.value = .62;
    this.musicGain = this.ctx.createGain(); this.sfxGain = this.ctx.createGain(); this.musicGain.gain.value = this.levels.music * .19; this.sfxGain.gain.value = this.levels.sfx;
    const comp = this.ctx.createDynamicsCompressor(); this.musicGain.connect(comp); this.sfxGain.connect(comp); comp.connect(this.master); this.master.connect(this.ctx.destination);
    this.startLayers(); this.ambience();
  }
  startLayers() { const defs={explore:[73.4,'triangle'],combat:[110,'sawtooth'],rage:[164.8,'sine'],bear:[55,'sawtooth'],night:[49,'triangle'],boss:[65.4,'square']};for(const [name,[frequency,type]] of Object.entries(defs)){const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.type=type;oscillator.frequency.value=frequency;gain.gain.value=.0001;oscillator.connect(gain);gain.connect(this.musicGain);oscillator.start();this.layers[name]={oscillator,gain};}this.setMood({}); }
  setMood({combat=false,rage=0,bear=false,boss=false,night=false}={}) { if(!this.ctx)return;const key=[combat,rage>=75,bear,boss,night].join(':');if(key===this.moodKey)return;this.moodKey=key;const levels={explore:.12,combat:combat ? .12 : 0,rage:rage>=75 ? .07 : 0,bear:bear ? .2 : 0,boss:boss ? .09 : 0,night:night ? .035 : 0};for(const[name,layer]of Object.entries(this.layers))layer.gain.gain.setTargetAtTime((levels[name]||0)*this.levels.music,this.ctx.currentTime,.38); }
  setLevels(music, sfx) { this.levels = { music: Number(music), sfx: Number(sfx) }; if (this.musicGain) this.musicGain.gain.setTargetAtTime(this.levels.music * .19, this.ctx.currentTime, .15); if (this.sfxGain) this.sfxGain.gain.setTargetAtTime(this.levels.sfx, this.ctx.currentTime, .08); }
  tone(freq, duration = .2, wave = 'sine', volume = .12, bus = 'sfx', endFreq = null) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = wave; osc.frequency.setValueAtTime(freq, t); if (endFreq) osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
    gain.gain.setValueAtTime(.0001, t); gain.gain.exponentialRampToValueAtTime(volume, t + .012); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain); gain.connect(bus === 'music' ? this.musicGain : this.sfxGain); osc.start(t); osc.stop(t + duration + .02);
  }
  noise(duration = .16, volume = .13) {
    if (!this.ctx || !this.enabled) return;
    const n = Math.floor(this.ctx.sampleRate * duration), buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const source = this.ctx.createBufferSource(), gain = this.ctx.createGain(); source.buffer = buffer; gain.gain.value = volume; source.connect(gain); gain.connect(this.sfxGain); source.start();
  }
  ambience() { if(!this.ctx||this.ctx.suspended||this.ambienceRunning)return;this.ambienceRunning=true;this.tone(55, 3, 'triangle', .08, 'music'); this.tone(82.4, 4, 'sine', .035, 'music'); setTimeout(() => { this.ambienceRunning=false;if (this.ctx && !this.ctx.suspended) this.ambience(); }, 3200); }
  pause() { this.ctx?.suspend(); }
  event(type) {
    if (type === 'attack') this.tone(180, .12, 'triangle', .18, 'sfx', 70);
    else if (type === 'hit') { this.noise(.12, .18); this.tone(92, .18, 'sine', .22); }
    else if (type === 'bear') { this.tone(58, .9, 'sawtooth', .33, 'sfx', 28); this.noise(.65, .32); }
    else if (type === 'skill') { this.tone(260, .28, 'sawtooth', .19, 'sfx', 65); }
    else if (type === 'moonrise') { this.tone(392, 1.5, 'sine', .11, 'sfx', 130); this.tone(65, 1.3, 'triangle', .12); }
    else if (type === 'treeFall') { this.tone(160, .75, 'sawtooth', .2, 'sfx', 35); this.noise(.7, .28); }
    else if (type === 'treeCreak') this.tone(70,.45,'triangle',.16,'sfx',125);
    else if (type === 'treeSnap') { this.tone(230,.12,'square',.2,'sfx',62);this.noise(.1,.12); }
    else if (type === 'parry') { this.tone(920, .26, 'sine', .18, 'sfx', 520); }
    else if (type === 'hurt') this.tone(78, .32, 'triangle', .18, 'sfx', 38);
    else if (type === 'complete') { [261,330,392,523].forEach((f,i) => setTimeout(() => this.tone(f,1.4,'sine',.1),i*90)); }
  }
}
