/**
 * AudioManager — every sound is synthesized with the Web Audio API,
 * so there are no external assets to load or fail.
 */
type Ctor = typeof AudioContext;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private volume = 0.7;
  private muted = false;
  private currentTrack: string | null = null;

  init() {
    if (this.ctx || typeof window === "undefined") return;
    const Ctx: Ctor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) return;
    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.28;
      this.musicGain.connect(this.master);
    } catch {
      this.ctx = null;
    }
  }

  resume() {
    this.init();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume;
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }

  private tone(
    freq: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    sweepTo?: number,
    dest?: AudioNode,
  ) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (sweepTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, sweepTo), t + duration);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0008, t + duration);
    osc.connect(g);
    g.connect(dest ?? this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  private noise(duration: number, gain: number, filterFreq: number, sweepTo?: number) {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime;
    const frames = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, Math.max(1, frames), this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFreq, t);
    if (sweepTo) filter.frequency.exponentialRampToValueAtTime(Math.max(60, sweepTo), t + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0008, t + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(t);
  }

  shoot(weapon: string) {
    switch (weapon) {
      case "shotgun":
        this.noise(0.24, 0.5, 900, 180);
        this.tone(120, 0.16, "square", 0.16, 50);
        break;
      case "rifle":
        this.noise(0.1, 0.32, 1700, 500);
        this.tone(320, 0.07, "square", 0.1, 120);
        break;
      case "smg":
        this.noise(0.06, 0.22, 2100, 700);
        break;
      case "dual":
        this.noise(0.08, 0.26, 1500, 500);
        break;
      default:
        this.noise(0.1, 0.3, 1300, 400);
        this.tone(420, 0.06, "square", 0.09, 160);
    }
  }

  empty() {
    this.tone(1200, 0.05, "square", 0.05, 700);
  }

  hit() {
    this.noise(0.08, 0.24, 2400, 900);
  }

  enemyDeath() {
    this.tone(190, 0.28, "sawtooth", 0.16, 60);
    this.noise(0.2, 0.16, 700, 200);
  }

  playerHurt() {
    this.tone(150, 0.3, "triangle", 0.24, 70);
    this.noise(0.16, 0.18, 500, 160);
  }

  pickup() {
    this.tone(660, 0.09, "triangle", 0.16);
    this.tone(990, 0.16, "triangle", 0.13);
  }

  heal() {
    this.tone(520, 0.14, "sine", 0.18);
    this.tone(780, 0.22, "sine", 0.14);
  }

  fragment() {
    [523, 659, 784, 1046].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.7, "sine", 0.18), i * 150);
    });
  }

  bossRoar() {
    this.tone(70, 1.2, "sawtooth", 0.3, 40);
    this.noise(1.0, 0.22, 320, 90);
  }

  death() {
    [330, 262, 196, 147].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.5, "triangle", 0.18), i * 180);
    });
  }

  firework() {
    this.noise(0.6, 0.3, 1200, 200);
    this.tone(90, 0.4, "sine", 0.2, 40);
  }

  ui() {
    this.tone(740, 0.05, "sine", 0.09);
  }

  /** Simple generative loop per scene. */
  playMusic(track: "menu" | "map" | "level" | "boss" | "ending" | null) {
    this.init();
    if (this.currentTrack === track) return;
    this.stopMusic();
    this.currentTrack = track;
    if (!track || !this.ctx || !this.musicGain) return;

    const scales: Record<string, number[]> = {
      menu: [220, 261.6, 329.6, 392, 440, 392, 329.6, 261.6],
      map: [196, 246.9, 293.7, 349.2, 392, 349.2, 293.7, 246.9],
      level: [174.6, 174.6, 207.7, 233.1, 174.6, 155.6, 207.7, 233.1],
      boss: [146.8, 155.6, 146.8, 138.6, 116.5, 138.6, 146.8, 155.6],
      ending: [261.6, 329.6, 392, 523.3, 659.3, 523.3, 392, 329.6],
    };
    const scale = scales[track] ?? scales['menu'] ?? [220];
    const interval = track === "boss" ? 260 : track === "ending" ? 520 : 400;
    this.musicStep = 0;
    const tick = () => {
      if (!this.ctx || !this.musicGain) return;
      const note = scale[this.musicStep % scale.length];
      const type: OscillatorType = track === "boss" ? "sawtooth" : "triangle";
      this.tone(note, interval / 1000 + 0.4, type, 0.12, undefined, this.musicGain);
      if (this.musicStep % 4 === 0) {
        this.tone(note / 2, 0.9, "sine", 0.14, undefined, this.musicGain);
      }
      this.musicStep++;
    };
    tick();
    this.musicTimer = window.setInterval(tick, interval);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    this.currentTrack = null;
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
  }
}

export const audio = new AudioManager();
