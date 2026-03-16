import { StageId, EnemyType } from '../types';
import { TILE_SIZE } from '../constants';

// ── Tile Types ─────────────────────────────────────────────────────

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

// ── String-based tile map parser ───────────────────────────────────
// Each char maps to a tile type for readable level design:
//   .  = empty       #  = solid      -  = platform
//   S  = spike       V  = vine       B  = breakable
//   @  = player      X  = boss       D  = boss door

const CHAR_MAP: Record<string, number> = {
  '.': T.EMPTY,
  '#': T.SOLID,
  '-': T.PLATFORM,
  'S': T.SPIKE,
  'V': T.VINE,
  'B': T.BREAKABLE,
  'D': T.BOSS_DOOR,
  '@': T.PLAYER_SPAWN,
  'X': T.BOSS_SPAWN,
};

function parseMap(lines: string[]): number[][] {
  return lines.map(line =>
    line.split('').map(ch => CHAR_MAP[ch] ?? T.EMPTY)
  );
}

function section(map: string[], enemies: EnemySpawn[], isBossRoom?: boolean): LevelSection {
  return { tiles: parseMap(map), enemies, isBossRoom };
}

// ── Enemy shorthand ────────────────────────────────────────────────

function e(type: EnemyType, col: number, row: number): EnemySpawn {
  return { type, col, row };
}

// ── Stage-specific level generators ────────────────────────────────

export function generateLevel(stageId: StageId): LevelSection[] {
  switch (stageId) {
    case StageId.HUGE_KNIGHT: return generateKnightFortress();
    case StageId.DEMON_BOSS: return generateDemonInferno();
    case StageId.HEADLESS_HORSEMAN: return generateHauntedGraveyard();
    case StageId.WITCH: return generateWitchTower();
    case StageId.CERBERUS: return generateBeastDen();
    case StageId.MEDUSA: return generateMedusaLair();
    case StageId.DRAGON: return generateDragonSummit();
    default: return generateKnightFortress();
  }
}

// ════════════════════════════════════════════════════════════════════
// STAGE 1: KNIGHT'S FORTRESS  (Huge Knight)
// Theme: Stone castle, ramparts, guard towers, breakable walls
// ════════════════════════════════════════════════════════════════════

