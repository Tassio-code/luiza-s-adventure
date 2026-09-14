import { useEffect, useRef } from "react";

/**
 * Cinematic fragment fusion: canvas-driven orbit collapse, energy arcs,
 * shockwaves, light rays and a final bloom that reveals the parchment.
 * Purely presentational — calls onDone when the sequence completes.
 */
export function FragmentMerge({
  onDone,
  onImpact,
  duration = 7000,
}: {
  onDone: () => void;
  onImpact?: () => void;
  duration?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);
  const impactRef = useRef(false);
  const onDoneRef = useRef(onDone);
  const onImpactRef = useRef(onImpact);
  onDoneRef.current = onDone;
  onImpactRef.current = onImpact;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    type Star = { x: number; y: number; r: number; a: number; s: number };
    const stars: Star[] = Array.from({ length: 140 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 1.4,
      a: 0.15 + Math.random() * 0.5,
      s: 0.3 + Math.random() * 1.2,
    }));

    type Spark = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      max: number;
      hue: number;
      size: number;
    };
    const sparks: Spark[] = [];
    const rings: { t: number; max: number; width: number }[] = [];

    const FRAGS = 5;
    const trails: { x: number; y: number; a: number }[][] = Array.from({ length: FRAGS }, () => []);

    // Timeline (ms)
    const T_ORBIT = duration * 0.5; // orbit + collapse
    const T_IMPACT = duration * 0.62; // fusion flash
    const T_BLOOM = duration * 0.86; // light rays / expansion

    const start = performance.now();

    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const frame = (now: number) => {
      const el = now - start;
      const cx = w / 2;
      const cy = h / 2;
      const base = Math.min(w, h);

      // shake around impact
      let shake = 0;
      if (el > T_IMPACT - 220 && el < T_IMPACT + 520) {
        const k = 1 - Math.abs(el - T_IMPACT) / 520;
        shake = Math.max(0, k) * 9;
      }
      const sx = (Math.random() - 0.5) * shake;
      const sy = (Math.random() - 0.5) * shake;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#09070a";
      ctx.fillRect(0, 0, w, h);
      ctx.translate(sx, sy);

      // starfield drift
      ctx.globalCompositeOperation = "lighter";
      for (const st of stars) {
        const px = st.x * w;
        const py = ((st.y + (el / 20000) * st.s) % 1) * h;
        ctx.globalAlpha = st.a * (0.6 + 0.4 * Math.sin(el / 600 + st.x * 20));
        ctx.fillStyle = "#ffe8b0";
        ctx.beginPath();
        ctx.arc(px, py, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ---- fragment positions ----
      const collapse = Math.min(1, el / T_ORBIT);
      const radius = (1 - easeInOut(collapse)) * base * 0.34 + 2;
      const spin = el / 1000 * (1.1 + collapse * 6);
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < FRAGS; i++) {
        const a = (i / FRAGS) * Math.PI * 2 + spin;
        const wob = Math.sin(el / 300 + i) * (1 - collapse) * 10;
        pts.push({ x: cx + Math.cos(a) * (radius + wob), y: cy + Math.sin(a) * (radius + wob) });
      }

      const fused = el >= T_IMPACT;

      // trails
      if (!fused) {
        for (let i = 0; i < FRAGS; i++) {
          trails[i]!.push({ x: pts[i]!.x, y: pts[i]!.y, a: 1 });
          if (trails[i]!.length > 26) trails[i]!.shift();
        }
      }
      for (let i = 0; i < FRAGS; i++) {
        const tr = trails[i]!;
        for (let j = 1; j < tr.length; j++) {
          const p0 = tr[j - 1]!;
          const p1 = tr[j]!;
          const k = j / tr.length;
          ctx.strokeStyle = `hsla(${38 + i * 5}, 92%, ${58 + k * 20}%, ${k * 0.48})`;
          ctx.lineWidth = 1 + k * 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
        if (fused) tr.shift();
      }

      // Fine luminous threads stitch the parchment pieces together.
      if (!fused && collapse > 0.25) {
        const strength = (collapse - 0.25) / 0.75;
        for (let i = 0; i < FRAGS; i++) {
          const a = pts[i]!;
          const b = pts[(i + 1) % FRAGS]!;
          ctx.strokeStyle = `hsla(43, 96%, 74%, ${0.12 + strength * 0.46})`;
          ctx.lineWidth = 1 + strength * 1.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          const segs = 6;
          for (let s = 1; s < segs; s++) {
            const t = s / segs;
            const curve = Math.sin(t * Math.PI) * 10 * strength;
            ctx.lineTo(a.x + (b.x - a.x) * t + curve, a.y + (b.y - a.y) * t - curve);
          }
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // fragments themselves
      if (!fused) {
        for (let i = 0; i < FRAGS; i++) {
          const p = pts[i]!;
          const size = base * 0.045 * (1 - collapse * 0.35);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(spin * 1.4 + i);
          const g = ctx.createLinearGradient(-size, -size, size, size);
          g.addColorStop(0, "hsla(48,92%,88%,0.98)");
          g.addColorStop(0.55, `hsla(${39 + i * 4},84%,68%,0.98)`);
          g.addColorStop(1, "hsla(17,72%,42%,0.96)");
          ctx.fillStyle = g;
          ctx.shadowColor = "hsla(43,100%,68%,0.9)";
          ctx.shadowBlur = 26;
          ctx.beginPath();
          ctx.moveTo(-size * 0.15, -size);
          ctx.lineTo(size * 0.76, -size * 0.36);
          ctx.lineTo(size * 0.52, size * 0.78);
          ctx.lineTo(-size * 0.28, size);
          ctx.lineTo(-size * 0.78, size * 0.18);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = "hsla(52,100%,92%,0.72)";
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.restore();

          if (Math.random() < 0.5) {
            sparks.push({
              x: p.x,
              y: p.y,
              vx: (Math.random() - 0.5) * 60,
              vy: (Math.random() - 0.5) * 60,
              life: 0,
              max: 0.5 + Math.random() * 0.6,
              hue: 34 + Math.random() * 22,
              size: 1 + Math.random() * 2,
            });
          }
        }
      }

      // impact burst
      if (fused && !impactRef.current) {
        impactRef.current = true;
        onImpactRef.current?.();
        rings.push({ t: 0, max: base * 0.75, width: 10 });
        rings.push({ t: -0.12, max: base * 1.1, width: 4 });
        for (let i = 0; i < 220; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 120 + Math.random() * 520;
          sparks.push({
            x: cx,
            y: cy,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            life: 0,
            max: 0.7 + Math.random() * 1.1,
            hue: 32 + Math.random() * 28,
            size: 1 + Math.random() * 2.6,
          });
        }
      }

      // sparks
      const dt = 1 / 60;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]!;
        s.life += dt;
        if (s.life >= s.max) {
          sparks.splice(i, 1);
          continue;
        }
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vx *= 0.965;
        s.vy *= 0.965;
        const k = 1 - s.life / s.max;
        ctx.globalAlpha = k;
        ctx.fillStyle = `hsl(${s.hue}, 100%, ${65 + k * 25}%)`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // shockwave rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]!;
        r.t += dt / 1.1;
        if (r.t > 1) {
          rings.splice(i, 1);
          continue;
        }
        if (r.t < 0) continue;
        const rad = easeOut(r.t) * r.max;
        ctx.strokeStyle = `hsla(44,100%,78%,${(1 - r.t) * 0.55})`;
        ctx.lineWidth = r.width * (1 - r.t) + 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.stroke();
      }

      // core glow
      const coreT = fused ? Math.min(1, (el - T_IMPACT) / 900) : collapse;
      const coreR = fused
        ? base * (0.06 + 0.16 * easeOut(coreT))
        : base * (0.02 + 0.05 * collapse);
      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 2.6);
      cg.addColorStop(0, "rgba(255,255,255,0.95)");
      cg.addColorStop(0.28, "hsla(44,100%,72%,0.72)");
      cg.addColorStop(1, "hsla(18,90%,42%,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR * 2.6, 0, Math.PI * 2);
      ctx.fill();

      // god rays after fusion
      if (fused) {
        const rt = Math.min(1, (el - T_IMPACT) / (T_BLOOM - T_IMPACT));
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(el / 4000);
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * Math.PI * 2;
          const len = base * (0.2 + 0.6 * easeOut(rt)) * (0.6 + 0.4 * Math.sin(i * 2.1 + el / 500));
          ctx.globalAlpha = 0.16 * (1 - rt * 0.35);
          ctx.fillStyle = "hsl(44,100%,78%)";
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a - 0.03) * len, Math.sin(a - 0.03) * len);
          ctx.lineTo(Math.cos(a + 0.03) * len, Math.sin(a + 0.03) * len);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      // white flash at impact
      if (el > T_IMPACT - 60 && el < T_IMPACT + 420) {
        const k = 1 - Math.abs(el - T_IMPACT) / 420;
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,255,255,${Math.max(0, k) * 0.85})`;
        ctx.fillRect(-40, -40, w + 80, h + 80);
      }

      ctx.globalCompositeOperation = "source-over";

      // final fade to black
      if (el > T_BLOOM) {
        const k = Math.min(1, (el - T_BLOOM) / (duration - T_BLOOM));
        ctx.fillStyle = `rgba(5,6,11,${k})`;
        ctx.fillRect(-40, -40, w + 80, h + 80);
      }

      if (el >= duration) {
        if (!doneRef.current) {
          doneRef.current = true;
          onDoneRef.current();
        }
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [duration]);

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-x-0 bottom-12 flex flex-col items-center gap-3 px-8">
        <p className="animate-fade-in text-center text-[11px] uppercase tracking-[0.42em] text-primary/80">
          os cinco fragmentos se tornam um
        </p>
      </div>
      <button
        type="button"
        aria-label="Pular animação"
        className="absolute bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-[calc(0.75rem+env(safe-area-inset-right))] rounded-full border border-primary/30 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-primary/70"
        onClick={() => {
          if (!doneRef.current) {
            doneRef.current = true;
            onDone();
          }
        }}
      >
        Pular
      </button>
    </main>
  );
}
