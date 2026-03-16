import { StageId, EnemyType } from '../types';
import { TILE_SIZE } from '../constants';

// Tile types for level layout
export const T = {
  EMPTY: 0,
  SOLID: 1,
  PLATFORM: 2,
  SPIKE: 3,
  VINE: 4,
  BREAKABLE: 5,
  BOSS_DOOR: 6,
  PLAYER_SPAWN: 7,
  BOSS_SPAWN: 8,
};

export interface EnemySpawn {
  type: EnemyType;
  col: number;
  row: number;
}

export interface LevelSection {
  tiles: number[][];
  enemies: EnemySpawn[];
  isBossRoom?: boolean;
}

// Helper to create a flat ground section
function groundSection(width: number, height: number): number[][] {
  const tiles: number[][] = [];
  for (let r = 0; r < height; r++) {
    const row: number[] = [];
    for (let c = 0; c < width; c++) {
      if (r >= height - 2) {
        row.push(T.SOLID); // Ground
      } else if (r === 0 || c === 0 || c === width - 1) {
        row.push(T.EMPTY); // Open top and sides
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }
  return tiles;
}

// Generate a complete level for a stage
export function generateLevel(stageId: StageId): LevelSection[] {
  const sections: LevelSection[] = [];
  const stageEnemies = getStageEnemies(stageId);

  // Section 1: Start area (easy, tutorial-ish)
  sections.push(createSection1(stageEnemies));

  // Section 2: Platforming challenge
  sections.push(createSection2(stageEnemies, stageId));

  // Section 3: Enemy gauntlet
  sections.push(createSection3(stageEnemies, stageId));

  // Section 4: Vertical/mixed challenge
  sections.push(createSection4(stageEnemies, stageId));

  // Section 5: Boss room
  sections.push(createBossRoom());

  return sections;
}

function getStageEnemies(stageId: StageId): EnemyType[] {
  const stageEnemyMap: Record<StageId, EnemyType[]> = {
    [StageId.HUGE_KNIGHT]: [EnemyType.DWARF_WARRIOR, EnemyType.SKELETON_WARRIOR, EnemyType.STONE_GOLEM, EnemyType.GOBLIN, EnemyType.MASKED_ORC],
    [StageId.DEMON_BOSS]: [EnemyType.IMP, EnemyType.PYROMANCER, EnemyType.SKELETON_MAGE, EnemyType.FLYING_EYE, EnemyType.POISON_SKULL],
    [StageId.HEADLESS_HORSEMAN]: [EnemyType.WEREWOLF, EnemyType.GARGOYLE, EnemyType.SKELETON_WARRIOR, EnemyType.GOBLIN, EnemyType.HARPY],
    [StageId.WITCH]: [EnemyType.WIZARD, EnemyType.MIMIC_CHEST, EnemyType.POISON_SKULL, EnemyType.FLYING_EYE, EnemyType.BABY_DRAGON],
    [StageId.CERBERUS]: [EnemyType.KOBOLD_WARRIOR, EnemyType.LIZARDMAN, EnemyType.SATYR_ARCHER, EnemyType.GRYPHON, EnemyType.WEREWOLF],
    [StageId.MEDUSA]: [EnemyType.STONE_GOLEM, EnemyType.CYCLOPS, EnemyType.HARPY, EnemyType.GARGOYLE, EnemyType.LIZARDMAN],
    [StageId.DRAGON]: [EnemyType.MINOTAUR, EnemyType.PYROMANCER, EnemyType.BABY_DRAGON, EnemyType.MASKED_ORC, EnemyType.STONE_GOLEM],
  };
  return stageEnemyMap[stageId] || [];
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createSection1(enemies: EnemyType[]): LevelSection {
  // W=30 H=9 tiles (960x288 pixels)
  const W = 30, H = 9;
  const tiles: number[][] = [];

  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      if (r >= H - 2) {
        row.push(T.SOLID);
      } else if (r === H - 3 && (c === 10 || c === 11)) {
        row.push(T.PLATFORM);
      } else if (r === H - 4 && (c === 18 || c === 19)) {
        row.push(T.PLATFORM);
      } else if (r === H - 3 && c === 24) {
        row.push(T.PLATFORM);
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }

  // Place spawn
  tiles[H - 3][1] = T.PLAYER_SPAWN;

  const spawns: EnemySpawn[] = [];
  if (enemies.length > 0) {
    spawns.push({ type: enemies[0], col: 8, row: H - 3 });
    spawns.push({ type: enemies[0], col: 15, row: H - 3 });
    if (enemies.length > 1) {
      spawns.push({ type: enemies[1], col: 22, row: H - 3 });
    }
  }

  return { tiles, enemies: spawns };
}

function createSection2(enemies: EnemyType[], stageId: StageId): LevelSection {
  const W = 30, H = 12;
  const tiles: number[][] = [];

  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      if (r >= H - 1) {
        // Bottomless pit with islands
        if ((c >= 0 && c <= 3) || (c >= 8 && c <= 11) || (c >= 16 && c <= 19) || (c >= 24 && c <= 29)) {
          row.push(T.SOLID);
        } else {
          row.push(T.SPIKE);
        }
      } else if (r === H - 2 && ((c >= 0 && c <= 3) || (c >= 8 && c <= 11) || (c >= 16 && c <= 19) || (c >= 24 && c <= 29))) {
        row.push(T.SOLID);
      } else if (r === H - 5 && (c === 6 || c === 7)) {
        row.push(T.PLATFORM);
      } else if (r === H - 5 && (c === 13 || c === 14)) {
        row.push(T.PLATFORM);
      } else if (r === H - 4 && (c === 20 || c === 21)) {
        row.push(T.PLATFORM);
      } else if (r === 3 && c >= 12 && c <= 14) {
        // High platform for vertical element
        row.push(T.PLATFORM);
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }

  const spawns: EnemySpawn[] = [];
  if (enemies.length > 0) {
    spawns.push({ type: enemies[0], col: 10, row: H - 3 });
    spawns.push({ type: pick(enemies), col: 18, row: H - 3 });
    spawns.push({ type: pick(enemies), col: 26, row: H - 3 });
  }

  return { tiles, enemies: spawns };
}

function createSection3(enemies: EnemyType[], stageId: StageId): LevelSection {
  const W = 35, H = 10;
  const tiles: number[][] = [];
  const hasVines = stageId === StageId.DEMON_BOSS || stageId === StageId.WITCH || stageId === StageId.DRAGON;
  const hasBreakable = stageId === StageId.HUGE_KNIGHT || stageId === StageId.HEADLESS_HORSEMAN ||
                       stageId === StageId.CERBERUS || stageId === StageId.MEDUSA || stageId === StageId.DRAGON;

  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      if (r >= H - 2) {
        row.push(T.SOLID);
      } else if (r >= 2 && r <= 4 && c === 15) {
        // Barrier
        row.push(hasVines ? T.VINE : (hasBreakable ? T.BREAKABLE : T.SOLID));
      } else if (r === H - 4 && (c >= 5 && c <= 7)) {
        row.push(T.PLATFORM);
      } else if (r === H - 5 && (c >= 20 && c <= 22)) {
        row.push(T.PLATFORM);
      } else if (r === H - 4 && (c >= 28 && c <= 30)) {
        row.push(T.PLATFORM);
      } else if (r === 2 && c >= 22 && c <= 24) {
        row.push(T.PLATFORM);
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }

  const spawns: EnemySpawn[] = [];
  if (enemies.length >= 3) {
    spawns.push({ type: enemies[0], col: 6, row: H - 3 });
    spawns.push({ type: enemies[1], col: 12, row: H - 3 });
    spawns.push({ type: enemies[2], col: 20, row: H - 3 });
    spawns.push({ type: enemies[0], col: 26, row: H - 3 });
    spawns.push({ type: pick(enemies), col: 32, row: H - 3 });
  }

  return { tiles, enemies: spawns };
}

function createSection4(enemies: EnemyType[], stageId: StageId): LevelSection {
  // Taller section for vertical challenge
  const W = 20, H = 16;
  const tiles: number[][] = [];

  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      // Walls on sides
      if (c === 0 || c === W - 1) {
        row.push(T.SOLID);
      }
      // Ground at bottom
      else if (r >= H - 2) {
        row.push(T.SOLID);
      }
      // Ascending platforms (zigzag pattern)
      else if (r === H - 4 && (c >= 2 && c <= 5)) {
        row.push(T.PLATFORM);
      } else if (r === H - 6 && (c >= 10 && c <= 14)) {
        row.push(T.PLATFORM);
      } else if (r === H - 8 && (c >= 3 && c <= 6)) {
        row.push(T.PLATFORM);
      } else if (r === H - 10 && (c >= 11 && c <= 15)) {
        row.push(T.PLATFORM);
      } else if (r === H - 12 && (c >= 4 && c <= 8)) {
        row.push(T.PLATFORM);
      } else if (r === H - 14 && (c >= 10 && c <= 16)) {
        row.push(T.SOLID); // Exit platform at top
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }

  const spawns: EnemySpawn[] = [];
  if (enemies.length >= 2) {
    spawns.push({ type: enemies[0], col: 4, row: H - 3 });
    spawns.push({ type: pick(enemies), col: 12, row: H - 7 });
    spawns.push({ type: pick(enemies), col: 5, row: H - 9 });
    if (enemies.length >= 4) {
      spawns.push({ type: enemies[3], col: 13, row: H - 11 });
    }
  }

  return { tiles, enemies: spawns };
}

function createBossRoom(): LevelSection {
  const W = 16, H = 9;
  const tiles: number[][] = [];

  for (let r = 0; r < H; r++) {
    const row: number[] = [];
    for (let c = 0; c < W; c++) {
      if (r >= H - 2) {
        row.push(T.SOLID); // Floor
      } else if (r === 0) {
        row.push(T.SOLID); // Ceiling
      } else if (c === 0 || c === W - 1) {
        row.push(T.SOLID); // Walls
      } else if (r === 1 && c === 1) {
        row.push(T.PLAYER_SPAWN);
      } else {
        row.push(T.EMPTY);
      }
    }
    tiles.push(row);
  }

  // Boss spawn at far side (row H-4 so tall bosses don't clip into floor)
  tiles[H - 4][W - 3] = T.BOSS_SPAWN;

  return { tiles, enemies: [], isBossRoom: true };
}

export function getSectionWorldOffset(sections: LevelSection[], sectionIndex: number): { x: number; y: number } {
  let offsetX = 0;
  for (let i = 0; i < sectionIndex; i++) {
    offsetX += sections[i].tiles[0].length * TILE_SIZE;
  }
  return { x: offsetX, y: 0 };
}

export function getTotalLevelWidth(sections: LevelSection[]): number {
  return sections.reduce((sum, s) => sum + s.tiles[0].length * TILE_SIZE, 0);
}

export function getTotalLevelHeight(sections: LevelSection[]): number {
  return Math.max(...sections.map(s => s.tiles.length * TILE_SIZE));
}
