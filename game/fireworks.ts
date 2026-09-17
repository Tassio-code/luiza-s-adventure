type Kind = "rocket" | "spark" | "glitter" | "ember";

type Particle = {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  hue: number;
  sat: number;
  light: number;
  size: number;
  drag: number;
  gravity: number;
  kind: Kind;
  twinkle: number;
  crackle: boolean;
};

type Flash = { x: number; y: number; life: number; maxLife: number; hue: number; radius: number };

const TAU = Math.PI * 2;

/**
 * Fully procedural fireworks: rockets with tapered trails, multi-style shells,
 * bloom flashes, glitter twinkle and crackling embers.
 *
 * The canvas is cleared completely every frame (streaks come from per-particle
 * previous positions), so no ghost smudges are ever left on the background.
 */
export class FireworksShow {
  private parts: Particle[] = [];
  private flashes: Flash[] = [];
  private raf = 0;
  private last = 0;
  private timer = 0;
  private running = false;
  private fading = false;
  private shake = 0;

  /** Stops launching new rockets; remaining sparks fade out naturally. */
  fadeOut() {
    this.fading = true;
  }

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
    this.timer = 0.2;
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.parts.length = 0;
    this.flashes.length = 0;
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.vw = rect.width;
    this.vh = rect.height;
  };

  private dpr = 1;
  private vw = 1;
  private vh = 1;

  private get w() {
    return this.vw;
  }
  private get h() {
    return this.vh;
  }

  private spark(o: Partial<Particle> & { x: number; y: number; kind: Kind }): void {
    this.parts.push({
      px: o.x,
      py: o.y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      hue: 40,
      sat: 95,
      light: 70,
      size: 2,
      drag: 0.86,
      gravity: 150,
      twinkle: Math.random() * TAU,
      crackle: false,
      ...o,
    } as Particle);
  }

  private launch() {
    const hue = Math.floor(Math.random() * 360);
    const depth = 0.65 + Math.random() * 0.55;
    this.spark({
      kind: "rocket",
      x: this.w * (0.12 + Math.random() * 0.76),
      y: this.h + 8,
      vx: (Math.random() - 0.5) * 70,
      vy: -(380 + Math.random() * 200) * depth,
      life: 1.05 + Math.random() * 0.55,
      maxLife: 1.6,
      hue,
      sat: 90,
      light: 80,
      size: 2.2 * depth,
      drag: 0.999,
      gravity: 195,
    });
  }

  private explode(p: Particle) {
    // 0 crisântemo, 1 anel duplo, 2 salgueiro, 3 palma multicor, 4 crackle
    const style = Math.floor(Math.random() * 5);
    const base = p.hue;
    const alt = (base + 120 + Math.random() * 120) % 360;
    const scale = 0.85 + Math.random() * 0.5;

    this.flashes.push({
      x: p.x,
      y: p.y,
      life: 0.42,
      maxLife: 0.42,
      hue: base,
      radius: (70 + Math.random() * 60) * scale,
    });
    this.shake = Math.min(6, this.shake + 2.2);

    const emit = (count: number, opts: (i: number, n: number) => Partial<Particle>) => {
      for (let i = 0; i < count; i++) {
        this.spark({ x: p.x, y: p.y, kind: "spark", ...opts(i, count) } as never);
      }
    };

    if (style === 0) {
      emit(150, () => {
        const a = Math.random() * TAU;
        const s = (110 + Math.random() * 250) * scale;
        return {
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1.3 + Math.random() * 1.0,
          maxLife: 2.3,
          hue: base + (Math.random() - 0.5) * 24,
          light: 62 + Math.random() * 26,
          size: 1.6 + Math.random() * 1.5,
          drag: 0.9,
          gravity: 130,
        };
      });
    } else if (style === 1) {
      for (const [ring, hue] of [
        [1, base],
        [0.62, alt],
      ] as const) {
        const n = 74;
        emit(n, (i) => {
          const a = (i / n) * TAU + Math.random() * 0.03;
          const s = 265 * ring * scale;
          return {
            vx: Math.cos(a) * s,
            vy: Math.sin(a) * s * 0.92,
            life: 1.4 + Math.random() * 0.5,
            maxLife: 2,
            hue,
            light: 70,
            size: 1.8,
            drag: 0.9,
            gravity: 120,
          };
        });
      }
    } else if (style === 2) {
      emit(120, () => {
        const a = Math.random() * TAU;
        const s = (70 + Math.random() * 150) * scale;
        return {
          kind: "ember",
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 2.1 + Math.random() * 1.4,
          maxLife: 3.5,
          hue: base,
          sat: 85,
          light: 68,
          size: 1.7,
          drag: 0.965,
          gravity: 175,
        };
      });
    } else if (style === 3) {
      emit(140, () => {
        const a = Math.random() * TAU;
        const s = (120 + Math.random() * 230) * scale;
        return {
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1.2 + Math.random() * 1.1,
          maxLife: 2.3,
          hue: Math.random() < 0.5 ? base : alt,
          light: 64 + Math.random() * 24,
          size: 1.5 + Math.random() * 1.6,
          drag: 0.9,
          gravity: 140,
        };
      });
    } else {
      emit(110, () => {
        const a = Math.random() * TAU;
        const s = (110 + Math.random() * 220) * scale;
        return {
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
          life: 1.1 + Math.random() * 0.9,
          maxLife: 2,
          hue: base,
          light: 70,
          size: 1.7,
          drag: 0.9,
          gravity: 140,
          crackle: true,
        };
      });
    }

    // Poeira brilhante que fica cintilando no céu.
    emit(46, () => {
      const a = Math.random() * TAU;
      const s = (30 + Math.random() * 130) * scale;
      return {
        kind: "glitter",
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: 1.6 + Math.random() * 1.6,
        maxLife: 3.2,
        hue: base,
        sat: 40,
        light: 92,
        size: 1.3,
        drag: 0.94,
        gravity: 60,
      };
    });

    this.onBoom();
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;

    this.timer -= dt;
    if (!this.fading && this.timer <= 0) {
      this.timer = 0.32 + Math.random() * 0.5;
      this.launch();
      if (Math.random() < 0.45) this.launch();
      if (Math.random() < 0.12) {
        this.launch();
        this.launch();
      }
    }

    const ctx = this.ctx;
    // Limpeza total: nada de rastro acumulado no fundo.
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);

    this.shake *= Math.pow(0.001, dt);
    if (this.shake > 0.05) {
      const a = Math.random() * TAU;
      ctx.setTransform(
        this.dpr,
        0,
        0,
        this.dpr,
        Math.cos(a) * this.shake * this.dpr,
        Math.sin(a) * this.shake * this.dpr,
      );
    }

    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";

    // Bloom das explosões.
    for (let i = this.flashes.length - 1; i >= 0; i--) {
      const f = this.flashes[i];
      f.life -= dt;
      if (f.life <= 0) {
        this.flashes.splice(i, 1);
        continue;
      }
      const t = f.life / f.maxLife;
      const r = f.radius * (1.25 - t * 0.55);
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, `hsla(${f.hue}, 100%, 92%, ${0.5 * t})`);
      g.addColorStop(0.35, `hsla(${f.hue}, 95%, 68%, ${0.22 * t})`);
      g.addColorStop(1, `hsla(${f.hue}, 95%, 50%, 0)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, TAU);
      ctx.fill();
    }

    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      p.px = p.x;
      p.py = p.y;
      p.vy += p.gravity * dt;
      const d = Math.pow(p.drag, dt * 60);
      p.vx *= d;
      p.vy *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.kind === "rocket") {
        // Rastro quente com faíscas caindo.
        ctx.strokeStyle = `hsla(${p.hue}, 90%, 85%, 0.9)`;
        ctx.lineWidth = p.size * 1.5;
        ctx.beginPath();
        ctx.moveTo(p.px, p.py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.fillStyle = "rgba(255,240,205,0.95)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.35, 0, TAU);
        ctx.fill();

        if (Math.random() < 0.85) {
          this.spark({
            kind: "ember",
            x: p.x + (Math.random() - 0.5) * 3,
            y: p.y,
            vx: (Math.random() - 0.5) * 30 - p.vx * 0.06,
            vy: 30 + Math.random() * 40,
            life: 0.34 + Math.random() * 0.25,
            maxLife: 0.6,
            hue: 32,
            sat: 100,
            light: 72,
            size: 1.2,
            drag: 0.9,
            gravity: 120,
          });
        }
        if (p.life <= 0 || p.vy > -40) {
          this.explode(p);
          this.parts.splice(i, 1);
          continue;
        }
        continue;
      }

      const t = Math.max(0, p.life / p.maxLife);
      let alpha = t * t * 0.95 + 0.05;
      if (p.kind === "glitter") {
        p.twinkle += dt * 26;
        alpha *= 0.35 + 0.65 * Math.abs(Math.sin(p.twinkle));
      }
      if (p.crackle && Math.random() < dt * 6) {
        alpha = 1;
      }

      const color = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha})`;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(0.6, p.size * (0.45 + t * 0.9));
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

      // Núcleo quente.
      ctx.fillStyle = `hsla(${p.hue}, ${Math.max(0, p.sat - 30)}%, ${Math.min(98, p.light + 20)}%, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.5, p.size * (0.35 + t * 0.5)), 0, TAU);
      ctx.fill();

      if (p.life <= 0 || p.y > this.h + 80) {
        this.parts.splice(i, 1);
      }
    }

    ctx.globalCompositeOperation = "source-over";
    if (this.parts.length > 3200) this.parts.splice(0, this.parts.length - 3200);
    this.raf = requestAnimationFrame(this.loop);
  };
}
