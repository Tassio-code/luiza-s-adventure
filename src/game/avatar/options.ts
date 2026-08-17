/**
 * Central catalogue of every avatar option.
 * Each category is independent: changing one never touches another.
 */

export type AvatarConfig = {
  name: string;
  skin: string;
  hair: string;
  hairColor: string;
  eyes: string;
  eyeColor: string;
  brow: string;
  mouth: string;
  top: string;
  topColor: string;
  bottom: string;
  bottomColor: string;
  accessories: string[];
};

export type Swatch = { id: string; label: string; color: string };
export type Shape = { id: string; label: string };

export const SKIN_TONES: Swatch[] = [
  { id: "porcelain", label: "Porcelana", color: "#f6dcc6" },
  { id: "light", label: "Clara", color: "#efc9a6" },
  { id: "warm", label: "Dourada", color: "#e0ab7f" },
  { id: "olive", label: "Oliva", color: "#c98f63" },
  { id: "tan", label: "Bronzeada", color: "#b3764c" },
  { id: "brown", label: "Castanha", color: "#8d5734" },
  { id: "deep", label: "Profunda", color: "#6b3c22" },
  { id: "ebony", label: "Ébano", color: "#4a2716" },
];

export const HAIR_STYLES: Shape[] = [
  { id: "pixie", label: "Pixie" },
  { id: "short", label: "Curto" },
  { id: "bob", label: "Chanel" },
  { id: "long", label: "Longo" },
  { id: "wavy", label: "Ondulado" },
  { id: "curly", label: "Cacheado" },
  { id: "ponytail", label: "Preso" },
  { id: "buns", label: "Coques" },
  { id: "braids", label: "Tranças" },
  { id: "bangs", label: "Franja longa" },
];

export const HAIR_COLORS: Swatch[] = [
  { id: "black", label: "Preto", color: "#1e1a1f" },
  { id: "darkbrown", label: "Castanho escuro", color: "#3a2418" },
  { id: "brown", label: "Castanho", color: "#5d3620" },
  { id: "lightbrown", label: "Castanho claro", color: "#8a5a2f" },
  { id: "blonde", label: "Loiro", color: "#d9a94f" },
  { id: "platinum", label: "Platinado", color: "#e8ddc4" },
  { id: "red", label: "Ruivo", color: "#a5401f" },
  { id: "auburn", label: "Acaju", color: "#79281f" },
  { id: "wine", label: "Vinho", color: "#5b1730" },
  { id: "ash", label: "Grafite", color: "#4a4750" },
];

export const EYE_SHAPES: Shape[] = [
  { id: "round", label: "Redondos" },
  { id: "almond", label: "Amendoados" },
  { id: "sharp", label: "Marcantes" },
  { id: "soft", label: "Suaves" },
  { id: "wide", label: "Grandes" },
];

export const EYE_COLORS: Swatch[] = [
  { id: "brown", label: "Castanho", color: "#5a3520" },
  { id: "honey", label: "Mel", color: "#a9772d" },
  { id: "green", label: "Verde", color: "#3f7a4b" },
  { id: "blue", label: "Azul", color: "#3b6ea8" },
  { id: "gray", label: "Cinza", color: "#7c8592" },
  { id: "violet", label: "Violeta", color: "#6c4a8f" },
];

export const BROW_SHAPES: Shape[] = [
  { id: "soft", label: "Suave" },
  { id: "straight", label: "Reta" },
  { id: "arched", label: "Arqueada" },
  { id: "bold", label: "Marcada" },
];

export const MOUTH_SHAPES: Shape[] = [
  { id: "calm", label: "Serena" },
  { id: "smile", label: "Sorriso" },
  { id: "smirk", label: "Meio sorriso" },
  { id: "determined", label: "Determinada" },
];

export const TOPS: Shape[] = [
  { id: "tshirt", label: "Camiseta" },
  { id: "blouse", label: "Blusa" },
  { id: "jacket", label: "Jaqueta" },
  { id: "hoodie", label: "Moletom" },
  { id: "tank", label: "Regata" },
  { id: "armor", label: "Peitoral" },
];

export const BOTTOMS: Shape[] = [
  { id: "pants", label: "Calça" },
  { id: "cargo", label: "Cargo" },
  { id: "shorts", label: "Shorts" },
  { id: "skirt", label: "Saia" },
  { id: "leggings", label: "Legging" },
];

export const CLOTH_COLORS: Swatch[] = [
  { id: "crimson", label: "Carmim", color: "#a32b32" },
  { id: "rose", label: "Rosa", color: "#d9758c" },
  { id: "amber", label: "Âmbar", color: "#d99341" },
  { id: "moss", label: "Musgo", color: "#4c7a45" },
  { id: "teal", label: "Turquesa", color: "#2f7b7d" },
  { id: "indigo", label: "Indigo", color: "#3c4a8a" },
  { id: "plum", label: "Ameixa", color: "#6b3a67" },
  { id: "cream", label: "Creme", color: "#e6d6b8" },
  { id: "slate", label: "Ardósia", color: "#4b5058" },
  { id: "ink", label: "Grafite", color: "#26242c" },
];

