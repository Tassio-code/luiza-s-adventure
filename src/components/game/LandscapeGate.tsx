import { useCallback, useEffect, useState, type ReactNode } from "react";

type LockableOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
};

export function LandscapeGate({ children }: { children: ReactNode }) {
  const [touchDevice, setTouchDevice] = useState(false);
  const [portrait, setPortrait] = useState(false);

  const requestLandscape = useCallback(() => {
    const orientation = window.screen.orientation as LockableOrientation;
    void orientation.lock?.("landscape").catch(() => undefined);
  }, []);

  useEffect(() => {
    const touchQuery = window.matchMedia("(pointer: coarse)");
    const portraitQuery = window.matchMedia("(orientation: portrait)");
    const update = () => {
      setTouchDevice(touchQuery.matches);
      setPortrait(portraitQuery.matches);
    };

    update();
    requestLandscape();
    touchQuery.addEventListener("change", update);
    portraitQuery.addEventListener("change", update);
    window.addEventListener("orientationchange", update);

    return () => {
      touchQuery.removeEventListener("change", update);
      portraitQuery.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [requestLandscape]);

  return (
    <div className="game-landscape-root" onPointerDown={requestLandscape}>
      {children}
      {touchDevice && portrait && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink px-8 text-center">
          <div className="flex max-w-xs flex-col items-center gap-5">
            <span className="block h-16 w-28 rounded-md border-2 border-primary/70 shadow-glow" />
            <h1 className="text-2xl text-primary text-glow">Gire o celular</h1>
            <p className="text-sm text-muted-foreground">
              Esta aventura foi criada para jogar com o celular na horizontal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}