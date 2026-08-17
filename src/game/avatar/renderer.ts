import type { ResolvedAvatar } from "./options";

/**
 * Layered avatar renderer.
 * Every layer is drawn in the same local coordinate system:
 *   origin = center of the feet, negative Y is up, character is ~66 units tall.
 * The layer order below is the single source of truth for depth sorting.
 */
export const LAYER_ORDER = [
  "SHADOW",
  "BACKPACK",
  "BACK_HAIR",
  "BACK_ARM",
  "LEGS",
  "LOWER_CLOTHES",
  "TORSO",
  "UPPER_CLOTHES",
  "HEAD",
  "EYES",
  "BROWS",
  "MOUTH",
  "FRONT_HAIR",
  "ACCESSORIES",
  "FRONT_ARM",
  "WEAPON",
] as const;

export const RIG = {
  feetY: 0,
  hipY: -24,
  waistY: -31,
  shoulderY: -44,
  neckY: -47,
  headY: -55,
  headR: 9.5,
  torsoHalf: 8,
  hipHalf: 6.4,
  armLen: 13,
};

export type AvatarPose = {
  /** 'idle' | 'run' | 'shoot' | 'hurt' | 'dead' | 'win' */
  state: "idle" | "run" | "shoot" | "hurt" | "dead" | "win";
  /** animation clock in seconds */
  time: number;
  /** aim angle in radians, world space (0 = right). */
  aim: number;
  /** 1 = facing right, -1 = facing left */
  facing: 1 | -1;
  /** 0..1 red damage flash */
  flash?: number;
  /** recoil kick 0..1 */
  recoil?: number;
  weapon?: WeaponVisual | null;
};

export type WeaponVisual = "pistol" | "dual" | "rifle" | "shotgun" | "smg" | "none";

