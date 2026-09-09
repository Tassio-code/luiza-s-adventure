import { drawAvatar, weaponMuzzleDistance, type AvatarPose } from "./avatar/renderer";
import type { ResolvedAvatar } from "./avatar/options";
import { ENEMIES, WEAPONS, type EnemyKind, type LevelDef, type WeaponId } from "./content";
import { drawBossSprite, preloadBossSprites, LEVEL_BOSS_GOLEM, type BossAnim } from "./bossSprites";
import { audio } from "./audio";
import { drawEnemy } from "./systems/enemyRender";
import { drawSheetSprite, setPixelated } from "./systems/spriteRender";
import { generateLevel, hasLineOfSight, moveCircle, TILE, type LevelMap } from "./systems/levelgen";
import { ParticleSystem } from "./systems/particles";
import { InputManager } from "./systems/input";
import { drawAtmosphere, drawDecoration, drawGround } from "./systems/worldRender";
import { createRng, rand, randInt, type Rng } from "./systems/rng";
import { MusicDirector, type DirectorPhase } from "./systems/director";
import { addXp, createProgress, statsFor, type CombatStats, type Progress } from "./progression";
import { stageTrack } from "./music";
import { loadSave, writeSave } from "./save";
import { xpForLevel } from "./progression";

export type HudState = {
  hp: number;
  maxHp: number;
  ammo: number;
  maxAmmo: number;
  weaponName: string;
  weaponId: WeaponId;
  killed: number;
  total: number;
  phase: "clear" | "boss" | "fragment" | "dead" | "done";
  objective: string;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  medkits: number;
  level: number;
  xp: number;
  xpNext: number;
  intensity: number;
  musicPhase: DirectorPhase;
};

export type EngineCallbacks = {
  onHud: (hud: HudState) => void;
  onComplete: () => void;
  onDeath: () => void;
  onBoss: () => void;
  onToast: (text: string) => void;
};

type BossState =
  | "approach"
  | "radial"
  | "volley"
  | "charge"
  | "summon"
  | "spiral"
  | "slam"
  | "snipe"
  | "vulnerable"
  | "dying";

/** Combat personality picked when an enemy spawns, so hordes never feel identical. */
type EnemyStyle = "rusher" | "lunger" | "spread" | "burst" | "sniper";

type Bullet = {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  damage: number;
  size: number;
  knockback: number;
  color: string;
};

type Enemy = {
  alive: boolean;
  kind: EnemyKind;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  hurt: number;
  facing: 1 | -1;
  fireTimer: number;
  anim: number;
  knockX: number;
  knockY: number;
  attackCooldown: number;
  style?: EnemyStyle;
  dashTimer?: number;
  dashVX?: number;
  dashVY?: number;
  burstLeft?: number;
  burstTimer?: number;
  // boss only
  boss?: {
    state: BossState;
    timer: number;
    nextAttack: number;
    chargeVX: number;
    chargeVY: number;
    phase: number;
    animLock?: number;
  };
  spriteAnim?: BossAnim;
  spriteTime?: number;
};

type Pickup = {
  active: boolean;
  kind: "ammo" | "medkit" | "fragment";
  x: number;
  y: number;
  amount: number;
  bob: number;
};

type Crate = { x: number; y: number; hp: number; opened: boolean; loot: "ammo" | "medkit" };

const MAX_BULLETS = 260;
const MAX_ENEMY_BULLETS = 220;

export class GameEngine {
  private ctx: CanvasRenderingContext2D;
  private input = new InputManager();
  private particles = new ParticleSystem(1000);
  private ambient = new ParticleSystem(220);
  private map: LevelMap;
  private rng: Rng;

  private raf = 0;
  private lastTime = 0;
  private running = false;
  private paused = false;
  private time = 0;

  private cam = { x: 0, y: 0, shake: 0 };
  private zoom = 1;
  private viewW = 0;
  private viewH = 0;

  private player = {
    x: 0,
    y: 0,
    r: 13,
    hp: 100,
    maxHp: 100,
    speed: 190,
    aim: 0,
    facing: 1 as 1 | -1,
    invuln: 0,
    flash: 0,
    recoil: 0,
    shootTimer: 0,
    moving: false,
    dead: false,
    victory: false,
    medkits: 1,
  };

  private weapon: WeaponId;
  private ammo: number;
  private bullets: Bullet[] = [];
  private enemyBullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private pickups: Pickup[] = [];
  private crates: Crate[] = [];
  private boss: Enemy | null = null;

  private director: MusicDirector;
  private progress: Progress = createProgress();
  private stats: CombatStats = statsFor(1);
  /** >0 while the arena is silent, preparing the boss entrance */
  private bossIntro = -1;
  private spawned = 0;
  private killed = 0;
  private spawnTimer = 0.8;
  private phase: HudState["phase"] = "clear";
  private lastHudKey = "";
  private completeTimer = -1;
  private muzzleFlash = 0;

  constructor(
    private canvas: HTMLCanvasElement,
    private level: LevelDef,
    private avatar: ResolvedAvatar,
    private callbacks: EngineCallbacks,
  ) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D não disponível neste dispositivo.");
    this.ctx = context;
    this.map = generateLevel(level.index);
    const coarse =
      typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;
    this.director = new MusicDirector(stageTrack(level.index).plan, coarse ? 0.75 : 1);
    this.rng = createRng(4242 + level.index * 31);
    preloadBossSprites(LEVEL_BOSS_GOLEM[level.index] ?? 1);
    this.weapon = level.weapon;
    this.ammo = WEAPONS[this.weapon].startAmmo;
    this.player.x = this.map.playerStart.x;
    this.player.y = this.map.playerStart.y;
    this.cam.x = this.player.x;
    this.cam.y = this.player.y;

    for (let i = 0; i < MAX_BULLETS; i++) this.bullets.push(this.makeBullet());
    for (let i = 0; i < MAX_ENEMY_BULLETS; i++) this.enemyBullets.push(this.makeBullet());