export const ACCESSORIES: Shape[] = [
  { id: "glasses", label: "Óculos" },
  { id: "hat", label: "Chapéu" },
  { id: "bow", label: "Laço" },
  { id: "headband", label: "Tiara" },
  { id: "backpack", label: "Mochila" },
  { id: "scarf", label: "Echarpe" },
  { id: "earrings", label: "Brincos" },
];

/** Accessories that cannot be worn together (same anchor point). */
const ACCESSORY_CONFLICTS: Record<string, string[]> = {
  hat: ["bow", "headband"],
  bow: ["hat"],
  headband: ["hat"],
};

export function toggleAccessory(current: string[], id: string): string[] {
  if (current.includes(id)) return current.filter((a) => a !== id);
  const blocked = ACCESSORY_CONFLICTS[id] ?? [];
  return [...current.filter((a) => !blocked.includes(a)), id];
}

export const DEFAULT_AVATAR: AvatarConfig = {
  name: "Luiza",
  skin: "light",
  hair: "long",
  hairColor: "darkbrown",
  eyes: "almond",
  eyeColor: "brown",
  brow: "soft",
  mouth: "calm",
  top: "jacket",
  topColor: "crimson",
  bottom: "pants",
  bottomColor: "slate",
  accessories: [],
};

function pick<T extends { id: string }>(list: T[], id: string, fallbackId: string): T {
  const found = list.find((item) => item.id === id) ?? list.find((item) => item.id === fallbackId);
  return (found ?? list[0]) as T;
}

/** Resolves a (possibly stale/partial) config into safe, renderable values. */
export function resolveAvatar(cfg: AvatarConfig) {
  return {
    name: cfg.name?.trim() ? cfg.name.trim() : DEFAULT_AVATAR.name,
    skin: pick(SKIN_TONES, cfg.skin, DEFAULT_AVATAR.skin).color,
    hair: pick(HAIR_STYLES, cfg.hair, DEFAULT_AVATAR.hair).id,
    hairColor: pick(HAIR_COLORS, cfg.hairColor, DEFAULT_AVATAR.hairColor).color,
    eyes: pick(EYE_SHAPES, cfg.eyes, DEFAULT_AVATAR.eyes).id,
    eyeColor: pick(EYE_COLORS, cfg.eyeColor, DEFAULT_AVATAR.eyeColor).color,
    brow: pick(BROW_SHAPES, cfg.brow, DEFAULT_AVATAR.brow).id,
    mouth: pick(MOUTH_SHAPES, cfg.mouth, DEFAULT_AVATAR.mouth).id,
    top: pick(TOPS, cfg.top, DEFAULT_AVATAR.top).id,
    topColor: pick(CLOTH_COLORS, cfg.topColor, DEFAULT_AVATAR.topColor).color,
    bottom: pick(BOTTOMS, cfg.bottom, DEFAULT_AVATAR.bottom).id,
    bottomColor: pick(CLOTH_COLORS, cfg.bottomColor, DEFAULT_AVATAR.bottomColor).color,
    accessories: Array.isArray(cfg.accessories)
      ? cfg.accessories.filter((a) => ACCESSORIES.some((opt) => opt.id === a))
      : [],
  };
}

export type ResolvedAvatar = ReturnType<typeof resolveAvatar>;

export function sanitizeAvatar(raw: unknown): AvatarConfig {
  const input = (raw ?? {}) as Partial<AvatarConfig>;
  const merged: AvatarConfig = { ...DEFAULT_AVATAR, ...input };
  const resolvedAccessories = Array.isArray(input.accessories)
    ? input.accessories.filter((a) => ACCESSORIES.some((opt) => opt.id === a))
    : [];
  return {
    name:
      typeof merged.name === "string" && merged.name.trim()
        ? merged.name.slice(0, 18)
        : DEFAULT_AVATAR.name,
    skin: pick(SKIN_TONES, merged.skin, DEFAULT_AVATAR.skin).id,
    hair: pick(HAIR_STYLES, merged.hair, DEFAULT_AVATAR.hair).id,
    hairColor: pick(HAIR_COLORS, merged.hairColor, DEFAULT_AVATAR.hairColor).id,
    eyes: pick(EYE_SHAPES, merged.eyes, DEFAULT_AVATAR.eyes).id,
    eyeColor: pick(EYE_COLORS, merged.eyeColor, DEFAULT_AVATAR.eyeColor).id,
    brow: pick(BROW_SHAPES, merged.brow, DEFAULT_AVATAR.brow).id,
    mouth: pick(MOUTH_SHAPES, merged.mouth, DEFAULT_AVATAR.mouth).id,
    top: pick(TOPS, merged.top, DEFAULT_AVATAR.top).id,
    topColor: pick(CLOTH_COLORS, merged.topColor, DEFAULT_AVATAR.topColor).id,
    bottom: pick(BOTTOMS, merged.bottom, DEFAULT_AVATAR.bottom).id,
    bottomColor: pick(CLOTH_COLORS, merged.bottomColor, DEFAULT_AVATAR.bottomColor).id,
    accessories: resolvedAccessories,
  };
}
