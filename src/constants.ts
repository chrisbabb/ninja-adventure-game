import {
  FormType, FormStats, SpecialAbility,
  EnemyType, EnemyConfig, BehaviorType, AttackStyle,
  BossType, BossConfig,
  StageId, StageConfig,
} from './types';

// ── Game Dimensions ────────────────────────────────────────────────

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 270;
export const TILE_SIZE = 32;
export const PIXEL_SCALE = 1;

// ── Physics ────────────────────────────────────────────────────────

export const GRAVITY = 900;
export const MAX_FALL_SPEED = 500;
export const COYOTE_TIME = 80;        // ms grace period after leaving ledge
export const JUMP_BUFFER_TIME = 100;  // ms buffer for early jump input
export const INVINCIBILITY_TIME = 1500; // ms after taking damage
export const KNOCKBACK_FORCE = 200;

// ── Depth Layers ───────────────────────────────────────────────────

export const DEPTH = {
  BG: 0,
  TILES: 10,
  ENEMIES: 20,
  PLAYER: 30,
  PROJECTILES: 35,
  PARTICLES: 40,
  UI: 100,
  MENU: 200,
};

// ── Form Definitions ───────────────────────────────────────────────

export const FORM_STATS: Record<FormType, FormStats> = {
  [FormType.NORMAL]: {
    maxHealth: 20,
    armor: 0,
    speed: 150,
    jumpForce: -320,
    maxJumps: 2,
    attackDamage: 3,
    attackSpeed: 3,
    attackRange: 40,
    attackType: 'melee',
    color: 0x4488ff,
    specialAbility: SpecialAbility.NONE,
  },
  [FormType.DOUBLE_SWORD]: {
    maxHealth: 20,
    armor: 0,
    speed: 160,
    jumpForce: -320,
    maxJumps: 3,
    attackDamage: 2,
    attackSpeed: 6,
    attackRange: 44,
    attackType: 'melee',
    color: 0x88ffff,
    specialAbility: SpecialAbility.TRIPLE_JUMP,
  },
  [FormType.DEMON]: {
    maxHealth: 22,
    armor: 0,
    speed: 150,
    jumpForce: -320,
    maxJumps: 2,
    attackDamage: 4,
    attackSpeed: 2.5,
    attackRange: 120,
    attackType: 'ranged',
    color: 0xff4444,
    specialAbility: SpecialAbility.FLAME_SWORD,
  },
  [FormType.PANDA]: {
    maxHealth: 35,
    armor: 0.3,
    speed: 130,
    jumpForce: -300,
    maxJumps: 1,
    attackDamage: 4,
    attackSpeed: 2,
    attackRange: 38,
    attackType: 'melee',
    color: 0xffffff,
    specialAbility: SpecialAbility.EXTRA_ARMOR,
  },
  [FormType.WOLF]: {
    maxHealth: 18,
    armor: 0,
    speed: 160,
    jumpForce: -320,
    maxJumps: 2,
    attackDamage: 3,
    attackSpeed: 3.5,
    attackRange: 40,
    attackType: 'melee',
    color: 0x8888aa,
    specialAbility: SpecialAbility.FAST_RUN,
  },
  [FormType.ARMORED]: {
    maxHealth: 24,
    armor: 0.25,
    speed: 140,
    jumpForce: -310,
    maxJumps: 2,
    attackDamage: 3,
    attackSpeed: 3,
    attackRange: 160,
    attackType: 'both',
    color: 0xcccc44,
    specialAbility: SpecialAbility.SHURIKEN_DASH,
  },
  [FormType.ARCHER]: {
    maxHealth: 18,
    armor: 0,
    speed: 150,
    jumpForce: -320,
    maxJumps: 2,
    attackDamage: 4,
    attackSpeed: 2.5,
    attackRange: 250,
    attackType: 'ranged',
    color: 0x44cc44,
    specialAbility: SpecialAbility.ARROW_SHOT,
  },
  [FormType.EXECUTIONER]: {
    maxHealth: 26,
    armor: 0.1,
    speed: 120,
    jumpForce: -300,
    maxJumps: 2,
    attackDamage: 8,
    attackSpeed: 1.5,
    attackRange: 48,
    attackType: 'melee',
    color: 0x884488,
    specialAbility: SpecialAbility.BLOCK_SMASH,
  },
  [FormType.MASTER]: {
    maxHealth: 28,
    armor: 0.15,
    speed: 170,
    jumpForce: -330,
    maxJumps: 3,
    attackDamage: 7,
    attackSpeed: 4,
    attackRange: 180,
    attackType: 'both',
    color: 0xffdd00,
    specialAbility: SpecialAbility.MASTER_ALL,
  },
};

