/**
 * Real golem boss sprites (Craftpix packs), served as CDN-hosted strips.
 * Each strip: frames laid out horizontally, 240px tall, trimmed to a stable bbox.
 */
import g1Walking from "@/assets/bosses/golem1-walking.asset.json";
import g1Running from "@/assets/bosses/golem1-running.asset.json";
import g1Slashing from "@/assets/bosses/golem1-slashing.asset.json";
import g1Throwing from "@/assets/bosses/golem1-throwing.asset.json";
import g1Hurt from "@/assets/bosses/golem1-hurt.asset.json";
import g1Dying from "@/assets/bosses/golem1-dying.asset.json";
import g1Idle from "@/assets/bosses/golem1-idle.asset.json";
import g2Walking from "@/assets/bosses/golem2-walking.asset.json";
import g2Running from "@/assets/bosses/golem2-running.asset.json";
import g2Slashing from "@/assets/bosses/golem2-slashing.asset.json";
import g2Throwing from "@/assets/bosses/golem2-throwing.asset.json";
import g2Hurt from "@/assets/bosses/golem2-hurt.asset.json";
import g2Dying from "@/assets/bosses/golem2-dying.asset.json";
import g2Idle from "@/assets/bosses/golem2-idle.asset.json";
import g3Walking from "@/assets/bosses/golem3-walking.asset.json";
import g3Running from "@/assets/bosses/golem3-running.asset.json";
import g3Slashing from "@/assets/bosses/golem3-slashing.asset.json";
import g3Throwing from "@/assets/bosses/golem3-throwing.asset.json";
import g3Hurt from "@/assets/bosses/golem3-hurt.asset.json";
import g3Dying from "@/assets/bosses/golem3-dying.asset.json";
import g3Idle from "@/assets/bosses/golem3-idle.asset.json";

export type BossAnim =
  | "walking"
  | "running"
  | "slashing"
  | "throwing"
  | "hurt"
  | "dying"
  | "idle";

export type GolemVariant = 1 | 2 | 3;

type StripDef = { url: string; frames: number; fw: number; fh: number; fps: number; loop: boolean };

const H = 240;
const def = (url: string, frames: number, fw: number, fps: number, loop = true): StripDef => ({
  url,
  frames,
  fw,
  fh: H,
  fps,
  loop,
});

const STRIPS: Record<GolemVariant, Record<BossAnim, StripDef>> = {
  1: {
    walking: def(g1Walking.url, 24, 178, 13),
    running: def(g1Running.url, 12, 174, 15),
    slashing: def(g1Slashing.url, 12, 282, 20, false),
    throwing: def(g1Throwing.url, 12, 223, 20, false),
    hurt: def(g1Hurt.url, 12, 213, 14, false),
    dying: def(g1Dying.url, 15, 204, 11, false),
    idle: def(g1Idle.url, 18, 174, 11),
  },
  2: {
    walking: def(g2Walking.url, 24, 161, 13),
    running: def(g2Running.url, 12, 169, 15),
    slashing: def(g2Slashing.url, 12, 257, 20, false),
    throwing: def(g2Throwing.url, 12, 202, 20, false),
    hurt: def(g2Hurt.url, 12, 221, 14, false),
    dying: def(g2Dying.url, 15, 225, 11, false),
    idle: def(g2Idle.url, 18, 162, 11),
  },
  3: {
    walking: def(g3Walking.url, 24, 172, 13),
    running: def(g3Running.url, 12, 175, 15),
    slashing: def(g3Slashing.url, 12, 284, 20, false),
    throwing: def(g3Throwing.url, 12, 223, 20, false),
    hurt: def(g3Hurt.url, 12, 222, 14, false),
    dying: def(g3Dying.url, 15, 214, 11, false),
    idle: def(g3Idle.url, 18, 172, 11),
  },
};

/** Thematic mapping: which golem stars as the boss of each of the 5 levels. */
export const LEVEL_BOSS_GOLEM: GolemVariant[] = [2, 3, 1, 2, 3];

const images = new Map<string, HTMLImageElement>();

/** Preload every strip for one variant. Safe to call repeatedly. */
export function preloadBossSprites(variant: GolemVariant): void {
  for (const strip of Object.values(STRIPS[variant])) {
    if (images.has(strip.url)) continue;
    const img = new Image();
    img.src = strip.url;
    images.set(strip.url, img);
  }
}

/**
 * Draws the boss anchored at its feet (x, y). `displayH` is world-space height.
 * Sprites face left; flipped when facing === 1 (right).
 */
export function drawBossSprite(
  ctx: CanvasRenderingContext2D,
  variant: GolemVariant,
  anim: BossAnim,
  animTime: number,
  facing: 1 | -1,
  hurt: number,
  x: number,
  y: number,
  displayH: number,
): void {
  const strip = STRIPS[variant][anim];
  const img = images.get(strip.url);

  // ground shadow
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y, displayH * 0.3, displayH * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  if (!img || !img.complete || img.naturalWidth === 0) return;

  let frame = Math.floor(animTime * strip.fps);
  if (strip.loop) frame %= strip.frames;
  else frame = Math.min(frame, strip.frames - 1);

  const dw = displayH * (strip.fw / strip.fh);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.translate(x, y);
  if (facing === 1) ctx.scale(-1, 1);
  if (hurt > 0) ctx.filter = "brightness(1.9) saturate(0.4)";
  ctx.drawImage(
    img,
    frame * strip.fw,
    0,
    strip.fw,
    strip.fh,
    -dw / 2,
    -displayH,
    dw,
    displayH,
  );
  ctx.restore();
}