    const saved = loadSave().progress;
    if (saved) {
      this.progress = { level: saved.level, xp: saved.xp, next: xpForLevel(saved.level) };
      this.stats = statsFor(saved.level);
      this.player.maxHp = this.stats.maxHp;
      this.player.hp = this.stats.maxHp;
      this.player.speed = 190 * this.stats.speedMul;
    }

    this.populateWorld();
  }

  /* ------------------------------- lifecycle ------------------------------ */

  start() {
    if (this.running) return;
    this.running = true;
    this.input.attach(this.canvas, () => this.callbacks.onToast("__pause__"));
    this.resize();
    window.addEventListener("resize", this.resize);
    this.lastTime = performance.now();
    this.raf = requestAnimationFrame(this.loop);
    this.emitHud(true);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    this.input.detach();
    this.particles.clear();
    this.ambient.clear();
  }

  setPaused(p: boolean) {
    this.paused = p;
    if (!p) this.lastTime = performance.now();
    if (p) this.input.releaseAll();
  }

  getInput() {
    return this.input;
  }

  useMedkit() {
    if (this.player.medkits <= 0 || this.player.dead) return;
    if (this.player.hp >= this.player.maxHp) {
      this.callbacks.onToast("Vida já está cheia");
      return;
    }
    this.player.medkits--;
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + 45);
    audio.heal();
    this.particles.burst(this.player.x, this.player.y - 24, 18, "#7ee08a", {
      speed: 90,
      life: 0.7,
    });
    this.emitHud(true);
  }

  private resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    this.zoom = rect.width < 720 ? 0.82 : rect.width < 1100 ? 0.95 : 1.05;
    this.viewW = rect.width / this.zoom;
    this.viewH = rect.height / this.zoom;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    setPixelated(this.ctx);
  };

  /* -------------------------------- world -------------------------------- */

  private makeBullet(): Bullet {
    return {
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      damage: 0,
      size: 3,
      knockback: 0,
      color: "#ffd98a",
    };
  }

  private populateWorld() {
    const rooms = this.map.rooms;
    rooms.forEach((room, i) => {
      if (i === 0) return;
      const cx = (room.cx + 0.5) * TILE;
      const cy = (room.cy + 0.5) * TILE;
      if (this.rng() < 0.72) {
        this.crates.push({
          x: cx + rand(this.rng, -60, 60),
          y: cy + rand(this.rng, -50, 50),
          hp: 30,
          opened: false,
          loot: this.rng() < 0.65 ? "ammo" : "medkit",
        });
      }
      if (this.rng() < 0.85) {
        this.pickups.push({
          active: true,
          kind: "ammo",
          x: cx + rand(this.rng, -70, 70),
          y: cy + rand(this.rng, -60, 60),
          amount: randInt(this.rng, 14, 26),
          bob: this.rng() * 6,
        });
      }
      if (this.rng() < 0.28) {
        this.pickups.push({
          active: true,
          kind: "medkit",
          x: cx + rand(this.rng, -70, 70),
          y: cy + rand(this.rng, -60, 60),
          amount: 1,
          bob: this.rng() * 6,
        });
      }
    });
  }

  /** Melee enemies charge or lunge; shooters spread, burst or snipe. */
  private pickEnemyStyle(kind: EnemyKind): EnemyStyle {
    const ranged = ENEMIES[kind].ranged;
    const pool: EnemyStyle[] = ranged
      ? ["spread", "burst", "sniper", "burst"]
      : ["rusher", "lunger", "lunger"];
    return pool[randInt(this.rng, 0, pool.length - 1)] ?? "rusher";
  }

  private spawnEnemy(kind: EnemyKind) {
    const stats = ENEMIES[kind];
    const rooms = this.map.rooms;
    let spot: { x: number; y: number } | null = null;
    for (let tries = 0; tries < 30; tries++) {
      const room = rooms[randInt(this.rng, 0, rooms.length - 1)];
      const x = (room.x + rand(this.rng, 1, room.w - 1)) * TILE;
      const y = (room.y + rand(this.rng, 1, room.h - 1)) * TILE;
      const dist = Math.hypot(x - this.player.x, y - this.player.y);
      if (dist > 380 && dist < 1500) {
        spot = { x, y };
        break;
      }
    }
    if (!spot) {
      const room = rooms[rooms.length - 1];
      spot = { x: (room.cx + 0.5) * TILE, y: (room.cy + 0.5) * TILE };
    }
    const hpScale = 1 + this.level.index * 0.06;
    const enemy: Enemy = {
      alive: true,
      kind,
      x: spot.x,
      y: spot.y,
      vx: 0,
      vy: 0,
      hp: stats.hp * hpScale,
      maxHp: stats.hp * hpScale,
      hurt: 0,
      facing: 1,
      fireTimer: rand(this.rng, 0.6, stats.fireRate || 2),
      anim: this.rng() * 4,
      knockX: 0,
      knockY: 0,
      attackCooldown: 0,
      style: this.pickEnemyStyle(kind),
      dashTimer: rand(this.rng, 1.2, 3),
      dashVX: 0,
      dashVY: 0,
      burstLeft: 0,
      burstTimer: 0,
    };
    this.enemies.push(enemy);
    this.particles.burst(spot.x, spot.y - 20, 10, "#8b8b8b", {
      speed: 70,
      life: 0.5,
      shape: "smoke",
    });
  }

  private spawnBoss() {
    const stats = ENEMIES.boss;
    const room = this.map.rooms[this.map.rooms.length - 1];
    const hp = stats.hp * (0.62 + this.level.index * 0.1);
    this.boss = {
      alive: true,
      kind: "boss",
      x: (room.cx + 0.5) * TILE,
      y: (room.cy + 0.5) * TILE,
      vx: 0,
      vy: 0,
      hp,
      maxHp: hp,
      hurt: 0,
      facing: 1,
      fireTimer: 0,
      anim: 0,
      knockX: 0,
      knockY: 0,
      attackCooldown: 0,
      boss: {
        state: "approach",
        timer: 0,
        nextAttack: 2.4,
        chargeVX: 0,
        chargeVY: 0,
        phase: 1,
        animLock: 0,
      },
      spriteAnim: "walking",
      spriteTime: 0,
    };
    this.phase = "boss";
    audio.bossRoar();
    // A trilha da fase continua tocando durante o boss (sem troca de música).
    this.cam.shake = 16;
    this.callbacks.onBoss();
    this.callbacks.onToast(`${this.level.bossName} despertou!`);
  }

  /* --------------------------------- loop -------------------------------- */

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;
    if (!this.paused) {
      this.update(dt);
    }
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.time += dt;
    const p = this.player;

    if (p.dead) {
      this.particles.update(dt);
      this.ambient.update(dt);
      this.cam.shake *= 0.9;
      return;
    }

    /* ---- aim ---- */
    const s = this.input.state;
    if (s.usingTouch) {
      p.aim = Math.atan2(s.aimVecY, s.aimVecX);
    } else {
      const worldX = this.cam.x - this.viewW / 2 + s.aimX / this.zoom;
      const worldY = this.cam.y - this.viewH / 2 + s.aimY / this.zoom;
      p.aim = Math.atan2(worldY - (p.y - 34), worldX - p.x);
    }
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;

    /* ---- movement ---- */
    let mx = (s.right ? 1 : 0) - (s.left ? 1 : 0);
    let my = (s.down ? 1 : 0) - (s.up ? 1 : 0);
    if (s.joyX !== 0 || s.joyY !== 0) {
      mx = s.joyX;
      my = s.joyY;
    }
    const mag = Math.hypot(mx, my);
    if (mag > 1) {
      mx /= mag;
      my /= mag;
    }
    p.moving = mag > 0.08;
    const moved = moveCircle(this.map, p.x, p.y, mx * p.speed * dt, my * p.speed * dt, p.r);
    p.x = moved.x;
    p.y = moved.y;

    // crates block the player
    for (const crate of this.crates) {
      if (crate.opened) continue;
      const dx = p.x - crate.x;
      const dy = p.y - crate.y;
      const d = Math.hypot(dx, dy);
      const min = p.r + 16;
      if (d < min && d > 0.001) {
        p.x = crate.x + (dx / d) * min;
        p.y = crate.y + (dy / d) * min;
      }
    }

    if (p.moving && Math.random() < 0.25) {
      this.particles.spawn({
        x: p.x + rand(this.rng, -5, 5),
        y: p.y,
        vx: rand(this.rng, -12, 12),
        vy: rand(this.rng, -16, -4),
        color: "rgba(255,255,255,0.35)",
        life: 0.4,
        size: 1.8,
        shape: "smoke",
      });
    }

    /* ---- shooting ---- */
    p.shootTimer -= dt;
    p.recoil = Math.max(0, p.recoil - dt * 5);
    this.muzzleFlash = Math.max(0, this.muzzleFlash - dt * 8);
    if (s.shooting && p.shootTimer <= 0) this.fire();

    /* ---- interaction ---- */
    if (s.interact) {
      this.tryInteract();
      this.input.state.interact = false;
    }

    p.invuln = Math.max(0, p.invuln - dt);
    p.flash = Math.max(0, p.flash - dt * 2.2);

    this.updateBullets(dt);
    this.updateEnemies(dt);
    this.updateBoss(dt);
    this.updatePickups(dt);
    this.updateWaves(dt);
    this.particles.update(dt);
    this.updateAmbient(dt);

    /* ---- camera ---- */
    const lead = 40;
    const targetX = p.x + Math.cos(p.aim) * lead;
    const targetY = p.y - 24 + Math.sin(p.aim) * lead;
    this.cam.x += (targetX - this.cam.x) * Math.min(1, dt * 6);
    this.cam.y += (targetY - this.cam.y) * Math.min(1, dt * 6);
    this.cam.x = Math.max(this.viewW / 2, Math.min(this.map.width - this.viewW / 2, this.cam.x));
    this.cam.y = Math.max(this.viewH / 2, Math.min(this.map.height - this.viewH / 2, this.cam.y));
    this.cam.shake *= 0.86;

    if (this.completeTimer > 0) {
      this.completeTimer -= dt;
      if (this.completeTimer <= 0) {
        this.completeTimer = -1;
        this.callbacks.onComplete();
      }
    }

    this.emitHud();
  }

  private tryInteract() {
    for (const crate of this.crates) {
      if (crate.opened) continue;
      if (Math.hypot(crate.x - this.player.x, crate.y - this.player.y) < 52) {
        this.openCrate(crate);
        return;
      }
    }
    this.callbacks.onToast("Nada por perto para abrir");
  }

  private openCrate(crate: Crate) {
    crate.opened = true;
    this.particles.burst(crate.x, crate.y - 10, 20, "#c79a5b", {
      speed: 130,
      life: 0.6,
      shape: "shard",
      gravity: 260,
    });
    audio.pickup();
    if (crate.loot === "ammo") {
      const amount = randInt(this.rng, 10, 20);
      this.pickups.push({ active: true, kind: "ammo", x: crate.x, y: crate.y, amount, bob: 0 });
    } else {
      this.pickups.push({
        active: true,
        kind: "medkit",
        x: crate.x,
        y: crate.y,
        amount: 1,
        bob: 0,
      });
    }
  }

  private fire() {
    const w = WEAPONS[this.weapon];
    if (this.ammo < w.ammoPerShot) {
      audio.empty();
      this.player.shootTimer = 0.35;
      this.callbacks.onToast("Sem munição! Procure suprimentos.");
      return;
    }
    this.ammo -= w.ammoPerShot;
    this.player.shootTimer = w.cooldown / this.stats.fireRateMul;
    this.player.recoil = 1;
    this.muzzleFlash = 1;
    this.cam.shake = Math.min(14, this.cam.shake + (this.weapon === "shotgun" ? 9 : 3.2));
    audio.shoot(this.weapon);

    const dist = weaponMuzzleDistance(w.visual);
    const originX = this.player.x + Math.cos(this.player.aim) * dist;
    const originY = this.player.y - 42 + Math.sin(this.player.aim) * dist;

    for (let i = 0; i < w.pellets; i++) {
      const angle = this.player.aim + rand(this.rng, -w.spread, w.spread);
      const b = this.bullets.find((bullet) => !bullet.active);
      if (!b) break;
      b.active = true;
      b.x = originX;
      b.y = originY;
      b.vx = Math.cos(angle) * w.speed;
      b.vy = Math.sin(angle) * w.speed;
      b.life = w.range / w.speed;
      b.damage = w.damage * this.stats.damageMul;
      b.size = w.bulletSize;
      b.knockback = w.knockback;
      b.color = "#5fc8ff";
    }
    this.particles.burst(originX, originY, 6, "#7fd4ff", { speed: 150, life: 0.18, size: 2.2 });
  }

  private updateBullets(dt: number) {
    for (const b of this.bullets) {
      if (!b.active) continue;
      b.life -= dt;
      const nx = b.x + b.vx * dt;
      const ny = b.y + b.vy * dt;
      if (b.life <= 0) {
        b.active = false;
        continue;
      }
      if (this.hitsWall(nx, ny)) {
        b.active = false;
        this.particles.burst(nx, ny, 5, "#d9d2c0", { speed: 90, life: 0.25, size: 1.8 });
        continue;
      }
      b.x = nx;
      b.y = ny;

      for (const crate of this.crates) {
        if (crate.opened) continue;
        if (Math.abs(b.x - crate.x) < 20 && Math.abs(b.y - crate.y + 10) < 22) {
          crate.hp -= b.damage;
          b.active = false;
          this.particles.burst(b.x, b.y, 6, "#a87b45", { speed: 90, life: 0.3, shape: "shard" });
          if (crate.hp <= 0) this.openCrate(crate);
          break;
        }
      }
      if (!b.active) continue;

      const targets: Enemy[] =
        this.boss && this.boss.alive ? [...this.enemies, this.boss] : this.enemies;
      for (const e of targets) {
        if (!e.alive) continue;
        const stats = ENEMIES[e.kind];
        const hitY = e.y - (e.kind === "boss" ? 48 : 22);
        if (Math.hypot(b.x - e.x, b.y - hitY) <= stats.radius + b.size) {
          const vulnerable = e.boss?.state === "vulnerable" ? 1.8 : 1;
          this.damageEnemy(e, b.damage * vulnerable, b.vx, b.vy, b.knockback);
          b.active = false;
          break;
        }
      }
    }

    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      b.life -= dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.life <= 0 || this.hitsWall(b.x, b.y)) {
        b.active = false;
        this.particles.burst(b.x, b.y, 4, b.color, { speed: 70, life: 0.25, size: 2 });
        continue;
      }
      if (Math.hypot(b.x - this.player.x, b.y - (this.player.y - 26)) < this.player.r + b.size) {
        b.active = false;
        this.damagePlayer(b.damage);
      }
    }
  }

  private hitsWall(x: number, y: number) {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    if (tx < 0 || ty < 0 || tx >= this.map.cols || ty >= this.map.rows) return true;
    return this.map.tiles[ty * this.map.cols + tx] === 1;
  }

  private damageEnemy(e: Enemy, damage: number, vx: number, vy: number, knockback: number) {
    e.hp -= damage;
    e.hurt = 0.32;
    const len = Math.hypot(vx, vy) || 1;
    const factor = e.kind === "boss" ? 0.12 : 1;
    e.knockX += (vx / len) * knockback * factor;
    e.knockY += (vy / len) * knockback * factor;
    const hitY = e.y - (e.kind === "boss" ? 48 : 22);
    audio.hit();
    this.particles.burst(e.x, hitY, 7, e.kind === "skeleton" ? "#e8dcc0" : "#b8324a", {
      speed: 130,
      life: 0.35,
      size: 2.4,
    });
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    e.alive = false;
    audio.enemyDeath();
    const hitY = e.y - (e.kind === "boss" ? 48 : 22);
    this.particles.burst(e.x, hitY, e.kind === "boss" ? 90 : 22, "#8c2438", {
      speed: e.kind === "boss" ? 300 : 170,
      life: 0.9,
      size: 3,
      gravity: 120,
    });
    if (e.kind === "boss") {
      this.cam.shake = 26;
      if (e.boss) {
        // plays the death animation before the level completes
        e.boss.state = "dying";
        e.boss.timer = 1.5;
        e.spriteAnim = "dying";
        e.spriteTime = 0;
      }
      return;
    }
    this.killed++;
    this.grantXp(ENEMIES[e.kind].score);
    const roll = this.rng();
    const lastLevel = this.level.index === 4;
    if (roll < (lastLevel ? 0.6 : 0.3)) {
      this.pickups.push({
        active: true,
        kind: "ammo",
        x: e.x,
        y: e.y,
        amount: lastLevel ? randInt(this.rng, 24, 40) : randInt(this.rng, 8, 16),
        bob: 0,
      });
    } else if (roll < (lastLevel ? 0.7 : 0.38)) {
      this.pickups.push({ active: true, kind: "medkit", x: e.x, y: e.y, amount: 1, bob: 0 });
    }
  }

  private grantXp(amount: number) {
    const result = addXp(this.progress, amount);
    this.progress = result.progress;
    try {
      const save = loadSave();
      writeSave({ ...save, progress: { level: this.progress.level, xp: this.progress.xp } });
    } catch {
      /* ignore */
    }
    if (result.levelsGained > 0) {
      this.stats = statsFor(this.progress.level);
      const prevMax = this.player.maxHp;
      this.player.maxHp = this.stats.maxHp;
      this.player.hp = Math.min(
        this.player.maxHp,
        this.player.hp + (this.player.maxHp - prevMax) + 12,
      );
      this.player.speed = 190 * this.stats.speedMul;
      audio.heal();
      this.particles.burst(this.player.x, this.player.y - 26, 34, "#ffd98a", {
        speed: 170,
        life: 0.8,
      });
      this.callbacks.onToast(`Nível ${this.progress.level} — mais forte!`);
      this.emitHud(true);
    }
  }

  private onBossDefeated() {
    this.phase = "fragment";
    this.callbacks.onToast(`${this.level.bossName} derrotado!`);
    audio.playMusic("ending", { id: "victory", duration: 40, loop: true });
    const room = this.map.rooms[this.map.rooms.length - 1];
    this.pickups.push({
      active: true,
      kind: "fragment",
      x: (room.cx + 0.5) * TILE,
      y: (room.cy + 0.5) * TILE,
      amount: 1,
      bob: 0,
    });
  }

  private damagePlayer(amount: number) {
    const p = this.player;
    if (p.invuln > 0 || p.dead) return;
    p.hp -= amount;
    p.invuln = 0.85;
    p.flash = 1;
    this.cam.shake = 12;
    audio.playerHurt();
    this.particles.burst(p.x, p.y - 30, 12, "#ff5f57", { speed: 140, life: 0.4 });
    if (p.hp <= 0) {
      p.hp = 0;
      p.dead = true;
      this.phase = "dead";
      audio.death();
      audio.stopMusic();
      this.callbacks.onDeath();
    }
    this.emitHud(true);
  }

  private updateEnemies(dt: number) {
    const p = this.player;
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      if (!e.alive) {
        this.enemies.splice(i, 1);
        continue;
      }
      const stats = ENEMIES[e.kind];
      e.hurt = Math.max(0, e.hurt - dt * 3);
      e.anim += dt;
      e.attackCooldown = Math.max(0, e.attackCooldown - dt);

      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.facing = dx >= 0 ? 1 : -1;

      // separation from neighbours (keeps the horde readable)
      let sepX = 0;
      let sepY = 0;
      for (const other of this.enemies) {
        if (other === e || !other.alive) continue;
        const ox = e.x - other.x;
        const oy = e.y - other.y;
        const od = Math.hypot(ox, oy);
        if (od > 0.001 && od < 42) {
          sepX += (ox / od) * (42 - od) * 2.4;
          sepY += (oy / od) * (42 - od) * 2.4;
        }
      }

      const ranged = stats.ranged;
      const style = e.style ?? (ranged ? "spread" : "rusher");
      const preferred = ranged ? (style === "sniper" ? 320 : style === "spread" ? 170 : 230) : 26;
      let dirX = dx / dist;
      let dirY = dy / dist;
      if (ranged && dist < preferred * 0.8) {
        dirX = -dirX;
        dirY = -dirY;
      } else if (ranged && dist < preferred * 1.15) {
        dirX = -dirY;
        dirY = dirX;
      }

      const vx = dirX * stats.speed + sepX + e.knockX;
      const vy = dirY * stats.speed + sepY + e.knockY;
      e.knockX *= 0.86;
      e.knockY *= 0.86;
      const moved = moveCircle(this.map, e.x, e.y, vx * dt, vy * dt, stats.radius * 0.8);
      e.x = moved.x;
      e.y = moved.y;

      if (ranged) {
        e.fireTimer -= dt;
        if (
          e.fireTimer <= 0 &&
          dist < 460 &&
          hasLineOfSight(this.map, e.x, e.y - 20, p.x, p.y - 26)
        ) {
          e.fireTimer = stats.fireRate * rand(this.rng, 0.8, 1.3);
          this.enemyShoot(e, stats.projectileSpeed, stats.damage * 0.8);
        }
      }
      if (dist < stats.radius + p.r + 4 && e.attackCooldown <= 0) {
        e.attackCooldown = 0.9;
        this.damagePlayer(stats.damage);
        e.knockX -= dirX * 260;
        e.knockY -= dirY * 260;
      }
    }
  }

  private enemyShoot(e: Enemy, speed: number, damage: number, angleOverride?: number) {
    const b = this.enemyBullets.find((bullet) => !bullet.active);
    if (!b) return;
    const angle = angleOverride ?? Math.atan2(this.player.y - 26 - (e.y - 24), this.player.x - e.x);
    const color = "#ff4444";
    b.active = true;
    b.x = e.x + Math.cos(angle) * 18;
    b.y = e.y - 24 + Math.sin(angle) * 18;
    b.vx = Math.cos(angle) * speed;
    b.vy = Math.sin(angle) * speed;
    b.life = 3.2;
    b.damage = damage;
    b.size = e.kind === "boss" ? 6 : 4.2;
    b.knockback = 0;
    b.color = color;
  }

  private updateBoss(dt: number) {
    const boss = this.boss;
    if (!boss || !boss.boss) return;
    const st = boss.boss;
    if (st.state === "dying") {
      st.timer -= dt;
      boss.spriteTime = (boss.spriteTime ?? 0) + dt;
      if (st.timer <= 0) {
        this.boss = null;
        this.onBossDefeated();
      }
      return;
    }
    if (!boss.alive) return;
    const p = this.player;
    boss.hurt = Math.max(0, boss.hurt - dt * 3);
    boss.anim += dt;
    const dx = p.x - boss.x;
    const dy = p.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    boss.facing = dx >= 0 ? 1 : -1;
    st.timer -= dt;
    const hpRatio = boss.hp / boss.maxHp;
    st.phase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;

    // sprite animation: locked one-shots (attacks/hits) win, otherwise follow the AI state
    boss.spriteTime = (boss.spriteTime ?? 0) + dt;
    st.animLock = Math.max(0, (st.animLock ?? 0) - dt);
    if (st.animLock <= 0) {
      const want: BossAnim =
        st.state === "charge" ? "running" : st.state === "vulnerable" ? "idle" : "walking";
      if (boss.spriteAnim !== want) {
        boss.spriteAnim = want;
        boss.spriteTime = 0;
      }
    }

    const move = (speed: number) => {
      const moved = moveCircle(
        this.map,
        boss.x,
        boss.y,
        (dx / dist) * speed * dt,
        (dy / dist) * speed * dt,
        26,
      );
      boss.x = moved.x;
      boss.y = moved.y;
    };

    switch (st.state) {
      case "approach": {
        if (dist > 200) move(ENEMIES.boss.speed);
        else if (dist < 130) move(-ENEMIES.boss.speed * 0.6);
        if (st.timer <= 0) {
          const options: BossState[] =
            st.phase === 1
              ? ["radial", "volley", "charge"]
              : st.phase === 2
                ? ["radial", "charge", "summon", "volley"]
                : ["radial", "radial", "charge", "volley", "summon"];
          const next = options[randInt(this.rng, 0, options.length - 1)] ?? "radial";
          st.state = next;
          st.timer = next === "charge" ? 0.85 : 0.6;
          if (next !== "charge") {
            boss.spriteAnim = "throwing";
            boss.spriteTime = 0;
            st.animLock = 0.62;
          }
          if (next === "charge") {
            st.chargeVX = (dx / dist) * 460;
            st.chargeVY = (dy / dist) * 460;
            this.callbacks.onToast("Ele vai avançar!");
          }
          if (next === "radial") {
            const count = st.phase === 3 ? 18 : 12;
            for (let i = 0; i < count; i++) {
              this.enemyShoot(boss, 210, ENEMIES.boss.damage * 0.55, (i / count) * Math.PI * 2);
            }
            audio.bossRoar();
          }
          if (next === "volley") {
            for (let i = -2; i <= 2; i++) {
              const base = Math.atan2(p.y - 26 - (boss.y - 48), p.x - boss.x);
              this.enemyShoot(boss, 300, ENEMIES.boss.damage * 0.5, base + i * 0.16);
            }
          }
          if (next === "summon") {
            const before = this.enemies.length;
            for (let i = 0; i < 6; i++) this.spawnEnemy(this.level.enemy);
            if (this.enemies.length > before) this.callbacks.onToast("Ele chamou reforços!");
          }
        }
        break;
      }
      case "charge": {
        const moved = moveCircle(this.map, boss.x, boss.y, st.chargeVX * dt, st.chargeVY * dt, 26);
        if (moved.hitX || moved.hitY) st.timer = 0;
        boss.x = moved.x;
        boss.y = moved.y;
        this.particles.spawn({
          x: boss.x,
          y: boss.y - 20,
          vx: rand(this.rng, -30, 30),
          vy: rand(this.rng, -40, 0),
          color: "#8d1b34",
          life: 0.5,
          size: 6,
          shape: "smoke",
        });
        if (dist < 60) this.damagePlayer(ENEMIES.boss.damage);
        if (st.timer <= 0) {
          st.state = "vulnerable";
          st.timer = 1.6;
          this.cam.shake = 12;
        }
        break;
      }
      case "vulnerable": {
        if (st.timer <= 0) {
          st.state = "approach";
          st.timer = st.phase === 3 ? 1.4 : 2.4;
        }
        break;
      }
      default: {
        if (st.timer <= 0) {
          st.state = "vulnerable";
          st.timer = st.phase === 3 ? 0.9 : 1.4;
        }
        break;
      }
    }

    if (dist < 62 && st.state !== "charge") {
      if (boss.attackCooldown <= 0) {
        boss.attackCooldown = 1.1;
        this.damagePlayer(ENEMIES.boss.damage * 0.7);
        boss.spriteAnim = "slashing";
        boss.spriteTime = 0;
        st.animLock = 0.55;
      }
    }
    boss.attackCooldown = Math.max(0, boss.attackCooldown - dt);
  }

  private updatePickups(dt: number) {
    const p = this.player;
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const item = this.pickups[i];
      if (!item.active) {
        this.pickups.splice(i, 1);
        continue;
      }
      item.bob += dt * 3;
      const d = Math.hypot(item.x - p.x, item.y - p.y);
      if (d > 34) continue;
      if (item.kind === "ammo") {
        const w = WEAPONS[this.weapon];
        if (this.ammo >= w.maxAmmo) continue;
        this.ammo = Math.min(w.maxAmmo, this.ammo + item.amount);
        audio.pickup();
        this.callbacks.onToast(`+${item.amount} munição`);
      } else if (item.kind === "medkit") {
        this.player.medkits++;
        audio.pickup();
        this.callbacks.onToast("Kit médico guardado (tecla Q)");
      } else {
        audio.fragment();
        this.player.victory = true;
        this.phase = "done";
        this.completeTimer = 1.4;
        this.particles.burst(item.x, item.y - 20, 60, "#ffd88a", {
          speed: 210,
          life: 1.2,
          size: 3.4,
        });
      }
      item.active = false;
      this.pickups.splice(i, 1);
      this.emitHud(true);
    }
  }

  private updateWaves(dt: number) {
    if (this.phase !== "clear") return;

    // the song drives the pacing; when there is no real track the director
    // simulates the timeline from the configured duration
    this.director.update(dt, audio.musicProgress() ?? undefined);
    if (this.spawned >= this.level.enemyCount) this.director.stopSpawning();

    if (this.bossIntro < 0) {
      const count = this.director.tryBurst(this.enemies.length);
      for (let i = 0; i < count && this.spawned < this.level.enemyCount; i++) {
        this.spawnEnemy(this.level.enemy);
        this.spawned++;
      }
    }

    // arena is clean and no new horde can arrive -> silence, then the boss
    if (!this.director.spawnsOpen && this.enemies.length === 0) {
      if (this.bossIntro < 0) {
        this.bossIntro = 2.1;
        // a trilha da fase continua tocando durante o boss — sem parar a música
        this.callbacks.onToast("A horda acabou…");
      } else {
        this.bossIntro -= dt;
        if (this.bossIntro <= 0) {
          this.bossIntro = -1;
          if (this.level.hasBoss) this.spawnBoss();
          else this.onBossDefeated();
        }
      }
    }
  }

  private updateAmbient(dt: number) {
    const theme = this.level.theme;
    const spawnRate = theme.particle === "snow" ? 0.9 : theme.particle === "sand" ? 0.8 : 0.35;
    if (Math.random() < spawnRate) {
      const x = this.cam.x + rand(this.rng, -this.viewW / 2, this.viewW / 2);
      const y = this.cam.y - this.viewH / 2 - 20;
      const cfg = {
        leaf: {
          color: "#9ccf7a",
          vx: rand(this.rng, -30, 10),
          vy: rand(this.rng, 20, 50),
          size: 2.6,
          life: 6,
        },
        dust: {
          color: "rgba(220,210,190,0.7)",
          vx: rand(this.rng, -20, 20),
          vy: rand(this.rng, 10, 30),
          size: 1.8,
          life: 5,
        },
        snow: {
          color: "#ffffff",
          vx: rand(this.rng, -60, -10),
          vy: rand(this.rng, 60, 120),
          size: 2.4,
          life: 5,
        },
        sand: {
          color: "#e6cd9a",
          vx: rand(this.rng, -140, -60),
          vy: rand(this.rng, 10, 40),
          size: 2,
          life: 4,
        },
        ash: {
          color: "#d68b8b",
          vx: rand(this.rng, -25, 25),
          vy: rand(this.rng, 20, 45),
          size: 2.2,
          life: 6,
        },
      }[theme.particle];
      this.ambient.spawn({ ...cfg, x, y, drag: 1, shape: "dot" });
    }
    this.ambient.update(dt);
  }

  /* --------------------------------- HUD --------------------------------- */

  private emitHud(force = false) {
    const hud: HudState = {
      hp: Math.round(this.player.hp),
      maxHp: this.player.maxHp,
      ammo: this.ammo,
      maxAmmo: WEAPONS[this.weapon].maxAmmo,
      weaponName: WEAPONS[this.weapon].name,
      weaponId: this.weapon,
      killed: this.killed,
      total: this.level.enemyCount,
      phase: this.phase,
      medkits: this.player.medkits,
      level: this.progress.level,
      xp: this.progress.xp,
      xpNext: this.progress.next,
      intensity: this.director.intensity,
      musicPhase: this.director.phase,
      objective:
        this.phase === "clear"
          ? this.bossIntro > 0
            ? "Algo muito maior se aproxima…"
            : `Elimine os inimigos (${this.killed}/${this.level.enemyCount})`
          : this.phase === "boss"
            ? `Derrote ${this.level.bossName}`
            : this.phase === "fragment"
              ? "Pegue o fragmento"
              : this.phase === "dead"
                ? "Você caiu"
                : "Fragmento obtido",
      bossHp: this.boss ? Math.max(0, Math.round(this.boss.hp)) : 0,
      bossMaxHp: this.boss ? this.boss.maxHp : 0,
      bossName: this.level.bossName,
    };
    const key = `${hud.hp}|${hud.ammo}|${hud.killed}|${hud.phase}|${hud.bossHp}|${hud.medkits}|${hud.level}|${hud.xp}|${Math.round(hud.intensity * 20)}`;
    if (!force && key === this.lastHudKey) return;
    this.lastHudKey = key;
    this.callbacks.onHud(hud);
  }

  /* -------------------------------- render ------------------------------- */

  private render() {
    const ctx = this.ctx;
    const theme = this.level.theme;
    const shakeX = (Math.random() - 0.5) * this.cam.shake;
    const shakeY = (Math.random() - 0.5) * this.cam.shake;
    const viewX = this.cam.x - this.viewW / 2 + shakeX;
    const viewY = this.cam.y - this.viewH / 2 + shakeY;

    ctx.save();
    ctx.fillStyle = theme.ambient;
    ctx.fillRect(0, 0, this.viewW * this.zoom, this.viewH * this.zoom);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-viewX, -viewY);
    const view = { x: viewX, y: viewY, w: this.viewW, h: this.viewH };

    drawGround(ctx, this.map, theme, view);

    // y-sorted world objects
    type Item = { y: number; draw: () => void };
    const items: Item[] = [];
    for (const d of this.map.decorations) {
      if (d.x < view.x - 90 || d.x > view.x + view.w + 90) continue;
      if (d.y < view.y - 130 || d.y > view.y + view.h + 130) continue;
      items.push({ y: d.y, draw: () => drawDecoration(ctx, d, theme, this.time) });
    }
    for (const crate of this.crates) {
      if (crate.opened) continue;
      items.push({ y: crate.y, draw: () => this.drawCrate(crate) });
    }
    for (const item of this.pickups) {
      items.push({ y: item.y, draw: () => this.drawPickup(item) });
    }
    for (const e of this.enemies) {
      if (!e.alive) continue;
      items.push({
        y: e.y,
        draw: () => {
          drawEnemy(ctx, e.kind, e.anim, e.facing, e.hurt, 1, e.x, e.y);
          if (e.hp < e.maxHp) this.drawHealthBar(e.x, e.y - 52, 34, e.hp / e.maxHp);
        },
      });
    }
    if (this.boss && (this.boss.alive || this.boss.boss?.state === "dying")) {
      const boss = this.boss;
      const variant = LEVEL_BOSS_GOLEM[this.level.index] ?? 1;
      items.push({
        y: boss.y,
        draw: () =>
          drawBossSprite(
            ctx,
            variant,
            boss.spriteAnim ?? "walking",
            boss.spriteTime ?? 0,
            boss.facing,
            boss.hurt,
            boss.x,
            boss.y,
            150,
          ),
      });
    }
    items.push({ y: this.player.y, draw: () => this.drawPlayer() });
    items.sort((a, b) => a.y - b.y);
    for (const item of items) item.draw();

    // bullets (bright core + glow so they read over any terrain)
    ctx.save();
    for (const b of this.bullets) {
      if (!b.active) continue;
      ctx.strokeStyle = "rgba(140,220,255,0.55)";
      ctx.lineWidth = b.size * 1.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.022, b.y - b.vy * 0.022);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const b of this.enemyBullets) {
      if (!b.active) continue;
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,220,220,0.9)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    this.particles.render(ctx);
    this.ambient.render(ctx);
    drawAtmosphere(ctx, theme, view, this.time, this.level.index);

    // aim guide
    if (!this.player.dead) {
      const ax = this.player.x + Math.cos(this.player.aim) * 90;
      const ay = this.player.y - 34 + Math.sin(this.player.aim) * 90;
      ctx.strokeStyle = "rgba(255,225,170,0.35)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      ctx.moveTo(ax - 14, ay);
      ctx.lineTo(ax - 10, ay);
      ctx.moveTo(ax + 10, ay);
      ctx.lineTo(ax + 14, ay);
      ctx.stroke();
    }

    // minimap
    ctx.restore();
    this.drawMinimap();
  }

  private drawPlayer() {
    const ctx = this.ctx;
    const p = this.player;
    const pose: AvatarPose = {
      state: p.dead ? "dead" : p.victory ? "win" : p.moving ? "run" : "idle",
      time: this.time,
      aim: p.aim,
      facing: p.facing,
      flash: p.flash,
      recoil: p.recoil,
      weapon: WEAPONS[this.weapon].visual,
    };
    if (p.invuln > 0 && Math.floor(this.time * 20) % 2 === 0) ctx.globalAlpha = 0.6;
    drawAvatar(ctx, this.avatar, pose, p.x, p.y, 1.05);
    ctx.globalAlpha = 1;

    if (this.muzzleFlash > 0) {
      const w = WEAPONS[this.weapon];
      const d = weaponMuzzleDistance(w.visual);
      const mx = p.x + Math.cos(p.aim) * d;
      const my = p.y - 42 + Math.sin(p.aim) * d;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const g = ctx.createRadialGradient(mx, my, 1, mx, my, 34 * this.muzzleFlash);
      g.addColorStop(0, "rgba(255,230,150,0.95)");
      g.addColorStop(1, "rgba(255,180,80,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mx, my, 34 * this.muzzleFlash, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  private drawHealthBar(x: number, y: number, width: number, ratio: number) {
    const ctx = this.ctx;
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - width / 2, y, width, 4);
    ctx.fillStyle = ratio > 0.5 ? "#7ec96a" : ratio > 0.25 ? "#e0b055" : "#d3574f";
    ctx.fillRect(x - width / 2, y, width * Math.max(0, ratio), 4);
  }

  private drawCrate(crate: Crate) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(crate.x, crate.y);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    // Kenney chest sprite when the sheet is loaded
    if (drawSheetSprite(ctx, "castle", 89, 0, 4, 42, 1)) {
      ctx.restore();
      return;
    }
    ctx.fillStyle = "#7d5a34";
    ctx.fillRect(-16, -30, 32, 30);
    ctx.fillStyle = "#96703f";
    ctx.fillRect(-16, -30, 32, 6);
    ctx.strokeStyle = "#4b3520";
    ctx.lineWidth = 2;
    ctx.strokeRect(-16, -30, 32, 30);
    ctx.beginPath();
    ctx.moveTo(-16, -30);
    ctx.lineTo(16, 0);
    ctx.moveTo(16, -30);
    ctx.lineTo(-16, 0);
    ctx.stroke();
    ctx.restore();
  }

  private drawPickup(item: Pickup) {
    const ctx = this.ctx;
    const bob = Math.sin(item.bob) * 3;
    ctx.save();
    ctx.translate(item.x, item.y + bob);
    ctx.fillStyle = "rgba(0,0,0,0.28)";
    ctx.beginPath();
    ctx.ellipse(0, 4 - bob, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (item.kind === "ammo") {
      if (drawSheetSprite(ctx, "ui", 76, 0, 2 - bob, 24, 1)) {
        ctx.restore();
        return;
      }
      ctx.fillStyle = "#c9a24a";
      ctx.fillRect(-9, -12, 18, 12);
      ctx.fillStyle = "#7a6127";
      ctx.fillRect(-9, -12, 18, 3);
      ctx.fillStyle = "#f0dda4";
      ctx.fillRect(-4, -9, 3, 7);
      ctx.fillRect(1, -9, 3, 7);
    } else if (item.kind === "medkit") {
      if (drawSheetSprite(ctx, "ui", 56, 0, 2 - bob, 26, 1)) {
        ctx.restore();
        return;
      }
      ctx.fillStyle = "#e8e3da";
      ctx.fillRect(-9, -12, 18, 12);
      ctx.fillStyle = "#c8434a";
      ctx.fillRect(-1.8, -10, 3.6, 8);
      ctx.fillRect(-6, -7.4, 12, 3.2);
    } else {
      const glow = ctx.createRadialGradient(0, -16, 2, 0, -16, 40);
      glow.addColorStop(0, "rgba(255,215,130,0.6)");
      glow.addColorStop(1, "rgba(255,200,110,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, -16, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(Math.sin(item.bob * 0.5) * 0.2);
      ctx.fillStyle = "#ffd88a";
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(11, -16);
      ctx.lineTo(4, -2);
      ctx.lineTo(-8, -8);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(4, -16);
      ctx.lineTo(-2, -6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  private drawMinimap() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const size = rect.width < 720 ? 92 : 132;
    const pad = 14;
    const scale = size / Math.max(this.map.width, this.map.height);
    const ox = rect.width - size - pad;
    const oy = pad;
    ctx.save();
    ctx.globalAlpha = 0.82;
    ctx.fillStyle = "rgba(12,10,16,0.75)";
    ctx.fillRect(ox - 4, oy - 4, size + 8, size + 8);
    ctx.strokeStyle = "rgba(220,180,110,0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(ox - 4, oy - 4, size + 8, size + 8);
    const step = 2;
    for (let ty = 0; ty < this.map.rows; ty += 1) {
      for (let tx = 0; tx < this.map.cols; tx += 1) {
        if (this.map.tiles[ty * this.map.cols + tx] === 1) continue;
        ctx.fillStyle = "rgba(200,190,170,0.35)";
        ctx.fillRect(
          ox + tx * TILE * scale,
          oy + ty * TILE * scale,
          TILE * scale + 0.5,
          TILE * scale + 0.5,
        );
      }
    }
    for (const e of this.enemies) {
      ctx.fillStyle = "rgba(220,80,90,0.9)";
      ctx.fillRect(ox + e.x * scale - 1, oy + e.y * scale - 1, step, step);
    }
    for (const item of this.pickups) {
      ctx.fillStyle = item.kind === "fragment" ? "#ffd88a" : "rgba(120,200,140,0.9)";
      ctx.fillRect(ox + item.x * scale - 1, oy + item.y * scale - 1, step, step);
    }
    if (this.boss?.alive) {
      ctx.fillStyle = "#ff5f7a";
      ctx.fillRect(ox + this.boss.x * scale - 2, oy + this.boss.y * scale - 2, 4, 4);
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(ox + this.player.x * scale - 1.5, oy + this.player.y * scale - 1.5, 3, 3);
    ctx.restore();
  }
}
