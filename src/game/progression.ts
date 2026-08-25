/**
 * Player progression — XP, levels and derived combat stats.
 * Pure functions so the balance can be unit-tested without the engine.
 */

export const MAX_LEVEL = 20;

export type Progress = {
  level: number;
  xp: number;
  /** xp required to reach the next level */
  next: number;
};

export function xpForLevel(level: number): number {
  const l = Math.max(1, Math.floor(level));
  return Math.round(55 + (l - 1) * 42 + Math.pow(l - 1, 1.6) * 6);
}

export function createProgress(): Progress {
  return { level: 1, xp: 0, next: xpForLevel(1) };
}

/** Adds XP, rolling over as many levels as needed. Never mutates the input. */
export function addXp(progress: Progress, amount: number): { progress: Progress; levelsGained: number } {
  const gain = Math.max(0, Math.round(amount));
  let { level, xp } = progress;
  xp += gain;
  let levelsGained = 0;
  while (level < MAX_LEVEL && xp >= xpForLevel(level)) {
    xp -= xpForLevel(level);
    level++;
    levelsGained++;
  }
  if (level >= MAX_LEVEL) {
    level = MAX_LEVEL;
    xp = Math.min(xp, xpForLevel(MAX_LEVEL));
  }
  return { progress: { level, xp, next: xpForLevel(level) }, levelsGained };
}

export type CombatStats = {
  damageMul: number;
  fireRateMul: number;
  speedMul: number;
  ammoMul: number;
  maxHp: number;
};

/** Stats grow smoothly and stay bounded so the game never trivialises. */
export function statsFor(level: number): CombatStats {
  const l = Math.max(1, Math.min(MAX_LEVEL, Math.floor(level)));
  const t = (l - 1) / (MAX_LEVEL - 1);
  return {
    damageMul: 1 + t * 1.6,
    fireRateMul: 1 + t * 0.45,
    speedMul: 1 + t * 0.28,
    ammoMul: 1 + t * 0.8,
    maxHp: Math.round(100 + t * 90),
  };
}
