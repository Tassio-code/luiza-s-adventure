import { describe, expect, it } from "vitest";
import { MusicDirector, makePlan } from "./director";
import { STAGE_TRACKS, bossTrack, stageTrack } from "../music";

const run = (d: MusicDirector, seconds: number, step = 1 / 60) => {
  for (let t = 0; t < seconds; t += step) d.update(step);
};

describe("MusicDirector", () => {
  it("normalises careless plan data", () => {
    const plan = makePlan({ duration: 1, rampStart: 0.99, spawnStop: 0.2 });
    expect(plan.duration).toBeGreaterThanOrEqual(20);
    expect(plan.spawnStop).toBeGreaterThan(plan.rampStart);
  });

  it("walks warmup -> rise -> climax -> rampdown -> stopped", () => {
    const d = new MusicDirector({ duration: 100 });
    const phases: string[] = [];
    for (let i = 0; i <= 100; i++) {
      d.update(1);
      if (phases[phases.length - 1] !== d.phase) phases.push(d.phase);
    }
    expect(phases).toEqual(["warmup", "rise", "climax", "rampdown", "stopped"]);
  });

  it("stops spawning before the song ends", () => {
    const d = new MusicDirector({ duration: 100, spawnStop: 0.9 });
    run(d, 85);
    expect(d.spawnsOpen).toBe(true);
    run(d, 8);
    expect(d.spawnsOpen).toBe(false);
    expect(d.burst).toBe(0);
    expect(d.tryBurst(0)).toBe(0);
  });

  it("intensity peaks near the climax and collapses at the end", () => {
    const d = new MusicDirector({ duration: 100 });
    d.update(0, 0.05);
    const early = d.intensity;
    d.update(0, 0.7);
    const peak = d.intensity;
    d.update(0, 0.98);
    expect(early).toBeLessThan(peak);
    expect(d.intensity).toBe(0);
  });

  it("respects the alive cap and never exceeds it", () => {
    const d = new MusicDirector({ duration: 120, maxAlive: 20 });
    d.update(0, 0.6);
    const cap = d.aliveCap;
    expect(d.tryBurst(cap)).toBe(0);
    expect(d.tryBurst(cap + 5)).toBe(0);
  });

  it("scales the cap down on weaker devices", () => {
    const strong = new MusicDirector({ duration: 120 }, 1);
    const weak = new MusicDirector({ duration: 120 }, 0.6);
    strong.update(0, 0.7);
    weak.update(0, 0.7);
    expect(weak.aliveCap).toBeLessThan(strong.aliveCap);
  });

  it("hard stop is irreversible", () => {
    const d = new MusicDirector({ duration: 120 });
    d.update(0, 0.3);
    d.stopSpawning();
    d.update(0, 0.4);
    expect(d.spawnsOpen).toBe(false);
  });

  it("bursts are throttled by the spawn interval", () => {
    const d = new MusicDirector({ duration: 120 });
    run(d, 40);
    let bursts = 0;
    for (let i = 0; i < 60; i++) {
      d.update(1 / 60, 0.6);
      if (d.tryBurst(0) > 0) bursts++;
    }
    expect(bursts).toBeGreaterThan(0);
    expect(bursts).toBeLessThan(10);
  });
});

describe("music registry", () => {
  it("has one stage track per level with a valid plan", () => {
    expect(STAGE_TRACKS).toHaveLength(5);
    for (let i = 0; i < 5; i++) {
      const plan = makePlan(stageTrack(i).plan);
      expect(plan.spawnStop).toBeLessThan(1);
      expect(bossTrack(i).id).not.toBe(stageTrack(i).id);
    }
  });
});
