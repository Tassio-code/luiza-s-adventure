/**
 * Real pixel-art monster sprites (Craftpix monster icon packs), one per enemy kind.
 * Single-frame art animated procedurally (bob, squash, lean) by the renderer.
 */
import orcUrl from "@/assets/monsters/orc.png";
import zombieUrl from "@/assets/monsters/zombie.png";
import frostUrl from "@/assets/monsters/frost.png";
import skeletonUrl from "@/assets/monsters/skeleton.png";
import vampireUrl from "@/assets/monsters/vampire.png";
import type { EnemyKind } from "./content";

const URLS: Partial<Record<EnemyKind, string>> = {
  orc: orcUrl,
  zombie: zombieUrl,
  frost: frostUrl,
  skeleton: skeletonUrl,
  vampire: vampireUrl,
};

const SIZE: Partial<Record<EnemyKind, number>> = {
  orc: 58,
  zombie: 56,
  frost: 58,
  skeleton: 54,
  vampire: 56,
};

const images = new Map<EnemyKind, HTMLImageElement>();
let started = false;

export function preloadMonsterSprites() {
  if (started || typeof Image === "undefined") return;
  started = true;
  for (const [kind, url] of Object.entries(URLS) as [EnemyKind, string][]) {
    const img = new Image();
    img.src = url;
    images.set(kind, img);
  }
}

/** Draws a monster at feet position (x, y). Returns false when art is unavailable. */
export function drawMonsterSprite(
  ctx: CanvasRenderingContext2D,
  kind: EnemyKind,
  time: number,
  facing: 1 | -1,
  hurt: number,
  scale: number,
  x: number,
  y: number,
): boolean {
  preloadMonsterSprites();
  const img = images.get(kind);
  const base = SIZE[kind];
  if (!img || !base || !img.complete || img.naturalWidth === 0) return false;

  const size = base * scale;
  const bob = Math.abs(Math.sin(time * 8)) * size * 0.06;
  const squash = 1 + Math.sin(time * 8) * 0.05;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.3, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y - bob);
  ctx.scale(facing, 1);
  if (hurt > 0) ctx.filter = "brightness(1.9) saturate(0.4)";
  ctx.drawImage(img, -size / 2, -size * squash, size, size * squash);
  ctx.filter = "none";
  ctx.restore();
  return true;
}

const BOSS_KINDS: EnemyKind[] = ["orc", "zombie", "frost", "skeleton", "vampire"];

/** Draws a distinct, enlarged boss from the five monster packs supplied for the game. */
export function drawLevelBoss(
  ctx: CanvasRenderingContext2D,
  levelIndex: number,
  time: number,
  facing: 1 | -1,
  hurt: number,
  x: number,
  y: number,
  dying: boolean,
): void {
  const kind = BOSS_KINDS[levelIndex] ?? "vampire";
  const pulse = 1 + Math.sin(time * 3.2) * 0.035;
  const scale = (levelIndex === 4 ? 3.15 : 2.75) * pulse;
  const auraHue = [112, 18, 196, 42, 344][levelIndex] ?? 344;

  ctx.save();
  if (dying) {
    const fade = Math.max(0, 1 - time / 1.5);
    ctx.globalAlpha = fade;
    ctx.translate(0, (1 - fade) * 22);
  }
  ctx.globalCompositeOperation = "screen";
  const aura = ctx.createRadialGradient(x, y - 72, 8, x, y - 72, levelIndex === 4 ? 118 : 94);
  aura.addColorStop(0, `hsla(${auraHue}, 90%, 62%, 0.32)`);
  aura.addColorStop(0.55, `hsla(${auraHue}, 85%, 48%, 0.12)`);
  aura.addColorStop(1, `hsla(${auraHue}, 80%, 35%, 0)`);
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(x, y - 72, levelIndex === 4 ? 118 : 94, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  if (dying) {
    const fade = Math.max(0, 1 - time / 1.5);
    ctx.globalAlpha = fade;
    ctx.translate(0, (1 - fade) * 22);
  }
  drawMonsterSprite(ctx, kind, time, facing, hurt, scale, x, y);
  ctx.restore();
}
