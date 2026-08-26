type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  kind: "rocket" | "spark" | "smoke";
  hue: number;
  trail: boolean;
};

/** Fully procedural fireworks: rockets, gravity, explosions, secondary sparks, smoke. */
export class FireworksShow {
  private parts: Particle[] = [];
  private raf = 0;
  private last = 0;
  private timer = 0;
  private running = false;

  constructor(
    private canvas: HTMLCanvasElement,
    private ctx: CanvasRenderingContext2D,
    private onBoom: () => void,
  ) {}

  start() {
    if (this.running) return;
    this.running = true;
    this.resize();
    window.addEventListener("resize", this.resize);
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.parts.length = 0;
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, rect.width * dpr);
    this.canvas.height = Math.max(1, rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  private get w() {
    return this.canvas.getBoundingClientRect().width;
  }
  private get h() {
    return this.canvas.getBoundingClientRect().height;
  }

  private launch() {
    const hue = Math.floor(Math.random() * 360);
    const depth = 0.6 + Math.random() * 0.6;
    this.parts.push({
      x: this.w * (0.15 + Math.random() * 0.7),
      y: this.h + 10,
      vx: (Math.random() - 0.5) * 60,
      vy: -(360 + Math.random() * 190) * depth,
      life: 1.1 + Math.random() * 0.6,
      maxLife: 1.7,
      color: `hsl(${hue}, 95%, 72%)`,
      size: 2.6 * depth,
      kind: "rocket",
      hue,
      trail: true,
    });
  }

  private explode(p: Particle) {
    const style = Math.floor(Math.random() * 3);
    const count = style === 0 ? 90 : style === 1 ? 60 : 120;
    for (let i = 0; i < count; i++) {
      const a = style === 1 ? (i / count) * Math.PI * 2 : Math.random() * Math.PI * 2;
      const speed = style === 1 ? 190 : 90 + Math.random() * 230;
      this.parts.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: 1.1 + Math.random() * 1.1,
        maxLife: 2.2,
        color: `hsl(${(p.hue + (style === 2 ? Math.random() * 60 : 0)) % 360}, 95%, ${60 + Math.random() * 25}%)`,
        size: p.size * (0.7 + Math.random() * 0.7),
        kind: "spark",
        hue: p.hue,
        trail: true,
      });
    }
    for (let i = 0; i < 12; i++) {
      this.parts.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 50,
        vy: (Math.random() - 0.5) * 50,
        life: 1.6,
        maxLife: 1.6,
        color: "rgba(255,255,255,1)",
        size: 8 + Math.random() * 12,
        kind: "smoke",
        hue: p.hue,
        trail: false,
      });
    }
    this.onBoom();
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.timer -= dt;
    if (this.timer <= 0) {
      this.timer = 0.35 + Math.random() * 0.55;
      this.launch();
      if (Math.random() < 0.35) this.launch();
    }

    const ctx = this.ctx;
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(8,6,14,0.24)";
    ctx.fillRect(0, 0, this.w, this.h);
    ctx.globalCompositeOperation = "lighter";

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      p.vy += (p.kind === "smoke" ? -14 : 190) * dt;
      p.vx *= p.kind === "spark" ? 0.985 : 0.995;
      p.vy *= p.kind === "spark" ? 0.985 : 1;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.kind === "rocket") {
        ctx.fillStyle = "rgba(255,220,160,0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        if (Math.random() < 0.8) {
          this.parts.push({
            x: p.x,
            y: p.y,
            vx: (Math.random() - 0.5) * 20,
            vy: 20,
            life: 0.4,
            maxLife: 0.4,
            color: "rgba(255,180,90,1)",
            size: 1.6,
            kind: "spark",
            hue: p.hue,
            trail: false,
          });
        }
        if (p.life <= 0 || p.vy > -40) {
          this.explode(p);
          this.parts.splice(i, 1);
          continue;
        }
      } else {
        const t = Math.max(0, p.life / p.maxLife);
        ctx.globalAlpha = p.kind === "smoke" ? t * 0.06 : t;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(
          p.x,
          p.y,
          p.size * (p.kind === "smoke" ? 1 + (1 - t) * 2.5 : t * 0.9 + 0.4),
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        if (p.life <= 0 || p.y > this.h + 60) {
          this.parts.splice(i, 1);
          continue;
        }
      }
    }
    if (this.parts.length > 2600) this.parts.splice(0, this.parts.length - 2600);
    this.raf = requestAnimationFrame(this.loop);
  };
}
