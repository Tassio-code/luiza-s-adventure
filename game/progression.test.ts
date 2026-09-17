import { describe, expect, it } from "vitest";
import { MAX_LEVEL, addXp, createProgress, statsFor, xpForLevel } from "./progression";

describe("progression", () => {
  it("starts at level 1 with no xp", () => {
    const p = createProgress();
    expect(p.level).toBe(1);
    expect(p.xp).toBe(0);
    expect(p.next).toBe(xpForLevel(1));
  });

  it("does not mutate the input progress", () => {
    const p = createProgress();
    addXp(p, 999);
    expect(p.level).toBe(1);
    expect(p.xp).toBe(0);
  });

  it("levels up once when the threshold is reached", () => {
    const { progress, levelsGained } = addXp(createProgress(), xpForLevel(1));
    expect(levelsGained).toBe(1);
    expect(progress.level).toBe(2);
    expect(progress.xp).toBe(0);
  });

  it("rolls over multiple levels from a single large gain", () => {
    const { progress, levelsGained } = addXp(createProgress(), 5000);
    expect(levelsGained).toBeGreaterThan(3);
    expect(progress.level).toBeLessThanOrEqual(MAX_LEVEL);
  });

  it("clamps at the max level", () => {
    const { progress } = addXp(createProgress(), 10_000_000);
    expect(progress.level).toBe(MAX_LEVEL);
    expect(progress.xp).toBeLessThanOrEqual(xpForLevel(MAX_LEVEL));
  });

  it("ignores negative xp", () => {
    const { progress, levelsGained } = addXp(createProgress(), -50);
    expect(levelsGained).toBe(0);
    expect(progress.xp).toBe(0);
  });

  it("xp cost grows with the level", () => {
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(1));
    expect(xpForLevel(20)).toBeGreaterThan(xpForLevel(10));
  });

  it("stats grow monotonically and stay bounded", () => {
    const a = statsFor(1);
    const b = statsFor(10);
    const c = statsFor(MAX_LEVEL);
    expect(a.damageMul).toBe(1);
    expect(b.damageMul).toBeGreaterThan(a.damageMul);
    expect(c.damageMul).toBeGreaterThan(b.damageMul);
    expect(c.damageMul).toBeLessThanOrEqual(3);
    expect(c.speedMul).toBeLessThanOrEqual(1.4);
    expect(c.maxHp).toBeGreaterThan(a.maxHp);
    expect(statsFor(999).maxHp).toBe(c.maxHp);
  });
});
