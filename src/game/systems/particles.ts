export type Particle = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  shape: "spark" | "dot" | "smoke" | "shard";
};

/** Pooled particle system — never allocates during a frame after warm-up. */
export class ParticleSystem {
  private pool: Particle[] = [];
  private cursor = 0;

  constructor(private capacity = 900) {}

  spawn(p: Partial<Particle>) {
    let particle: Particle | undefined;
    for (let i = 0; i < this.pool.length; i++) {
      const idx = (this.cursor + i) % this.pool.length;
      if (!this.pool[idx].active) {
        particle = this.pool[idx];
        this.cursor = (idx + 1) % this.pool.length;
        break;
      }
    }
    if (!particle) {
      if (this.pool.length >= this.capacity) {
        particle = this.pool[this.cursor % this.pool.length];
        this.cursor++;
      } else {
        particle = {
          active: false,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          life: 0,
          maxLife: 1,
          size: 2,
          color: "#fff",
          gravity: 0,
          drag: 0.98,
          shape: "dot",
        };
        this.pool.push(particle);
      }
    }
    particle.active = true;
    particle.x = p.x ?? 0;
    particle.y = p.y ?? 0;
    particle.vx = p.vx ?? 0;
    particle.vy = p.vy ?? 0;
    particle.maxLife = p.maxLife ?? p.life ?? 0.6;
    particle.life = particle.maxLife;
    particle.size = p.size ?? 2.5;
    particle.color = p.color ?? "#ffffff";
    particle.gravity = p.gravity ?? 0;
    particle.drag = p.drag ?? 0.96;
    particle.shape = p.shape ?? "dot";
  }

  burst(
    x: number,
    y: number,
    count: number,
    color: string,
    opts: {
      speed?: number;
      life?: number;
      size?: number;
      shape?: Particle["shape"];
      gravity?: number;
    } = {},
  ) {
    const speed = opts.speed ?? 140;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.9);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        color,
        life: (opts.life ?? 0.5) * (0.6 + Math.random() * 0.8),
        size: (opts.size ?? 2.6) * (0.7 + Math.random() * 0.8),
        shape: opts.shape ?? "spark",
        gravity: opts.gravity ?? 0,
        drag: 0.93,
      });
    }
  }

  update(dt: number) {
    for (const p of this.pool) {
      if (!p.active) continue;
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      p.vy += p.gravity * dt;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  render(ctx: CanvasRenderingContext2D) {
    for (const p of this.pool) {
      if (!p.active) continue;
      const t = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = p.shape === "smoke" ? t * 0.4 : t;
      ctx.fillStyle = p.color;
      if (p.shape === "spark") {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size * (0.6 + t), p.size * 0.7);
      } else if (p.shape === "shard") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.vx * 0.01);
        ctx.fillRect(-p.size / 2, -p.size, p.size, p.size * 2);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          p.size * (p.shape === "smoke" ? 1 + (1 - t) * 2 : t + 0.3),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.pool) p.active = false;
  }

  get activeCount() {
    return this.pool.reduce((n, p) => n + (p.active ? 1 : 0), 0);
  }
}
