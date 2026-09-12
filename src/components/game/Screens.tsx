import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/content";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { FINAL_MESSAGE, BIRTHDAY_NAME } from "@/game/message";
import { AvatarCanvas } from "./AvatarCanvas";
import { InstallButton } from "./InstallButton";
import type { AvatarConfig } from "@/game/avatar/options";

export function TitleScreen({
  onStart,
  hasSave,
  onContinue,
}: {
  onStart: () => void;
  hasSave: boolean;
  onContinue: () => void;
}) {
  return (
    <main className="vignette-screen flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-4 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-primary">
        uma aventura para {BIRTHDAY_NAME}
      </p>
      <h1 className="max-w-2xl text-4xl leading-tight text-primary text-glow sm:text-6xl">
        Os Cinco Fragmentos
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
        Cinco regiões, cinco fragmentos e uma mensagem escondida no final. Crie sua heroína e
        atravesse a floresta, a cidade, a neve, o deserto e o castelo.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onStart}>
          {hasSave ? "Nova jornada" : "Começar"}
        </Button>
        {hasSave && (
          <Button size="lg" variant="secondary" onClick={onContinue}>
            Continuar
          </Button>
        )}
      </div>
    </main>
  );
}

export function WorldMap({
  avatar,
  unlocked,
  fragments,
  onPlay,
  onOpenMessage,
  onEditAvatar,
}: {
  avatar: AvatarConfig;
  unlocked: number;
  fragments: number[];
  onPlay: (index: number) => void;
  onOpenMessage: () => void;
  onEditAvatar: () => void;
}) {
  const all = fragments.length >= LEVELS.length;

  return (
    <main className="vignette-screen min-h-dvh overflow-hidden px-[calc(0.75rem+env(safe-area-inset-left))] py-2 pr-[calc(0.75rem+env(safe-area-inset-right))]">
      <div className="world-map-layout mx-auto w-full max-w-6xl">
        <header className="world-map-profile panel-parchment grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl p-3">
          <AvatarCanvas config={avatar} className="world-map-avatar h-16 w-12 shrink-0" />
          <div className="min-w-0">
            <h1 className="truncate text-lg text-primary">{avatar.name || "Sua heroína"}</h1>
            <p className="text-xs text-muted-foreground">
              Fragmentos {fragments.length}/{LEVELS.length}
            </p>
            <div className="mt-2 flex gap-1">
              {LEVELS.map((l, i) => (
                <span
                  key={l.id}
                  className={`h-3.5 w-3.5 rotate-45 rounded-sm ${
                    fragments.includes(i)
                      ? "bg-primary animate-fragment"
                      : "border border-border bg-secondary"
                  }`}
                />
              ))}
            </div>
          </div>
        </header>

        {/* 3D-ish journey map: a perspective path with five nodes, no names. */}
        <div
          className="world-map-board panel-parchment relative overflow-hidden rounded-xl px-3 py-4"
          style={{ perspective: "700px" }}
        >
          <div
            className="world-map-path flex flex-col-reverse items-center gap-4"
            style={{ transform: "rotateX(16deg)" }}
          >
            {LEVELS.map((l, i) => {
              const locked = i > unlocked;
              const done = fragments.includes(i);
              const current = !locked && !done;
              return (
                <button
                  key={l.id}
                  type="button"
                  disabled={locked}
                  aria-label={`Fase ${i + 1}${locked ? " bloqueada" : done ? " concluída" : ""}`}
                  onClick={() => {
                    audio.ui();
                    if (!locked) onPlay(i);
                  }}
                  className={`world-map-node ${i % 2 === 0 ? "world-map-node-even" : "world-map-node-odd"} relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-base transition-transform active:scale-95 ${
                    locked
                      ? "border-border/60 bg-secondary/60 text-muted-foreground"
                      : done
                        ? "border-primary bg-primary/25 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.45)]"
                        : "border-accent bg-accent/20 text-accent shadow-[0_0_28px_hsl(var(--accent)/0.45)]"
                  }`}
                >
                  {locked ? "🔒" : done ? "◆" : "▶"}
                  {current && (
                    <span className="absolute -inset-1 animate-ping rounded-full border border-accent/50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="world-map-actions grid min-w-0 gap-2">
          <Button variant="secondary" className="h-10 w-full px-2 text-xs" onClick={onEditAvatar}>
            Ajustar avatar
          </Button>
          <InstallButton className="min-w-0" />
          {all && (
            <Button className="h-10 w-full px-2 text-xs" onClick={onOpenMessage}>
              Abrir o pergaminho
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

export function FragmentReward({
  levelIndex,
  total,
  onContinue,
}: {
  levelIndex: number;
  total: number;
  onContinue: () => void;
}) {
  const level = LEVELS[levelIndex];
  useEffect(() => {
    audio.fragment();
  }, []);
  return (
    <main className="vignette-screen flex min-h-dvh flex-col items-center justify-center gap-4 px-6 py-4 text-center">
      <span className="h-24 w-24 rotate-45 rounded-lg bg-primary animate-fragment" />
      <div>
        <h1 className="text-3xl text-primary text-glow">Fragmento obtido</h1>
        <p className="mt-2 text-lg text-foreground">{level?.fragmentName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{total}/5 reunidos</p>
      </div>
      <Button size="lg" onClick={onContinue}>
        Voltar ao mapa
      </Button>
    </main>
  );
}

export function FinalMessage({ onFireworks }: { onFireworks: () => void }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    audio.playMusic("ending");
    return () => audio.stopMusic();
  }, []);
  const last = index >= FINAL_MESSAGE.length - 1;
  return (
    <main className="vignette-screen flex min-h-dvh items-center justify-center px-4 py-4">
      <div className="panel-parchment w-full max-w-2xl rounded-2xl p-8">
        <div className="mb-6 flex justify-center gap-2">
          {LEVELS.map((l) => (
            <span key={l.id} className="h-4 w-4 rotate-45 rounded-sm bg-primary animate-fragment" />
          ))}
        </div>
        <p
          className="min-h-[10rem] whitespace-pre-line text-base leading-relaxed text-foreground animate-title-in"
          key={index}
        >
          {FINAL_MESSAGE[index]}
        </p>
        <div className="mt-8 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {index + 1} / {FINAL_MESSAGE.length}
          </p>
          {last ? (
            <Button onClick={onFireworks}>Ver os fogos</Button>
          ) : (
            <Button onClick={() => setIndex((i) => i + 1)}>Continuar</Button>
          )}
        </div>
      </div>
    </main>
  );
}

export function Fireworks({ onBackToMap }: { onBackToMap: () => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const show = new FireworksShow(canvas, ctx, () => audio.firework());
    show.start();
    const t1 = window.setTimeout(() => setStep(1), 2600);
    return () => {
      window.clearTimeout(t1);
      show.stop();
    };
  }, []);
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ink">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl text-primary text-glow sm:text-6xl">
          FELIZ ANIVERSÁRIO
        </h1>
        {step >= 1 && (
          <p className="animate-title-in text-lg text-foreground sm:text-2xl">
            Que seus sonhos se tornem realidade.
          </p>
        )}
        <Button variant="secondary" className="mt-6" onClick={onBackToMap}>
          Voltar ao mapa
        </Button>
      </div>
    </main>
  );
}