function generateKnightFortress(): LevelSection[] {
  const DW = EnemyType.DWARF_WARRIOR;
  const SK = EnemyType.SKELETON_WARRIOR;
  const SG = EnemyType.STONE_GOLEM;
  const GB = EnemyType.GOBLIN;
  const MO = EnemyType.MASKED_ORC;

  // Section 1: Castle Gate (30x10)
  const s1 = section([
    '..............................',
    '..............##..............',
    '.............####.............',
    '...........########...........',
    '...@.......#....#.............',
    '..##......##....##..........##',
    '..##..--..##....##...--...###.',
    '..##......##....##........###.',
    '####..##########..####..#####.',
    '##############################',
  ], [
    e(GB, 7, 7), e(DW, 16, 3), e(GB, 22, 5), e(SK, 27, 5),
  ]);

  // Section 2: Courtyard & Ramparts (35x12)
  const s2 = section([
    '...................................',
    '#.......................#..#..#..#.',
    '#.......................#..#..#..#.',
    '#...---.............--..#..#..#..#.',
    '#.....................#.........#..',
    '#..........--........#.........#..',
    '#.............##.....#...--....#..',
    '#..##..BB..####......#........##..',
    '####..........###..###...##..###..',
    '####..........###..###..###..###..',
    '####.SSSS.....###..########..###..',
    '###################################',
  ], [
    e(DW, 5, 7), e(SK, 10, 7), e(GB, 15, 8), e(MO, 20, 4),
    e(GB, 25, 1), e(DW, 29, 1), e(SK, 32, 7),
  ]);

  // Section 3: Tower Ascent (18x18) - vertical climb
  const s3 = section([
    '##################',
    '#................#',
    '#..---...........#',
    '#................#',
    '#.........---....#',
    '#................#',
    '#....---..BB..#..#',
    '#.............#..#',
    '#..BB...---...#..#',
    '#.............#..#',
    '#.......---......#',
    '#................#',
    '#...---..........#',
    '#................#',
    '#.........---....#',
    '#................#',
    '#...............##',
    '##################',
  ], [
    e(SK, 8, 4), e(DW, 5, 8), e(GB, 10, 10), e(SK, 6, 14),
    e(MO, 12, 12), e(GB, 4, 6),
  ]);

  // Section 4: Rampart Run (35x10) - horizontal with gaps
  const s4 = section([
    '...................................',
    '#..............#.................#.',
    '#..............#.................#.',
    '#..............B.................#.',
    '#.........---..B..---...........##.',
    '###.............B.......---.....##.',
    '###.....##..............###..BB.##.',
    '###.....##..SSS..###...####..#####.',
    '####....##.......####.############.',
    '###################################',
  ], [
    e(DW, 6, 5), e(SG, 12, 6), e(SK, 18, 4), e(MO, 24, 4),
    e(GB, 28, 5), e(DW, 32, 5),
  ]);

  // Section 5: Throne Room (boss)
  const s5 = bossRoom(18, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 2: DEMON'S INFERNO  (Demon Boss)
// Theme: Volcanic, lava pits, fire, vine barriers
// ════════════════════════════════════════════════════════════════════

function generateDemonInferno(): LevelSection[] {
  const IM = EnemyType.IMP;
  const PY = EnemyType.PYROMANCER;
  const SM = EnemyType.SKELETON_MAGE;
  const FE = EnemyType.FLYING_EYE;
  const PS = EnemyType.POISON_SKULL;

  // Section 1: Volcanic Entrance (32x10)
  const s1 = section([
    '................................',
    '................................',
    '..@.............................',
    '..##...........---..........##..',
    '..##........................##..',
    '..###...--..............--..##..',
    '..###..........---........####..',
    '..####....##........##..######..',
    '..####.SS.####..SSS.####.####..',
    '################################',
  ], [
    e(IM, 10, 2), e(PS, 16, 4), e(PY, 22, 5), e(SM, 28, 3),
  ]);

  // Section 2: Fire Corridors with vine barriers (30x12)
  const s2 = section([
    '..............................',
    '#............................#',
    '#..VV....................VV..#',
    '#..VV..---..........---..VV..#',
    '#..VV...............V....VV..#',
    '#...................V........#',
    '#......---..........V.--....#',
    '#........##.........V.......#',
    '##........##..VV..###..##..##',
    '##....SS..###..V..###..##..##',
    '##........####....########..#',
    '##############################',
  ], [
    e(PY, 5, 5), e(IM, 12, 3), e(FE, 18, 2), e(PS, 22, 5),
    e(SM, 26, 7), e(IM, 8, 7),
  ]);

  // Section 3: Lava Platforms (35x10) - spike pits everywhere
  const s3 = section([
    '...................................',
    '...................................',
    '...........---..............---....',
    '...................................',
    '..---..........---..........VV.....',
    '...............VV...---....VV.....',
    '..........---..VV..........VV.....',
    '####..........VV.......##..####...',
    '####.SSS..SSS.....SSS.###.####...',
    '####.SSS..SSS..SS.SSS.#########..',
  ], [
    e(IM, 5, 1), e(FE, 14, 1), e(PS, 20, 3), e(PY, 28, 2),
    e(IM, 24, 1), e(SM, 10, 4),
  ]);

  // Section 4: Descent into Inferno (20x16)
  const s4 = section([
    '####################',
    '#..................#',
    '#.---..............#',
    '#..........---.....#',
    '#.....VV...........#',
    '#.....VV.---..VV...#',
    '#..---.......-VV-..#',
    '#..................#',
    '#........---...VV..#',
    '#..VV..........VV..#',
    '#..VV..---....--...#',
    '#..................#',
    '#.......---........#',
    '#.---..............#',
    '#...........---....#',
    '####################',
  ], [
    e(PY, 8, 3), e(IM, 14, 1), e(FE, 5, 6), e(PS, 12, 8),
    e(SM, 8, 11), e(IM, 15, 13), e(PS, 4, 13),
  ]);

  // Section 5: Demon's Chamber
  const s5 = bossRoom(18, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 3: HAUNTED GRAVEYARD  (Headless Horseman)
// Theme: Dark graveyard, crypts, undead, breakable tombstones
// ════════════════════════════════════════════════════════════════════

function generateHauntedGraveyard(): LevelSection[] {
  const WW = EnemyType.WEREWOLF;
  const GA = EnemyType.GARGOYLE;
  const SK = EnemyType.SKELETON_WARRIOR;
  const GB = EnemyType.GOBLIN;
  const HA = EnemyType.HARPY;

  // Section 1: Graveyard Entrance (32x10) - tombstone platforms
  const s1 = section([
    '................................',
    '.....................#..........',
    '..@...........B......#.........',
    '..##..B..B...BB..B...##..BB....',
    '..##..#..#...##..#...##..##....',
    '..##..#..#...##..#...##..##..##',
    '..##..#..#...##..#...##..##..##',
    '..##############..############.',
    '..##############..############.',
    '################################',
  ], [
    e(SK, 7, 6), e(GB, 14, 6), e(SK, 21, 4), e(GA, 27, 2),
    e(GB, 10, 6),
  ]);

  // Section 2: Crypt Descent (20x16) - going down underground
  const s2 = section([
    '####################',
    '#..................#',
    '#..---........---..#',
    '#..................#',
    '#......BB..BB......#',
    '#......##..##......#',
    '#.---..##..##.---..#',
    '#......##..##......#',
    '#.........SS.......#',
    '#..---........---..#',
    '#..................#',
    '#......BB..........#',
    '#......##...---....#',
    '#..---..........BB.#',
    '#.............####.#',
    '####################',
  ], [
    e(SK, 5, 2), e(GA, 14, 1), e(WW, 10, 6), e(GB, 5, 9),
    e(SK, 14, 11), e(HA, 8, 4), e(GB, 15, 13),
  ]);

  // Section 3: Underground Tunnels (35x10)
  const s3 = section([
    '###################################',
    '#.................................#',
    '#.........BB........BB...........#',
    '#..---....##..---...##....---.BB.#',
    '#.........##........##.......####.',
    '#.##..............##.........###..',
    '#.##..BB....---...##....---..##...',
    '#.####.##.........##..........#...',
    '#.####.##.SSS..########.SSS..#...',
    '###################################',
  ], [
    e(WW, 6, 5), e(SK, 12, 3), e(GA, 18, 1), e(GB, 24, 3),
    e(SK, 30, 3), e(WW, 16, 6), e(HA, 26, 1),
  ]);

  // Section 4: Cemetery Chase (35x10) - wide open, many enemies
  const s4 = section([
    '...................................',
    '...................................',
    '...................................',
    '..........---......---.............',
    '...............................BB..',
    '..---..................---..BB.##..',
    '.......BB..BB.....BB........####..',
    '.......##..##..BB.##...##..#####..',
    '###.SS.########.#.###.###.######..',
    '###################################',
  ], [
    e(WW, 5, 7), e(SK, 10, 6), e(GB, 15, 7), e(GA, 20, 2),
    e(HA, 25, 1), e(WW, 28, 6), e(SK, 32, 6), e(GB, 8, 7),
  ]);

  // Section 5: Mausoleum (boss)
  const s5 = bossRoom(18, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 4: WITCH'S TOWER  (Witch)
// Theme: Magical tower, vertical climb, alchemy, vine barriers
// ════════════════════════════════════════════════════════════════════

function generateWitchTower(): LevelSection[] {
  const WZ = EnemyType.WIZARD;
  const MC = EnemyType.MIMIC_CHEST;
  const PS = EnemyType.POISON_SKULL;
  const FE = EnemyType.FLYING_EYE;
  const BD = EnemyType.BABY_DRAGON;

  // Section 1: Tower Base (28x10)
  const s1 = section([
    '............................',
    '#.........................##',
    '#..@.............VV.....###',
    '#..##....---..VV.VV...####',
    '#..##........VVV.....#####',
    '#..##..---........---..####',
    '#..###........---.....####.',
    '#..####..##........########',
    '#..####..###..SSS..########',
    '############################',
  ], [
    e(WZ, 8, 5), e(PS, 14, 3), e(MC, 20, 6), e(FE, 24, 1),
  ]);

  // Section 2: Alchemy Library (25x14) - vine barriers, puzzles
  const s2 = section([
    '#########################',
    '#.......................#',
    '#..VV..---..........VV.#',
    '#..VV...........---..V.#',
    '#..VV.....VV.........V.#',
    '#.........VV..---....V.#',
    '#..---....VV.........V.#',
    '#.................---..#',
    '#.........---..........#',
    '#..VV..................#',
    '#..VV..---....---..VV..#',
    '#..VV..............VV..#',
    '#..##..####..####..##..#',
    '#########################',
  ], [
    e(WZ, 7, 6), e(MC, 15, 8), e(PS, 11, 2), e(FE, 20, 4),
    e(BD, 5, 10), e(WZ, 18, 10), e(PS, 13, 5),
  ]);

  // Section 3: Tower Ascent (16x22) - tall vertical climb
  const s3 = section([
    '################',
    '#..............#',
    '#...---........#',
    '#..............#',
    '#........---...#',
    '#..VV..........#',
    '#..VV..---..VV.#',
    '#..VV.......VV.#',
    '#...........VV.#',
    '#.---..........#',
    '#..............#',
    '#.......---....#',
    '#..............#',
    '#..---..VV.....#',
    '#.......VV.---.#',
    '#.......VV.....#',
    '#..............#',
    '#....---..VV...#',
    '#.........VV...#',
    '#..---....VV...#',
    '#..............#',
    '################',
  ], [
    e(FE, 10, 2), e(WZ, 5, 5), e(PS, 12, 8), e(BD, 8, 11),
    e(FE, 4, 14), e(WZ, 11, 17), e(PS, 7, 19),
  ]);

  // Section 4: Rooftop (30x10)
  const s4 = section([
    '..............................',
    '..............................',
    '..............---.............',
    '.....---..................---.',
    '..............VV..............',
    '.........---..VV..---........',
    '..VV..........VV.........VV..',
    '##VV..##..SSS..........##VV##',
    '####..###.....####..#####.###',
    '##############################',
  ], [
    e(BD, 5, 4), e(FE, 12, 1), e(WZ, 18, 4), e(PS, 24, 3),
    e(BD, 8, 1), e(MC, 22, 8),
  ]);

  // Section 5: Witch's Sanctum (boss)
  const s5 = bossRoom(18, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 5: BEAST'S DEN  (Cerberus)
// Theme: Wild caves, forest, rocky terrain, breakable walls
// ════════════════════════════════════════════════════════════════════

function generateBeastDen(): LevelSection[] {
  const KW = EnemyType.KOBOLD_WARRIOR;
  const LZ = EnemyType.LIZARDMAN;
  const SA = EnemyType.SATYR_ARCHER;
  const GR = EnemyType.GRYPHON;
  const WW = EnemyType.WEREWOLF;

  // Section 1: Forest Approach (32x10)
  const s1 = section([
    '................................',
    '...#..........#.........#.......',
    '..##.........###.......###......',
    '..@..........###.......###......',
    '..##...---.........---..........',
    '..##.......................---...',
    '..##..........---...........BB..',
    '..###....##..........##..BB.##..',
    '..####..####.SSS..#####..######.',
    '################################',
  ], [
    e(KW, 8, 7), e(LZ, 14, 7), e(SA, 20, 4), e(KW, 26, 6),
    e(GR, 18, 1),
  ]);

  // Section 2: Cave Entrance (30x12) - transition from forest to cave
  const s2 = section([
    '###...........................',
    '####..........##..............',
    '#####........####.........####',
    '######..---..####...---..####.',
    '#................#.......###..',
    '#..---...........#.......##...',
    '#....BB..........#..BB...#....',
    '#....##..---..BB.#..##..##....',
    '###..####.....##.#..##..###...',
    '###..####.SSS.#####..##.####..',
    '###..###########..########....',
    '##############################',
  ], [
    e(KW, 5, 4), e(LZ, 12, 4), e(WW, 18, 3), e(SA, 24, 3),
    e(KW, 8, 7), e(GR, 22, 0),
  ]);

  // Section 3: Underground River (35x10) - gaps over spikes
  const s3 = section([
    '###################################',
    '#.................................#',
    '#..---........BB.........---..BB.#',
    '#.............##.............####.#',
    '#......---....##..---........##..#',
    '##...........BB............---.#.#',
    '##..BB........#....BB........###.#',
    '####.##..##...##...##..##..####..#',
    '####.##..##.SS.##.SS##.##.#####.#',
    '###################################',
  ], [
    e(LZ, 6, 4), e(WW, 13, 2), e(SA, 19, 4), e(KW, 25, 2),
    e(LZ, 30, 2), e(GR, 10, 1), e(KW, 22, 6),
  ]);

  // Section 4: Deep Cave (22x14) - breakable walls everywhere
  const s4 = section([
    '######################',
    '#....................#',
    '#..---..BB..........##',
    '#.......##...---..BB##',
    '#.......##.......####.',
    '#..BB..---..BB.......#',
    '#..##.......##..---..#',
    '#..##...---..........#',
    '#............BB..BB..#',
    '#..---...##..##..##..#',
    '#.........#..........#',
    '#..BB..---...---..BB.#',
    '#..##............####.',
    '######################',
  ], [
    e(WW, 5, 4), e(KW, 11, 2), e(SA, 16, 3), e(LZ, 8, 7),
    e(WW, 14, 9), e(KW, 18, 11), e(GR, 6, 1),
  ]);

  // Section 5: The Den (boss)
  const s5 = bossRoom(20, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 6: MEDUSA'S LAIR  (Medusa)
// Theme: Ancient Greek temple ruins, columns, breakable statues
// ════════════════════════════════════════════════════════════════════

function generateMedusaLair(): LevelSection[] {
  const SG = EnemyType.STONE_GOLEM;
  const CY = EnemyType.CYCLOPS;
  const HA = EnemyType.HARPY;
  const GA = EnemyType.GARGOYLE;
  const LZ = EnemyType.LIZARDMAN;

  // Section 1: Temple Entrance (32x10) - columned hall
  const s1 = section([
    '................................',
    '..####..####..####..####..####..',
    '..@.#....#....#....#....#......',
    '..###....#....#....#....#...---',
    '..###....#....#....#....#......',
    '..##.....#....#....#....#...---',
    '..##.....#....#....#....#......',
    '..##..BB.#.BB.#.BB.#....#..####',
    '..##..########.#########..####.',
    '################################',
  ], [
    e(LZ, 8, 6), e(GA, 13, 1), e(SG, 18, 6), e(LZ, 24, 4),
    e(HA, 28, 1),
  ]);

  // Section 2: Ruined Halls (30x12) - crumbling architecture
  const s2 = section([
    '##............................',
    '##..........##............####',
    '##..........##............####',
    '##..---..BB.##..---......####',
    '#........##..........BB..##..',
    '#...............---..##..#...',
    '#..BB..---..............##...',
    '#..##..........BB..---..#....',
    '####..##..BB...##.......##...',
    '####..##..##..###.SSS.####...',
    '####..##..#########..######..',
    '##############################',
  ], [
    e(SG, 5, 4), e(CY, 12, 3), e(GA, 18, 1), e(LZ, 24, 3),
    e(HA, 8, 1), e(LZ, 28, 6), e(GA, 15, 5),
  ]);

  // Section 3: Statue Gallery (30x10) - many breakable blocks
  const s3 = section([
    '##############################',
    '#............................#',
    '#..BB..BB..BB..BB..BB..BB...#',
    '#..##..##..##..##..##..##.--#',
    '#..............BB............#',
    '#..---..BB.....##....BB.---..#',
    '#.......##...........##.....#',
    '#.......##..---..BB..##..BB.#',
    '#..BB..####......##..##..##.#',
    '##############################',
  ], [
    e(SG, 5, 4), e(CY, 11, 4), e(GA, 17, 1), e(LZ, 23, 4),
    e(HA, 14, 1), e(SG, 26, 6), e(LZ, 8, 6),
  ]);

  // Section 4: Snake Passage (22x14) - winding descent
  const s4 = section([
    '######################',
    '#....................#',
    '#..---....BB.........#',
    '#.........##...---...#',
    '#...............BB...#',
    '#..BB..---...#.##....#',
    '#..##........#.......#',
    '#..##...---..#..BB...#',
    '#............#..##...#',
    '#..---..BB...#..---..#',
    '#.......##...........#',
    '#............---..BB.#',
    '#..BB..---........##.#',
    '######################',
  ], [
    e(SG, 5, 4), e(CY, 12, 2), e(GA, 16, 1), e(LZ, 8, 8),
    e(HA, 14, 5), e(LZ, 18, 11), e(SG, 6, 10),
  ]);

  // Section 5: Medusa's Throne (boss)
  const s5 = bossRoom(18, 11);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// STAGE 7: DRAGON'S SUMMIT  (Dragon - Final Boss)
// Theme: Mountain/volcano peak, hardest level, both barriers
// ════════════════════════════════════════════════════════════════════

function generateDragonSummit(): LevelSection[] {
  const MT = EnemyType.MINOTAUR;
  const PY = EnemyType.PYROMANCER;
  const BD = EnemyType.BABY_DRAGON;
  const MO = EnemyType.MASKED_ORC;
  const SG = EnemyType.STONE_GOLEM;

  // Section 1: Mountain Base (32x12) - steep rocky terrain
  const s1 = section([
    '................................',
    '................................',
    '..@.........................####',
    '..##....---..............######.',
    '..##..............---..########.',
    '..###..BB..---........########..',
    '..###..##.........VV..######...',
    '..####.##..##..BB.VV..#####....',
    '..####.######..##.....####.....',
    '..####.######..###.SS.####.....',
    '..####.######..###.########....',
    '################################',
  ], [
    e(MO, 7, 5), e(MT, 13, 5), e(PY, 19, 4), e(BD, 25, 1),
    e(SG, 22, 5),
  ]);

  // Section 2: Cliffside Path (35x12) - narrow platforms, both barriers
  const s2 = section([
    '...................................',
    '#.........#........................',
    '#.........#.....VV.............###',
    '#..---....#.VV..VV..BB........###',
    '#.........#.VV......##...---..##.',
    '#.....BB..#.VV.---..........BB#..',
    '#.....##..#..............---..##..',
    '##........#..BB...VV.........##..',
    '##..SSS..###.##...VV..##..####..',
    '##.......####.##..VV..##..####..',
    '##.......####.########.########..',
    '###################################',
  ], [
    e(BD, 6, 3), e(MT, 14, 3), e(PY, 20, 4), e(MO, 26, 4),
    e(SG, 30, 4), e(BD, 10, 1), e(MT, 24, 6),
  ]);

  // Section 3: Volcano Interior (25x16) - both vines and breakable
  const s3 = section([
    '#########################',
    '#.......................#',
    '#..---....VV.......BB..#',
    '#.........VV.......##..#',
    '#..BB.....VV..---......#',
    '#..##..---............BB#',
    '#..##..........VV...####',
    '#..........---..VV.....#',
    '#...VV.........VV..BB..#',
    '#...VV..BB.---..VV.##..#',
    '#...VV..##..........VV.#',
    '#.......##...---....VV.#',
    '#..BB..---..........VV.#',
    '#..##..........---..VV.#',
    '#..##..............BB..#',
    '#########################',
  ], [
    e(PY, 5, 4), e(BD, 12, 1), e(MT, 18, 2), e(SG, 8, 7),
    e(MO, 15, 9), e(BD, 20, 6), e(PY, 10, 12), e(MT, 16, 13),
  ]);

  // Section 4: Summit Gauntlet (35x10) - final enemy rush
  const s4 = section([
    '...................................',
    '#.................................#',
    '#..........VV...BB........VV..BB.#',
    '#..---..VV.VV...##..---..VV..##.#',
    '#.......VV.VV............VV.....#',
    '#..BB......VV...BB..---..VV..BB.#',
    '#..##..---....BB.##.........####.',
    '####........BB##.##..BB..######..',
    '####.SS..SS.####.##..##.#######..',
    '###################################',
  ], [
    e(MT, 5, 5), e(SG, 10, 5), e(PY, 15, 3), e(BD, 20, 1),
    e(MO, 24, 3), e(MT, 28, 3), e(SG, 32, 5), e(BD, 8, 1),
  ]);

  // Section 5: Dragon's Peak (larger boss room)
  const s5 = bossRoom(22, 13);

  return [s1, s2, s3, s4, s5];
}

// ════════════════════════════════════════════════════════════════════
// Boss Room Generator (shared, configurable size)
// ════════════════════════════════════════════════════════════════════

function bossRoom(width: number, height: number): LevelSection {
  const lines: string[] = [];

  for (let r = 0; r < height; r++) {
    let line = '';
    for (let c = 0; c < width; c++) {
      if (r === 0 || r >= height - 2) {
        line += '#';  // ceiling and floor
      } else if (c === 0 || c === width - 1) {
        line += '#';  // walls
      } else if (r === height - 4 && c === width - 3) {
        line += 'X';  // boss spawn (high enough to not clip floor)
      } else {
        line += '.';
      }
    }
    lines.push(line);
  }

  return section(lines, [], true);
}

// ── Utility exports ────────────────────────────────────────────────

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