// ── Form Display Names ─────────────────────────────────────────────

export const FORM_NAMES: Record<FormType, string> = {
  [FormType.NORMAL]: 'Normal Ninja',
  [FormType.DOUBLE_SWORD]: 'Double Sword',
  [FormType.DEMON]: 'Demon Ninja',
  [FormType.PANDA]: 'Panda Ninja',
  [FormType.WOLF]: 'Wolf Ninja',
  [FormType.ARMORED]: 'Armored Ninja',
  [FormType.ARCHER]: 'Archer Ninja',
  [FormType.EXECUTIONER]: 'Executioner',
  [FormType.MASTER]: 'Master Ninja',
};

// ── Enemy Configurations ───────────────────────────────────────────

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  [EnemyType.KOBOLD_WARRIOR]: {
    type: EnemyType.KOBOLD_WARRIOR, health: 6, damage: 2, speed: 75,
    behavior: BehaviorType.CHASE, attackStyle: AttackStyle.MELEE,
    detectionRange: 150, attackRange: 45, attackCooldown: 800,
    color: 0x88aa44, width: 56, height: 36, flying: false,
  },
  [EnemyType.MINOTAUR]: {
    type: EnemyType.MINOTAUR, health: 14, damage: 5, speed: 50,
    behavior: BehaviorType.CHASE, attackStyle: AttackStyle.CHARGE,
    detectionRange: 160, attackRange: 36, attackCooldown: 2000,
    color: 0x884422, width: 36, height: 40, flying: false,
  },
  [EnemyType.WIZARD]: {
    type: EnemyType.WIZARD, health: 8, damage: 3, speed: 30,
    behavior: BehaviorType.STATIONARY, attackStyle: AttackStyle.RANGED,
    detectionRange: 200, attackRange: 200, attackCooldown: 1800,
    color: 0x6644cc, width: 28, height: 32, flying: false,
    projectileSpeed: 160, projectileColor: 0xaa66ff,
  },
  [EnemyType.GRYPHON]: {
    type: EnemyType.GRYPHON, health: 12, damage: 4, speed: 80,
    behavior: BehaviorType.FLY_CHASE, attackStyle: AttackStyle.DIVE,
    detectionRange: 180, attackRange: 40, attackCooldown: 2500,
    color: 0xddaa44, width: 36, height: 32, flying: true,
  },
  [EnemyType.LIZARDMAN]: {
    type: EnemyType.LIZARDMAN, health: 10, damage: 3, speed: 55,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.MELEE,
    detectionRange: 130, attackRange: 34, attackCooldown: 1000,
    color: 0x44aa44, width: 30, height: 32, flying: false,
  },
  [EnemyType.IMP]: {
    type: EnemyType.IMP, health: 5, damage: 2, speed: 70,
    behavior: BehaviorType.FLY_PATROL, attackStyle: AttackStyle.RANGED,
    detectionRange: 150, attackRange: 140, attackCooldown: 2000,
    color: 0xff6644, width: 24, height: 24, flying: true,
    projectileSpeed: 140, projectileColor: 0xff4400,
  },
  [EnemyType.MIMIC_CHEST]: {
    type: EnemyType.MIMIC_CHEST, health: 12, damage: 5, speed: 90,
    behavior: BehaviorType.AMBUSH, attackStyle: AttackStyle.MELEE,
    detectionRange: 50, attackRange: 32, attackCooldown: 800,
    color: 0xccaa44, width: 32, height: 28, flying: false,
  },
  [EnemyType.DWARF_WARRIOR]: {
    type: EnemyType.DWARF_WARRIOR, health: 10, damage: 3, speed: 50,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.MELEE,
    detectionRange: 100, attackRange: 28, attackCooldown: 1000,
    color: 0xaa8866, width: 26, height: 24, flying: false,
  },
  [EnemyType.PYROMANCER]: {
    type: EnemyType.PYROMANCER, health: 8, damage: 4, speed: 25,
    behavior: BehaviorType.STATIONARY, attackStyle: AttackStyle.RANGED,
    detectionRange: 180, attackRange: 180, attackCooldown: 1500,
    color: 0xff6600, width: 28, height: 32, flying: false,
    projectileSpeed: 180, projectileColor: 0xff4400,
  },
  [EnemyType.MASKED_ORC]: {
    type: EnemyType.MASKED_ORC, health: 10, damage: 3, speed: 55,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.MELEE,
    detectionRange: 120, attackRange: 32, attackCooldown: 1100,
    color: 0x668844, width: 30, height: 34, flying: false,
  },
  [EnemyType.SKELETON_MAGE]: {
    type: EnemyType.SKELETON_MAGE, health: 7, damage: 3, speed: 35,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.RANGED,
    detectionRange: 170, attackRange: 170, attackCooldown: 1600,
    color: 0xccccaa, width: 28, height: 32, flying: false,
    projectileSpeed: 150, projectileColor: 0x88ff88,
  },
  [EnemyType.WEREWOLF]: {
    type: EnemyType.WEREWOLF, health: 12, damage: 4, speed: 100,
    behavior: BehaviorType.CHASE, attackStyle: AttackStyle.MELEE,
    detectionRange: 180, attackRange: 34, attackCooldown: 800,
    color: 0x666688, width: 32, height: 34, flying: false,
  },
  [EnemyType.BABY_DRAGON]: {
    type: EnemyType.BABY_DRAGON, health: 8, damage: 3, speed: 65,
    behavior: BehaviorType.FLY_PATROL, attackStyle: AttackStyle.RANGED,
    detectionRange: 160, attackRange: 150, attackCooldown: 2200,
    color: 0xff8844, width: 28, height: 26, flying: true,
    projectileSpeed: 160, projectileColor: 0xff6600,
  },
  [EnemyType.POISON_SKULL]: {
    type: EnemyType.POISON_SKULL, health: 4, damage: 4, speed: 40,
    behavior: BehaviorType.FLOAT_CHASE, attackStyle: AttackStyle.EXPLODE,
    detectionRange: 200, attackRange: 20, attackCooldown: 0,
    color: 0x66ff66, width: 22, height: 22, flying: true,
  },
  [EnemyType.CYCLOPS]: {
    type: EnemyType.CYCLOPS, health: 16, damage: 5, speed: 35,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.RANGED,
    detectionRange: 200, attackRange: 200, attackCooldown: 2500,
    color: 0xaa8888, width: 38, height: 42, flying: false,
    projectileSpeed: 130, projectileColor: 0x886644,
  },
  [EnemyType.HARPY]: {
    type: EnemyType.HARPY, health: 7, damage: 3, speed: 80,
    behavior: BehaviorType.FLY_CHASE, attackStyle: AttackStyle.DIVE,
    detectionRange: 180, attackRange: 36, attackCooldown: 2000,
    color: 0xcc88cc, width: 30, height: 28, flying: true,
  },
  [EnemyType.SATYR_ARCHER]: {
    type: EnemyType.SATYR_ARCHER, health: 8, damage: 3, speed: 45,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.RANGED,
    detectionRange: 200, attackRange: 200, attackCooldown: 1400,
    color: 0xaaaa66, width: 28, height: 32, flying: false,
    projectileSpeed: 200, projectileColor: 0x886644,
  },
  [EnemyType.STONE_GOLEM]: {
    type: EnemyType.STONE_GOLEM, health: 20, damage: 6, speed: 25,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.MELEE,
    detectionRange: 100, attackRange: 38, attackCooldown: 2000,
    color: 0x888888, width: 38, height: 42, flying: false,
  },
  [EnemyType.GOBLIN]: {
    type: EnemyType.GOBLIN, health: 4, damage: 2, speed: 80,
    behavior: BehaviorType.CHASE, attackStyle: AttackStyle.MELEE,
    detectionRange: 120, attackRange: 26, attackCooldown: 900,
    color: 0x44aa22, width: 24, height: 24, flying: false,
  },
  [EnemyType.FLYING_EYE]: {
    type: EnemyType.FLYING_EYE, health: 5, damage: 2, speed: 60,
    behavior: BehaviorType.FLY_CHASE, attackStyle: AttackStyle.RANGED,
    detectionRange: 160, attackRange: 130, attackCooldown: 1800,
    color: 0xff4488, width: 22, height: 22, flying: true,
    projectileSpeed: 140, projectileColor: 0xff2266,
  },
  [EnemyType.GARGOYLE]: {
    type: EnemyType.GARGOYLE, health: 10, damage: 4, speed: 70,
    behavior: BehaviorType.AMBUSH, attackStyle: AttackStyle.DIVE,
    detectionRange: 120, attackRange: 36, attackCooldown: 1500,
    color: 0x666666, width: 32, height: 34, flying: true,
  },
  [EnemyType.SKELETON_WARRIOR]: {
    type: EnemyType.SKELETON_WARRIOR, health: 8, damage: 3, speed: 50,
    behavior: BehaviorType.PATROL, attackStyle: AttackStyle.MELEE,
    detectionRange: 110, attackRange: 32, attackCooldown: 1000,
    color: 0xddddbb, width: 28, height: 32, flying: false,
  },
};

