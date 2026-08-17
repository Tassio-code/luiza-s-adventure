import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { CharacterCreator } from "@/components/game/CharacterCreator";
import { LevelScene } from "@/components/game/LevelScene";
import { FinalMessage, Fireworks, FragmentReward, TitleScreen, WorldMap } from "@/components/game/Screens";
import { audio } from "@/game/audio";
import { defaultAvatar, loadSave, writeSave, type SaveData } from "@/game/save";
import type { AvatarConfig } from "@/game/avatar/options";
import { LEVELS } from "@/game/content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Os Cinco Fragmentos — uma aventura para Luiza" },
      {
        name: "description",
        content:
          "Top-down shooter 2D com criação de personagem, cinco regiões, chefes e uma mensagem escondida no final.",
      },
      { property: "og:title", content: "Os Cinco Fragmentos — uma aventura para Luiza" },
      {
        property: "og:description",
        content: "Crie sua heroína, atravesse cinco mundos e reúna os cinco fragmentos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GamePage,
});

type Scene = "menu" | "creator" | "map" | "level" | "reward" | "message" | "fireworks";

function GamePage() {
  return (
    <ClientOnly fallback={<div className="vignette-screen min-h-screen" />}>
      <Game />
    </ClientOnly>
  );
}

function Game() {
  const [save, setSave] = useState<SaveData | null>(null);
  const [scene, setScene] = useState<Scene>("menu");
  const [draft, setDraft] = useState<AvatarConfig>(defaultAvatar());
  const [levelIndex, setLevelIndex] = useState(0);

  useEffect(() => {
    const loaded = loadSave();
    setSave(loaded);
    if (loaded.avatar) setDraft(loaded.avatar);
  }, []);

  const persist = useCallback((next: SaveData) => {
    setSave(next);
    writeSave(next);
  }, []);

  const avatar = save?.avatar ?? draft;
  const fragments = useMemo(() => save?.fragments ?? [], [save]);

  useEffect(() => {
    if (scene === "menu") audio.playMusic("menu");
    if (scene === "map" || scene === "creator") audio.playMusic("map");
  }, [scene]);

  if (!save) return <div className="vignette-screen min-h-screen" />;

  const completeLevel = () => {
    const next: SaveData = {
      ...save,
      completed: [...new Set([...save.completed, levelIndex])].sort((a, b) => a - b),
      fragments: [...new Set([...save.fragments, levelIndex])].sort((a, b) => a - b),
      unlocked: Math.min(LEVELS.length - 1, Math.max(save.unlocked, levelIndex + 1)),
      lastScene: "map",
    };
    next.messageUnlocked = next.fragments.length >= LEVELS.length;
    persist(next);
    setScene("reward");
  };

  switch (scene) {
    case "creator":
      return (
        <CharacterCreator
          value={draft}
          onChange={setDraft}
          onConfirm={() => {
            audio.resume();
            persist({ ...save, avatar: draft, lastScene: "map" });
            setScene("map");
          }}
          onBack={() => setScene(save.avatar ? "map" : "menu")}
        />
      );
    case "map":
      return (
        <WorldMap
          avatar={avatar}
          unlocked={save.unlocked}
          fragments={fragments}
          onPlay={(i) => {
            audio.resume();
            setLevelIndex(i);
            setScene("level");
          }}
          onOpenMessage={() => setScene("message")}
          onEditAvatar={() => setScene("creator")}
        />
      );
    case "level":
      return (
        <LevelScene
          levelIndex={levelIndex}
          avatar={avatar}
          onComplete={completeLevel}
          onExit={() => setScene("map")}
        />
      );
    case "reward":
      return (
        <FragmentReward
          levelIndex={levelIndex}
          total={fragments.length}
          onContinue={() => setScene("map")}
        />
      );
    case "message":
      return <FinalMessage onFireworks={() => setScene("fireworks")} />;
    case "fireworks":
      return <Fireworks onBackToMap={() => setScene("map")} />;
    default:
      return (
        <TitleScreen
          hasSave={Boolean(save.avatar)}
          onStart={() => {
            audio.resume();
            setDraft(save.avatar ?? defaultAvatar());
            setScene("creator");
          }}
          onContinue={() => {
            audio.resume();
            setScene("map");
          }}
        />
      );
  }
}
