import type { WeaponVisual } from "./avatar/renderer";
import type { SheetKey } from "./assets";

export type WeaponId = "pistol" | "dual" | "rifle" | "shotgun" | "smg";

export type Weapon = {
  id: WeaponId;
  name: string;
  visual: WeaponVisual;
  damage: number;
  /** seconds between shots */
  cooldown: number;
  /** projectiles per shot */
  pellets: number;
  spread: number;
  speed: number;
  range: number;
  ammoPerShot: number;
  startAmmo: number;
  maxAmmo: number;
  knockback: number;
  bulletSize: number;
  description: string;
};

export const WEAPONS: Record<WeaponId, Weapon> = {
  pistol: {
    id: "pistol",
    name: "Pistola Guardiã",
    visual: "pistol",
    damage: 26,
    cooldown: 0.28,
    pellets: 1,
    spread: 0.03,
    speed: 620,
    range: 620,
    ammoPerShot: 1,
    startAmmo: 110,
    maxAmmo: 160,
    knockback: 110,
    bulletSize: 3.2,
    description: "Precisa e confiável. Cada bala conta.",
  },
  dual: {
    id: "dual",
    name: "Pistolas Gêmeas",
    visual: "dual",
    damage: 20,
    cooldown: 0.16,
    pellets: 1,
    spread: 0.07,
    speed: 640,
    range: 600,
    ammoPerShot: 1,
    startAmmo: 110,
    maxAmmo: 260,
    knockback: 90,
    bulletSize: 3,
    description: "Duas mãos, dois canos, o dobro de ritmo.",
  },
  rifle: {
    id: "rifle",
    name: "Fuzil do Inverno",
    visual: "rifle",
    damage: 34,
    cooldown: 0.13,
    pellets: 1,
    spread: 0.05,
    speed: 820,
    range: 780,
    ammoPerShot: 1,
    startAmmo: 160,
    maxAmmo: 340,
    knockback: 120,
    bulletSize: 3.4,
    description: "Rajadas longas que atravessam a nevasca.",
  },
  shotgun: {
    id: "shotgun",
    name: "Espingarda das Ruínas",
    visual: "shotgun",
    damage: 19,
    cooldown: 0.62,
    pellets: 7,
    spread: 0.34,
    speed: 560,
    range: 300,
    ammoPerShot: 1,
    startAmmo: 48,
    maxAmmo: 110,
    knockback: 300,
    bulletSize: 3.6,
    description: "Dano brutal a curta distância. Munição rara.",
  },
  smg: {
    id: "smg",
    name: "Metralhadora Escarlate",
    visual: "smg",
    damage: 17,
    cooldown: 0.075,
    pellets: 1,
    spread: 0.11,
    speed: 760,
    range: 620,
    ammoPerShot: 1,
    startAmmo: 300,
    maxAmmo: 520,
    knockback: 70,
    bulletSize: 2.8,
    description: "Cadência absurda para a noite mais longa.",
  },
};

export type EnemyKind = "orc" | "zombie" | "frost" | "skeleton" | "vampire" | "boss";

export type EnemyStats = {
  kind: EnemyKind;
  name: string;
  hp: number;
  speed: number;
  damage: number;
  radius: number;
  ranged: boolean;
  fireRate: number;
  projectileSpeed: number;
  score: number;
};

