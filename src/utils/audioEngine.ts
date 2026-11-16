import { VINYL_PLAYLIST, VinylMusicStyle, VinylTrack } from '../data/cafeConfig';

class WillowVinylAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private crackleSource: AudioBufferSourceNode | null = null;
  private crackleGain: GainNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private chordTimer: number | null = null;
  private grooveTimers: number[] = [];
  private currentTrack: VinylTrack = VINYL_PLAYLIST[0];
  private style: VinylMusicStyle = 'warm-jazz';
  private rpmMultiplier = 1; // 1 = 33.3 RPM, 1.16 = 45 RPM
  private spinPitchMultiplier = 1; // Temporary platter spin bend
  private step = 0;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.7;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public playNeedleDropSound() {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(98, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + 0.14);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playManualSpinCue(velocity = 1) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const clampedVel = Math.min(2.5, Math.max(0.4, Math.abs(velocity)));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 * clampedVel, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.08);
    filter.type = 'bandpass';
    filter.frequency.value = 640;

    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private startCrackle(level = 0.06) {
    if (!this.ctx || !this.masterGain) return;
    this.stopCrackle();
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const dustPop = Math.random() < 0.00065 ? (Math.random() * 2 - 1) * 0.42 : 0;
      const surfaceHiss = (Math.random() * 2 - 1) * 0.016;
      channel[i] = dustPop + surfaceHiss;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1950;
    bandpass.Q.value = 1.1;

    const gain = this.ctx.createGain();
    gain.gain.value = level;

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.crackleSource = source;
    this.crackleGain = gain;
  }

  private stopCrackle() {
    if (this.crackleSource) {
      try {
        this.crackleSource.stop();
        this.crackleSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.crackleSource = null;
    }
  }

  private startRainWash() {
    if (!this.ctx || !this.masterGain || this.rainSource) return;
    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = this.ctx.createBuffer(1, length, sampleRate);
    const channel = buffer.getChannelData(0);

    // Pink-ish rain noise smoothing
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      const droplet = Math.random() < 0.0004 ? (Math.random() * 2 - 1) * 0.18 : 0;
      channel[i] = (b0 + b1 + b2) * 0.28 + droplet;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 1350;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.11, this.ctx.currentTime + 0.8);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.rainSource = source;
    this.rainGain = gain;
  }

  private stopRainWash() {
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.rainSource = null;
      this.rainGain = null;
    }
  }

  private clearGrooveTimers() {
    this.grooveTimers.forEach((id) => window.clearTimeout(id));
    this.grooveTimers = [];
  }

  private playSoftPercussion(kind: 'kick' | 'snare' | 'brush') {
    if (!this.ctx || !this.masterGain || !this.isPlaying) return;
    const now = this.ctx.currentTime;

    if (kind === 'kick') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(105, now);
      osc.frequency.exponentialRampToValueAtTime(42, now + 0.14);
      gain.gain.setValueAtTime(0.095, now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.18);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.2);
      return;
    }

    // Filtered white-noise burst for snare / brush
    const sampleRate = this.ctx.sampleRate;
    const len = Math.floor(sampleRate * (kind === 'brush' ? 0.08 : 0.11));
    const buf = this.ctx.createBuffer(1, len, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = buf;

    const filter = this.ctx.createBiquadFilter();
    filter.type = kind === 'brush' ? 'highpass' : 'bandpass';
    filter.frequency.value = kind === 'brush' ? 3200 : 1450;

    const gain = this.ctx.createGain();
    const peak = kind === 'brush' ? 0.016 : 0.032;
    gain.gain.setValueAtTime(peak, now);
    gain.gain.exponentialRampToValueAtTime(0.0005, now + (kind === 'brush' ? 0.075 : 0.1));

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(now);
  }

  private playWarmJazzChord(frequencies: number[]) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pitchScale = this.rpmMultiplier * this.spinPitchMultiplier;

    frequencies.forEach((baseFreq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const freq = baseFreq * pitchScale;
      const stagger = idx * 0.045;

      const osc = this.ctx.createOscillator();
      const subOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'triangle';
      subOsc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + stagger);
      subOsc.frequency.setValueAtTime(freq * 2, now + stagger);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 6, now + stagger);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(920, now + stagger);
      filter.frequency.exponentialRampToValueAtTime(420, now + stagger + 3.2);

      const peakGain = idx === 0 ? 0.055 : 0.032;
      env.gain.setValueAtTime(0.0001, now + stagger);
      env.gain.linearRampToValueAtTime(peakGain, now + stagger + 0.25);
      env.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 3.8);

      const overtoneGain = this.ctx.createGain();
      overtoneGain.gain.value = 0.14;

      osc.connect(filter);
      subOsc.connect(overtoneGain);
      overtoneGain.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);

      osc.start(now + stagger);
      subOsc.start(now + stagger);
      osc.stop(now + stagger + 4.0);
      subOsc.stop(now + stagger + 4.0);
    });
  }

  private playLofiTapeChord(frequencies: number[], barMs: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pitchScale = this.rpmMultiplier * this.spinPitchMultiplier;

    frequencies.forEach((baseFreq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const freq = baseFreq * pitchScale;
      const stagger = idx * 0.025;

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + stagger);
      // Intentional warm cassette wow & flutter
      osc.detune.setValueAtTime((Math.random() - 0.5) * 18, now + stagger);
      osc.detune.linearRampToValueAtTime((Math.random() - 0.5) * 22, now + stagger + 1.8);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(580, now + stagger);
      filter.frequency.exponentialRampToValueAtTime(280, now + stagger + 2.8);

      const peakGain = idx === 0 ? 0.062 : 0.018;
      env.gain.setValueAtTime(0.0001, now + stagger);
      env.gain.linearRampToValueAtTime(peakGain, now + stagger + 0.09);
      env.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 3.1);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);

      osc.start(now + stagger);
      osc.stop(now + stagger + 3.3);
    });

    // Subtle dusty boom-bap pocket across the bar
    this.playSoftPercussion('kick');
    this.grooveTimers.push(window.setTimeout(() => this.playSoftPercussion('snare'), barMs * 0.25));
    this.grooveTimers.push(window.setTimeout(() => this.playSoftPercussion('kick'), barMs * 0.52));
    this.grooveTimers.push(window.setTimeout(() => this.playSoftPercussion('snare'), barMs * 0.75));
  }

  private playBossaPlucks(frequencies: number[], barMs: number) {
    if (!this.ctx || !this.masterGain) return;
    const pitchScale = this.rpmMultiplier * this.spinPitchMultiplier;
    // Syncopated Bossa clave beat fractions within bar
    const claveOffsets = [0, 0.18, 0.36, 0.58, 0.78];

    claveOffsets.forEach((fraction, stepIdx) => {
      const timerId = window.setTimeout(() => {
        if (!this.ctx || !this.masterGain || !this.isPlaying) return;
        const now = this.ctx.currentTime;
        const voices =
          stepIdx === 0 || stepIdx === 3 ? frequencies : frequencies.slice(1, 4);

        voices.forEach((baseFreq, vIdx) => {
          if (!this.ctx || !this.masterGain) return;
          const osc = this.ctx.createOscillator();
          const filter = this.ctx.createBiquadFilter();
          const env = this.ctx.createGain();

          osc.type = 'triangle';
          // Alternate bass root & fifth on clave steps 0 vs 3
          const bassAdjust = vIdx === 0 && stepIdx === 3 ? 1.5 : 1;
          osc.frequency.setValueAtTime(baseFreq * pitchScale * bassAdjust, now);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(1450, now);
          filter.frequency.exponentialRampToValueAtTime(420, now + 0.55);

          const peak = vIdx === 0 ? 0.055 : 0.028;
          env.gain.setValueAtTime(0.0001, now);
          env.gain.linearRampToValueAtTime(peak, now + 0.015);
          env.gain.exponentialRampToValueAtTime(0.0001, now + 0.68);

          osc.connect(filter);
          filter.connect(env);
          env.connect(this.masterGain);
          osc.start(now);
          osc.stop(now + 0.72);
        });

        if (stepIdx % 2 === 1) {
          this.playSoftPercussion('brush');
        }
      }, barMs * fraction);

      this.grooveTimers.push(timerId);
    });
  }

  private playFeltPianoChord(frequencies: number[]) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pitchScale = this.rpmMultiplier * this.spinPitchMultiplier;

    frequencies.forEach((baseFreq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const freq = baseFreq * pitchScale;
      const stagger = idx * 0.085; // Expressive human rubato arpeggio

      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + stagger);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(680, now + stagger);
      filter.frequency.exponentialRampToValueAtTime(240, now + stagger + 3.6);

      const peakGain = idx === 0 ? 0.068 : 0.036;
      env.gain.setValueAtTime(0.0001, now + stagger);
      env.gain.linearRampToValueAtTime(peakGain, now + stagger + 0.035);
      env.gain.exponentialRampToValueAtTime(0.0001, now + stagger + 4.3);

      osc.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);
      osc.start(now + stagger);
      osc.stop(now + stagger + 4.5);
    });
  }

  private playRainyAmbientPad(frequencies: number[]) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const pitchScale = this.rpmMultiplier * this.spinPitchMultiplier;

    frequencies.forEach((baseFreq, idx) => {
      if (!this.ctx || !this.masterGain) return;
      const freq = baseFreq * pitchScale;

      const oscA = this.ctx.createOscillator();
      const oscB = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const env = this.ctx.createGain();

      oscA.type = 'sine';
      oscB.type = 'triangle';
      oscA.frequency.setValueAtTime(freq, now);
      oscB.frequency.setValueAtTime(freq * 1.003, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);
      filter.frequency.linearRampToValueAtTime(840, now + 2.2);
      filter.frequency.linearRampToValueAtTime(380, now + 4.6);

      const peakGain = idx === 0 ? 0.045 : 0.024;
      env.gain.setValueAtTime(0.0001, now);
      env.gain.linearRampToValueAtTime(peakGain, now + 1.05);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 4.9);

      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(env);
      env.connect(this.masterGain);

      oscA.start(now);
      oscB.start(now);
      oscA.stop(now + 5.1);
      oscB.stop(now + 5.1);
    });
  }

  private scheduleProgression() {
    if (!this.isPlaying) return;
    this.clearGrooveTimers();

    const chords = this.currentTrack.chords;
    const chord = chords[this.step % chords.length];
    this.step += 1;

    const baseInterval = Math.max(1800, this.currentTrack.tempoMs / this.rpmMultiplier);
    const interval =
      this.style === 'rainy-ambient'
        ? baseInterval * 1.18
        : this.style === 'bossa-courtyard'
        ? baseInterval * 0.88
        : baseInterval;

    switch (this.style) {
      case 'lofi-tape':
        this.playLofiTapeChord(chord, interval);
        break;
      case 'bossa-courtyard':
        this.playBossaPlucks(chord, interval);
        break;
      case 'felt-piano':
        this.playFeltPianoChord(chord);
        break;
      case 'rainy-ambient':
        this.playRainyAmbientPad(chord);
        break;
      case 'warm-jazz':
      default:
        this.playWarmJazzChord(chord);
        break;
    }

    this.chordTimer = window.setTimeout(() => this.scheduleProgression(), interval);
  }

  public start(track?: VinylTrack, crackle = 0.06, style?: VinylMusicStyle) {
    this.ensureContext();
    if (track) {
      this.currentTrack = track;
    }
    if (style) {
      this.style = style;
    }
    if (this.isPlaying) {
      return;
    }
    this.isPlaying = true;
    this.playNeedleDropSound();
    this.startCrackle(crackle);
    if (this.style === 'rainy-ambient') {
      this.startRainWash();
    }
    this.scheduleProgression();
  }

  public stop() {
    this.isPlaying = false;
    if (this.chordTimer !== null) {
      window.clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }
    this.clearGrooveTimers();
    this.stopCrackle();
    this.stopRainWash();
  }

  public toggle(track?: VinylTrack, crackle = 0.06, style?: VinylMusicStyle): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    this.start(track, crackle, style);
    return true;
  }

  public setTrack(track: VinylTrack) {
    this.currentTrack = track;
    this.step = 0;
    if (this.isPlaying) {
      if (this.chordTimer !== null) {
        window.clearTimeout(this.chordTimer);
      }
      this.clearGrooveTimers();
      this.playNeedleDropSound();
      this.scheduleProgression();
    }
  }

  public setStyle(nextStyle: VinylMusicStyle) {
    if (this.style === nextStyle) return;
    this.style = nextStyle;

    if (this.isPlaying) {
      if (nextStyle === 'rainy-ambient') {
        this.startRainWash();
      } else {
        this.stopRainWash();
      }
      if (this.chordTimer !== null) {
        window.clearTimeout(this.chordTimer);
      }
      this.clearGrooveTimers();
      this.scheduleProgression();
    }
  }

  public setSpinPitchOffset(offset: number) {
    // Subtle temporary pitch bend when manually spinning/nudging the record
    const clamped = Math.max(-0.18, Math.min(0.24, offset));
    this.spinPitchMultiplier = 1 + clamped;
  }

  public setRpm(rpm: 33 | 45) {
    this.rpmMultiplier = rpm === 45 ? 1.16 : 1.0;
  }

  public setCrackleLevel(level: number) {
    if (this.crackleGain && this.ctx) {
      this.crackleGain.gain.setTargetAtTime(level, this.ctx.currentTime, 0.1);
    }
  }

  public setVolume(vol: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
    }
  }
}

export const vinylAudio = new WillowVinylAudioEngine();
