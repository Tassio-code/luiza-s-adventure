import { createRng, rand, randInt, type Rng } from "./rng";

export const TILE = 56;

export type Room = { x: number; y: number; w: number; h: number; cx: number; cy: number };

export type Decoration = {
  x: number;
  y: number;
  kind: "tree" | "bush" | "rock" | "car" | "lamp" | "sign" | "cactus" | "pillar" | "torch" | "crystal" | "grave" | "puddle";
  scale: number;
  rot: number;
};

export type LevelMap = {
  cols: number;
  rows: number;
  /** 1 = wall, 0 = floor */
  tiles: Uint8Array;
  rooms: Room[];
  decorations: Decoration[];
  width: number;
  height: number;
  playerStart: { x: number; y: number };
};

function carveRect(map: Uint8Array, cols: number, r: Room) {
  for (let y = r.y; y < r.y + r.h; y++) {
    for (let x = r.x; x < r.x + r.w; x++) {
      map[y * cols + x] = 0;
    }
  }
}

function carveCorridor(map: Uint8Array, cols: number, a: Room, b: Room, rng: Rng) {
  const thickness = randInt(rng, 2, 3);
  const horizontalFirst = rng() > 0.5;
  const stepX = (x0: number, x1: number, y: number) => {
    const from = Math.min(x0, x1);
    const to = Math.max(x0, x1);
    for (let x = from; x <= to; x++) {
      for (let t = 0; t < thickness; t++) map[(y + t) * cols + x] = 0;
    }
  };
  const stepY = (y0: number, y1: number, x: number) => {
    const from = Math.min(y0, y1);
    const to = Math.max(y0, y1);
    for (let y = from; y <= to; y++) {
      for (let t = 0; t < thickness; t++) map[y * cols + (x + t)] = 0;
    }
  };
  if (horizontalFirst) {
    stepX(a.cx, b.cx, a.cy);
    stepY(a.cy, b.cy, b.cx);
  } else {
    stepY(a.cy, b.cy, a.cx);
    stepX(a.cx, b.cx, b.cy);
  }
}

const DECOR_BY_LEVEL: Record<number, Decoration["kind"][]> = {
  0: ["tree", "bush", "rock", "puddle"],
  1: ["car", "lamp", "sign", "rock"],
  2: ["tree", "crystal", "rock", "crystal"],
  3: ["cactus", "pillar", "rock", "grave"],
  4: ["pillar", "torch", "grave", "rock"],
};

export function generateLevel(levelIndex: number): LevelMap {
  const rng = createRng(1337 + levelIndex * 977);
  const cols = 44 + levelIndex * 3;
  const rows = 34 + levelIndex * 2;
  const tiles = new Uint8Array(cols * rows).fill(1);

  const rooms: Room[] = [];
  const attempts = 220;
  const target = 9 + levelIndex;
  for (let i = 0; i < attempts && rooms.length < target; i++) {
    const w = randInt(rng, 6, 12);
    const h = randInt(rng, 5, 10);
    const x = randInt(rng, 2, cols - w - 3);
    const y = randInt(rng, 2, rows - h - 3);
    const room: Room = { x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) };
    const overlaps = rooms.some(
      (r) => x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y,
    );
    if (overlaps) continue;
    rooms.push(room);
  }

  rooms.sort((a, b) => a.cx + a.cy - (b.cx + b.cy));
  rooms.forEach((r) => carveRect(tiles, cols, r));
  for (let i = 1; i < rooms.length; i++) carveCorridor(tiles, cols, rooms[i - 1], rooms[i], rng);
  // a couple of loops so the map is not a pure chain
  if (rooms.length > 4) {
    carveCorridor(tiles, cols, rooms[0], rooms[Math.floor(rooms.length / 2)], rng);
    carveCorridor(tiles, cols, rooms[1], rooms[rooms.length - 1], rng);
  }

  // solid border
  for (let x = 0; x < cols; x++) {
    tiles[x] = 1;
    tiles[(rows - 1) * cols + x] = 1;
  }
  for (let y = 0; y < rows; y++) {
    tiles[y * cols] = 1;
    tiles[y * cols + cols - 1] = 1;
  }

  // decorations on floor tiles, never blocking
  const kinds = DECOR_BY_LEVEL[levelIndex] ?? DECOR_BY_LEVEL[0];
  const decorations: Decoration[] = [];
  for (let i = 0; i < 190; i++) {
    const tx = randInt(rng, 1, cols - 2);
    const ty = randInt(rng, 1, rows - 2);
    if (tiles[ty * cols + tx] !== 0) continue;
    decorations.push({
      x: (tx + rand(rng, 0.15, 0.85)) * TILE,
      y: (ty + rand(rng, 0.15, 0.85)) * TILE,
      kind: kinds[randInt(rng, 0, kinds.length - 1)],
      scale: rand(rng, 0.75, 1.35),
      rot: rand(rng, -0.3, 0.3),
    });
  }

  const first = rooms[0];
  return {
    cols,
    rows,
    tiles,
    rooms,
    decorations,
    width: cols * TILE,
    height: rows * TILE,
    playerStart: { x: (first.cx + 0.5) * TILE, y: (first.cy + 0.5) * TILE },
  };
}

export function isWallAt(map: LevelMap, x: number, y: number): boolean {
  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);
  if (tx < 0 || ty < 0 || tx >= map.cols || ty >= map.rows) return true;
  return map.tiles[ty * map.cols + tx] === 1;
}

/** Circle vs tilemap resolution, axis separated so sliding along walls feels good. */
export function moveCircle(
  map: LevelMap,
  x: number,
  y: number,
  dx: number,
  dy: number,
  radius: number,
): { x: number; y: number; hitX: boolean; hitY: boolean } {
  let nx = x;
  let ny = y;
  let hitX = false;
  let hitY = false;
  const probe = (px: number, py: number) => {
    for (let a = 0; a < 8; a++) {
      const ang = (a / 8) * Math.PI * 2;
      if (isWallAt(map, px + Math.cos(ang) * radius, py + Math.sin(ang) * radius)) return true;
    }
    return isWallAt(map, px, py);
  };
  if (dx !== 0) {
    if (!probe(nx + dx, ny)) nx += dx;
    else hitX = true;
  }
  if (dy !== 0) {
    if (!probe(nx, ny + dy)) ny += dy;
    else hitY = true;
  }
  return { x: nx, y: ny, hitX, hitY };
}

export function hasLineOfSight(map: LevelMap, x0: number, y0: number, x1: number, y1: number) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.ceil(dist / (TILE * 0.4));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (isWallAt(map, x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)) return false;
  }
  return true;
}
