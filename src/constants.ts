// ─── Display ──────────────────────────────────────────────────────────────────
export const GAME_WIDTH  = 960;
export const GAME_HEIGHT = 540;
export const WORLD_WIDTH = 6400;

// ─── Physics ──────────────────────────────────────────────────────────────────
export const GRAVITY = 900;

// ─── Player tuning ────────────────────────────────────────────────────────────
export const PLAYER = {
  SPEED:               220,
  JUMP_VEL:           -530,
  DOUBLE_JUMP_VEL:    -450,
  WALL_JUMP_VX:        300,
  WALL_JUMP_VY:       -490,
  WALL_SLIDE_MAX_VY:    90,
  DASH_SPEED:          700,
  DASH_DURATION:       150,   // ms
  SLIDE_SPEED:         400,
  SLIDE_DURATION:      380,   // ms
  MAX_HEALTH:            6,
  ATTACK_DAMAGE:         2,
  ATTACK_DURATION:     220,   // ms (hitbox active)
  ATTACK_COOLDOWN:     380,   // ms
  SPECIAL_COOLDOWN:   1200,   // ms
  STEAL_RANGE:          80,   // px
  INVINCIBLE_MS:      1600,
  // physics body size
  W: 22,
  H: 36,
};

// ─── Enemy tuning ─────────────────────────────────────────────────────────────
export const ENEMY = {
  DETECT_RANGE:  240,
  ATTACK_RANGE:   60,
  STAGGER_MS:   3000,
  KNOCKBACK_VX:  260,
  KNOCKBACK_VY: -180,
};

// ─── Outfits ──────────────────────────────────────────────────────────────────
export const OUTFITS = {
  BASE:        'base',
  FLAME_RONIN: 'flame_ronin',
  STONE_GUARD: 'stone_guard',
  SKY_TENGU:   'sky_tengu',
} as const;

export type OutfitType = typeof OUTFITS[keyof typeof OUTFITS];

export const OUTFIT_NAMES: Record<OutfitType, string> = {
  base:        'Shadow Ninja',
  flame_ronin: 'Flame Ronin',
  stone_guard: 'Stone Guard',
  sky_tengu:   'Sky Tengu',
};

export const OUTFIT_COLORS: Record<OutfitType, { body: number; head: number; accent: number }> = {
  base:        { body: 0x1e1432, head: 0xd4d4d4, accent: 0xcc2222 },
  flame_ronin: { body: 0x8b1a00, head: 0xff6020, accent: 0xffcc00 },
  stone_guard: { body: 0x4a4a5a, head: 0x7a7a8a, accent: 0x2244aa },
  sky_tengu:   { body: 0x0a3d5c, head: 0x8acfea, accent: 0xffffff },
};

// ─── Scene keys ───────────────────────────────────────────────────────────────
export const SCENES = {
  BOOT:      'BootScene',
  TITLE:     'TitleScene',
  GAME:      'GameScene',
  UI:        'UIScene',
  GAME_OVER: 'GameOverScene',
} as const;

// ─── Registry keys ────────────────────────────────────────────────────────────
export const REG = {
  HEALTH:    'health',
  MAX_HP:    'maxHealth',
  OUTFIT:    'outfit',
  SCORE:     'score',
  WIN:       'win',
} as const;

// ─── Depths ───────────────────────────────────────────────────────────────────
export const DEPTH = {
  BG:         0,
  TILES:     10,
  HAZARD:    15,
  ENEMY:     20,
  PLAYER:    30,
  PROJECTILE:35,
  FX:        40,
  UI:        50,
} as const;
