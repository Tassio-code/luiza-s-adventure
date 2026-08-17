import { useEffect, useRef } from "react";
import { resolveAvatar, type AvatarConfig } from "@/game/avatar/options";
import { drawAvatarPortrait, type WeaponVisual } from "@/game/avatar/renderer";

export function AvatarCanvas({
  config,
  weapon = "none",
  className,
}: {
  config: AvatarConfig;
  weapon?: WeaponVisual;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const start = performance.now();
    const render = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.floor(rect.width * dpr)) {
        canvas.width = Math.max(1, Math.floor(rect.width * dpr));
        canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawAvatarPortrait(
        ctx,
        resolveAvatar(configRef.current),
        (now - start) / 1000,
        rect.width,
        rect.height,
        weapon,
      );
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [weapon]);

  return <canvas ref={ref} className={className} aria-label="Prévia do avatar" />;
}