// ── Enemy Sprite Sheet Configurations ──────────────────────────────

export interface EnemyAnimDef {
  key: string;         // animation key suffix (e.g. 'idle', 'run')
  file: string;        // file path under assets/enemies/<type>/
  frames: number;      // total frame count
  frameRate: number;
  repeat: number;      // -1 = loop, 0 = play once
}

export interface EnemySpriteData {
  frameWidth: number;
  frameHeight: number;
  // Physics body in source frame coordinates (before scaling)
  bodyWidth: number;
  bodyHeight: number;
  bodyOffsetX: number;
  bodyOffsetY: number;
  anims: EnemyAnimDef[];
}

export const ENEMY_SPRITE_DATA: Partial<Record<EnemyType, EnemySpriteData>> = {
  [EnemyType.KOBOLD_WARRIOR]: {
    frameWidth: 148,
    frameHeight: 96,
    // Kobold body occupies roughly center of frame
    bodyWidth: 40,
    bodyHeight: 48,
    bodyOffsetX: 54,
    bodyOffsetY: 36,
    anims: [
      { key: 'idle',          file: 'idle.png',           frames: 6,  frameRate: 8,  repeat: -1 },
      { key: 'run',           file: 'run.png',            frames: 8,  frameRate: 12, repeat: -1 },
      { key: 'attack',        file: 'combo_attack_1.png', frames: 5,  frameRate: 12, repeat: 0 },
      { key: 'combo_attack_2', file: 'combo_attack_2.png', frames: 5,  frameRate: 12, repeat: 0 },
      { key: 'combo_attack_3', file: 'combo_attack_3.png', frames: 6,  frameRate: 12, repeat: 0 },
      { key: 'strong_attack', file: 'strong_attack.png',  frames: 12, frameRate: 14, repeat: 0 },
      { key: 'hurt',          file: 'hurt.png',           frames: 4,  frameRate: 10, repeat: 0 },
      { key: 'death',         file: 'death.png',          frames: 10, frameRate: 10, repeat: 0 },
      { key: 'dash',          file: 'dash.png',           frames: 7,  frameRate: 12, repeat: 0 },
      { key: 'jump',          file: 'jump.png',           frames: 3,  frameRate: 8,  repeat: 0 },
    ],
  },
};

