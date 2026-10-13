// SoundEngine.js - High-performance Web Audio API procedural sound engine
// Zero external assets required, 100% reliable, zero loading latency, 3D spatial ready

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.isMuted = false;
    this.masterVolume = 0.8;
    this.musicPlaying = false;
    this.musicInterval = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.85;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.35;
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn('Web Audio not supported:', e);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMasterVolume(val) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    }
    return this.isMuted;
  }

  // ---- PROCEDURAL SFX ----

  // Gunshots
  playGunshot(weaponType = 'rifle') {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    if (weaponType === 'shotgun') {
      // Deep heavy blast
      this.createNoiseBurst(0.28, 120, 0.9);
      this.createSineSweep(180, 40, 0.22, 0.7);
    } else if (weaponType === 'smg') {
      // Rapid snappy shot
      this.createNoiseBurst(0.12, 450, 0.6);
      this.createSineSweep(320, 80, 0.1, 0.4);
    } else if (weaponType === 'sniper') {
      // Thunderous crack with long tail
      this.createNoiseBurst(0.4, 250, 1.0);
      this.createSineSweep(240, 30, 0.35, 0.9);
      this.createSineSweep(800, 150, 0.15, 0.5);
    } else if (weaponType === 'rocket') {
      // Roaring rocket launch whoosh
      this.createNoiseBurst(0.6, 200, 1.0);
      this.createSineSweep(140, 50, 0.5, 0.8);
      this.createSineSweep(450, 120, 0.4, 0.6);
    } else {
      // Standard Assault Rifle (Thresher)
      this.createNoiseBurst(0.18, 300, 0.75);
      this.createSineSweep(260, 60, 0.15, 0.5);
    }
  }

  // CNG Dual-Tone Horn ("পিপ পিপ")
  playCNGHorn() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    [0, 0.14].forEach(offset => {
      [390, 470].forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + offset);
        gain.gain.setValueAtTime(0.35, t + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.11);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(t + offset);
        osc.stop(t + offset + 0.11);
      });
    });
  }

  // Driveable CNG 2-Stroke Engine Oscillator
  startCNGEngine() {
    this.ensureContext();
    if (!this.ctx || this.cngOsc) return;
    try {
      this.cngOsc = this.ctx.createOscillator();
      this.cngGain = this.ctx.createGain();
      this.cngFilter = this.ctx.createBiquadFilter();

      this.cngOsc.type = 'sawtooth';
      this.cngOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

      this.cngFilter.type = 'lowpass';
      this.cngFilter.frequency.setValueAtTime(160, this.ctx.currentTime);

      this.cngGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

      this.cngOsc.connect(this.cngFilter);
      this.cngFilter.connect(this.cngGain);
      this.cngGain.connect(this.sfxGain);
      this.cngOsc.start();
    } catch (e) {
      console.warn('CNG engine audio error', e);
    }
  }

  updateCNGEnginePitch(speed) {
    if (!this.ctx || !this.cngOsc) return;
    const baseFreq = 45 + Math.min(110, speed * 4.5);
    this.cngOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.05);
    if (this.cngFilter) {
      this.cngFilter.frequency.setTargetAtTime(160 + speed * 12, this.ctx.currentTime, 0.05);
    }
  }

  stopCNGEngine() {
    if (this.cngOsc) {
      try {
        if (this.cngGain) {
          this.cngGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
        }
        setTimeout(() => {
          if (this.cngOsc) {
            this.cngOsc.stop();
            this.cngOsc.disconnect();
            this.cngOsc = null;
            this.cngGain = null;
          }
        }, 220);
      } catch {
        this.cngOsc = null;
      }
    }
  }

  // Roadkill / Vehicle crash thud
  playCarImpact() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createNoiseBurst(0.35, 140, 0.95);
    this.createSineSweep(160, 30, 0.3, 0.85);
  }

  // Thunderclap & Rolling Bass Thunder
  playThunder() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    // Initial crack
    this.createNoiseBurst(0.5, 300, 0.85);
    // Deep rumbling tail
    const bufferSize = this.ctx.sampleRate * 2.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, t);
    filter.frequency.exponentialRampToValueAtTime(40, t + 2.2);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start();
    noise.stop(t + 2.2);
  }

  // Boss Ground Slam Earthquake
  playBossSlam() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createNoiseBurst(0.45, 100, 0.9);
    this.createSineSweep(120, 25, 0.5, 1.0);
  }

  // Killstreak Fanfare
  playKillstreak(combo = 2) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const baseFreqs = [261.6, 329.6, 392.0, 523.2, 659.2];
    baseFreqs.slice(0, Math.min(5, combo + 1)).forEach((freq, i) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
      }, i * 65);
    });
  }

  createNoiseBurst(duration, filterCutoff, gainMultiplier) {
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterCutoff * 3, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(filterCutoff, this.ctx.currentTime + duration);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(gainMultiplier, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }

  createSineSweep(startFreq, endFreq, duration, gainMultiplier) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(10, endFreq), this.ctx.currentTime + duration);

    gain.gain.setValueAtTime(gainMultiplier, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Hitmarker sound (satisfying subtle click or ding)
  playHitmarker(isHeadshot = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const freq = isHeadshot ? 1760 : 920; // High ping for headshot
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.2, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(isHeadshot ? 0.35 : 0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  // Reload sound (clicks, slides, mag lock)
  playReload() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    // Mag detach click
    this.createSineSweep(500, 150, 0.08, 0.3);
    // Slide rack at 0.4s
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.createSineSweep(800, 200, 0.1, 0.4);
    }, 450);
  }

  // Empty magazine click
  playEmptyClick() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createSineSweep(900, 400, 0.04, 0.25);
  }

  // Grenade pin pull & explosion
  playGrenadeThrow() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createSineSweep(600, 1200, 0.12, 0.3);
  }

  playExplosion() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    // Sub-bass thump
    this.createSineSweep(140, 25, 0.8, 1.0);
    // Huge fiery blast noise
    this.createNoiseBurst(0.9, 180, 1.0);
  }

  // Zombie groan / death scream
  playZombieSound(type = 'groan') {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (type === 'hit') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(60, this.ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
    } else if (type === 'death') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    } else {
      // Groan
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(95, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(110, this.ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(75, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + (type === 'death' ? 0.35 : 0.4));
  }

  // Player hurt / heart beat
  playPlayerHurt() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createSineSweep(180, 50, 0.25, 0.6);
  }

  // Coin / Taka pickup
  playCoinPickup() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987, this.ctx.currentTime); // B5
    osc.frequency.setValueAtTime(1318, this.ctx.currentTime + 0.08); // E6
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  // Wave start fanfare
  playWaveStart() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const notes = [220, 277, 330, 440];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      }, idx * 120);
    });
  }

  // Dhaka rickshaw bell ("Tring Tring!")
  playRickshawBell() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const playChime = (delay) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(2489, this.ctx.currentTime); // High metal bell
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
      }, delay);
    };
    playChime(0);
    playChime(90);
  }

  // Footstep on asphalt
  playFootstep() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createNoiseBurst(0.04, 180, 0.12);
  }

  // Melee Attack (Kick / Knife whoosh & hit)
  playMelee(didHit = false) {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createSineSweep(400, 100, 0.12, 0.4);
    if (didHit) {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        this.createNoiseBurst(0.15, 140, 0.7);
        this.createSineSweep(180, 40, 0.18, 0.8);
      }, 50);
    }
  }

  // Low HP Heartbeat
  playHeartbeat() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createSineSweep(70, 30, 0.18, 0.6);
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return;
      this.createSineSweep(65, 25, 0.22, 0.45);
    }, 120);
  }

  // Sniper ADS Breath In
  playSniperBreath() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createNoiseBurst(0.3, 350, 0.15);
  }

  // Electric / Chain Shock Zap
  playElectricZap() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.12);
  }

  // Boss Roar
  playBossRoar() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    this.createNoiseBurst(0.8, 120, 0.8);
    this.createSineSweep(130, 30, 0.9, 0.9);
  }

  // Perk Selected Fanfare
  playPerkSelect() {
    this.ensureContext();
    if (!this.ctx || this.isMuted) return;
    const notes = [330, 440, 554, 659];
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
      }, idx * 80);
    });
  }

  // Dynamic Ambient Combat Music Synth Loop
  startMusic() {
    this.ensureContext();
    if (this.musicPlaying || !this.ctx) return;
    this.musicPlaying = true;

    let step = 0;
    const bassline = [55, 55, 65, 55, 49, 49, 73, 65]; // Heavy pulsating synth bass in A-minor

    this.musicInterval = setInterval(() => {
      if (!this.musicPlaying || this.isMuted || !this.ctx) return;

      const freq = bassline[step % bassline.length];
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280 + (step % 4) * 80, this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);

      step++;
    }, 320);
  }

  stopMusic() {
    this.musicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
