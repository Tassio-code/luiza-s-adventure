import type { MusicPlan } from "./systems/director";

/**
 * Music registry. Each stage has one track and each boss has another.
 *
 * Real songs live in `public/music/` as lightweight .m4a files.
 * Bosses reuse the stage track so the music never breaks immersion.
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
    src: "/music/fase01.m4a",
    duration: 445,
    plan: {
      duration: 445,
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
    src: "/music/fase02.m4a",
    duration: 204,
    plan: {
      duration: 204,
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
    src: "/music/fase03.m4a",
    duration: 215,
    plan: {
      duration: 215,
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
    src: "/music/fase04.m4a",
    duration: 167,
    plan: {
      duration: 167,
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
    src: "/music/fase05.m4a",
    duration: 256,
    plan: {
      duration: 256,
      rampStart: 0.82,
      spawnStop: 0.94,
      baseAlive: 10,
      maxAlive: 30,
      maxBurst: 5,
      minInterval: 0.26,
    },
  },
];

export const BOSS_TRACKS: TrackConfig[] = STAGE_TRACKS.map((t) => ({
  id: `boss-${t.id.replace("stage-", "")}`,
  src: t.src,
  duration: t.duration,
  plan: {},
}));

export function stageTrack(levelIndex: number): TrackConfig {
  return STAGE_TRACKS[Math.max(0, Math.min(STAGE_TRACKS.length - 1, levelIndex))]!;
}

export function bossTrack(levelIndex: number): TrackConfig {
  return BOSS_TRACKS[Math.max(0, Math.min(BOSS_TRACKS.length - 1, levelIndex))]!;
}
