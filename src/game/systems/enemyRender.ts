import type { EnemyKind } from "../content";

type Ctx = CanvasRenderingContext2D;

function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2);
  ctx.closePath();
}

/**
 * Draws an original stylized enemy. Origin is the feet, negative Y is up,
 * matching the avatar rig so everything shares one coordinate system.
 */
export function drawEnemy(
  ctx: Ctx,
  kind: EnemyKind,
  time: number,
  facing: 1 | -1,
  hurt: number,
  scale: number,
  x: number,
  y: number,
  charging = false,
) {
  const walk = Math.sin(time * 7);
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // shadow
  ctx.fillStyle = "rgba(0,0,0,0.34)";
  ellipse(ctx, 0, 0, 11, 4);
  ctx.fill();

  ctx.save();
  ctx.scale(facing, 1);
  ctx.translate(0, -Math.abs(walk) * 1.2);

  switch (kind) {
    case "orc": {
      ctx.fillStyle = "#4e7a3d";
      ellipse(ctx, -3.6, -10, 3.4, 10 + walk * 1.2);
      ctx.fill();
      ellipse(ctx, 3.6, -10, 3.4, 10 - walk * 1.2);
      ctx.fill();
      ctx.fillStyle = "#5f9349";
      ellipse(ctx, 0, -26, 10, 12);
      ctx.fill();
      ctx.fillStyle = "#3e5f30";
      ellipse(ctx, -9, -30, 4, 6, -0.4);
      ctx.fill();
      ellipse(ctx, 9, -30, 4, 6, 0.4);
      ctx.fill();
      ctx.fillStyle = "#6ba354";
      ellipse(ctx, 1, -42, 8, 7.4);
      ctx.fill();
      ctx.fillStyle = "#2b3f22";
      ellipse(ctx, 4, -44, 1.5, 1.2);
      ctx.fill();
      ctx.fillStyle = "#f0e6c8";
      ctx.beginPath();
      ctx.moveTo(3, -39);
      ctx.lineTo(5.4, -35.5);
      ctx.lineTo(1.4, -37.4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#6b4a2b";
      ctx.fillRect(6, -34, 12, 2.6);
      break;
    }
    case "zombie": {
      ctx.fillStyle = "#4a5a52";
      ellipse(ctx, -3.2, -9, 3, 9 + walk);
      ctx.fill();
      ellipse(ctx, 3.2, -9, 3, 9 - walk);
      ctx.fill();
      ctx.fillStyle = "#6c7f70";
      ellipse(ctx, 0, -24, 7.6, 10);
      ctx.fill();
      ctx.fillStyle = "#8fa392";
      ellipse(ctx, 2, -37, 6.6, 6.8);
      ctx.fill();
      ctx.fillStyle = "#2d3a33";
      ellipse(ctx, 4, -38, 1.3, 1);
      ctx.fill();
      ctx.fillStyle = "#7d5b52";
      ctx.fillRect(0, -35, 5, 1.2);
      ctx.fillStyle = "#8fa392";
      ellipse(ctx, 8, -28 + walk, 2.6, 7, 0.9);
      ctx.fill();
      break;
    }
    case "frost": {
      ctx.fillStyle = "#5d7f9c";
      ellipse(ctx, -3.2, -9, 3.2, 9 + walk);
      ctx.fill();
      ellipse(ctx, 3.2, -9, 3.2, 9 - walk);
      ctx.fill();
      ctx.fillStyle = "#7fa8c4";
      ellipse(ctx, 0, -24, 8, 10.4);
      ctx.fill();
      ctx.fillStyle = "#bfe3f5";
      ellipse(ctx, 2, -38, 6.8, 7);
      ctx.fill();
      ctx.fillStyle = "#e8faff";
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(-6 + i * 4, -32);
        ctx.lineTo(-4.6 + i * 4, -40 - (i % 2) * 3);
        ctx.lineTo(-3 + i * 4, -32);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#2b6f8f";
      ellipse(ctx, 4, -39, 1.4, 1.1);
      ctx.fill();
      break;
    }
    case "skeleton": {
      ctx.strokeStyle = "#e6dcc2";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(-1.4, -14 + walk);
      ctx.moveTo(3, 0);
      ctx.lineTo(1.4, -14 - walk);
      ctx.moveTo(0, -14);
      ctx.lineTo(0, -30);
      ctx.stroke();
      ctx.fillStyle = "#efe6cd";
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(-5, -28 + i * 4.5, 10, 2);
      }
      ctx.beginPath();
      ctx.arc(1, -37, 6.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2b2119";
      ellipse(ctx, 3.4, -38, 1.6, 1.8);
      ctx.fill();
      ellipse(ctx, -0.6, -38, 1.6, 1.8);
      ctx.fill();
      ctx.strokeStyle = "#c9bb98";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -28);
      ctx.lineTo(13, -22 + walk);
      ctx.stroke();
      break;
    }
    case "vampire": {
      ctx.fillStyle = "#2a1420";
      ctx.beginPath();
      ctx.moveTo(-11, -2);
      ctx.quadraticCurveTo(-8, -34, 0, -40);
      ctx.quadraticCurveTo(8, -34, 11, -2);
      ctx.quadraticCurveTo(0, 3, -11, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#7d1c33";
      ctx.beginPath();
      ctx.moveTo(-5, -30);
      ctx.quadraticCurveTo(0, -8, 5, -30);
      ctx.quadraticCurveTo(0, -26, -5, -30);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e8dfe0";
      ellipse(ctx, 1.6, -41, 6.2, 6.6);
      ctx.fill();
      ctx.fillStyle = "#1d1118";
      ellipse(ctx, 1.6, -46, 6.6, 3.6);
      ctx.fill();
      ctx.fillStyle = "#b3243c";
      ellipse(ctx, 4, -41, 1.4, 1.2);
      ctx.fill();
      ellipse(ctx, -0.4, -41, 1.4, 1.2);
      ctx.fill();
      break;
    }
    case "boss": {
      const pulse = 1 + Math.sin(time * 3) * 0.03;
      ctx.scale(pulse, pulse);
      // cloak
      ctx.fillStyle = charging ? "#4a1226" : "#22101c";
      ctx.beginPath();
      ctx.moveTo(-30, -4);
      ctx.quadraticCurveTo(-26, -70, 0, -86);
      ctx.quadraticCurveTo(26, -70, 30, -4);
      ctx.quadraticCurveTo(0, 6, -30, -4);
      ctx.closePath();
      ctx.fill();
      // wings
      ctx.fillStyle = "rgba(120,20,45,0.75)";
      const flap = Math.sin(time * 2.4) * 8;
      ctx.beginPath();
      ctx.moveTo(-14, -64);
      ctx.quadraticCurveTo(-56, -70 - flap, -66, -28 + flap);
      ctx.quadraticCurveTo(-40, -44, -16, -40);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(14, -64);
      ctx.quadraticCurveTo(56, -70 - flap, 66, -28 + flap);
      ctx.quadraticCurveTo(40, -44, 16, -40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#8d1b34";
      ctx.beginPath();
      ctx.moveTo(-12, -64);
      ctx.quadraticCurveTo(0, -18, 12, -64);
      ctx.quadraticCurveTo(0, -58, -12, -64);
      ctx.closePath();
      ctx.fill();
      // head
      ctx.fillStyle = "#e6d8d8";
      ellipse(ctx, 0, -88, 11, 12);
      ctx.fill();
      ctx.fillStyle = "#d6b64a";
      ctx.beginPath();
      ctx.moveTo(-11, -98);
      for (let i = 0; i < 5; i++) {
        const bx = -11 + (i * 22) / 4;
        ctx.lineTo(bx + 2.2, -108);
        ctx.lineTo(bx + 4.4, -98);
      }
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = charging ? "#ffd166" : "#e02c46";
      ellipse(ctx, -4, -88, 2.4, 2);
      ctx.fill();
      ellipse(ctx, 4, -88, 2.4, 2);
      ctx.fill();
      break;
    }
  }
  ctx.restore();

  if (hurt > 0) {
    ctx.globalAlpha = Math.min(0.7, hurt);
    ctx.fillStyle = "#ff6b5e";
    const h = kind === "boss" ? 90 : 44;
    const w = kind === "boss" ? 30 : 11;
    ellipse(ctx, 0, -h / 2, w, h / 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