/* ---------------------------------- color --------------------------------- */

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp255(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

export function shade(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return `rgb(${clamp255(r + (t - r) * p)}, ${clamp255(g + (t - g) * p)}, ${clamp255(b + (t - b) * p)})`;
}

export function withAlpha(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/* --------------------------------- helpers -------------------------------- */

type Ctx = CanvasRenderingContext2D;

function rounded(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
  ctx.closePath();
}

/* --------------------------------- clothes -------------------------------- */

function sleeveLength(top: string): number {
  switch (top) {
    case "tank":
      return 0;
    case "tshirt":
    case "blouse":
      return 0.45;
    case "armor":
      return 0.35;
    default:
      return 1;
  }
}

function drawLegs(ctx: Ctx, av: ResolvedAvatar, swing: number) {
  const { hipY } = RIG;
  const legs: Array<{ dir: number; z: number }> = [
    { dir: -1, z: 0 },
    { dir: 1, z: 1 },
  ];
  for (const leg of legs) {
    const angle = swing * leg.dir;
    ctx.save();
    ctx.translate(leg.z === 0 ? -3.2 : 3.2, hipY + 1);
    ctx.rotate(angle);
    // skin
    ctx.fillStyle = leg.z === 0 ? shade(av.skin, -0.12) : av.skin;
    rounded(ctx, -2.6, 0, 5.2, 25, 2.4);
    ctx.fill();
    // shoe
    ctx.fillStyle = shade(av.bottomColor, -0.55);
    rounded(ctx, -3.1, 20.5, 6.2, 4.8, 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawLowerClothes(ctx: Ctx, av: ResolvedAvatar, swing: number) {
  const { hipY } = RIG;
  const base = av.bottomColor;
  const dark = shade(base, -0.28);
  if (av.bottom === "skirt") {
    ctx.fillStyle = base;
    ctx.beginPath();
    ctx.moveTo(-6.4, hipY - 3);
    ctx.lineTo(6.4, hipY - 3);
    ctx.quadraticCurveTo(10, hipY + 9, 8.6, hipY + 11);
    ctx.lineTo(-8.6, hipY + 11);
    ctx.quadraticCurveTo(-10, hipY + 9, -6.4, hipY - 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = withAlpha("#000000", 0.16);
    ctx.fillRect(-8.6, hipY + 8, 17.2, 3);
    return;
  }
  const length = av.bottom === "shorts" ? 9 : 22;
  const width = av.bottom === "leggings" ? 4.8 : av.bottom === "cargo" ? 6.4 : 5.6;
  const legs = [
    { dir: -1, x: -3.2, tone: dark },
    { dir: 1, x: 3.2, tone: base },
  ];
  for (const leg of legs) {
    ctx.save();
    ctx.translate(leg.x, hipY + 1);
    ctx.rotate(swing * leg.dir);
    ctx.fillStyle = leg.tone;
    rounded(ctx, -width / 2, -1, width, length, 2.2);
    ctx.fill();
    if (av.bottom === "cargo") {
      ctx.fillStyle = shade(base, -0.45);
      rounded(ctx, -width / 2 + 0.4, 7, width - 0.8, 4, 1);
      ctx.fill();
    }
    ctx.restore();
  }
  // hips block
  ctx.fillStyle = base;
  rounded(ctx, -6.6, hipY - 4, 13.2, 7, 2.5);
  ctx.fill();
}

function drawTorsoSkin(ctx: Ctx, av: ResolvedAvatar) {
  const { shoulderY, hipY, torsoHalf, hipHalf } = RIG;
  ctx.fillStyle = av.skin;
  ctx.beginPath();
  ctx.moveTo(-torsoHalf, shoulderY + 1);
  ctx.quadraticCurveTo(-torsoHalf - 0.6, shoulderY + 9, -hipHalf, hipY);
  ctx.lineTo(hipHalf, hipY);
  ctx.quadraticCurveTo(torsoHalf + 0.6, shoulderY + 9, torsoHalf, shoulderY + 1);
  ctx.quadraticCurveTo(0, shoulderY - 3.4, -torsoHalf, shoulderY + 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = withAlpha("#000000", 0.1);
  ctx.beginPath();
  ctx.moveTo(-torsoHalf, shoulderY + 1);
  ctx.quadraticCurveTo(-torsoHalf, hipY - 4, -hipHalf, hipY);
  ctx.lineTo(-hipHalf + 2.6, hipY);
  ctx.quadraticCurveTo(-torsoHalf + 2.4, hipY - 6, -torsoHalf + 2.6, shoulderY + 1);
  ctx.closePath();
  ctx.fill();
  // neck
  ctx.fillStyle = shade(av.skin, -0.14);
  rounded(ctx, -2.6, RIG.neckY - 1, 5.2, 5, 2);
  ctx.fill();
}

function drawUpperClothes(ctx: Ctx, av: ResolvedAvatar) {
  const { shoulderY, hipY, torsoHalf, hipHalf } = RIG;
  const base = av.topColor;
  const dark = shade(base, -0.3);
  const light = shade(base, 0.16);
  const bottomY = av.top === "jacket" || av.top === "hoodie" ? hipY + 2 : hipY - 1;

  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(-torsoHalf - 0.8, shoulderY + 0.5);
  ctx.quadraticCurveTo(-torsoHalf - 1.2, shoulderY + 10, -hipHalf - 0.8, bottomY);
  ctx.lineTo(hipHalf + 0.8, bottomY);
  ctx.quadraticCurveTo(torsoHalf + 1.2, shoulderY + 10, torsoHalf + 0.8, shoulderY + 0.5);
  ctx.quadraticCurveTo(0, shoulderY - 3.6, -torsoHalf - 0.8, shoulderY + 0.5);
  ctx.closePath();
  ctx.fill();

  // shading
  ctx.save();
  ctx.clip();
  ctx.fillStyle = withAlpha("#000000", 0.14);
  ctx.fillRect(-torsoHalf - 2, shoulderY, 3.4, 30);
  ctx.fillStyle = withAlpha("#ffffff", 0.1);
  ctx.fillRect(torsoHalf - 2.4, shoulderY, 2.4, 30);
  ctx.restore();

  if (av.top === "tank") {
    ctx.fillStyle = av.skin;
    ctx.beginPath();
    ctx.moveTo(-6.4, shoulderY - 1);
    ctx.lineTo(-3.4, shoulderY - 1);
    ctx.lineTo(-3.4, shoulderY + 7);
    ctx.lineTo(-6.4, shoulderY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(6.4, shoulderY - 1);
    ctx.lineTo(3.4, shoulderY - 1);
    ctx.lineTo(3.4, shoulderY + 7);
    ctx.lineTo(6.4, shoulderY + 6);
    ctx.closePath();
    ctx.fill();
  }

  if (av.top === "jacket") {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(0, shoulderY + 1);
    ctx.lineTo(0.8, bottomY);
    ctx.stroke();
    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.moveTo(-4.6, shoulderY);
    ctx.lineTo(0, shoulderY + 7);
    ctx.lineTo(-6.6, shoulderY + 5);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4.6, shoulderY);
    ctx.lineTo(0, shoulderY + 7);
    ctx.lineTo(6.6, shoulderY + 5);
    ctx.closePath();
    ctx.fill();
  }

  if (av.top === "hoodie") {
    ctx.fillStyle = dark;
    ellipse(ctx, 0, shoulderY + 1.5, 7.2, 3.4);
    ctx.fill();
    ctx.strokeStyle = shade(base, 0.35);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-2, shoulderY + 4);
    ctx.lineTo(-1.4, shoulderY + 9);
    ctx.moveTo(2, shoulderY + 4);
    ctx.lineTo(1.4, shoulderY + 9);
    ctx.stroke();
    ctx.fillStyle = dark;
    rounded(ctx, -4.6, hipY - 8, 9.2, 5, 1.6);
    ctx.fill();
  }

  if (av.top === "blouse") {
    ctx.fillStyle = shade(base, 0.3);
    ctx.beginPath();
    ctx.moveTo(-4.4, shoulderY);
    ctx.quadraticCurveTo(0, shoulderY + 8, 4.4, shoulderY);
    ctx.quadraticCurveTo(0, shoulderY + 3, -4.4, shoulderY);
    ctx.closePath();
    ctx.fill();
  }

  if (av.top === "armor") {
    ctx.fillStyle = shade(base, 0.22);
    rounded(ctx, -6.2, shoulderY + 2, 12.4, 12, 3);
    ctx.fill();
    ctx.strokeStyle = shade(base, -0.45);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-6.2, shoulderY + 8);
    ctx.lineTo(6.2, shoulderY + 8);
    ctx.stroke();
  }

  if (av.top === "tshirt") {
    ctx.fillStyle = withAlpha("#ffffff", 0.12);
    ellipse(ctx, 0, shoulderY + 1, 3.4, 1.8);
    ctx.fill();
  }
}

/* ----------------------------------- head --------------------------------- */

function drawHead(ctx: Ctx, av: ResolvedAvatar) {
  const { headY, headR } = RIG;
  ctx.fillStyle = av.skin;
  ellipse(ctx, 0, headY, headR - 0.6, headR + 0.6);
  ctx.fill();
  // ears
  ctx.fillStyle = shade(av.skin, -0.08);
  ellipse(ctx, -headR + 0.4, headY + 1.5, 1.6, 2.2);
  ctx.fill();
  ellipse(ctx, headR - 0.4, headY + 1.5, 1.6, 2.2);
  ctx.fill();
  // cheek shade
  ctx.fillStyle = withAlpha("#000000", 0.07);
  ellipse(ctx, -4.4, headY + 3.2, 3.6, 3.2);
  ctx.fill();
  ctx.fillStyle = withAlpha("#e2727c", 0.24);
  ellipse(ctx, -4.8, headY + 3.6, 2.2, 1.3);
  ctx.fill();
  ellipse(ctx, 4.8, headY + 3.6, 2.2, 1.3);
  ctx.fill();
  // nose
  ctx.strokeStyle = withAlpha("#000000", 0.22);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(0.4, headY + 2.4);
  ctx.quadraticCurveTo(1.4, headY + 3.6, 0.2, headY + 4);
  ctx.stroke();
}

function drawEyes(ctx: Ctx, av: ResolvedAvatar, blink: number) {
  const y = RIG.headY + 0.6;
  const shapes: Record<string, { rx: number; ry: number; tilt: number }> = {
    round: { rx: 2.3, ry: 2.3, tilt: 0 },
    almond: { rx: 2.6, ry: 1.9, tilt: 0.08 },
    sharp: { rx: 2.8, ry: 1.6, tilt: 0.2 },
    soft: { rx: 2.4, ry: 2.0, tilt: -0.06 },
    wide: { rx: 2.9, ry: 2.6, tilt: 0 },
  };
  const s = shapes[av.eyes] ?? shapes.almond;
  for (const dir of [-1, 1] as const) {
    const x = dir * 3.9;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.tilt * dir);
    const openness = Math.max(0.08, 1 - blink);
    // sclera
    ctx.fillStyle = "#fbf7f2";
    ellipse(ctx, 0, 0, s.rx, s.ry * openness);
    ctx.fill();
    ctx.save();
    ctx.clip();
    // iris
    ctx.fillStyle = av.eyeColor;
    ellipse(ctx, dir * 0.25, 0.15, s.ry * 0.95, s.ry * 0.95);
    ctx.fill();
    ctx.fillStyle = shade(av.eyeColor, -0.5);
    ellipse(ctx, dir * 0.25, 0.15, s.ry * 0.45, s.ry * 0.45);
    ctx.fill();
    ctx.fillStyle = withAlpha("#ffffff", 0.9);
    ellipse(ctx, dir * 0.25 - 0.6, -0.5, 0.5, 0.5);
    ctx.fill();
    ctx.restore();
    // lash line
    ctx.strokeStyle = withAlpha("#2a1c1a", 0.85);
    ctx.lineWidth = 0.65;
    ctx.beginPath();
    ctx.ellipse(0, 0, s.rx, s.ry * openness, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawBrows(ctx: Ctx, av: ResolvedAvatar) {
  const y = RIG.headY - 3.2;
  ctx.strokeStyle = shade(av.hairColor, -0.15);
  ctx.lineCap = "round";
  for (const dir of [-1, 1] as const) {
    const x = dir * 3.9;
    ctx.beginPath();
    switch (av.brow) {
      case "straight":
        ctx.lineWidth = 1.1;
        ctx.moveTo(x - 2.2, y);
        ctx.lineTo(x + 2.2, y);
        break;
      case "arched":
        ctx.lineWidth = 1.1;
        ctx.moveTo(x - 2.2, y + 0.5);
        ctx.quadraticCurveTo(x, y - 1.6, x + 2.2, y + 0.3);
        break;
      case "bold":
        ctx.lineWidth = 1.8;
        ctx.moveTo(x - 2.4, y + 0.3);
        ctx.quadraticCurveTo(x, y - 0.9, x + 2.4, y + 0.4);
        break;
      default:
        ctx.lineWidth = 1;
        ctx.moveTo(x - 2.1, y + 0.4);
        ctx.quadraticCurveTo(x, y - 0.8, x + 2.1, y + 0.2);
    }
    ctx.stroke();
  }
}

function drawMouth(ctx: Ctx, av: ResolvedAvatar) {
  const y = RIG.headY + 5.6;
  ctx.strokeStyle = "#8c4a49";
  ctx.lineWidth = 0.9;
  ctx.lineCap = "round";
  ctx.beginPath();
  switch (av.mouth) {
    case "smile":
      ctx.moveTo(-2, y - 0.4);
      ctx.quadraticCurveTo(0, y + 1.6, 2, y - 0.4);
      break;
    case "smirk":
      ctx.moveTo(-1.6, y + 0.2);
      ctx.quadraticCurveTo(0.6, y + 1.2, 2.2, y - 0.6);
      break;
    case "determined":
      ctx.moveTo(-2, y + 0.2);
      ctx.lineTo(2, y);
      break;
    default:
      ctx.moveTo(-1.6, y);
      ctx.quadraticCurveTo(0, y + 0.7, 1.6, y);
  }
  ctx.stroke();
}

/* ----------------------------------- hair --------------------------------- */

function drawBackHair(ctx: Ctx, av: ResolvedAvatar, sway: number) {
  const { headY, headR } = RIG;
  const base = av.hairColor;
  const dark = shade(base, -0.28);
  ctx.fillStyle = dark;
  switch (av.hair) {
    case "long":
    case "wavy":
    case "bangs": {
      const len = av.hair === "wavy" ? 26 : 30;
      ctx.beginPath();
      ctx.moveTo(-headR - 1.4, headY - 4);
      ctx.quadraticCurveTo(-headR - 4 + sway, headY + len * 0.5, -headR - 1 + sway, headY + len);
      ctx.quadraticCurveTo(0, headY + len + 4, headR + 1 + sway, headY + len);
      ctx.quadraticCurveTo(headR + 4 + sway, headY + len * 0.5, headR + 1.4, headY - 4);
      ctx.closePath();
      ctx.fill();
      if (av.hair === "wavy") {
        ctx.strokeStyle = shade(base, -0.45);
        ctx.lineWidth = 0.8;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(i * 4, headY + 4);
          ctx.quadraticCurveTo(i * 4 + 2.4, headY + 14, i * 4 + sway, headY + len - 2);
          ctx.stroke();
        }
      }
      break;
    }
    case "curly": {
      for (let i = 0; i < 12; i++) {
        const a = Math.PI * 0.15 + (i / 11) * Math.PI * 1.7;
        const r = headR + 3.4;
        ellipse(ctx, Math.cos(a) * r * 1.05, headY + Math.sin(a) * r * 0.95, 4.2, 4);
        ctx.fill();
      }
      break;
    }
    case "ponytail": {
      ctx.beginPath();
      ctx.moveTo(-2, headY - 6);
      ctx.quadraticCurveTo(-13 + sway * 1.6, headY + 2, -10 + sway * 2, headY + 20);
      ctx.quadraticCurveTo(-5 + sway, headY + 16, -2, headY + 2);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "braids": {
      for (const dir of [-1, 1] as const) {
        for (let i = 0; i < 5; i++) {
          ellipse(
            ctx,
            dir * (headR + 0.4) + sway * (i / 5),
            headY + 2 + i * 4.6,
            3.1 - i * 0.15,
            2.9,
          );
          ctx.fill();
        }
      }
      break;
    }
    case "buns": {
      for (const dir of [-1, 1] as const) {
        ellipse(ctx, dir * (headR + 1.8), headY - 6.5, 4.4, 4.4);
        ctx.fill();
      }
      break;
    }
    case "bob": {
      ctx.beginPath();
      ctx.moveTo(-headR - 1.6, headY - 4);
      ctx.quadraticCurveTo(-headR - 2.6, headY + 8, -headR + 0.6, headY + 10);
      ctx.lineTo(headR - 0.6, headY + 10);
      ctx.quadraticCurveTo(headR + 2.6, headY + 8, headR + 1.6, headY - 4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default:
      break;
  }
}

function drawFrontHair(ctx: Ctx, av: ResolvedAvatar) {
  const { headY, headR } = RIG;
  const base = av.hairColor;
  ctx.fillStyle = base;
  // scalp cap shared by every style
  ctx.beginPath();
  ctx.moveTo(-headR - 0.8, headY + 0.5);
  ctx.quadraticCurveTo(-headR - 1.2, headY - headR - 3.4, 0, headY - headR - 3.2);
  ctx.quadraticCurveTo(headR + 1.2, headY - headR - 3.4, headR + 0.8, headY + 0.5);
  ctx.quadraticCurveTo(headR - 1, headY - 5.6, 0, headY - 5.8);
  ctx.quadraticCurveTo(-headR + 1, headY - 5.6, -headR - 0.8, headY + 0.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = base;
  switch (av.hair) {
    case "pixie":
      ctx.beginPath();
      ctx.moveTo(-headR - 0.6, headY - 2.4);
      ctx.quadraticCurveTo(-4, headY - 8.4, 6, headY - 5.4);
      ctx.quadraticCurveTo(3, headY - 3.4, -1.4, headY - 3.6);
      ctx.closePath();
      ctx.fill();
      break;
    case "short":
      ctx.beginPath();
      ctx.moveTo(-headR - 0.8, headY - 1);
      ctx.quadraticCurveTo(-2, headY - 9, headR + 0.8, headY - 2.4);
      ctx.quadraticCurveTo(2, headY - 4.6, -headR - 0.4, headY - 1);
      ctx.closePath();
      ctx.fill();
      break;
    case "bangs":
      ctx.beginPath();
      ctx.moveTo(-headR - 0.6, headY - 1.6);
      ctx.quadraticCurveTo(0, headY - 10, headR + 0.6, headY - 1.6);
      ctx.quadraticCurveTo(0, headY - 3.2, -headR - 0.6, headY - 1.6);
      ctx.closePath();
      ctx.fill();
      break;
    case "curly":
      for (let i = 0; i < 6; i++) {
        const a = Math.PI * 1.05 + (i / 5) * Math.PI * 0.9;
        ellipse(ctx, Math.cos(a) * (headR + 0.6), headY + Math.sin(a) * (headR + 0.6), 3.4, 3.2);
        ctx.fill();
      }
      break;
    case "buns":
      ctx.beginPath();
      ctx.moveTo(-headR - 0.6, headY - 2.6);
      ctx.quadraticCurveTo(-3, headY - 9.4, 4.6, headY - 6);
      ctx.quadraticCurveTo(0, headY - 4, -headR - 0.4, headY - 2.6);
      ctx.closePath();
      ctx.fill();
      break;
    case "ponytail":
      ctx.beginPath();
      ctx.moveTo(-headR - 0.6, headY - 2.2);
      ctx.quadraticCurveTo(-2, headY - 10, headR + 0.4, headY - 4.2);
      ctx.quadraticCurveTo(0, headY - 5.4, -headR - 0.4, headY - 2.2);
      ctx.closePath();
      ctx.fill();
      break;
    default:
      // side-swept fringe
      ctx.beginPath();
      ctx.moveTo(-headR - 0.8, headY - 1.2);
      ctx.quadraticCurveTo(-5, headY - 9.6, headR + 0.6, headY - 3.6);
      ctx.quadraticCurveTo(-1, headY - 5.2, -headR - 0.4, headY - 1.2);
      ctx.closePath();
      ctx.fill();
  }
  // highlight
  ctx.fillStyle = withAlpha("#ffffff", 0.16);
  ellipse(ctx, -3.4, headY - 7.4, 3.4, 1.5, -0.4);
  ctx.fill();
}

/* -------------------------------- accessories ------------------------------ */

function drawBackAccessories(ctx: Ctx, av: ResolvedAvatar) {
  if (av.accessories.includes("backpack")) {
    ctx.fillStyle = "#5a4130";
    rounded(ctx, -8.6, RIG.shoulderY + 2, 17.2, 16, 4);
    ctx.fill();
    ctx.fillStyle = "#3d2b1f";
    rounded(ctx, -5, RIG.shoulderY + 7, 10, 6, 2);
    ctx.fill();
  }
}

function drawFrontAccessories(ctx: Ctx, av: ResolvedAvatar) {
  const { headY, headR, shoulderY } = RIG;
  if (av.accessories.includes("earrings")) {
    ctx.fillStyle = "#e8c86a";
    ellipse(ctx, -headR + 0.2, headY + 4, 0.9, 1.2);
    ctx.fill();
    ellipse(ctx, headR - 0.2, headY + 4, 0.9, 1.2);
    ctx.fill();
  }
  if (av.accessories.includes("glasses")) {
    ctx.strokeStyle = "#2b2b33";
    ctx.lineWidth = 0.8;
    ellipse(ctx, -3.9, headY + 0.6, 3.2, 2.6);
    ctx.stroke();
    ellipse(ctx, 3.9, headY + 0.6, 3.2, 2.6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.7, headY + 0.4);
    ctx.lineTo(0.7, headY + 0.4);
    ctx.stroke();
    ctx.fillStyle = withAlpha("#bcd7f0", 0.22);
    ellipse(ctx, -3.9, headY + 0.6, 3.2, 2.6);
    ctx.fill();
    ellipse(ctx, 3.9, headY + 0.6, 3.2, 2.6);
    ctx.fill();
  }
  if (av.accessories.includes("headband")) {
    ctx.strokeStyle = "#d9758c";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.ellipse(0, headY - 1.5, headR + 0.6, headR + 1, 0, Math.PI * 1.12, Math.PI * 1.88);
    ctx.stroke();
  }
  if (av.accessories.includes("bow")) {
    const bx = 5.6;
    const by = headY - headR - 1.2;
    ctx.fillStyle = "#c8425c";
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx - 5, by - 3.4, bx - 4.4, by + 1.4);
    ctx.quadraticCurveTo(bx - 2, by + 2, bx, by);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + 5, by - 3.4, bx + 4.4, by + 1.4);
    ctx.quadraticCurveTo(bx + 2, by + 2, bx, by);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#8f2a41";
    ellipse(ctx, bx, by + 0.4, 1.2, 1.2);
    ctx.fill();
  }
  if (av.accessories.includes("hat")) {
    ctx.fillStyle = "#40342b";
    ellipse(ctx, 0, headY - headR - 1.2, headR + 5.2, 2.6);
    ctx.fill();
    rounded(ctx, -6.4, headY - headR - 8.4, 12.8, 8, 3);
    ctx.fill();
    ctx.fillStyle = "#8d6b3f";
    ctx.fillRect(-6.4, headY - headR - 3.2, 12.8, 2);
  }
  if (av.accessories.includes("scarf")) {
    ctx.fillStyle = "#b8543f";
    rounded(ctx, -6, shoulderY - 3, 12, 4.6, 2.2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(2.4, shoulderY + 0.6);
    ctx.lineTo(6.2, shoulderY + 10);
    ctx.lineTo(3, shoulderY + 10.6);
    ctx.closePath();
    ctx.fill();
  }
}

/* ---------------------------------- weapon --------------------------------- */

export function weaponMuzzleDistance(weapon: WeaponVisual): number {
  switch (weapon) {
    case "rifle":
      return 19;
    case "smg":
      return 16;
    case "shotgun":
      return 18;
    default:
      return 13;
  }
}

function drawWeaponShape(ctx: Ctx, weapon: WeaponVisual) {
  // drawn along +X, origin at the hand
  const steel = "#4c515c";
  const dark = "#2b2f38";
  const wood = "#6b4a2c";
  switch (weapon) {
    case "pistol":
    case "dual":
      ctx.fillStyle = dark;
      rounded(ctx, -1, -1.6, 10, 3.2, 1);
      ctx.fill();
      ctx.fillStyle = steel;
      rounded(ctx, -2.4, -0.4, 3.4, 5, 1);
      ctx.fill();
      break;
    case "rifle":
      ctx.fillStyle = dark;
      rounded(ctx, -5, -1.5, 21, 3, 1);
      ctx.fill();
      ctx.fillStyle = wood;
      rounded(ctx, -6.5, -1.8, 6, 3.6, 1.2);
      ctx.fill();
      ctx.fillStyle = steel;
      rounded(ctx, 1, 0.8, 3.2, 5.4, 1);
      ctx.fill();
      break;
    case "shotgun":
      ctx.fillStyle = dark;
      rounded(ctx, -5, -2.1, 20, 4.2, 1.4);
      ctx.fill();
      ctx.fillStyle = wood;
      rounded(ctx, -7, -2.3, 7, 4.6, 1.6);
      ctx.fill();
      ctx.fillStyle = steel;
      rounded(ctx, 5, 1.2, 6, 2.4, 1);
      ctx.fill();
      break;
    case "smg":
      ctx.fillStyle = steel;
      rounded(ctx, -4, -1.8, 17, 3.6, 1.2);
      ctx.fill();
      ctx.fillStyle = dark;
      rounded(ctx, -1.4, 1.2, 3, 7, 1);
      ctx.fill();
      rounded(ctx, 8, -3.2, 2.2, 3, 0.8);
      ctx.fill();
      break;
    default:
      break;
  }
}

/* ---------------------------------- avatar --------------------------------- */

export function drawAvatar(
  ctx: Ctx,
  av: ResolvedAvatar,
  pose: AvatarPose,
  x: number,
  y: number,
  scale: number,
) {
  const {
    state,
    time,
    aim,
    facing,
    flash = 0,
    recoil = 0,
    weapon = "none",
  } = pose;
  const running = state === "run";
  const cycle = time * 9;
  const swing = running ? Math.sin(cycle) * 0.55 : Math.sin(time * 2) * 0.04;
  const bob = running ? Math.abs(Math.sin(cycle)) * 1.6 : Math.sin(time * 2) * 0.5;
  const blinkPhase = (time % 4.2) / 4.2;
  const blink = blinkPhase > 0.97 ? 1 : 0;
  const sway = running ? Math.sin(cycle * 0.5) * 1.6 : Math.sin(time * 1.4) * 0.7;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // SHADOW (world aligned, never flipped)
  ctx.fillStyle = "rgba(0,0,0,0.32)";
  ellipse(ctx, 0, 0, 10, 3.6);
  ctx.fill();

  if (state === "dead") {
    ctx.translate(0, -6);
    ctx.rotate((Math.PI / 2) * 0.82 * facing);
    ctx.globalAlpha = 0.9;
  } else if (state === "win") {
    ctx.translate(0, -Math.abs(Math.sin(time * 4)) * 3);
  } else {
    ctx.translate(0, -bob);
  }

  // ---- body group (mirrored by facing) ----
  ctx.save();
  ctx.scale(facing, 1);
  drawBackAccessories(ctx, av);
  drawBackHair(ctx, av, sway);

  // back arm
  ctx.save();
  ctx.translate(-5.4, RIG.shoulderY + 2);
  ctx.rotate(running ? -swing * 0.8 : 0.25);
  ctx.fillStyle = shade(av.skin, -0.16);
  rounded(ctx, -1.9, 0, 3.8, RIG.armLen, 1.8);
  ctx.fill();
  if (sleeveLength(av.top) > 0) {
    ctx.fillStyle = shade(av.topColor, -0.3);
    rounded(ctx, -2.3, -1, 4.6, RIG.armLen * sleeveLength(av.top), 2);
    ctx.fill();
  }
  ctx.restore();

  drawLegs(ctx, av, swing);
  drawLowerClothes(ctx, av, swing);
  drawTorsoSkin(ctx, av);
  drawUpperClothes(ctx, av);
  drawHead(ctx, av);
  drawEyes(ctx, av, state === "dead" ? 1 : blink);
  drawBrows(ctx, av);
  drawMouth(ctx, av);
  drawFrontHair(ctx, av);
  drawFrontAccessories(ctx, av);
  ctx.restore();
  // ---- end body group ----

  // FRONT ARM + WEAPON, aimed in world space
  const hasWeapon = weapon && weapon !== "none";
  const armAngle = hasWeapon && state !== "dead" ? aim : facing > 0 ? 0.5 : Math.PI - 0.5;
  const shoulderX = 4.4 * facing;
  const kick = recoil * 2.6;

  const drawArm = (angle: number, offsetY: number) => {
    ctx.save();
    ctx.translate(shoulderX, RIG.shoulderY + 2 + offsetY);
    ctx.rotate(angle);
    ctx.translate(-kick, 0);
    ctx.fillStyle = av.skin;
    rounded(ctx, 0, -1.9, RIG.armLen, 3.8, 1.8);
    ctx.fill();
    if (sleeveLength(av.top) > 0) {
      ctx.fillStyle = av.topColor;
      rounded(ctx, -1.4, -2.3, RIG.armLen * sleeveLength(av.top) + 1, 4.6, 2);
      ctx.fill();
    }
    if (hasWeapon && state !== "dead") {
      ctx.save();
      ctx.translate(RIG.armLen - 1, 0);
      ctx.scale(1, facing > 0 ? 1 : -1);
      drawWeaponShape(ctx, weapon as WeaponVisual);
      ctx.restore();
    }
    ctx.restore();
  };

  if (state === "win") {
    drawArm(-1.25 * (facing > 0 ? 1 : -1), 0);
  } else if (weapon === "dual") {
    drawArm(armAngle + 0.22, 1.5);
    drawArm(armAngle - 0.22, -1.5);
  } else {
    drawArm(armAngle, 0);
  }

  // damage flash silhouette
  if (flash > 0) {
    ctx.globalAlpha = Math.min(0.65, flash);
    ctx.fillStyle = "#ff5f57";
    ellipse(ctx, 0, RIG.headY, RIG.headR, RIG.headR + 1);
    ctx.fill();
    rounded(ctx, -RIG.torsoHalf - 1, RIG.shoulderY, RIG.torsoHalf * 2 + 2, 24, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

/** Convenience for UI previews (portrait framing). */
export function drawAvatarPortrait(
  ctx: Ctx,
  av: ResolvedAvatar,
  time: number,
  width: number,
  height: number,
  weapon: WeaponVisual = "none",
) {
  ctx.clearRect(0, 0, width, height);
  const scale = Math.min(width / 60, height / 84);
  drawAvatar(
    ctx,
    av,
    { state: "idle", time, aim: 0, facing: 1, weapon },
    width / 2,
    height * 0.9,
    scale,
  );
}