export const ENEMIES: Record<EnemyKind, EnemyStats> = {
  orc: { kind: "orc", name: "Orc da Mata", hp: 58, speed: 74, damage: 12, radius: 15, ranged: false, fireRate: 0, projectileSpeed: 0, score: 10 },
  zombie: { kind: "zombie", name: "Errante", hp: 48, speed: 62, damage: 10, radius: 14, ranged: false, fireRate: 0, projectileSpeed: 0, score: 10 },
  frost: { kind: "frost", name: "Errante de Gelo", hp: 72, speed: 58, damage: 13, radius: 15, ranged: true, fireRate: 2.4, projectileSpeed: 230, score: 14 },
  skeleton: { kind: "skeleton", name: "Esqueleto Antigo", hp: 62, speed: 88, damage: 12, radius: 13, ranged: true, fireRate: 2.9, projectileSpeed: 260, score: 14 },
  vampire: { kind: "vampire", name: "Vampiro", hp: 95, speed: 96, damage: 16, radius: 15, ranged: true, fireRate: 2.1, projectileSpeed: 300, score: 20 },
  boss: { kind: "boss", name: "Senhor dos Vampiros", hp: 1500, speed: 82, damage: 22, radius: 34, ranged: true, fireRate: 1.5, projectileSpeed: 250, score: 200 },
};

export type Theme = {
  ground: string;
  groundAlt: string;
  wall: string;
  wallTop: string;
  detail: string;
  fog: string;
  light: string;
  ambient: string;
  particle: "leaf" | "dust" | "snow" | "sand" | "ash";
  /** Kenney packed-tilemap indices used to paint the floor/walls of this region. */
  tileset: TileSet;
};

export type TileSet = {
  floorSheet: SheetKey;
  floor: number[];
  /** solid tile painted under every wall cell */
  wallBaseSheet: SheetKey;
  wallBase: number;
  /** sprites layered on top of the wall base for silhouette variety */
  wallSheet: SheetKey;
  wall: number[];
  /** optional color wash applied over the tiles to unify the region palette */
  tint?: string;
  tintMode?: GlobalCompositeOperation;
  tintAlpha?: number;
};

export type LevelDef = {
  index: number;
  id: string;
  name: string;
  region: string;
  description: string;
  weapon: WeaponId;
  enemy: EnemyKind;
  enemyCount: number;
  waveSize: number;
  hasBoss: boolean;
  bossName: string;
  fragmentName: string;
  intro: string;
  theme: Theme;
};

