// ── Player Form Types ──────────────────────────────────────────────

export enum FormType {
  NORMAL = 'normal',
  DOUBLE_SWORD = 'double_sword',
  DEMON = 'demon',
  PANDA = 'panda',
  WOLF = 'wolf',
  ARMORED = 'armored',
  ARCHER = 'archer',
  EXECUTIONER = 'executioner',
  MASTER = 'master',
}

export interface FormStats {
  maxHealth: number;
  armor: number;          // damage reduction (0-1)
  speed: number;          // horizontal speed
  jumpForce: number;      // jump velocity
  maxJumps: number;       // 1=single, 2=double, 3=triple
  attackDamage: number;
  attackSpeed: number;    // attacks per second
  attackRange: number;    // pixels
  attackType: 'melee' | 'ranged' | 'both';
  color: number;          // placeholder tint color
  specialAbility: SpecialAbility;
}

export enum SpecialAbility {
  NONE = 'none',
  TRIPLE_JUMP = 'triple_jump',
  FLAME_SWORD = 'flame_sword',
  EXTRA_ARMOR = 'extra_armor',
  FAST_RUN = 'fast_run',
  SHURIKEN_DASH = 'shuriken_dash',
  ARROW_SHOT = 'arrow_shot',
  BLOCK_SMASH = 'block_smash',
  MASTER_ALL = 'master_all',
}

// ── Enemy Types ────────────────────────────────────────────────────

export enum EnemyType {
  KOBOLD_WARRIOR = 'kobold_warrior',
  MINOTAUR = 'minotaur',
  WIZARD = 'wizard',
  GRYPHON = 'gryphon',
  LIZARDMAN = 'lizardman',
  IMP = 'imp',
  MIMIC_CHEST = 'mimic_chest',
  DWARF_WARRIOR = 'dwarf_warrior',
  PYROMANCER = 'pyromancer',
  MASKED_ORC = 'masked_orc',
  SKELETON_MAGE = 'skeleton_mage',
  WEREWOLF = 'werewolf',
  BABY_DRAGON = 'baby_dragon',
  POISON_SKULL = 'poison_skull',
  CYCLOPS = 'cyclops',
  HARPY = 'harpy',
  SATYR_ARCHER = 'satyr_archer',
  STONE_GOLEM = 'stone_golem',
  GOBLIN = 'goblin',
  FLYING_EYE = 'flying_eye',
  GARGOYLE = 'gargoyle',
  SKELETON_WARRIOR = 'skeleton_warrior',
}

export enum BehaviorType {
  PATROL = 'patrol',
  CHASE = 'chase',
  FLY_PATROL = 'fly_patrol',
  FLY_CHASE = 'fly_chase',
  STATIONARY = 'stationary',
  AMBUSH = 'ambush',
  FLOAT_CHASE = 'float_chase',
}

export enum AttackStyle {
  MELEE = 'melee',
  RANGED = 'ranged',
  CHARGE = 'charge',
  DIVE = 'dive',
  EXPLODE = 'explode',
  NONE = 'none',
}

export interface EnemyConfig {
  type: EnemyType;
  health: number;
  damage: number;
  speed: number;
  behavior: BehaviorType;
  attackStyle: AttackStyle;
  detectionRange: number;
  attackRange: number;
  attackCooldown: number; // ms
  color: number;
  width: number;
  height: number;
  flying: boolean;
  projectileSpeed?: number;
  projectileColor?: number;
}

// ── Boss Types ─────────────────────────────────────────────────────

export enum BossType {
  HUGE_KNIGHT = 'huge_knight',
  DEMON_BOSS = 'demon_boss',
  HEADLESS_HORSEMAN = 'headless_horseman',
  WITCH = 'witch',
  CERBERUS = 'cerberus',
  MEDUSA = 'medusa',
  DRAGON = 'dragon',
}

export interface BossPhase {
  healthThreshold: number;  // switch to this phase at this % health
  speed: number;
  attackPatterns: BossAttackPattern[];
  attackInterval: number;   // ms between attacks
}

export interface BossAttackPattern {
  name: string;
  weight: number;           // probability weight for selection
  duration: number;         // ms
  cooldown: number;         // ms after this attack before next
}

export interface BossConfig {
  type: BossType;
  health: number;
  damage: number;
  speed: number;
  color: number;
  width: number;
  height: number;
  rewardForm: FormType | null;
  weakness: FormType;
  weaknessDamageMultiplier: number;
  masterDamageMultiplier: number;
  phases: BossPhase[];
}

// ── Stage Types ────────────────────────────────────────────────────

export enum StageId {
  HUGE_KNIGHT = 'stage_huge_knight',
  DEMON_BOSS = 'stage_demon_boss',
  HEADLESS_HORSEMAN = 'stage_headless_horseman',
  WITCH = 'stage_witch',
  CERBERUS = 'stage_cerberus',
  MEDUSA = 'stage_medusa',
  DRAGON = 'stage_dragon',
}

export interface StageConfig {
  id: StageId;
  name: string;
  boss: BossType;
  enemies: EnemyType[];
  tileColor: number;
  bgColor: number;
  hasVineBarriers: boolean;
  hasBreakableBlocks: boolean;
}

// ── Difficulty ──────────────────────────────────────────────────────

export enum Difficulty {
  EASY = 'easy',
  NORMAL = 'normal',
  HARD = 'hard',
}

// ── Game State ──────────────────────────────────────────────────────

export interface GameSaveData {
  unlockedForms: FormType[];
  defeatedBosses: BossType[];
  currentForm: FormType;
  difficulty: Difficulty;
  hardModeUnlocked: boolean;
  bestTimes: Record<string, number>;
}

// ── Projectile Types ───────────────────────────────────────────────

export enum ProjectileOwner {
  PLAYER = 'player',
  ENEMY = 'enemy',
}

export interface ProjectileConfig {
  speed: number;
  damage: number;
  owner: ProjectileOwner;
  color: number;
  width: number;
  height: number;
  lifetime: number;     // ms
  gravity: boolean;
  piercing: boolean;
}

// ── Scene Keys ─────────────────────────────────────────────────────

export const SCENE_KEYS = {
  BOOT: 'BootScene',
  MAIN_MENU: 'MainMenuScene',
  SETTINGS: 'SettingsScene',
  STAGE_SELECT: 'StageSelectScene',
  GAME: 'GameScene',
  UI: 'UIScene',
  PAUSE: 'PauseScene',
  FORM_MENU: 'FormMenuScene',
  GAME_OVER: 'GameOverScene',
  VICTORY: 'VictoryScene',
} as const;
