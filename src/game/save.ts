import { DEFAULT_AVATAR, sanitizeAvatar, type AvatarConfig } from "./avatar/options";

const KEY = "cinco-fragmentos:save:v1";
const CAMPAIGN_RESET_KEY = "cinco-fragmentos:campaign-reset:2026-09-17";

export type SaveData = {
  avatar: AvatarConfig | null;
  /** level indexes completed */
  completed: number[];
  /** fragments collected (level indexes) */
  fragments: number[];
  unlocked: number;
  messageUnlocked: boolean;
  settings: { volume: number; muted: boolean };
  /** persisted player progression across levels */
  progress: { level: number; xp: number } | null;
  lastScene: string | null;
};

export const EMPTY_SAVE: SaveData = {
  avatar: null,
  completed: [],
  fragments: [],
  unlocked: 0,
  messageUnlocked: false,
  settings: { volume: 0.7, muted: false },
  progress: null,
  lastScene: null,
};

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadSave(): SaveData {
  if (!isBrowser()) return { ...EMPTY_SAVE };
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...EMPTY_SAVE };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((n) => Number.isInteger(n) && n >= 0 && n < 5)
      : [];
    const fragments = Array.isArray(parsed.fragments)
      ? parsed.fragments.filter((n) => Number.isInteger(n) && n >= 0 && n < 5)
      : [];
    return {
      avatar: parsed.avatar ? sanitizeAvatar(parsed.avatar) : null,
      completed: [...new Set(completed)].sort((a, b) => a - b),
      fragments: [...new Set(fragments)].sort((a, b) => a - b),
      unlocked: Math.min(4, Math.max(0, Number(parsed.unlocked) || 0)),
      messageUnlocked: Boolean(parsed.messageUnlocked),
      settings: {
        volume:
          typeof parsed.settings?.volume === "number"
            ? Math.min(1, Math.max(0, parsed.settings.volume))
            : 0.7,
        muted: Boolean(parsed.settings?.muted),
      },
      progress:
        parsed.progress && typeof parsed.progress.level === "number"
          ? {
              level: Math.min(20, Math.max(1, Math.floor(parsed.progress.level))),
              xp: Math.max(0, Math.floor(Number(parsed.progress.xp) || 0)),
            }
          : null,
      lastScene: typeof parsed.lastScene === "string" ? parsed.lastScene : null,
    };
  } catch {
    return { ...EMPTY_SAVE };
  }
}

export function writeSave(data: SaveData) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* storage full or unavailable — gameplay continues in memory */
  }
}

/** Clears the former showcase unlocks once while preserving the created avatar and settings. */
export function resetCampaignOnce(data: SaveData): SaveData {
  if (!isBrowser() || window.localStorage.getItem(CAMPAIGN_RESET_KEY)) return data;
  const reset: SaveData = {
    ...data,
    completed: [],
    fragments: [],
    unlocked: 0,
    messageUnlocked: false,
    progress: null,
    lastScene: "map",
  };
  try {
    window.localStorage.setItem(CAMPAIGN_RESET_KEY, "done");
  } catch {
    /* gameplay continues even when storage is unavailable */
  }
  writeSave(reset);
  return reset;
}

export function clearSave() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function defaultAvatar(): AvatarConfig {
  return { ...DEFAULT_AVATAR, accessories: [] };
}
