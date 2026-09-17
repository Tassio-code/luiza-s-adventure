/**
 * AudioManager — plays the Kenney .ogg sample pack when available and
 * falls back to fully synthesized Web Audio tones otherwise.
 */
type Ctor = typeof AudioContext;

const SFX_MIX_LEVEL = 0.32;
const MUSIC_MIX_LEVEL = 0.72;

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

const SAMPLES = {
  "shoot-a": publicAsset("sfx/shoot-a.ogg"),
  "shoot-c": publicAsset("sfx/shoot-c.ogg"),
  "shoot-e": publicAsset("sfx/shoot-e.ogg"),
  "shoot-g": publicAsset("sfx/shoot-g.ogg"),
  "hurt-a": publicAsset("sfx/hurt-a.ogg"),
  "hurt-c": publicAsset("sfx/hurt-c.ogg"),
  "explosion-a": publicAsset("sfx/explosion-a.ogg"),
  "explosion-c": publicAsset("sfx/explosion-c.ogg"),
  "coin-a": publicAsset("sfx/coin-a.ogg"),
  "select-a": publicAsset("sfx/select-a.ogg"),
  "lose-a": publicAsset("sfx/lose-a.ogg"),
  "error-a": publicAsset("sfx/error-a.ogg"),
  "jump-a": publicAsset("sfx/jump-a.ogg"),
  "move-a": publicAsset("sfx/move-a.ogg"),
} as const;

