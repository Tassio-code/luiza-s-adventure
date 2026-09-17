/**
 * MusicDirector — pure, deterministic combat director driven by the music
 * timeline. It owns the answer to three questions asked every frame:
 *
 *  - how intense should the fight be right now?
 *  - may the arena spawn new enemies?
 *  - how many enemies may live at once?
 *
 * The whole point is that difficulty follows the *song*, not a fixed timer,
 * and that spawning shuts down progressively BEFORE the track ends so the
 * arena is clean when the boss walks in.
 *
 * No audio/DOM dependency on purpose — it is unit-testable in isolation.
 */

export type MusicPlan = {
  /** length of the stage track, in seconds */
  duration: number;
  /** progress (0..1) where the spawn ramp-down starts */
  rampStart: number;
  /** progress (0..1) where spawning stops completely */
  spawnStop: number;
  /** seconds between spawn bursts at minimum intensity */
  baseInterval: number;
  /** seconds between spawn bursts at full intensity */
  minInterval: number;
  /** simultaneous enemies at minimum intensity */
  baseAlive: number;
  /** simultaneous enemies at full intensity */
  maxAlive: number;
  /** enemies per burst at full intensity */
  maxBurst: number;
};

export type DirectorPhase = "warmup" | "rise" | "climax" | "rampdown" | "stopped";

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const DEFAULT_PLAN: MusicPlan = {
  duration: 150,
  rampStart: 0.78,
  spawnStop: 0.92,
  baseInterval: 1.1,
  minInterval: 0.28,
  baseAlive: 8,
  maxAlive: 26,
  maxBurst: 4,
};

export function makePlan(partial: Partial<MusicPlan> = {}): MusicPlan {
  const plan = { ...DEFAULT_PLAN, ...partial };
  // guarantee a sane ordering even if content data is edited carelessly
  plan.rampStart = clamp(plan.rampStart, 0.2, 0.95);
  plan.spawnStop = clamp(plan.spawnStop, plan.rampStart + 0.01, 0.99);
  plan.duration = Math.max(20, plan.duration);
  return plan;
}

export class MusicDirector {
  readonly plan: MusicPlan;
  /** 0..1 position inside the stage track */
  progress = 0;
  elapsed = 0;
  /** scales the alive cap for weaker devices (mobile) */
  performanceScale = 1;

  private cooldown = 0;
  private hardStopped = false;

  constructor(plan: Partial<MusicPlan> = {}, performanceScale = 1) {
    this.plan = makePlan(plan);
    this.performanceScale = clamp(performanceScale, 0.4, 1.4);
    this.cooldown = 0.6;
  }

  /** Advance the timeline. `progressOverride` lets real audio drive it. */
  update(dt: number, progressOverride?: number) {
    this.elapsed += Math.max(0, dt);
    this.progress =
      typeof progressOverride === "number" && Number.isFinite(progressOverride)
        ? clamp(progressOverride, 0, 1)
        : clamp(this.elapsed / this.plan.duration, 0, 1);
    this.cooldown -= Math.max(0, dt);
  }

  /** Once stopped by the caller (e.g. quota reached) it never reopens. */
  stopSpawning() {
    this.hardStopped = true;
  }

  get phase(): DirectorPhase {
    const p = this.progress;
    if (this.hardStopped || p >= this.plan.spawnStop) return "stopped";
    if (p >= this.plan.rampStart) return "rampdown";
    if (p >= 0.5) return "climax";
    if (p >= 0.16) return "rise";
    return "warmup";
  }

  /** 0..1 combat pressure. Rises with the song, collapses at the end. */
  get intensity(): number {
    const p = this.progress;
    const { rampStart, spawnStop } = this.plan;
    if (p < 0.16) return lerp(0.15, 0.45, p / 0.16);
    if (p < 0.5) return lerp(0.45, 0.8, (p - 0.16) / (0.5 - 0.16));
    if (p < rampStart) return lerp(0.8, 1, (p - 0.5) / (rampStart - 0.5));
    if (p < spawnStop) return lerp(1, 0.15, (p - rampStart) / (spawnStop - rampStart));
    return 0;
  }

  get spawnsOpen(): boolean {
    return this.phase !== "stopped";
  }

  get spawnInterval(): number {
    const i = this.intensity;
    const base = lerp(this.plan.baseInterval, this.plan.minInterval, i);
    // during ramp-down spawns get noticeably rarer, not just weaker
    return this.phase === "rampdown" ? base * 2.2 : base;
  }

  get aliveCap(): number {
    const cap = lerp(this.plan.baseAlive, this.plan.maxAlive, this.intensity);
    return Math.max(3, Math.round(cap * this.performanceScale));
  }

  get burst(): number {
    if (!this.spawnsOpen) return 0;
    const n = Math.round(lerp(1, this.plan.maxBurst, this.intensity));
    return this.phase === "rampdown" ? 1 : Math.max(1, n);
  }

  /** True when a burst may fire right now; consumes the internal cooldown. */
  tryBurst(aliveNow: number): number {
    if (!this.spawnsOpen) return 0;
    if (this.cooldown > 0) return 0;
    const room = this.aliveCap - aliveNow;
    if (room <= 0) return 0;
    this.cooldown = this.spawnInterval;
    return Math.min(room, this.burst);
  }

  /** Seconds left before the track ends. */
  get remaining(): number {
    return Math.max(0, this.plan.duration * (1 - this.progress));
  }

  get finished(): boolean {
    return this.progress >= 1;
  }
}
