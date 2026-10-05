class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (m && this.ctx && this.ctx.state === "running") {
      // Clean up or let current sounds finish
    }
  }

  isMuted(): boolean {
    return this.muted;
  }

  private createGainNode(duration: number, startVolume = 0.15): GainNode | null {
    if (!this.ctx) return null;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(startVolume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    gain.connect(this.ctx.destination);
    return gain;
  }

  playLetterSound(basePitch: number) {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    const duration = 0.5;
    const gain = this.createGainNode(duration, 0.2);
    if (!gain) return;

    // Sweet additive synthesis: Fundamental + Octave + Vibrato
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(basePitch, this.ctx.currentTime);
    // Add warm vibrato
    osc1.frequency.linearRampToValueAtTime(basePitch + 5, this.ctx.currentTime + 0.15);
    osc1.frequency.linearRampToValueAtTime(basePitch - 5, this.ctx.currentTime + 0.3);
    osc1.frequency.linearRampToValueAtTime(basePitch, this.ctx.currentTime + duration);

    osc2.type = "sine";
    // Octave above
    osc2.frequency.setValueAtTime(basePitch * 2, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(basePitch * 2 + 10, this.ctx.currentTime + 0.15);
    osc2.frequency.linearRampToValueAtTime(basePitch * 2 - 10, this.ctx.currentTime + 0.3);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

    osc1.connect(gain);
    osc2.connect(subGain);
    subGain.connect(this.ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(this.ctx.currentTime + duration);
    osc2.stop(this.ctx.currentTime + duration);
  }

  playBeeFlight() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    const duration = 0.7;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.25);
    gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    gain.connect(this.ctx.destination);

    // Bee Buzzing Hum: 120Hz square mixed with 60Hz LFO modulation
    const osc = this.ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(110, this.ctx.currentTime);
    // Flight pitch sweep
    osc.frequency.linearRampToValueAtTime(145, this.ctx.currentTime + 0.3);
    osc.frequency.linearRampToValueAtTime(115, this.ctx.currentTime + 0.5);
    osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + duration);

    // Filter to make it warm, thick and cute (cut high frequencies)
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // Vibrato parameter
    const vibrato = this.ctx.createOscillator();
    vibrato.type = "sine";
    vibrato.frequency.setValueAtTime(45, this.ctx.currentTime); // LFO at 45Hz
    const vibratoGain = this.ctx.createGain();
    vibratoGain.gain.setValueAtTime(15, this.ctx.currentTime);

    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    osc.connect(filter);
    filter.connect(gain);

    osc.start();
    vibrato.start();

    osc.stop(this.ctx.currentTime + duration);
    vibrato.stop(this.ctx.currentTime + duration);
  }

  playCorrectHit() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    // Double glittering chime (E5 then A5)
    const playNote = (pitch: number, startDelay: number, volume: number) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + startDelay;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      gain.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.42);
    };

    playNote(659.25, 0.0, 0.12); // E5
    playNote(880.00, 0.1, 0.14); // A5
  }

  playError() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    const duration = 0.3;
    const gain = this.createGainNode(duration, 0.18);
    if (!gain) return;

    // Bouncy soft low-frequency bend
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(75, this.ctx.currentTime + duration);

    osc.connect(gain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  playHintShowing() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    // High sparkling fairy chime
    const playNote = (pitch: number, startDelay: number) => {
      if (!this.ctx) return;
      const t = this.ctx.currentTime + startDelay;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      gain.connect(this.ctx.destination);

      const osc = this.ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.3);
    };

    playNote(987.77, 0.0);  // B5
    playNote(1174.66, 0.07); // D6
    playNote(1318.51, 0.14); // E6
  }

  playVictory() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    // Happy jewish or major arpeggio
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 784.00, 1046.50]; // C Major scale arpeggio
    notes.forEach((pitch, i) => {
      if (!this.ctx) return;
      const delay = i * 0.085;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
      gain.connect(this.ctx.destination);

      osc.type = "triangle";
      osc.frequency.setValueAtTime(pitch, t);
      // add dynamic swell
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }

  playLevelUnlock() {
    this.initCtx();
    if (this.muted || !this.ctx) return;

    // Triumphant ascending scale
    const notes = [349.23, 440.00, 523.25, 698.46, 880.00, 1046.50, 1396.91]; // F Major arpeggio
    notes.forEach((pitch, i) => {
      if (!this.ctx) return;
      const delay = i * 0.07;
      const t = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      gain.gain.setValueAtTime(0.1, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      gain.connect(this.ctx.destination);

      osc.type = "sine";
      osc.frequency.setValueAtTime(pitch, t);
      osc.connect(gain);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }
}

export const sound = new SoundEngine();
