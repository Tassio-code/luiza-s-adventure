import type { MusicPlan } from "./systems/director";

/**
 * Music registry. Each stage has one track and each boss has another.
 *
 * `src` is intentionally nullable: while the real songs are not delivered yet,
 * the generative fallback plays and the timeline is simulated with `duration`.
 * To plug a real song, drop the file in `public/music/` and set `src` — nothing
 * else in the game needs to change.
 */
export type TrackConfig = {
  id: string;
  /** public URL of the audio file, or null to use the generative fallback */
  src: string | null;
  /** length in seconds (used when there is no file to read the duration from) */
  duration: number;
  /** per-track combat pacing; spawn ramp-down window is configured here */
  plan: Partial<MusicPlan>;
};

export const STAGE_TRACKS: TrackConfig[] = [
  {
    id: "stage-floresta",
    src: null,
    duration: 135,
    plan: {
      duration: 135,
      rampStart: 0.74,
      spawnStop: 0.9,
      baseAlive: 7,
      maxAlive: 20,
      maxBurst: 3,
      minInterval: 0.4,
    },
  },
  {
    id: "stage-cidade",
    src: null,
    duration: 145,
    plan: {
      duration: 145,
      rampStart: 0.76,
      spawnStop: 0.91,
      baseAlive: 8,
      maxAlive: 23,
      maxBurst: 4,
      minInterval: 0.34,
    },
  },
  {
    id: "stage-neve",
    src: null,
    duration: 155,
    plan: {
      duration: 155,
      rampStart: 0.78,
      spawnStop: 0.92,
      baseAlive: 8,
      maxAlive: 25,
      maxBurst: 4,
      minInterval: 0.32,
    },
  },
  {
    id: "stage-deserto",
    src: null,
    duration: 160,
    plan: {
      duration: 160,
      rampStart: 0.8,
      spawnStop: 0.93,
      baseAlive: 9,
      maxAlive: 27,
      maxBurst: 5,
      minInterval: 0.3,
    },
  },
  {
    id: "stage-castelo",
    src: null,
    duration: 175,
    plan: {
      duration: 175,
      rampStart: 0.82,
      spawnStop: 0.94,
      baseAlive: 10,
      maxAlive: 30,
      maxBurst: 5,
      minInterval: 0.26,
    },
  },
];

export const BOSS_TRACKS: TrackConfig[] = STAGE_TRACKS.map((t, i) => ({
  id: `boss-${t.id.replace("stage-", "")}`,
  src: null,
  duration: 120 + i * 8,
  plan: {},
}));

export function stageTrack(levelIndex: number): TrackConfig {
  return STAGE_TRACKS[Math.max(0, Math.min(STAGE_TRACKS.length - 1, levelIndex))]!;
}

export function bossTrack(levelIndex: number): TrackConfig {
  return BOSS_TRACKS[Math.max(0, Math.min(BOSS_TRACKS.length - 1, levelIndex))]!;
}
