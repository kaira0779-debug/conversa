// Web Audio API Procedural Synthesizer for Dark Cinematic & Meditation Soundscapes

class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentPreset: string = '';
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private currentVolume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(val: number) {
    this.currentVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this.currentVolume;
  }

  public stop() {
    if (!this.ctx) return;
    this.isPlaying = false;
    this.currentPreset = '';

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.05);
    }

    setTimeout(() => {
      this.activeNodes.forEach(item => {
        if (typeof item === 'number') {
          clearInterval(item);
        } else if ('stop' in item && typeof (item as AudioScheduledSourceNode).stop === 'function') {
          try {
            (item as AudioScheduledSourceNode).stop();
          } catch {
            // Already stopped
          }
        }
      });
      this.activeNodes = [];
    }, 100);
  }

  public playPreset(preset: 'rain' | 'fire' | 'drone' | 'wind' | 'chimes') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.currentPreset = preset;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.gain.setTargetAtTime(this.currentVolume, this.ctx.currentTime, 0.3);
    this.masterGain.connect(this.ctx.destination);

    switch (preset) {
      case 'rain':
        this.startRainSynth();
        break;
      case 'fire':
        this.startFireSynth();
        break;
      case 'drone':
        this.startDroneSynth();
        break;
      case 'wind':
        this.startWindSynth();
        break;
      case 'chimes':
        this.startChimesSynth();
        break;
      default:
        this.startDroneSynth();
    }
  }

  private createPinkNoiseBuffer(): AudioBuffer {
    if (!this.ctx) throw new Error('No audio context');
    const bufferSize = this.ctx.sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  private startRainSynth() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1000;

    const rainGain = this.ctx.createGain();
    rainGain.gain.value = 0.7;

    noise.connect(filter);
    filter.connect(rainGain);
    rainGain.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter, rainGain);

    // Random raindrops
    const interval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const dropGain = this.ctx.createGain();
      const freq = 1200 + Math.random() * 1800;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.08);

      dropGain.gain.setValueAtTime(0.08 * Math.random(), this.ctx.currentTime);
      dropGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.08);

      osc.connect(dropGain);
      dropGain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.08);
    }, 180);
    this.activeNodes.push(interval);
  }

  private startFireSynth() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 1.2;

    const fireGain = this.ctx.createGain();
    fireGain.gain.value = 0.6;

    noise.connect(filter);
    filter.connect(fireGain);
    fireGain.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter, fireGain);

    // Wood crackles
    const interval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      if (Math.random() > 0.4) {
        const crackle = this.ctx.createOscillator();
        const cGain = this.ctx.createGain();
        crackle.type = 'triangle';
        crackle.frequency.setValueAtTime(150 + Math.random() * 900, this.ctx.currentTime);
        cGain.gain.setValueAtTime(0.12 * Math.random(), this.ctx.currentTime);
        cGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
        crackle.connect(cGain);
        cGain.connect(this.masterGain);
        crackle.start();
        crackle.stop(this.ctx.currentTime + 0.04);
      }
    }, 120);
    this.activeNodes.push(interval);
  }

  private startDroneSynth() {
    if (!this.ctx || !this.masterGain) return;
    // Harmonic binaural meditative drone in D minor / A (deep 110Hz, 165Hz, 220Hz, 330Hz)
    const freqs = [110, 164.8, 220, 277.18, 329.6];
    freqs.forEach((f, i) => {
      if (!this.ctx || !this.masterGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(f + (Math.random() * 0.4 - 0.2), this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15 / (i + 1), this.ctx.currentTime);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      this.activeNodes.push(osc, gain);
    });
  }

  private startWindSynth() {
    if (!this.ctx || !this.masterGain) return;
    const noise = this.ctx.createBufferSource();
    noise.buffer = this.createPinkNoiseBuffer();
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);
    filter.Q.value = 2.5;

    // Slow LFO for sweeping wind howling
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime);
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    noise.connect(filter);
    filter.connect(this.masterGain);
    noise.start();
    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }

  private startChimesSynth() {
    if (!this.ctx || !this.masterGain) return;
    this.startDroneSynth(); // Underlying quiet drone

    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5]; // C E G B C E
    const interval = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx || !this.masterGain) return;
      if (Math.random() > 0.3) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const note = notes[Math.floor(Math.random() * notes.length)];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.5);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 3.6);
      }
    }, 1400);
    this.activeNodes.push(interval);
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public getCurrentPreset(): string {
    return this.currentPreset;
  }
}

export const audioEngine = new AmbientAudioEngine();
