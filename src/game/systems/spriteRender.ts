import { assets, SHEETS, type SheetKey } from "../assets";

type Ctx = CanvasRenderingContext2D;

/** Draws one packed-tilemap cell into a destination rect (pixel-art, no smoothing). */
export function drawSheetTile(
  ctx: Ctx,
  key: SheetKey,
  index: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): boolean {
  const img = assets.get(key);
  if (!img) return false;
  const def = SHEETS[key];
  const sx = (index % def.cols) * def.tile;
  const sy = Math.floor(index / def.cols) * def.tile;
  ctx.drawImage(img, sx, sy, def.tile, def.tile, dx, dy, dw, dh);
  return true;
}

/**
 * Draws a character sprite anchored at its feet (origin bottom-center),
 * matching the engine coordinate system where negative Y is up.
 */
export function drawSheetSprite(
  ctx: Ctx,
  key: SheetKey,
  index: number,
  x: number,
  y: number,
  size: number,
  facing: 1 | -1 = 1,
): boolean {
  const img = assets.get(key);
  if (!img) return false;
  const def = SHEETS[key];
  const sx = (index % def.cols) * def.tile;
  const sy = Math.floor(index / def.cols) * def.tile;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.drawImage(img, sx, sy, def.tile, def.tile, -size / 2, -size, size, size);
  ctx.restore();
  return true;
}

/** Pixel-art friendly canvas defaults. */
export function setPixelated(ctx: Ctx) {
  ctx.imageSmoothingEnabled = false;
}
