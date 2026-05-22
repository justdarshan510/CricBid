class SoundEffectsManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Browser AudioContext initialization is deferred to user interaction
  }

  private initCtx() {
    if (this.ctx) return;
    if (typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public playBidSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // High-pitched synth pluck/chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.08); // Jump to C6

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  public playGavelSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Double gavel knock sound: woodblock thud
      const playThud = (delay: number) => {
        if (!this.ctx) return;
        const time = this.ctx.currentTime + delay;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, time);
        osc.frequency.linearRampToValueAtTime(70, time + 0.06);

        gain.gain.setValueAtTime(0.4, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

        osc.start(time);
        osc.stop(time + 0.08);
      };

      playThud(0);
      playThud(0.14); // Double knock
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  public playSoldSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Triumph sound: G-major triad arpeggio chime
      const playTone = (freq: number, startDelay: number, duration: number) => {
        if (!this.ctx) return;
        const time = this.ctx.currentTime + startDelay;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.15, time + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration);
      };

      playTone(392.00, 0.0, 0.35); // G4
      playTone(493.88, 0.08, 0.35); // B4
      playTone(587.33, 0.16, 0.45); // D5
      playTone(783.99, 0.24, 0.65); // G5
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  public playBuzzerSound() {
    if (!this.soundEnabled) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Low synth warning buzz
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }
}

export const soundEffects = new SoundEffectsManager();
export default soundEffects;
