import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEVELS } from "@/game/content";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { FINAL_MESSAGE, BIRTHDAY_NAME } from "@/game/message";
import { AvatarCanvas } from "./AvatarCanvas";
import { InstallButton } from "./InstallButton";
import type { AvatarConfig } from "@/game/avatar/options";
import { Building2, Castle, Check, Lock, Pyramid, ScrollText, Snowflake, Trees, UserRound } from "lucide-react";

const MAP_ICONS = [Trees, Building2, Snowflake, Pyramid, Castle];

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
    <main className="world-map-screen h-dvh overflow-hidden px-[calc(0.5rem+env(safe-area-inset-left))] py-2 pr-[calc(0.5rem+env(safe-area-inset-right))]">
      <div className="world-map-layout relative mx-auto h-full w-full max-w-7xl overflow-hidden rounded-xl border border-primary/35">
        <div className="world-map-sky" aria-hidden="true" />
        <div className="world-map-biomes" aria-hidden="true">
          <span className="map-biome map-biome-forest" />
          <span className="map-biome map-biome-city" />
          <span className="map-biome map-biome-snow" />
          <span className="map-biome map-biome-desert" />
          <span className="map-biome map-biome-castle" />
        </div>
        <div className="world-map-mist" aria-hidden="true" />

        <header className="world-map-profile absolute left-3 top-3 z-20 flex items-center gap-2 rounded-lg border border-primary/30 bg-ink/75 px-2.5 py-1.5 backdrop-blur-md">
          <AvatarCanvas config={avatar} className="world-map-avatar h-12 w-9 shrink-0" />
          <div className="min-w-0">
            <h1 className="max-w-40 truncate text-sm text-primary">{avatar.name || "Sua heroína"}</h1>
            <p className="text-[10px] uppercase text-muted-foreground">Jornada dos fragmentos</p>
            <div className="mt-1 flex items-center gap-1" aria-label={`${fragments.length} de ${LEVELS.length} fragmentos`}>
              {LEVELS.map((level, i) => (
                <span
                  key={level.id}
                  className={`h-2.5 w-2.5 rotate-45 rounded-sm ${
                    fragments.includes(i) ? "bg-primary shadow-glow" : "border border-border bg-secondary"
                  }`}
                />
              ))}
              <span className="ml-1 text-[10px] font-bold text-primary">{fragments.length}/{LEVELS.length}</span>
            </div>
          </div>
        </header>

        <section className="world-map-board absolute inset-0" aria-label="Mapa das cinco regiões">
          <svg className="world-map-trail" viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true">
            <path className="world-map-trail-glow" d="M110 258 C190 130 270 138 330 235 S465 326 525 208 S660 103 720 218 S830 330 902 170" />
            <path className="world-map-trail-dash" d="M110 258 C190 130 270 138 330 235 S465 326 525 208 S660 103 720 218 S830 330 902 170" />
          </svg>

          <div className="world-map-path">
            {LEVELS.map((level, i) => {
              const locked = i > unlocked;
              const done = fragments.includes(i);
              const current = !locked && !done;
              const Icon = MAP_ICONS[i] ?? Trees;
              return (
                <button
                  key={level.id}
                  type="button"
                  disabled={locked}
                  aria-label={`Fase ${i + 1}, ${level.name}${locked ? ", bloqueada" : done ? ", concluída" : ""}`}
                  onClick={() => {
                    audio.ui();
                    if (!locked) onPlay(i);
                  }}
                  className={`world-map-stop map-stop-${i + 1} ${locked ? "is-locked" : done ? "is-done" : "is-current"}`}
                >
                  <span className="world-map-node">
                    {current && <span className="world-map-node-pulse" />}
                    {locked ? <Lock /> : <Icon />}
                    <span className="world-map-number">{i + 1}</span>
                    {done && <Check className="world-map-check" />}
                  </span>
                  <span className="world-map-label">
                    <strong>{level.region}</strong>
                    <small>{locked ? "Bloqueada" : done ? "Concluída" : "Jogar agora"}</small>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="world-map-actions absolute bottom-3 right-3 z-20 flex items-center gap-2">
          <Button variant="secondary" size="sm" className="bg-ink/80 backdrop-blur-md" onClick={onEditAvatar}>
            <UserRound />
            Avatar
          </Button>
          <InstallButton className="world-map-install" />
          {all && (
            <Button size="sm" className="shadow-glow" onClick={onOpenMessage}>
              <ScrollText />
              Pergaminho
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
  return (
    <main className="fragment-reward-screen vignette-screen flex min-h-dvh flex-col items-center justify-center gap-3 overflow-hidden px-6 py-4 text-center">
      <div className="fragment-reward-reveal" aria-hidden="true">
        <span className="fragment-reward-ring fragment-reward-ring-outer" />
        <span className="fragment-reward-ring fragment-reward-ring-inner" />
        <span className="fragment-reward-beam" />
        <span className="fragment-reward-gem" />
        {Array.from({ length: 12 }, (_, i) => (
          <span key={i} className="fragment-reward-spark" style={{ "--spark-index": i } as React.CSSProperties} />
        ))}
      </div>
      <div className="animate-title-in">
        <h1 className="text-3xl text-primary text-glow">Fragmento conquistado</h1>
        <p className="mt-2 text-lg text-foreground">{level?.fragmentName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{total}/5 reunidos</p>
      </div>
      <Button size="lg" className="animate-title-in" onClick={onContinue}>
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
