import type { Theme } from "../content";
import { TILE, type Decoration, type LevelMap } from "./levelgen";

type Ctx = CanvasRenderingContext2D;

export type View = { x: number; y: number; w: number; h: number };

function hash(x: number, y: number) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

export function drawGround(ctx: Ctx, map: LevelMap, theme: Theme, view: View) {
  const x0 = Math.max(0, Math.floor(view.x / TILE) - 1);
  const y0 = Math.max(0, Math.floor(view.y / TILE) - 1);
  const x1 = Math.min(map.cols - 1, Math.ceil((view.x + view.w) / TILE) + 1);
  const y1 = Math.min(map.rows - 1, Math.ceil((view.y + view.h) / TILE) + 1);

  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const solid = map.tiles[ty * map.cols + tx] === 1;
      const px = tx * TILE;
      const py = ty * TILE;
      const h = hash(tx, ty);
      if (solid) {
        const openBelow = ty + 1 < map.rows && map.tiles[(ty + 1) * map.cols + tx] === 0;
        ctx.fillStyle = theme.wall;
        ctx.fillRect(px, py, TILE + 1, TILE + 1);
        ctx.fillStyle = h > 0.7 ? theme.wallTop : theme.wall;
        ctx.globalAlpha = 0.5;
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.globalAlpha = 1;
        if (openBelow) {
          ctx.fillStyle = theme.wallTop;
          ctx.fillRect(px, py + TILE - 8, TILE + 1, 8);
          ctx.fillStyle = "rgba(0,0,0,0.35)";
          ctx.fillRect(px, py + TILE, TILE + 1, 10);
        }
      } else {
        ctx.fillStyle = h > 0.5 ? theme.ground : theme.groundAlt;
        ctx.fillRect(px, py, TILE + 1, TILE + 1);
        if (h > 0.86) {
          ctx.fillStyle = "rgba(0,0,0,0.08)";
          ctx.fillRect(px + 8 + h * 12, py + 10 + h * 10, 14, 8);
        }
        if (h < 0.08) {
          ctx.fillStyle = theme.detail;
          ctx.globalAlpha = 0.16;
          ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
          ctx.globalAlpha = 1;
        }
      }
    }
  }
}

export function decorationHeight(d: Decoration) {
  switch (d.kind) {
    case "tree":
      return 78 * d.scale;
    case "lamp":
    case "pillar":
      return 70 * d.scale;
    case "cactus":
      return 46 * d.scale;
    case "car":
      return 26 * d.scale;
    default:
      return 20 * d.scale;
  }
}

