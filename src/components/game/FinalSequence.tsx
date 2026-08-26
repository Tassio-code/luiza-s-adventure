import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { audio } from "@/game/audio";
import { BIRTHDAY_NAME, FINAL_MESSAGE } from "@/game/message";

/** Optional photo — dropped in later. Missing file degrades gracefully. */
const PHOTO_SRC = "/final/photo.jpg";

type Step = "merge" | "scroll" | "birthday" | "thanks" | "photo" | "end";

export function FinalSequence({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = useState<Step>("merge");
  const [merged, setMerged] = useState(false);
  const [photoOk, setPhotoOk] = useState<boolean | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    audio.playMusic("ending", { id: "final", duration: 240, loop: true });
    return () => audio.stopMusic();
  }, []);

  useEffect(() => {
    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    if (step === "merge") {
      push(() => setMerged(true), 400);
      push(() => audio.fragment(), 1800);
      push(() => setStep("scroll"), 4200);
    }
    if (step === "birthday") push(() => setStep("thanks"), 6200);
    if (step === "thanks") push(() => setStep("photo"), 4200);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [step]);

  if (step === "merge") {
    return (
      <main className="vignette-screen relative flex min-h-screen items-center justify-center overflow-hidden bg-ink">
        <div className="relative h-64 w-64">
          {[0, 1, 2, 3, 4].map((i) => {
            const angle = (i / 5) * Math.PI * 2;
            const r = merged ? 0 : 110;
            return (
              <span
                key={i}
                className="absolute left-1/2 top-1/2 h-10 w-10 rounded-sm bg-primary shadow-[0_0_28px_hsl(var(--primary)/0.8)] transition-all duration-[3400ms] ease-in-out"
                style={{
                  transform: `translate(calc(-50% + ${Math.cos(angle) * r}px), calc(-50% + ${
                    Math.sin(angle) * r
                  }px)) rotate(${merged ? 405 : 45}deg) scale(${merged ? 0.7 : 1})`,
                  opacity: merged ? 0.95 : 0.85,
                }}
              />
            );
          })}
          <span
            className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/30 blur-2xl transition-opacity duration-[3000ms]"
            style={{ opacity: merged ? 1 : 0 }}
          />
        </div>
        <p className="absolute bottom-24 px-8 text-center text-sm uppercase tracking-[0.3em] text-primary/80">
          os fragmentos se unem
        </p>
      </main>
    );
  }

  if (step === "scroll") {
    return (
      <main className="vignette-screen flex min-h-screen items-center justify-center px-3 py-6">
        <div className="panel-parchment flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl p-5 sm:p-8">
          <h1 className="text-center text-xl text-primary sm:text-2xl">Pergaminho dos Cinco Fragmentos</h1>
          <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 text-[15px] leading-relaxed text-foreground">
            {FINAL_MESSAGE.map((paragraph, i) => (
              <p key={i} className="whitespace-pre-line break-words">
                {paragraph}
              </p>
            ))}
          </div>
          <Button className="mt-5 h-12 w-full text-base" onClick={() => setStep("birthday")}>
            Continuar
          </Button>
        </div>
      </main>
    );
  }

  if (step === "birthday") {
    return (
      <main className="relative flex min-h-screen items-end justify-center overflow-hidden bg-ink px-6">
        <h1 className="animate-rise-slow pb-10 text-center text-4xl leading-tight text-primary text-glow sm:text-6xl">
          Feliz Aniversário,
          <br />
          {BIRTHDAY_NAME}
        </h1>
      </main>
    );
  }

  if (step === "thanks") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink px-6">
        <p className="animate-fade-in text-center text-2xl text-primary/90 sm:text-4xl">Obrigado por jogar.</p>
      </main>
    );
  }

  if (step === "photo") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-ink px-6">
        {photoOk !== false ? (
          <img
            src={PHOTO_SRC}
            alt={`Fotografia de ${BIRTHDAY_NAME}`}
            onLoad={() => setPhotoOk(true)}
            onError={() => setPhotoOk(false)}
            className="animate-photo-in max-h-[70vh] w-full max-w-md rounded-2xl object-cover shadow-frame"
          />
        ) : (
          <p className="animate-fade-in max-w-sm text-center text-sm text-muted-foreground">
            (a fotografia entra aqui quando o arquivo for adicionado)
          </p>
        )}
        <Button variant="secondary" className="h-12 px-8" onClick={() => setStep("end")}>
          Fim
        </Button>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-ink px-6">
      <p className="animate-fade-in text-3xl tracking-[0.4em] text-primary">FIM</p>
      <Button variant="secondary" className="h-12 px-8" onClick={onFinished}>
        Voltar ao mapa
      </Button>
    </main>
  );
}
