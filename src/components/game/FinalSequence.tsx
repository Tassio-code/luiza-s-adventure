import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { audio } from "@/game/audio";
import { FireworksShow } from "@/game/fireworks";
import { FragmentMerge } from "@/components/game/FragmentMerge";
import { FINAL_MESSAGE } from "@/game/message";

const FINAL_MUSIC_SRC = `${import.meta.env.BASE_URL}music/musica-fim.m4a`;

type Step = "merge" | "scroll" | "birthday" | "end";

/** Fade duration when advancing to the next parchment paragraph. */
const PARAGRAPH_FADE_MS = 700;

export function FinalSequence({ onFinished }: { onFinished: () => void }) {
  const [step, setStep] = useState<Step>("merge");
  const [paragraph, setParagraph] = useState(0);
  const [paragraphOut, setParagraphOut] = useState(false);
  const timers = useRef<number[]>([]);
  const fireworksRef = useRef<FireworksShow | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    audio.playMusic("ending", {
      id: "musica-fim",
      src: FINAL_MUSIC_SRC,
      duration: 356,
      loop: false,
      fadeMs: 1800,
    });
  }, []);

  useEffect(() => () => audio.stopMusic(), []);

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
      // The title remains while the final song finishes naturally.
      push(() => fireworksRef.current?.fadeOut(), 12000);
    }
    return () => {
      timers.current.forEach(window.clearTimeout);
      timers.current = [];
    };
  }, [step]);

  useEffect(() => {
    if (step !== "birthday") return;
    const checkMusic = window.setInterval(() => {
      if (audio.musicHasEnded()) setStep("end");
    }, 400);
    return () => window.clearInterval(checkMusic);
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
    return <FragmentMerge onDone={() => setStep("scroll")} />;
  }

  if (step === "scroll") {
    const total = FINAL_MESSAGE.length;
    const advance = () => {
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
      <main className="vignette-screen relative flex min-h-dvh flex-col items-center justify-center gap-5 px-6 py-4">
        <p
          key={paragraph}
          className={`max-w-3xl whitespace-pre-line break-words text-center text-[18px] leading-relaxed text-foreground transition-opacity duration-700 sm:text-2xl ${
            paragraphOut ? "opacity-0" : "animate-fade-in opacity-100"
          }`}
        >
          {FINAL_MESSAGE[paragraph]}
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] right-[calc(1rem+env(safe-area-inset-right))] h-9 px-4 text-xs tracking-widest text-muted-foreground opacity-40 hover:bg-transparent hover:opacity-80"
          onClick={advance}
        >
          Continuar
        </Button>
      </main>
    );
  }

  if (step === "birthday") {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-6">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
        <h1 className="relative z-10 text-center text-4xl leading-tight text-primary text-glow sm:text-6xl">
          Feliz Aniversário
        </h1>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-ink px-6 py-4">
      <p className="animate-fade-in text-3xl tracking-[0.4em] text-primary">FIM</p>
      <Button variant="secondary" className="h-12 px-8" onClick={onFinished}>
        Voltar ao mapa
      </Button>
    </main>
  );
}