export const LEVELS: LevelDef[] = [
  {
    index: 0,
    id: "floresta",
    name: "Floresta de Vagalumes",
    region: "Floresta",
    description:
      "Uma mata antiga onde a luz desce em feixes finos entre as copas. Orcs guardam a clareira do primeiro fragmento.",
    weapon: "pistol",
    enemy: "orc",
    enemyCount: 50,
    waveSize: 8,
    hasBoss: true,
    bossName: "Bruto da Clareira",
    fragmentName: "Fragmento da Coragem",
    intro: "Explore a mata, sobreviva aos orcs e encontre o primeiro fragmento.",
    theme: {
      ground: "#26402c",
      groundAlt: "#2e4a33",
      wall: "#1a2b1f",
      wallTop: "#35543a",
      detail: "#7fae63",
      fog: "rgba(30,60,40,0.5)",
      light: "rgba(190,230,150,0.16)",
      ambient: "#0d1a12",
      particle: "leaf",
      tileset: { floorSheet: "tiles", floor: [114], wallBaseSheet: "tiles", wallBase: 114, wallSheet: "tiles", wall: [62, 80, 44, 45, 62, 80], tint: "#2f5a34", tintAlpha: 0.22 },
    },
  },
  {
    index: 1,
    id: "cidade",
    name: "Avenida Silenciosa",
    region: "Cidade",
    description:
      "Uma cidade esvaziada às pressas: carros de portas abertas, vitrines quebradas e errantes que reagem ao som.",
    weapon: "dual",
    enemy: "zombie",
    enemyCount: 36,
    waveSize: 10,
    hasBoss: true,
    bossName: "Errante Colossal",
    fragmentName: "Fragmento da Memória",
    intro: "Duas pistolas, ruas estreitas e uma horda que não para de vir.",
    theme: {
      ground: "#33343c",
      groundAlt: "#3b3c46",
      wall: "#232430",
      wallTop: "#4a4b58",
      detail: "#d1a45a",
      fog: "rgba(40,42,55,0.5)",
      light: "rgba(255,205,130,0.14)",
      ambient: "#12131b",
      particle: "dust",
      tileset: { floorSheet: "city", floor: [121, 289, 121, 131], wallBaseSheet: "tiles", wallBase: 70, wallSheet: "tiles", wall: [15, 16, 17], tint: "#2a2c3a", tintAlpha: 0.2 },
    },
  },
  {
    index: 2,
    id: "neve",
    name: "Cume Congelado",
    region: "Neve",
    description:
      "Uma vila de montanha soterrada pela nevasca. Os errantes aqui cospem estilhaços de gelo.",
    weapon: "rifle",
    enemy: "frost",
    enemyCount: 44,
    waveSize: 12,
    hasBoss: true,
    bossName: "Guardião de Cristal",
    fragmentName: "Fragmento da Força",
    intro: "A nevasca reduz a visão. Use o fuzil e mantenha distância.",
    theme: {
      ground: "#c9d8e6",
      groundAlt: "#dae6f1",
      wall: "#8fa4b8",
      wallTop: "#eaf3fa",
      detail: "#6fa8c9",
      fog: "rgba(200,220,240,0.55)",
      light: "rgba(230,245,255,0.2)",
      ambient: "#a9c6dd",
      particle: "snow",
      tileset: { floorSheet: "tiles", floor: [29, 119, 34, 29], wallBaseSheet: "tiles", wallBase: 29, wallSheet: "tiles", wall: [15, 16, 17], tint: "#dceeff", tintAlpha: 0.5, tintMode: "screen" },
    },
  },
  {
    index: 3,
    id: "deserto",
    name: "Ruínas de Areia",
    region: "Deserto",
    description:
      "Templos meio engolidos pelas dunas. Esqueletos despertam quando a areia se move.",
    weapon: "shotgun",
    enemy: "skeleton",
    enemyCount: 50,
    waveSize: 12,
    hasBoss: true,
    bossName: "Sentinela de Ossos",
    fragmentName: "Fragmento da Fé",
    intro: "Espingarda: dano altíssimo, alcance curto e pouca munição.",
    theme: {
      ground: "#c9a56b",
      groundAlt: "#d8b57a",
      wall: "#9c7844",
      wallTop: "#e2c48b",
      detail: "#7d5a2e",
      fog: "rgba(210,175,120,0.45)",
      light: "rgba(255,225,160,0.18)",
      ambient: "#3a2a17",
      particle: "sand",
      tileset: { floorSheet: "tiles", floor: [173], wallBaseSheet: "tiles", wallBase: 70, wallSheet: "tiles", wall: [15, 16, 63, 81], tint: "#c79a4f", tintAlpha: 0.3 },
    },
  },
  {
    index: 4,
    id: "castelo",
    name: "Castelo da Lua Vermelha",
    region: "Castelo",
    description:
      "O salão final. Tochas, corvos e o Senhor dos Vampiros guardando o último fragmento.",
    weapon: "smg",
    enemy: "vampire",
    enemyCount: 56,
    waveSize: 14,
    hasBoss: true,
    bossName: "Senhor dos Vampiros",
    fragmentName: "Fragmento do Amor",
    intro: "A noite mais longa. Sobreviva aos vampiros e enfrente o Senhor.",
    theme: {
      ground: "#33232c",
      groundAlt: "#3c2933",
      wall: "#1f1520",
      wallTop: "#4a3140",
      detail: "#a8324a",
      fog: "rgba(60,25,40,0.55)",
      light: "rgba(255,120,120,0.16)",
      ambient: "#150c13",
      particle: "ash",
      tileset: { floorSheet: "castle", floor: [48, 50, 52, 53], wallBaseSheet: "castle", wallBase: 0, wallSheet: "castle", wall: [57, 58, 59], tint: "#3d1524", tintAlpha: 0.28 },
    },
  },
];

export const FRAGMENTS = LEVELS.map((l) => l.fragmentName);
