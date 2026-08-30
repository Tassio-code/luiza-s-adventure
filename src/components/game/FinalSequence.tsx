import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { BIRTHDAY_NAME, FINAL_MESSAGE } from "@/game/message";

/** Optional photo — dropped in later. Missing file degrades gracefully. */
const PHOTO_SRC = "/final/photo.jpg";

type Step = "merge" | "scroll" | "birthday" | "thanks" | "photo" | "end";

/** Time each parchment paragraph stays fully visible before fading away. */
const PARAGRAPH_MS = 5200;
const PARAGRAPH_FADE_MS = 900;

export function FinalSequence({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = useState<Step>("merge");
  const [merged, setMerged] = useState(false);
  const [photoOk, setPhotoOk] = useState<boolean | null>(null);
  const [paragraph, setParagraph] = useState(0);
  const [paragraphOut, setParagraphOut] = useState(false);
  const [birthdayOut, setBirthdayOut] = useState(false);
  const timers = useRef<number[]>([]);
  const fireworksRef = useRef<FireworksShow | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    audio.playMusic("ending", { id: "final", duration: 240, loop: true });
    return () => audio.stopMusic();
  }, []);

  useEffect(() => {
    const push = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    timers.current.forEach(window.clearTimeout);
    timers.current = [];
    if (step === "merge") {
      // Handled by <FragmentMerge /> (canvas timeline + skip button).
    }

    if (step === "scroll") {
      // One paragraph at a time: fade in, hold, fade out, next.
      const total = FINAL_MESSAGE.length;
      let i = 0;
      const schedule = () => {
        push(() => setParagraphOut(true), PARAGRAPH_MS);
        push(() => {
          i += 1;
          if (i >= total) {
            setStep("birthday");
            return;
          }
          setParagraph(i);
          setParagraphOut(false);
          schedule();
        }, PARAGRAPH_MS + PARAGRAPH_FADE_MS);
      };
      setParagraph(0);
      setParagraphOut(false);
      schedule();
    }
    if (step === "birthday") {
      // Fireworks keep going while the title rises, then everything fades slowly.
      push(() => fireworksRef.current?.fadeOut(), 5200);
      push(() => setBirthdayOut(true), 5800);
      push(() => setStep("thanks"), 10200);
    }
    if (step === "thanks") push(() => setStep("photo"), 4200);
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [step]);

  useEffect(() => {
    if (step !== "birthday") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const show = new FireworksShow(canvas, ctx, () => audio.firework());
    fireworksRef.current = show;
    show.start();
    return () => {
      show.stop();
      fireworksRef.current = null;
    };
  }, [step]);

  if (step === "merge") {
    return (
      <FragmentMerge
        onImpact={() => audio.fragment()}
        onDone={() => setStep("scroll")}
      />
    );
  }


  if (step === "scroll") {
    return (
      <main className="vignette-screen flex min-h-screen items-center justify-center px-4 py-6">
        <div className="panel-parchment flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center rounded-2xl p-6 sm:p-10">
          <h1 className="mb-8 text-center text-xl text-primary sm:text-2xl">
            Pergaminho dos Cinco Fragmentos
          </h1>
          <p
            key={paragraph}
            className={`whitespace-pre-line break-words text-center text-[16px] leading-relaxed text-foreground transition-opacity duration-1000 sm:text-lg ${
              paragraphOut ? "opacity-0" : "animate-fade-in opacity-100"
            }`}
          >
            {FINAL_MESSAGE[paragraph]}
          </p>
          <div className="mt-8 flex gap-2">
            {FINAL_MESSAGE.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                  i === paragraph ? "bg-primary" : i < paragraph ? "bg-primary/40" : "bg-foreground/15"
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            className="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground"
            onClick={() => setStep("birthday")}
          >
            Pular
          </Button>
        </div>
      </main>
    );
  }

  if (step === "birthday") {
    return (
      <main className="relative flex min-h-screen items-end justify-center overflow-hidden bg-ink px-6">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <h1
          className={`animate-rise-slow relative z-10 pb-10 text-center text-4xl leading-tight text-primary text-glow transition-opacity duration-[4000ms] ease-out sm:text-6xl ${
            birthdayOut ? "opacity-0" : "opacity-100"
          }`}
        >
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
        <p className="animate-fade-in text-center text-2xl text-primary/90 sm:text-4xl">
          Obrigado por jogar.
        </p>
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
