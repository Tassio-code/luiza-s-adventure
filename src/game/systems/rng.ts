/** Deterministic RNG (mulberry32) so a level always generates the same layout. */
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof createRng>;

export function rand(rng: Rng, min: number, max: number) {
  return min + rng() * (max - min);
}

export function randInt(rng: Rng, min: number, max: number) {
  return Math.floor(rand(rng, min, max + 1));
}

export function pickOne<T>(rng: Rng, list: T[]): T {
  return list[Math.min(list.length - 1, Math.floor(rng() * list.length))];
}
