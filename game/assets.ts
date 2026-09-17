/**
 * Asset manager for the Kenney pixel-art packs (CC0).
 * Every sheet is a packed tilemap: sprites are addressed by linear index.
 */
export type SheetKey = "tiles" | "enemies" | "players" | "castle" | "city" | "weapons" | "ui";

export type SheetDef = { src: string; tile: number; cols: number };

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const SHEETS: Record<SheetKey, SheetDef> = {
  tiles: { src: publicAsset("sprites/tiles.png"), tile: 16, cols: 18 },
  enemies: { src: publicAsset("sprites/enemies.png"), tile: 24, cols: 4 },
  players: { src: publicAsset("sprites/players.png"), tile: 24, cols: 4 },
  castle: { src: publicAsset("sprites/castle.png"), tile: 16, cols: 12 },
  city: { src: publicAsset("sprites/city.png"), tile: 8, cols: 24 },
  weapons: { src: publicAsset("sprites/weapons.png"), tile: 24, cols: 10 },
  ui: { src: publicAsset("sprites/ui.png"), tile: 16, cols: 18 },
};

class AssetManager {
  private images = new Map<SheetKey, HTMLImageElement>();
  private promise: Promise<void> | null = null;

  /** Loads every sheet once. Never rejects: the game falls back to vector art. */
  load(): Promise<void> {
    if (this.promise) return this.promise;
    if (typeof window === "undefined") return Promise.resolve();
    const keys = Object.keys(SHEETS) as SheetKey[];
    this.promise = Promise.all(
      keys.map(
        (key) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.decoding = "sync";
            img.onload = () => {
              this.images.set(key, img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = SHEETS[key].src;
          }),
      ),
    ).then(() => undefined);
    return this.promise;
  }

  get(key: SheetKey): HTMLImageElement | null {
    return this.images.get(key) ?? null;
  }

  get ready() {
    return this.images.size > 0;
  }
}

export const assets = new AssetManager();
