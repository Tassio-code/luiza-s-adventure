import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { LEVELS, WEAPONS } from "@/game/content";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { FINAL_MESSAGE, BIRTHDAY_NAME } from "@/game/message";
import { AvatarCanvas } from "./AvatarCanvas";
import type { AvatarConfig } from "@/game/avatar/options";

export function TitleScreen({ onStart, hasSave, onContinue }: { onStart: () => void; hasSave: boolean; onContinue: () => void }) {
  return (
    <main className="vignette-screen flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-xs uppercase tracking-[0.4em] text-primary">uma aventura para {BIRTHDAY_NAME}</p>
      <h1 className="max-w-2xl text-4xl leading-tight text-primary text-glow sm:text-6xl">Os Cinco Fragmentos</h1>
      <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
        Cinco regiões, cinco fragmentos e uma mensagem escondida no final. Crie sua heroína e atravesse
        a floresta, a cidade, a neve, o deserto e o castelo.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onStart}>{hasSave ? "Nova jornada" : "Começar"}</Button>
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
  const [selected, setSelected] = useState<number | null>(null);
  const all = fragments.length >= LEVELS.length;
  const level = selected !== null ? LEVELS[selected] : null;

  return (
    <main className="vignette-screen min-h-screen px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="panel-parchment flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <AvatarCanvas config={avatar} className="h-24 w-20" />
            <div>
              <h1 className="text-2xl text-primary">{avatar.name}</h1>
              <p className="text-sm text-muted-foreground">Fragmentos reunidos: {fragments.length}/5</p>
              <div className="mt-2 flex gap-1.5">
                {LEVELS.map((l, i) => (
                  <span
                    key={l.id}
                    className={`h-5 w-5 rotate-45 rounded-sm ${
                      fragments.includes(i) ? "bg-primary animate-fragment" : "border border-border bg-secondary"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onEditAvatar}>Ajustar avatar</Button>
            {all && <Button onClick={onOpenMessage}>Abrir mensagem</Button>}
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((l, i) => {
            const locked = i > unlocked;
            const done = fragments.includes(i);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => {
                  audio.ui();
                  setSelected(i);
                }}
                className={`panel-parchment rounded-2xl p-5 text-left transition-transform hover:-translate-y-1 ${
                  locked ? "opacity-60" : ""
                }`}
              >
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Região {i + 1}</p>
                <h2 className="mt-1 text-lg text-primary">{l.region}</h2>
                <p className="mt-1 text-sm text-foreground">{l.name}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {locked ? "Fase bloqueada" : done ? "Fragmento obtido" : "Disponível"}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {level && selected !== null && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-ink/85 p-4" onClick={() => setSelected(null)}>
          <div className="panel-parchment w-full max-w-lg rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl text-primary">{level.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{level.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Arma</dt><dd>{WEAPONS[level.weapon].name}</dd></div>
              <div><dt className="text-muted-foreground">Inimigos</dt><dd>{level.enemy === "orc" ? "Orcs" : level.enemy === "zombie" ? "Zumbis" : level.enemy === "frost" ? "Zumbis de gelo" : level.enemy === "skeleton" ? "Esqueletos" : "Vampiros"}</dd></div>
              <div><dt className="text-muted-foreground">Chefe</dt><dd>{level.bossName}</dd></div>
              <div><dt className="text-muted-foreground">Fragmento</dt><dd>{level.fragmentName}</dd></div>
            </dl>
            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setSelected(null)}>Fechar</Button>
              {selected > unlocked ? (
                <p className="flex-1 self-center text-sm text-muted-foreground">
                  Complete a fase anterior para desbloquear este local.
                </p>
              ) : (
                <Button className="flex-1" onClick={() => onPlay(selected)}>Iniciar fase</Button>
              )}
            </div>
          </div>
        </div>
      )}
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
    <main className="vignette-screen flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <span className="h-24 w-24 rotate-45 rounded-lg bg-primary animate-fragment" />
      <div>
        <h1 className="text-3xl text-primary text-glow">Fragmento obtido</h1>
        <p className="mt-2 text-lg text-foreground">{level?.fragmentName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{total}/5 reunidos</p>
      </div>
      <Button size="lg" onClick={onContinue}>Voltar ao mapa</Button>
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
    <main className="vignette-screen flex min-h-screen items-center justify-center px-4 py-10">
      <div className="panel-parchment w-full max-w-2xl rounded-2xl p-8">
        <div className="mb-6 flex justify-center gap-2">
          {LEVELS.map((l) => (
            <span key={l.id} className="h-4 w-4 rotate-45 rounded-sm bg-primary animate-fragment" />
          ))}
        </div>
        <p className="min-h-[10rem] whitespace-pre-line text-base leading-relaxed text-foreground animate-title-in" key={index}>
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
    <main className="relative h-screen w-full overflow-hidden bg-ink">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="relative z-10 flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl text-primary text-glow sm:text-6xl">FELIZ ANIVERSÁRIO, {BIRTHDAY_NAME.toUpperCase()}</h1>
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
