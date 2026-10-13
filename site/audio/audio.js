export class ForestAudio {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.droneFilter = null;
    this.nodes = [];
    this.layers = {};
    this.moodKey = '';
    this.moodState = { combat: false, rage: 0, bear: false, boss: false, night: false };
    this.ambienceRunning = false;
    this.pulseRunning = false;
    this.stepBeat = 0;
    this.levels = { music: 0.6, sfx: 0.8 };
    this.enabled = true;
  }

  unlock() {
    if (this.ctx) {
      this.ctx.resume().then(() => {
        this.ambience();
        this.pulseLoop();
      });
      return;
    }
    const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.64;

    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.musicGain.gain.value = this.levels.music * 0.22;
    this.sfxGain.gain.value = this.levels.sfx;

    // Warm low-pass filter on the drone bus so bowed Nordic fifths sound dark and woody, never harsh
    this.droneFilter = this.ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 320;
    this.droneFilter.Q.value = 1.4;

    const comp = this.ctx.createDynamicsCompressor();
    this.droneFilter.connect(this.musicGain);
    this.musicGain.connect(comp);
    this.sfxGain.connect(comp);
    comp.connect(this.master);
    this.master.connect(this.ctx.destination);

    this.startLayers();
    this.ambience();
    this.pulseLoop();
  }

  startLayers() {
    // Dark D-minor / Phrygian tagelharpa & sub-horn drone layers routed through the warm lowpass filter
    const defs = {
      explore: [73.42, 'triangle'],   // D2 root drone
      fifth: [110.0, 'sine'],         // A2 open fifth resonance
      combat: [103.83, 'sawtooth'],   // G#2 tritone/tension layer
      rage: [146.83, 'triangle'],     // D3 upper tension harmonic
      bear: [36.71, 'sawtooth'],      // D1 colossal sub-bass titan growl
      night: [49.0, 'sine'],          // G1 deep night cavern hum
      boss: [55.0, 'sawtooth']        // A1 Old Thorngut lur-horn pedal
    };
    for (const [name, [frequency, type]] of Object.entries(defs)) {
      const oscillator = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;
      oscillator.connect(gain);
      gain.connect(this.droneFilter || this.musicGain);
      oscillator.start();
      this.layers[name] = { oscillator, gain };
    }
    this.setMood({});
  }

  setMood({ combat = false, rage = 0, bear = false, boss = false, night = false } = {}) {
    this.moodState = { combat: !!combat, rage: Number(rage) || 0, bear: !!bear, boss: !!boss, night: !!night };
    if (!this.ctx) return;
    const key = [combat, rage >= 50, rage >= 75, bear, boss, night].join(':');
    if (key === this.moodKey) return;
    this.moodKey = key;

    // Open filter cutoff during combat/bear/boss so the overtones swell organically
    if (this.droneFilter) {
      const targetCutoff = bear ? 620 : boss ? 520 : combat ? 420 : night ? 260 : 310;
      this.droneFilter.frequency.setTargetAtTime(targetCutoff, this.ctx.currentTime, 0.45);
    }

    const levels = {
      explore: 0.13,
      fifth: 0.07,
      combat: combat ? 0.11 : 0,
      rage: rage >= 75 ? 0.08 : rage >= 50 ? 0.04 : 0,
      bear: bear ? 0.22 : 0,
      boss: boss ? 0.14 : 0,
      night: night ? 0.055 : 0
    };
    for (const [name, layer] of Object.entries(this.layers)) {
      layer.gain.gain.setTargetAtTime((levels[name] || 0) * this.levels.music, this.ctx.currentTime, 0.35);
    }
  }

  setLevels(music, sfx) {
    this.levels = { music: Number(music), sfx: Number(sfx) };
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.levels.music * 0.22, this.ctx.currentTime, 0.15);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.levels.sfx, this.ctx.currentTime, 0.08);
    }
  }

  tone(freq, duration = 0.2, wave = 'sine', volume = 0.12, bus = 'sfx', endFreq = null, filterFreq = null) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(Math.max(16, freq), t);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(16, endFreq), t + duration);
    }
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    const dest = bus === 'music' ? (this.droneFilter || this.musicGain) : this.sfxGain;
    if (filterFreq && this.ctx.createBiquadFilter) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = 'lowpass';
      flt.frequency.setValueAtTime(filterFreq, t);
      osc.connect(flt);
      flt.connect(gain);
    } else {
      osc.connect(gain);
    }
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  noise(duration = 0.16, volume = 0.13, filterFreq = 900, filterType = 'lowpass') {
    if (!this.ctx || !this.enabled) return;
    const n = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < n; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.08 * white) / 1.08;
      data[i] = (white * 0.65 + last * 0.35) * (1 - i / n);
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    if (this.ctx.createBiquadFilter) {
      const flt = this.ctx.createBiquadFilter();
      flt.type = filterType;
      flt.frequency.value = filterFreq;
      source.connect(flt);
      flt.connect(gain);
    } else {
      source.connect(gain);
    }
    gain.connect(this.sfxGain);
    source.start();
  }

  ambience() {
    if (!this.ctx || this.ctx.state === 'suspended' || this.ambienceRunning) return;
    this.ambienceRunning = true;
    const { night, boss } = this.moodState;
    // Bowed tagelharpa fifth swell + soft forest wind whisper
    this.tone(night ? 55.0 : 73.42, 3.1, 'triangle', 0.075, 'music', null, 280);
    this.tone(night ? 82.41 : 110.0, 3.8, 'sine', 0.038, 'music', null, 240);
    if (night || boss) {
      this.noise(1.8, 0.025 * this.levels.music, 320, 'bandpass');
    }
    setTimeout(() => {
      this.ambienceRunning = false;
      if (this.ctx && this.ctx.state !== 'suspended') this.ambience();
    }, 3200);
  }

  // Rhythmic heartbeat (when Rage >= 50) & tribal Nordic war-drum cadence (during Bear / Boss / Combat)
  pulseLoop() {
    if (!this.ctx || this.ctx.state === 'suspended' || this.pulseRunning) return;
    this.pulseRunning = true;
    const { combat, rage, bear, boss } = this.moodState;
    this.stepBeat = (this.stepBeat + 1) % 4;

    if (bear || boss) {
      // Booming primal war-drum pattern
      const strong = this.stepBeat === 0 || (bear && this.stepBeat === 2);
      this.tone(strong ? 76 : 58, strong ? 0.28 : 0.18, 'triangle', (strong ? 0.16 : 0.09) * this.levels.music, 'sfx', 28, 190);
      if (strong) this.noise(0.11, 0.06 * this.levels.music, 380, 'lowpass');
    } else if (rage >= 50) {
      // Audible lub-dub Rage heartbeat that accelerates as Rage nears 100
      this.tone(62, 0.14, 'sine', 0.13 * this.levels.music, 'sfx', 32, 140);
      setTimeout(() => {
        if (this.ctx && this.ctx.state !== 'suspended') {
          this.tone(52, 0.16, 'sine', 0.095 * this.levels.music, 'sfx', 28, 120);
        }
      }, 145);
    } else if (combat && this.stepBeat % 2 === 0) {
      // Low frame-drum combat pulse
      this.tone(68, 0.18, 'triangle', 0.08 * this.levels.music, 'sfx', 34, 160);
    }

    const interval = bear ? 360 : boss ? 410 : rage >= 90 ? 480 : rage >= 50 ? 640 : 520;
    setTimeout(() => {
      this.pulseRunning = false;
      if (this.ctx && this.ctx.state !== 'suspended') this.pulseLoop();
    }, interval);
  }

  pause() {
    this.ctx?.suspend();
  }

  event(type) {
    if (type === 'attack') {
      this.noise(0.08, 0.11, 1100, 'bandpass');
      this.tone(185, 0.12, 'triangle', 0.17, 'sfx', 68, 520);
    } else if (type === 'heavyAttack') {
      this.noise(0.16, 0.18, 720, 'lowpass');
      this.tone(145, 0.24, 'sawtooth', 0.24, 'sfx', 42, 380);
    } else if (type === 'hit') {
      this.noise(0.12, 0.18, 650, 'lowpass');
      this.tone(96, 0.18, 'sine', 0.22, 'sfx', 40);
    } else if (type === 'armorClink') {
      // High-Q bark/iron deflection ring so light-attack bounce is immediately audible
      this.tone(690, 0.11, 'triangle', 0.16, 'sfx', 430);
      this.tone(1120, 0.07, 'sine', 0.10, 'sfx', 880);
    } else if (type === 'armorBreak') {
      // Heavy timber-shattering armor crack
      this.noise(0.24, 0.26, 950, 'lowpass');
      this.tone(280, 0.28, 'sawtooth', 0.26, 'sfx', 44, 460);
    } else if (type === 'parry') {
      this.tone(920, 0.26, 'sine', 0.19, 'sfx', 520);
      this.tone(1380, 0.18, 'triangle', 0.12, 'sfx', 960);
    } else if (type === 'perfectDodge') {
      this.noise(0.18, 0.14, 540, 'bandpass');
      this.tone(440, 0.22, 'sine', 0.14, 'sfx', 660);
    } else if (type === 'enemyTell') {
      // Readable sound telegraph per spec §12.4
      this.tone(138, 0.22, 'sawtooth', 0.13, 'sfx', 196, 360);
    } else if (type === 'bossTell') {
      // Old Thorngut guttural boar-roar windup telegraph
      this.tone(72, 0.48, 'sawtooth', 0.24, 'sfx', 118, 290);
      this.tone(48, 0.52, 'triangle', 0.20, 'sfx', 34, 180);
    } else if (type === 'bossStagger') {
      // Colossal stagger crash when Thorngut hits a felled log or gets pinned
      this.noise(0.42, 0.28, 480, 'lowpass');
      this.tone(64, 0.55, 'sawtooth', 0.30, 'sfx', 24, 210);
    } else if (type === 'bear') {
      this.tone(62, 0.92, 'sawtooth', 0.34, 'sfx', 28, 320);
      this.tone(93, 0.75, 'triangle', 0.22, 'sfx', 42, 280);
      this.noise(0.65, 0.30, 520, 'lowpass');
    } else if (type === 'skill' || type === 'roar' || type === 'pounce' || type === 'shockwave') {
      this.tone(255, 0.28, 'sawtooth', 0.20, 'sfx', 62, 440);
      this.noise(0.18, 0.16, 620, 'lowpass');
    } else if (type === 'moonrise') {
      this.tone(392, 1.5, 'sine', 0.11, 'sfx', 130);
      this.tone(65.4, 1.3, 'triangle', 0.13, 'sfx', 49, 240);
    } else if (type === 'treeFall') {
      this.tone(160, 0.75, 'sawtooth', 0.22, 'sfx', 34, 340);
      this.noise(0.72, 0.28, 480, 'lowpass');
    } else if (type === 'treeCreak') {
      this.tone(72, 0.45, 'triangle', 0.16, 'sfx', 126, 260);
    } else if (type === 'treeSnap') {
      this.tone(235, 0.13, 'square', 0.20, 'sfx', 60, 520);
      this.noise(0.12, 0.15, 1200, 'bandpass');
    } else if (type === 'pickup') {
      this.tone(330, 0.14, 'triangle', 0.13, 'sfx', 495, 680);
    } else if (type === 'checkpoint') {
      this.noise(0.25, 0.12, 650, 'bandpass');
      [220, 330, 440].forEach((f, i) => setTimeout(() => this.tone(f, 0.55, 'triangle', 0.09, 'sfx', null, 520), i * 55));
    } else if (type === 'sleep') {
      [146.8, 220, 293.7, 369.9].forEach((f, i) => setTimeout(() => this.tone(f, 0.95, 'sine', 0.08, 'sfx', null, 480), i * 80));
    } else if (type === 'hurt') {
      this.noise(0.14, 0.19, 580, 'lowpass');
      this.tone(82, 0.32, 'triangle', 0.20, 'sfx', 36, 240);
    } else if (type === 'exhausted') {
      // Heavy gasping drop when bear form breaks into 3s exhaustion
      this.noise(0.38, 0.16, 420, 'bandpass');
      this.tone(92, 0.48, 'sine', 0.18, 'sfx', 34, 180);
    } else if (type === 'complete') {
      [293.7, 369.9, 440, 587.3].forEach((f, i) => setTimeout(() => this.tone(f, 1.4, 'sine', 0.11, 'sfx', null, 640), i * 95));
    }
  }
}
