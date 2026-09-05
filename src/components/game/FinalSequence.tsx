import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { FragmentMerge } from "@/components/game/FragmentMerge";
import { BIRTHDAY_NAME, FINAL_MESSAGE } from "@/game/message";

/** Optional photo — dropped in later. Missing file degrades gracefully. */
const PHOTO_SRC = "/final/photo.jpg";

type Step = "merge" | "scroll" | "birthday" | "photo" | "end";

/** Fade duration when advancing to the next parchment paragraph. */
const PARAGRAPH_FADE_MS = 700;

export function FinalSequence({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = useState<Step>("merge");
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

    if (step === "scroll") {
      // A leitura é manual: cada parágrafo espera o clique em "Continuar".
      setParagraph(0);
      setParagraphOut(false);
    }
    if (step === "birthday") {
      // Fireworks keep going while the title rises, then everything fades slowly.
      push(() => fireworksRef.current?.fadeOut(), 7200);
      push(() => setBirthdayOut(true), 8200);
      push(() => setStep("photo"), 13000);
    }
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
    const total = FINAL_MESSAGE.length;
    const advance = () => {
      audio.ui();
      setParagraphOut(true);
      window.setTimeout(() => {
        if (paragraph + 1 >= total) {
          setStep("birthday");
          return;
        }
        setParagraph((n) => n + 1);
        setParagraphOut(false);
      }, PARAGRAPH_FADE_MS);
    };
    return (
      <main className="vignette-screen flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-10">
        <p
          key={paragraph}
          className={`max-w-3xl whitespace-pre-line break-words text-center text-[18px] leading-relaxed text-foreground transition-opacity duration-700 sm:text-2xl ${
            paragraphOut ? "opacity-0" : "animate-fade-in opacity-100"
          }`}
        >
          {FINAL_MESSAGE[paragraph]}
        </p>
        <div className="flex flex-col items-center gap-2">
          <Button variant="secondary" className="h-12 px-10" onClick={advance}>
            Continuar
          </Button>
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            {paragraph + 1} / {total}
          </span>
        </div>
      </main>
    );
  }

  if (step === "birthday") {
    return (
      <main className="relative flex min-h-screen items-end justify-center overflow-hidden bg-ink px-6">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <h1
          className={`animate-rise-slow relative z-10 pb-10 text-center text-4xl leading-tight text-primary text-glow transition-opacity duration-[5000ms] ease-out sm:text-6xl ${
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