// ── Boss Configurations ────────────────────────────────────────────

export const BOSS_CONFIGS: Record<BossType, BossConfig> = {
  [BossType.HUGE_KNIGHT]: {
    type: BossType.HUGE_KNIGHT,
    health: 60, damage: 6, speed: 50,
    color: 0xaaaacc, width: 48, height: 56,
    rewardForm: FormType.ARMORED,
    weakness: FormType.PANDA,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 50,
        attackInterval: 2000,
        attackPatterns: [
          { name: 'sword_slam', weight: 3, duration: 800, cooldown: 1200 },
          { name: 'shield_charge', weight: 2, duration: 1000, cooldown: 1500 },
          { name: 'ground_pound', weight: 1, duration: 1200, cooldown: 2000 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 65,
        attackInterval: 1500,
        attackPatterns: [
          { name: 'sword_slam', weight: 2, duration: 600, cooldown: 800 },
          { name: 'shield_charge', weight: 3, duration: 800, cooldown: 1000 },
          { name: 'ground_pound', weight: 2, duration: 1000, cooldown: 1500 },
          { name: 'sword_combo', weight: 2, duration: 1500, cooldown: 1800 },
        ],
      },
    ],
  },
  [BossType.DEMON_BOSS]: {
    type: BossType.DEMON_BOSS,
    health: 55, damage: 5, speed: 70,
    color: 0xcc2222, width: 44, height: 52,
    rewardForm: FormType.DEMON,
    weakness: FormType.WOLF,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 70,
        attackInterval: 1800,
        attackPatterns: [
          { name: 'fire_blast', weight: 3, duration: 800, cooldown: 1200 },
          { name: 'teleport_strike', weight: 2, duration: 1200, cooldown: 1500 },
          { name: 'fire_pillar', weight: 1, duration: 1000, cooldown: 1800 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 90,
        attackInterval: 1400,
        attackPatterns: [
          { name: 'fire_blast', weight: 2, duration: 600, cooldown: 800 },
          { name: 'teleport_strike', weight: 3, duration: 1000, cooldown: 1200 },
          { name: 'fire_pillar', weight: 2, duration: 800, cooldown: 1200 },
          { name: 'demon_rage', weight: 1, duration: 2000, cooldown: 2500 },
        ],
      },
    ],
  },
  [BossType.HEADLESS_HORSEMAN]: {
    type: BossType.HEADLESS_HORSEMAN,
    health: 50, damage: 5, speed: 80,
    color: 0x443366, width: 48, height: 52,
    rewardForm: FormType.DOUBLE_SWORD,
    weakness: FormType.DEMON,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 80,
        attackInterval: 1800,
        attackPatterns: [
          { name: 'head_throw', weight: 3, duration: 1000, cooldown: 1200 },
          { name: 'horse_charge', weight: 2, duration: 1200, cooldown: 1800 },
          { name: 'shadow_slash', weight: 2, duration: 600, cooldown: 1000 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 100,
        attackInterval: 1400,
        attackPatterns: [
          { name: 'head_throw', weight: 2, duration: 800, cooldown: 800 },
          { name: 'horse_charge', weight: 3, duration: 1000, cooldown: 1200 },
          { name: 'shadow_slash', weight: 2, duration: 500, cooldown: 800 },
          { name: 'spectral_wave', weight: 2, duration: 1200, cooldown: 1500 },
        ],
      },
    ],
  },
  [BossType.WITCH]: {
    type: BossType.WITCH,
    health: 45, damage: 4, speed: 60,
    color: 0x884488, width: 36, height: 44,
    rewardForm: FormType.PANDA,
    weakness: FormType.ARCHER,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 60,
        attackInterval: 2000,
        attackPatterns: [
          { name: 'potion_throw', weight: 3, duration: 800, cooldown: 1200 },
          { name: 'hex_beam', weight: 2, duration: 1000, cooldown: 1500 },
          { name: 'summon_minion', weight: 1, duration: 1500, cooldown: 3000 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 75,
        attackInterval: 1600,
        attackPatterns: [
          { name: 'potion_throw', weight: 2, duration: 600, cooldown: 800 },
          { name: 'hex_beam', weight: 3, duration: 800, cooldown: 1000 },
          { name: 'summon_minion', weight: 2, duration: 1200, cooldown: 2000 },
          { name: 'cauldron_blast', weight: 2, duration: 1500, cooldown: 2000 },
        ],
      },
    ],
  },
  [BossType.CERBERUS]: {
    type: BossType.CERBERUS,
    health: 65, damage: 5, speed: 65,
    color: 0x664422, width: 56, height: 48,
    rewardForm: FormType.WOLF,
    weakness: FormType.EXECUTIONER,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 65,
        attackInterval: 1800,
        attackPatterns: [
          { name: 'triple_bite', weight: 3, duration: 1000, cooldown: 1200 },
          { name: 'fire_breath', weight: 2, duration: 1200, cooldown: 1800 },
          { name: 'pounce', weight: 2, duration: 800, cooldown: 1500 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 85,
        attackInterval: 1400,
        attackPatterns: [
          { name: 'triple_bite', weight: 2, duration: 800, cooldown: 800 },
          { name: 'fire_breath', weight: 3, duration: 1000, cooldown: 1200 },
          { name: 'pounce', weight: 2, duration: 600, cooldown: 1000 },
          { name: 'howl', weight: 1, duration: 1500, cooldown: 2500 },
        ],
      },
    ],
  },
  [BossType.MEDUSA]: {
    type: BossType.MEDUSA,
    health: 50, damage: 4, speed: 55,
    color: 0x44aa66, width: 40, height: 48,
    rewardForm: FormType.EXECUTIONER,
    weakness: FormType.DOUBLE_SWORD,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 2.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 55,
        attackInterval: 2000,
        attackPatterns: [
          { name: 'petrify_gaze', weight: 3, duration: 1200, cooldown: 1500 },
          { name: 'snake_shot', weight: 2, duration: 800, cooldown: 1200 },
          { name: 'tail_sweep', weight: 2, duration: 600, cooldown: 1000 },
        ],
      },
      {
        healthThreshold: 0.4, speed: 70,
        attackInterval: 1600,
        attackPatterns: [
          { name: 'petrify_gaze', weight: 2, duration: 1000, cooldown: 1000 },
          { name: 'snake_shot', weight: 3, duration: 600, cooldown: 800 },
          { name: 'tail_sweep', weight: 2, duration: 500, cooldown: 800 },
          { name: 'stone_burst', weight: 2, duration: 1500, cooldown: 2000 },
        ],
      },
    ],
  },
  [BossType.DRAGON]: {
    type: BossType.DRAGON,
    health: 80, damage: 7, speed: 60,
    color: 0xcc4400, width: 64, height: 56,
    rewardForm: null,
    weakness: FormType.MASTER,
    weaknessDamageMultiplier: 3.0,
    masterDamageMultiplier: 3.0,
    phases: [
      {
        healthThreshold: 1.0, speed: 60,
        attackInterval: 2000,
        attackPatterns: [
          { name: 'fire_breath', weight: 3, duration: 1500, cooldown: 1500 },
          { name: 'claw_swipe', weight: 2, duration: 800, cooldown: 1200 },
          { name: 'tail_slam', weight: 2, duration: 1000, cooldown: 1500 },
        ],
      },
      {
        healthThreshold: 0.6, speed: 70,
        attackInterval: 1800,
        attackPatterns: [
          { name: 'fire_breath', weight: 2, duration: 1200, cooldown: 1200 },
          { name: 'claw_swipe', weight: 3, duration: 600, cooldown: 800 },
          { name: 'dive_bomb', weight: 2, duration: 1500, cooldown: 2000 },
          { name: 'fire_rain', weight: 1, duration: 2000, cooldown: 2500 },
        ],
      },
      {
        healthThreshold: 0.25, speed: 80,
        attackInterval: 1400,
        attackPatterns: [
          { name: 'fire_breath', weight: 2, duration: 1000, cooldown: 800 },
          { name: 'dive_bomb', weight: 3, duration: 1200, cooldown: 1500 },
          { name: 'fire_rain', weight: 3, duration: 1800, cooldown: 2000 },
          { name: 'inferno', weight: 1, duration: 2500, cooldown: 3000 },
        ],
      },
    ],
  },
};

