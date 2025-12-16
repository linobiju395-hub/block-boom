class AudioService {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private masterGain: GainNode | null = null;

  constructor() {
    this.muted = localStorage.getItem('blockBlastMuted') === 'true';
  }

  private getContext(): AudioContext | null {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
      }
    }
    
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('blockBlastMuted', String(this.muted));
    return this.muted;
  }
  
  isMuted() { return this.muted; }

  private createOscillator(type: OscillatorType, freq: number, startTime: number, duration: number, vol: number) {
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playPickup() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    // High-pitched "blip"
    this.createOscillator('sine', 800, ctx.currentTime, 0.1, 0.1);
  }

  playPlace() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    // Low "thud"
    this.createOscillator('triangle', 150, ctx.currentTime, 0.15, 0.2);
  }

  playClear(streak: number) {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    // C Major 7 chord tones (C4, E4, G4, B4)
    const baseFreqs = [261.63, 329.63, 392.00, 493.88];
    // Pitch shift based on streak
    const pitchMultiplier = 1 + (Math.min(streak, 10) * 0.1); 
    
    // Play arpeggiated chord
    baseFreqs.forEach((f, i) => {
      // Stagger notes slightly for a "shimmer" effect
      const timeOffset = i * 0.04;
      this.createOscillator('sine', f * pitchMultiplier, ctx.currentTime + timeOffset, 0.4, 0.15);
      // Add a higher harmonic for sparkle
      this.createOscillator('sine', f * 2 * pitchMultiplier, ctx.currentTime + timeOffset, 0.3, 0.05);
    });
  }

  playGameOver() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx || !this.masterGain) return;

    const t = ctx.currentTime;
    // Descending tones
    this.createOscillator('sawtooth', 400, t, 0.3, 0.1);
    this.createOscillator('sawtooth', 300, t + 0.2, 0.3, 0.1);
    this.createOscillator('sawtooth', 200, t + 0.4, 0.6, 0.1);
  }

  playUi() {
    if (this.muted) return;
    const ctx = this.getContext();
    if (!ctx) return;
    // Gentle click
    this.createOscillator('sine', 600, ctx.currentTime, 0.05, 0.05);
  }
}

export const audioService = new AudioService();
