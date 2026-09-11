import { useEffect, useRef, useState } from "react";

const LINES = [
  "Esse projeto foi feito para você.",
  "Desenvolvido por Tassio Medrado.",
  "Você terá que passar por 5 fases e coletar seus fragmentos.",
];

const HOLD = 3200;
const FADE = 1100;
const LEAD_IN = 1400;

/**
 * Cinematic cold open: black screen, then three lines that fade in and out.
 * A single tap skips ahead; the sequence can never fire `onDone` twice.
 */
export function IntroSequence({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const done = useRef(false);
  const timers = useRef<number[]>([]);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    onDone();
  };

  useEffect(() => {
    const push = (fn: () => void, delay: number) => {
      timers.current.push(window.setTimeout(fn, delay));
    };
    let t = LEAD_IN;
    LINES.forEach((_, i) => {
      push(() => {
        setIndex(i);
        setVisible(true);
      }, t);
      push(() => setVisible(false), t + HOLD);
      t += HOLD + FADE;
    });
    push(finish, t + 300);
    return () => {
      timers.current.forEach((id) => window.clearTimeout(id));
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink px-[calc(2rem+env(safe-area-inset-left))]"
      onPointerDown={finish}
      role="button"
      tabIndex={0}
      aria-label="Introdução — toque para avançar"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") finish();
      }}
    >
      {index >= 0 && (
        <p
          key={index}
          className="max-w-xl text-center text-xl leading-relaxed text-primary/95 transition-opacity duration-[1100ms] sm:text-3xl"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {LINES[index]}
        </p>
      )}
      <span className="absolute bottom-[calc(1rem+env(safe-area-inset-bottom))] text-[10px] uppercase tracking-[0.35em] text-muted-foreground/60">
        toque para avançar
      </span>
    </main>
  );
}