// ── Stage Configurations ───────────────────────────────────────────

export const STAGE_CONFIGS: Record<StageId, StageConfig> = {
  [StageId.HUGE_KNIGHT]: {
    id: StageId.HUGE_KNIGHT,
    name: "Knight's Fortress",
    boss: BossType.HUGE_KNIGHT,
    enemies: [EnemyType.DWARF_WARRIOR, EnemyType.SKELETON_WARRIOR, EnemyType.GOBLIN, EnemyType.SATYR_ARCHER, EnemyType.GRYPHON],
    tileColor: 0x556677,
    bgColor: 0x1a1a2e,
    hasVineBarriers: false,
    hasBreakableBlocks: true,
  },
  [StageId.DEMON_BOSS]: {
    id: StageId.DEMON_BOSS,
    name: "Demon's Inferno",
    boss: BossType.DEMON_BOSS,
    enemies: [EnemyType.IMP, EnemyType.PYROMANCER, EnemyType.KOBOLD_WARRIOR, EnemyType.FLYING_EYE, EnemyType.LIZARDMAN],
    tileColor: 0x663322,
    bgColor: 0x1a0a0a,
    hasVineBarriers: true,
    hasBreakableBlocks: false,
  },
  [StageId.HEADLESS_HORSEMAN]: {
    id: StageId.HEADLESS_HORSEMAN,
    name: 'Haunted Graveyard',
    boss: BossType.HEADLESS_HORSEMAN,
    enemies: [EnemyType.WEREWOLF, EnemyType.GARGOYLE, EnemyType.SKELETON_MAGE, EnemyType.GOBLIN, EnemyType.HARPY],
    tileColor: 0x445566,
    bgColor: 0x0a0a1a,
    hasVineBarriers: false,
    hasBreakableBlocks: true,
  },
  [StageId.WITCH]: {
    id: StageId.WITCH,
    name: "Witch's Tower",
    boss: BossType.WITCH,
    enemies: [EnemyType.WIZARD, EnemyType.MIMIC_CHEST, EnemyType.MASKED_ORC, EnemyType.FLYING_EYE, EnemyType.BABY_DRAGON],
    tileColor: 0x554466,
    bgColor: 0x1a0a2a,
    hasVineBarriers: true,
    hasBreakableBlocks: false,
  },
  [StageId.CERBERUS]: {
    id: StageId.CERBERUS,
    name: "Beast's Den",
    boss: BossType.CERBERUS,
    enemies: [EnemyType.KOBOLD_WARRIOR, EnemyType.CYCLOPS, EnemyType.SATYR_ARCHER, EnemyType.GRYPHON, EnemyType.WEREWOLF],
    tileColor: 0x665544,
    bgColor: 0x1a1a0a,
    hasVineBarriers: false,
    hasBreakableBlocks: true,
  },
  [StageId.MEDUSA]: {
    id: StageId.MEDUSA,
    name: "Medusa's Lair",
    boss: BossType.MEDUSA,
    enemies: [EnemyType.STONE_GOLEM, EnemyType.CYCLOPS, EnemyType.HARPY, EnemyType.GARGOYLE, EnemyType.SKELETON_WARRIOR],
    tileColor: 0x446655,
    bgColor: 0x0a1a1a,
    hasVineBarriers: false,
    hasBreakableBlocks: true,
  },
  [StageId.DRAGON]: {
    id: StageId.DRAGON,
    name: "Dragon's Summit",
    boss: BossType.DRAGON,
    enemies: [EnemyType.MINOTAUR, EnemyType.PYROMANCER, EnemyType.BABY_DRAGON, EnemyType.STONE_GOLEM, EnemyType.HARPY],
    tileColor: 0x664433,
    bgColor: 0x1a0a00,
    hasVineBarriers: true,
    hasBreakableBlocks: true,
  },
};

// ── Difficulty Multipliers ─────────────────────────────────────────

export const DIFFICULTY_MULTIPLIERS = {
  easy: { enemyHealth: 0.7, enemyDamage: 0.6, enemySpeed: 0.85, playerDamage: 1.3 },
  normal: { enemyHealth: 1.0, enemyDamage: 1.0, enemySpeed: 1.0, playerDamage: 1.0 },
  hard: { enemyHealth: 1.4, enemyDamage: 1.4, enemySpeed: 1.15, playerDamage: 0.85 },
};

// ── Wolf Form Fast Run ─────────────────────────────────────────────

export const WOLF_FAST_RUN_SPEED = 280;
export const WOLF_FAST_RUN_JUMP_BOOST = 1.3;
export const DOUBLE_TAP_WINDOW = 250; // ms
