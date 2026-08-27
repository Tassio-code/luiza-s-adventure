import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type PromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: string }>;
};

/**
 * "Install on phone" entry point. Uses the native install prompt when the
 * browser offers one, and falls back to short manual instructions (iOS/Safari
 * never fires `beforeinstallprompt`).
 */
export function InstallButton({ className }: { className?: string }) {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(standalone));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <div className={className}>
      <Button
        variant="secondary"
        className="h-12 w-full"
        onClick={async () => {
          if (prompt) {
            await prompt.prompt();
            setPrompt(null);
            return;
          }
          setHint(true);
        }}
      >
        Instalar no celular
      </Button>
      {hint && (
        <p className="mt-2 text-center text-xs leading-relaxed text-muted-foreground">
          No Chrome: menu <span className="text-primary">⋮</span> → “Adicionar à tela inicial”. No
          iPhone: botão de compartilhar → “Adicionar à Tela de Início”.
        </p>
      )}
    </div>
  );
}