export function drawDecoration(ctx: Ctx, d: Decoration, theme: Theme, time: number) {
  ctx.save();
  ctx.translate(d.x, d.y);
  ctx.scale(d.scale, d.scale);
  ctx.rotate(d.rot * 0.1);
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  switch (d.kind) {
    case "tree": {
      const sway = Math.sin(time * 0.8 + d.x * 0.01) * 2;
      ctx.fillStyle = "#3c2a1c";
      ctx.fillRect(-4, -34, 8, 34);
      ctx.fillStyle = theme.detail;
      ctx.beginPath();
      ctx.ellipse(sway, -52, 22, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(sway - 8, -46, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.beginPath();
      ctx.ellipse(sway + 8, -60, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "bush":
      ctx.fillStyle = theme.detail;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.ellipse(i * 8, -6, 8, 7, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case "rock":
      ctx.fillStyle = theme.wallTop;
      ctx.beginPath();
      ctx.moveTo(-11, 0);
      ctx.lineTo(-6, -12);
      ctx.lineTo(5, -14);
      ctx.lineTo(11, -3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.14)";
      ctx.fillRect(-4, -11, 7, 3);
      break;
    case "puddle":
      ctx.fillStyle = "rgba(120,180,200,0.25)";
      ctx.beginPath();
      ctx.ellipse(0, -2, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "car":
      ctx.fillStyle = "#7b3b3b";
      ctx.fillRect(-24, -18, 48, 20);
      ctx.fillStyle = "#2c2f38";
      ctx.fillRect(-16, -26, 30, 10);
      ctx.fillStyle = "rgba(180,220,255,0.35)";
      ctx.fillRect(-13, -24, 24, 6);
      ctx.fillStyle = "#191b21";
      ctx.fillRect(-22, 0, 10, 5);
      ctx.fillRect(12, 0, 10, 5);
      break;
    case "lamp": {
      ctx.fillStyle = "#33363f";
      ctx.fillRect(-2.4, -56, 4.8, 56);
      ctx.fillRect(-2.4, -58, 18, 4);
      const glow = ctx.createRadialGradient(14, -50, 2, 14, -50, 40);
      glow.addColorStop(0, "rgba(255,214,140,0.55)");
      glow.addColorStop(1, "rgba(255,214,140,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(14, -50, 40, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "sign":
      ctx.fillStyle = "#4a4d57";
      ctx.fillRect(-1.6, -28, 3.2, 28);
      ctx.fillStyle = theme.detail;
      ctx.fillRect(-12, -40, 24, 13);
      break;
    case "cactus":
      ctx.fillStyle = "#4e7a45";
      ctx.fillRect(-5, -40, 10, 40);
      ctx.fillRect(-14, -30, 9, 6);
      ctx.fillRect(-14, -30, 6, 16);
      ctx.fillRect(5, -22, 9, 6);
      ctx.fillRect(8, -34, 6, 18);
      break;
    case "pillar":
      ctx.fillStyle = theme.wallTop;
      ctx.fillRect(-10, -56, 20, 56);
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(2, -56, 8, 56);
      ctx.fillStyle = theme.detail;
      ctx.fillRect(-13, -62, 26, 8);
      break;
    case "torch": {
      ctx.fillStyle = "#3b2a24";
      ctx.fillRect(-2, -34, 4, 34);
      const f = 1 + Math.sin(time * 9 + d.x) * 0.2;
      const grad = ctx.createRadialGradient(0, -40, 2, 0, -40, 60);
      grad.addColorStop(0, "rgba(255,150,80,0.55)");
      grad.addColorStop(1, "rgba(255,90,60,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, -40, 60, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffb347";
      ctx.beginPath();
      ctx.ellipse(0, -40, 5 * f, 9 * f, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "crystal": {
      ctx.fillStyle = "rgba(140,215,255,0.85)";
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(8, -10);
      ctx.lineTo(0, 0);
      ctx.lineTo(-8, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(3, -12);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "grave":
      ctx.fillStyle = theme.wallTop;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(-9, -18);
      ctx.quadraticCurveTo(0, -28, 9, -18);
      ctx.lineTo(9, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fillRect(-4, -16, 8, 2);
      break;
  }
  ctx.restore();
}

/** Cinematic overlay: colored fog, light shafts and vignette. */
export function drawAtmosphere(
  ctx: Ctx,
  theme: Theme,
  view: View,
  time: number,
  levelIndex: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = theme.ambient;
  ctx.globalAlpha = 0.45;
  ctx.fillRect(view.x, view.y, view.w, view.h);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  if (levelIndex === 0 || levelIndex === 4) {
    for (let i = 0; i < 5; i++) {
      const sx = view.x + ((i * 320 + time * 6) % (view.w + 400)) - 200;
      ctx.fillStyle = theme.light;
      ctx.save();
      ctx.translate(sx, view.y);
      ctx.rotate(0.28);
      ctx.fillRect(0, 0, 60, view.h * 1.6);
      ctx.restore();
    }
  }
  ctx.restore();

  const g = ctx.createRadialGradient(
    view.x + view.w / 2,
    view.y + view.h / 2,
    Math.min(view.w, view.h) * 0.28,
    view.x + view.w / 2,
    view.y + view.h / 2,
    Math.max(view.w, view.h) * 0.72,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.62)");
  ctx.fillStyle = g;
  ctx.fillRect(view.x, view.y, view.w, view.h);
}