type SampleName = keyof typeof SAMPLES;

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private volume = 0.7;
  private muted = false;
  private currentTrack: string | null = null;
  private musicEl: HTMLAudioElement | null = null;
  private musicFadeTimer: number | null = null;
  private musicStartedAt: number | null = null;
  private musicDuration: number | null = null;
  private buffers = new Map<SampleName, AudioBuffer>();
  private loading: Promise<void> | null = null;

  private pendingGesture = false;

  /** True once the browser reports a user gesture (required for WebAudio). */
  private hasUserActivation() {
    if (typeof navigator === "undefined") return false;
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } })
      .userActivation;
    return ua ? ua.hasBeenActive : true;
  }

  private waitForGesture() {
    if (this.pendingGesture || typeof window === "undefined") return;
    this.pendingGesture = true;
    const onGesture = () => {
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      this.pendingGesture = false;
      this.resume();
    };
    window.addEventListener("pointerdown", onGesture, { once: true });
    window.addEventListener("keydown", onGesture, { once: true });
  }

  init() {
    if (this.ctx || typeof window === "undefined") return;
    if (!this.hasUserActivation()) {
      this.waitForGesture();
      return;
    }
    const Ctx: Ctor | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: Ctor }).webkitAudioContext;
    if (!Ctx) return;

    try {
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.volume * SFX_MIX_LEVEL;
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
    void this.loadSamples();
  }

  /** Decodes the sample pack once; failures silently keep the synth fallback. */
  loadSamples(): Promise<void> {
    this.init();
    if (this.loading) return this.loading;
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve();
    const names = Object.keys(SAMPLES) as SampleName[];
    this.loading = Promise.all(
      names.map(async (name) => {
        try {
          const res = await fetch(SAMPLES[name]);
          if (!res.ok) return;
          const buf = await ctx.decodeAudioData(await res.arrayBuffer());
          this.buffers.set(name, buf);
        } catch {
          /* keep synth fallback */
        }
      }),
    ).then(() => undefined);
    return this.loading;
  }

  private sample(name: SampleName, gain = 0.8, rate = 1): boolean {
    if (!this.ctx || !this.master) return false;
    const buffer = this.buffers.get(name);
    if (!buffer) return false;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    const g = this.ctx.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(this.master);
    src.start();
    return true;
  }

  setVolume(v: number) {
    this.volume = Math.min(1, Math.max(0, v));
    if (this.master) this.master.gain.value = this.muted ? 0 : this.volume * SFX_MIX_LEVEL;
    if (this.musicEl) {
      this.musicEl.volume = this.muted ? 0 : Math.min(1, this.volume * MUSIC_MIX_LEVEL);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume * SFX_MIX_LEVEL;
    if (this.musicEl) {
      this.musicEl.volume = m ? 0 : Math.min(1, this.volume * MUSIC_MIX_LEVEL);
    }
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
        if (this.sample("shoot-e", 0.75, 0.6)) {
          this.sample("explosion-a", 0.28, 1.5);
          return;
        }
        this.noise(0.24, 0.5, 900, 180);
        this.tone(120, 0.16, "square", 0.16, 50);
        break;
      case "rifle":
        if (this.sample("shoot-e", 0.5)) return;
        this.noise(0.1, 0.32, 1700, 500);
        this.tone(320, 0.07, "square", 0.1, 120);
        break;
      case "smg":
        if (this.sample("shoot-g", 0.4, 1.15)) return;
        this.noise(0.06, 0.22, 2100, 700);
        break;
      case "dual":
        if (this.sample("shoot-c", 0.5, 1.05)) return;
        this.noise(0.08, 0.26, 1500, 500);
        break;
      default:
        if (this.sample("shoot-a", 0.55)) return;
        this.noise(0.1, 0.3, 1300, 400);
        this.tone(420, 0.06, "square", 0.09, 160);
    }
  }

  empty() {
    if (this.sample("error-a", 0.5)) return;
    this.tone(1200, 0.05, "square", 0.05, 700);
  }

  hit() {
    if (this.sample("hurt-c", 0.28, 1.25)) return;
    this.noise(0.08, 0.24, 2400, 900);
  }

  enemyDeath() {
    if (this.sample("explosion-a", 0.45, 1.2)) return;
    this.tone(190, 0.28, "sawtooth", 0.16, 60);
    this.noise(0.2, 0.16, 700, 200);
  }

  playerHurt() {
    if (this.sample("hurt-a", 0.7)) return;
    this.tone(150, 0.3, "triangle", 0.24, 70);
    this.noise(0.16, 0.18, 500, 160);
  }

  pickup() {
    if (this.sample("coin-a", 0.6)) return;
    this.tone(660, 0.09, "triangle", 0.16);
    this.tone(990, 0.16, "triangle", 0.13);
  }

  heal() {
    if (this.sample("jump-a", 0.55)) return;
    this.tone(520, 0.14, "sine", 0.18);
    this.tone(780, 0.22, "sine", 0.14);
  }

  fragment() {
    this.sample("select-a", 0.7);
    [523, 659, 784, 1046].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.7, "sine", 0.18), i * 150);
    });
  }

  bossRoar() {
    if (this.sample("explosion-c", 0.8, 0.5)) return;
    this.tone(70, 1.2, "sawtooth", 0.3, 40);
    this.noise(1.0, 0.22, 320, 90);
  }

  death() {
    if (this.sample("lose-a", 0.7)) return;
    [330, 262, 196, 147].forEach((f, i) => {
      window.setTimeout(() => this.tone(f, 0.5, "triangle", 0.18), i * 180);
    });
  }

  firework() {
    if (this.sample("explosion-c", 0.55, 0.9)) return;
    this.noise(0.6, 0.3, 1200, 200);
    this.tone(90, 0.4, "sine", 0.2, 40);
  }

  ui() {
    if (this.sample("select-a", 0.35, 1.2)) return;
    this.tone(740, 0.05, "sine", 0.09);
  }

  /**
   * Plays exactly one main track at a time. When `opts.src` points to a real
   * file it is streamed and drives the timeline; otherwise a generative loop
   * plays and the timeline is simulated from `opts.duration`.
   */
  playMusic(
    track: "menu" | "map" | "level" | "boss" | "ending" | null,
    opts: {
      src?: string | null;
      duration?: number;
      id?: string;
      loop?: boolean;
      fadeMs?: number;
    } = {},
  ) {
    this.init();
    const key = `${track ?? "none"}:${opts.id ?? ""}`;
    if (this.currentTrack === key) return;
    const previous = this.musicEl;
    if (this.musicFadeTimer !== null) {
      window.clearInterval(this.musicFadeTimer);
      this.musicFadeTimer = null;
    }
    this.currentTrack = key;
    if (!track) {
      this.fadeElementOut(previous, opts.fadeMs ?? 900);
      this.musicEl = null;
      return;
    }

    this.musicStartedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.musicDuration = opts.duration ?? null;

    if (opts.src && typeof Audio !== "undefined") {
      try {
        const el = new Audio(opts.src);
        el.loop = opts.loop ?? false;
        const targetVolume = this.muted ? 0 : Math.min(1, this.volume * MUSIC_MIX_LEVEL);
        const fadeMs = opts.fadeMs ?? 900;
        el.volume = fadeMs > 0 ? 0 : targetVolume;
        this.musicEl = el;
        void el
          .play()
          .then(() => {
            this.fadeElementOut(previous, fadeMs);
            if (fadeMs <= 0 || targetVolume <= 0) {
              el.volume = targetVolume;
              return;
            }
            const startedAt = performance.now();
            this.musicFadeTimer = window.setInterval(() => {
              const progress = Math.min(1, (performance.now() - startedAt) / fadeMs);
              el.volume = targetVolume * progress;
              if (progress >= 1 && this.musicFadeTimer !== null) {
                window.clearInterval(this.musicFadeTimer);
                this.musicFadeTimer = null;
              }
            }, 40);
          })
          .catch(() => {
            // arquivo ausente ou bloqueado — sem música de sistema
            if (this.musicEl === el) this.musicEl = null;
            this.fadeElementOut(previous, fadeMs);
          });
        return;
      } catch {
        this.musicEl = null;
      }
    }
  }

  /** 0..1 position inside the current main track, or null when unknown. */
  musicProgress(): number | null {
    const el = this.musicEl;
    if (el && Number.isFinite(el.duration) && el.duration > 0) {
      return Math.max(0, Math.min(1, el.currentTime / el.duration));
    }
    if (this.musicStartedAt !== null && this.musicDuration) {
      const now = typeof performance !== "undefined" ? performance.now() : Date.now();
      return Math.max(0, Math.min(1, (now - this.musicStartedAt) / 1000 / this.musicDuration));
    }
    return null;
  }

  /** True when the current non-looping track reached its natural ending. */
  musicHasEnded(): boolean {
    const el = this.musicEl;
    if (el) return el.ended;
    return this.musicProgress() === 1;
  }

  private fadeElementOut(el: HTMLAudioElement | null, durationMs: number) {
    if (!el) return;
    if (durationMs <= 0 || el.volume <= 0) {
      el.pause();
      el.src = "";
      return;
    }
    const initialVolume = el.volume;
    const startedAt = performance.now();
    const timer = window.setInterval(() => {
      const progress = Math.min(1, (performance.now() - startedAt) / durationMs);
      el.volume = initialVolume * (1 - progress);
      if (progress >= 1) {
        window.clearInterval(timer);
        el.pause();
        el.src = "";
      }
    }, 40);
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      window.clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicFadeTimer !== null) {
      window.clearInterval(this.musicFadeTimer);
      this.musicFadeTimer = null;
    }
    if (this.musicEl) {
      try {
        this.musicEl.pause();
        this.musicEl.src = "";
      } catch {
        /* ignore */
      }
      this.musicEl = null;
    }
    this.musicStartedAt = null;
    this.musicDuration = null;
    this.currentTrack = null;
  }

  dispose() {
    this.stopMusic();
    if (this.ctx) void this.ctx.close().catch(() => {});
    this.ctx = null;
  }
}

export const audio = new AudioManager();
