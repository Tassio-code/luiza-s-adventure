import { useCallback, useEffect, useRef, useState } from "react";
import { GameEngine, type HudState } from "@/game/engine";
import { resolveAvatar, type AvatarConfig } from "@/game/avatar/options";
import { audio } from "@/game/audio";
import { LEVELS, WEAPONS } from "@/game/content";
import { assets } from "@/game/assets";
import { stageTrack } from "@/game/music";
import { Button } from "@/components/ui/button";

function Stick({
  onMove,
  label,
  fire,
  size = 128,
}: {
  onMove: (x: number, y: number, active: boolean) => void;
  label: string;
  fire?: boolean;
  size?: number;
}) {
  // Floating joystick: the base spawns where the finger lands inside the zone
  // and the knob tracks that finger anywhere on screen until it lifts.
  const zoneRef = useRef<HTMLDivElement | null>(null);
  const pointerId = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const [state, setState] = useState<{ active: boolean; ox: number; oy: number; kx: number; ky: number }>({
    active: false,
    ox: 0,
    oy: 0,
    kx: 0,
    ky: 0,
  });
  const radius = size / 2;

  const update = (clientX: number, clientY: number) => {
    let dx = (clientX - origin.current.x) / radius;
    let dy = (clientY - origin.current.y) / radius;
    const m = Math.hypot(dx, dy);
    if (m > 1) {
      dx /= m;
      dy /= m;
    }
    const travel = radius - 30;
    setState((s) => ({ ...s, kx: dx * travel, ky: dy * travel }));
    onMove(dx, dy, true);
  };

  const release = (e: React.PointerEvent) => {
    if (pointerId.current !== e.pointerId) return;
    pointerId.current = null;
    setState((s) => ({ ...s, active: false, kx: 0, ky: 0 }));
    onMove(0, 0, false);
  };

  return (
    <div
      ref={zoneRef}
      onPointerDown={(e) => {
        if (pointerId.current !== null) return;
        pointerId.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        const rect = e.currentTarget.getBoundingClientRect();
        origin.current = { x: e.clientX, y: e.clientY };
        setState({ active: true, ox: e.clientX - rect.left, oy: e.clientY - rect.top, kx: 0, ky: 0 });
        update(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pointerId.current === e.pointerId) update(e.clientX, e.clientY);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      className="relative touch-none"
      style={{ width: "100%", height: "100%" }}
      aria-label={label}
    >
      {/* Idle base hint (centered in the zone) */}
      {!state.active && (
        <div
          className={`pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border opacity-50 ${
            fire ? "border-accent/60 bg-accent/10" : "border-primary/40 bg-card/50"
          }`}
          style={{ width: size, height: size }}
        >
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              fire ? "bg-accent/60" : "bg-primary/50"
            }`}
            style={{ width: size / 2, height: size / 2 }}
          />
          <span className="absolute inset-x-0 bottom-1.5 text-center text-[9px] uppercase tracking-widest text-muted-foreground">
            {label}
          </span>
        </div>
      )}
      {/* Active base follows the finger */}
      {state.active && (
        <div
          className={`pointer-events-none absolute rounded-full border ${
            fire ? "border-accent/70 bg-accent/15" : "border-primary/50 bg-card/60"
          } backdrop-blur-sm`}
          style={{
            width: size,
            height: size,
            left: state.ox - radius,
            top: state.oy - radius,
          }}
        >
          <span
            className={`absolute left-1/2 top-1/2 rounded-full ${
              fire ? "bg-accent/85" : "bg-primary/75"
            }`}
            style={{
              width: size / 2,
              height: size / 2,
              transform: `translate(calc(-50% + ${state.kx}px), calc(-50% + ${state.ky}px))`,
            }}
          />
        </div>
      )}
    </div>
  );
}

export function LevelScene({
  levelIndex,
  avatar,
  onComplete,
  onExit,
}: {
  levelIndex: number;
  avatar: AvatarConfig;
  onComplete: () => void;
  onExit: () => void;
}) {
  const level = LEVELS[levelIndex];
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const completedRef = useRef(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [dead, setDead] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [touch, setTouch] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTouch(typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void assets.load().then(() => {
      if (!cancelled) setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const showToast = useCallback((text: string) => {
    if (text === "__pause__") {
      setPaused((p) => !p);
      return;
    }
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? null : t)), 1800);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !level || !loaded) return;
    audio.resume();
    const track = stageTrack(levelIndex);
    audio.playMusic("level", { id: track.id, src: track.src, duration: track.duration, loop: true });
    let engine: GameEngine | null = null;
    try {
      engine = new GameEngine(canvas, level, resolveAvatar(avatar), {
        onHud: setHud,
        onComplete: () => {
          completedRef.current = true;
          onComplete();
        },
        onDeath: () => setDead(true),
        onBoss: () => undefined,
        onToast: showToast,
      });
    } catch (err) {
      console.error(err);
      return;
    }
    engineRef.current = engine;
    engine.start();
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "KeyQ") engineRef.current?.useMedkit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      engine?.stop();
      engineRef.current = null;
      if (!completedRef.current) audio.stopMusic();
    };
  }, [attempt, avatar, level, levelIndex, loaded, onComplete, showToast]);

  useEffect(() => {
    engineRef.current?.setPaused(paused || dead);
  }, [paused, dead]);

  if (!level) return null;
  const weapon = WEAPONS[level.weapon];

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-background">
      <canvas ref={canvasRef} className="h-full w-full touch-none" />

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/90">
          <p className="text-sm uppercase tracking-widest text-primary">
            Carregando {level.region}…
          </p>
        </div>
      )}

      {/* Boss health: slim bar pinned to the very top, no name */}
      {hud && hud.phase === "boss" && hud.bossMaxHp > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 px-3 pt-[calc(0.35rem+env(safe-area-inset-top))]">
          <div className="mx-auto h-2.5 w-full max-w-md overflow-hidden rounded-full border border-accent/50 bg-ink/70">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-200"
              style={{ width: `${(hud.bossHp / hud.bossMaxHp) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* HUD */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 flex flex-col gap-2 ${
          touch ? "p-2 pt-6" : "p-4"
        }`}
      >
        <div className={`flex flex-col items-start gap-2 ${touch ? "pr-[8.5rem]" : "pr-2"}`}>
          <div
            className={`panel-parchment rounded-xl ${
              touch ? "origin-top-left scale-[0.8] px-3 py-2" : "px-4 py-3"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {level.name}
            </p>
            <div className="mt-1 h-2.5 w-40 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-destructive transition-[width] duration-200"
                style={{ width: `${hud ? (hud.hp / hud.maxHp) * 100 : 100}%` }}
              />
            </div>
            <p className="mt-1 text-sm text-foreground">
              {hud?.hp ?? 100} <span className="text-muted-foreground">vida</span> ·{" "}
              {hud?.medkits ?? 0} kit(s)
            </p>
            <p className="text-sm text-primary">
              {weapon.name} · {hud?.ammo ?? weapon.startAmmo} munição
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Nv {hud?.level ?? 1}
              </span>
              <span className="h-1.5 w-24 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-primary transition-[width] duration-200"
                  style={{ width: `${hud ? Math.min(100, (hud.xp / hud.xpNext) * 100) : 0}%` }}
                />
              </span>
            </div>
          </div>
          <div
            className={`panel-parchment rounded-xl ${
              touch
                ? "max-w-[70vw] origin-top-left scale-[0.8] px-3 py-1.5"
                : "max-w-[45%] px-4 py-2"
            }`}
          >
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Objetivo</p>
            <p className="text-sm text-foreground">{hud?.objective ?? level.intro}</p>
          </div>
        </div>
      </div>

      {toast && (
        <p className="pointer-events-none absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-card/90 px-4 py-2 text-sm text-primary shadow-frame">
          {toast}
        </p>
      )}

      {!touch && (
        <button
          type="button"
          onClick={() => setPaused(true)}
          className="absolute right-4 top-44 h-11 rounded-md border border-border bg-card/80 px-4 text-xs text-foreground active:scale-95"
        >
          Pausar
        </button>
      )}

      {touch && (
          <>
            {/* Action buttons stay on the right edge, clear of both floating sticks. */}
            <div className="absolute top-40 right-3 z-20 flex flex-col items-end gap-2">
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const engine = engineRef.current;
                  if (engine) engine.getInput().state.interact = true;
                }}
                className="h-10 min-w-[4.75rem] touch-none rounded-full border border-primary/50 bg-card/85 px-3 text-[11px] text-primary shadow-frame active:scale-95"
              >
                Interagir
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  engineRef.current?.useMedkit();
                }}
                className="h-10 min-w-[4.75rem] touch-none rounded-full border border-primary/50 bg-card/85 px-3 text-[11px] text-primary shadow-frame active:scale-95"
              >
                Curar
              </button>
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPaused(true);
                }}
                className="h-9 min-w-[4.25rem] touch-none rounded-full border border-border bg-card/80 px-3 text-[11px] text-foreground shadow-frame active:scale-95"
              >
                Pausar
              </button>
            </div>

            {/* Floating stick zones: left side moves, right side aims/fires */}
            <div className="absolute bottom-0 left-0 h-[58%] w-[36%] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]">
              <Stick
                label="Mover"
                size={104}
                onMove={(x, y) => engineRef.current?.getInput().setJoystick(x, y)}
              />
            </div>
            <div className="absolute bottom-0 right-0 h-[58%] w-[36%] pb-[env(safe-area-inset-bottom)] pr-[env(safe-area-inset-right)]">
              <Stick
                label="Mirar / Atirar"
                fire
                size={104}
                onMove={(x, y, active) => engineRef.current?.getInput().setAimStick(x, y, active)}
              />
            </div>
          </>
      )}

      {!touch && (
        <p className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
          WASD para mover · mouse para mirar · clique/espaço para atirar · E interagir · Q curar ·
          ESC pausar
        </p>
      )}

      {paused && !dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/80 p-6">
          <div className="panel-parchment w-full max-w-sm rounded-2xl p-6 text-center">
            <h2 className="text-xl text-primary">Pausado</h2>
            <p className="mt-2 text-sm text-muted-foreground">{level.intro}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Button onClick={() => setPaused(false)}>Continuar</Button>
              <Button variant="secondary" onClick={onExit}>
                Voltar ao mapa
              </Button>
            </div>
          </div>
        </div>
      )}

      {dead && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink/85 p-6">
          <div className="panel-parchment w-full max-w-sm rounded-2xl p-6 text-center">
            <h2 className="text-2xl text-destructive">Você caiu</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              A região continua esperando. Tente de novo — o fragmento ainda está lá.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <Button
                onClick={() => {
                  setDead(false);
                  setPaused(false);
                  setAttempt((a) => a + 1);
                }}
              >
                Tentar novamente
              </Button>
              <Button variant="secondary" onClick={onExit}>
                Voltar ao mapa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
