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
  let sections: LevelSection[];
  switch (stageId) {
    case StageId.HUGE_KNIGHT: sections = generateKnightFortress(); break;
    case StageId.DEMON_BOSS: sections = generateDemonInferno(); break;
    case StageId.HEADLESS_HORSEMAN: sections = generateHauntedGraveyard(); break;
    case StageId.WITCH: sections = generateWitchTower(); break;
    case StageId.CERBERUS: sections = generateBeastDen(); break;
    case StageId.MEDUSA: sections = generateMedusaLair(); break;
    case StageId.DRAGON: sections = generateDragonSummit(); break;
    default: sections = generateKnightFortress(); break;
  }
  fixSectionTransitions(sections);
  fixEnemyPositions(sections);
  return sections;
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
    '..............................',
    '..@...........---.............',
    '..##......................---.',
    '..##..---..........---........',
    '..........BB..................',
    '..##..##..##..---......---....',
    '..##..##..........##..........',
    '..##..##..SSS..#####..##..##..',
    '##############################',
  ], [
    e(GB, 8, 7), e(DW, 15, 3), e(GB, 22, 3), e(SK, 27, 7),
  ]);

  // Section 2: Courtyard & Ramparts (35x12)
  const s2 = section([
    '...................................',
    '...................................',
    '.........---..............---......',
    '...................................',
    '..---...........---................',
    '.........................---.......',
    '..........---..........##..........',
    '..##..BB..........BB...##..---.....',
    '..##..##..---..##.##...##..........',
    '..##..##.......##......##..##..BB..',
    '..##..##..SSS..##......##..##..##..',
    '###################################',
  ], [
    e(DW, 6, 7), e(SK, 12, 7), e(GB, 18, 4), e(MO, 24, 4),
    e(GB, 28, 8), e(DW, 32, 8),
  ]);

  // Section 3: Tower Ascent (30x14) - open zigzag platforms
  const s3 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..............---........',
    '..............................',
    '..........---..BB....---......',
    '..---..........##.............',
    '..##...........##...---.......',
    '..##..---..BB.................',
    '..##.......##....---..##......',
    '..##.......##.........##..BB..',
    '..##..SSS..##.........##..##..',
    '##############################',
  ], [
    e(SK, 8, 3), e(DW, 5, 9), e(GB, 16, 5), e(SK, 22, 8),
    e(MO, 26, 10), e(GB, 12, 11),
  ]);

  // Section 4: Rampart Run (35x10) - horizontal with hazards
  const s4 = section([
    '...................................',
    '...................................',
    '..---..........---..............---',
    '...................................',
    '..........---..........---.........',
    '..##..BB.........BB..........BB....',
    '..##..##..---....##..---..##..##...',
    '..##..##.........##.......##..##...',
    '..##..##..SSS....##..SSS..##..##...',
    '###################################',
  ], [
    e(DW, 6, 5), e(SG, 14, 5), e(SK, 20, 4), e(MO, 26, 4),
    e(GB, 30, 5), e(DW, 10, 1),
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
    '..@............---..............',
    '..##............................',
    '..##..---..............---......',
    '..##..........---...............',
    '..###...........................',
    '..###..##..VV.......##..##......',
    '..###..##..VV..SSS..##..##......',
    '################################',
  ], [
    e(IM, 10, 4), e(PS, 16, 5), e(PY, 22, 5), e(SM, 28, 7),
  ]);

  // Section 2: Fire Corridors with vine barriers (30x12)
  const s2 = section([
    '..............................',
    '..............................',
    '..VV.........---..........VV..',
    '..VV......................VV..',
    '..VV..---..........---....VV..',
    '..............................',
    '..........---..........---....',
    '..##..VV..........VV..........',
    '..##..VV..---..##.VV..##......',
    '..##..VV.......##.....##..##..',
    '..##..VV..SSS..##.....##..##..',
    '##############################',
  ], [
    e(PY, 6, 5), e(IM, 12, 5), e(FE, 18, 1), e(PS, 22, 5),
    e(SM, 26, 8), e(IM, 8, 8),
  ]);

  // Section 3: Lava Platforms (35x10) - spike pits and vine barriers
  const s3 = section([
    '...................................',
    '...................................',
    '...........---..............---....',
    '...................................',
    '..---..........---.................',
    '...........................---.....',
    '..........---..........VV..........',
    '####..........##...VV..##..####....',
    '####.SSS..SSS.##..SSS..##..####....',
    '###################################',
  ], [
    e(IM, 5, 1), e(FE, 14, 1), e(PS, 20, 3), e(PY, 28, 4),
    e(IM, 24, 1), e(SM, 10, 6),
  ]);

  // Section 4: Descent into Inferno (30x14) - open zigzag descent
  const s4 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..............---........',
    '..VV..........................',
    '..VV......---..VV....---......',
    '..........VV..VV..............',
    '..---..........VV...---.......',
    '..##...........VV.............',
    '..##..---..VV.................',
    '..##.......VV....---..##......',
    '..##..SSS..VV.........##......',
    '##############################',
  ], [
    e(PY, 8, 3), e(IM, 14, 1), e(FE, 20, 4), e(PS, 12, 8),
    e(SM, 8, 10), e(IM, 24, 6), e(PS, 18, 10),
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
    '................................',
    '..@............---..............',
    '..##............................',
    '..##..---..BB.........---.......',
    '..##.......##...................',
    '..##..BB...##..---......BB......',
    '..##..##...##..........##.......',
    '..##..##...##..SSS..##..##......',
    '################################',
  ], [
    e(SK, 8, 6), e(GB, 14, 7), e(SK, 21, 4), e(GA, 27, 5),
    e(GB, 10, 7),
  ]);

  // Section 2: Crypt Descent (30x14) - open descent with breakable blocks
  const s2 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..BB..........---........',
    '.......##.....................',
    '..........---..BB....---......',
    '..---..........##.............',
    '..##...........##...---.......',
    '..##..---..BB.................',
    '..##.......##....---..##......',
    '..##.......##..SS.....##..BB..',
    '..##.......##..SS.....##..##..',
    '##############################',
  ], [
    e(SK, 5, 3), e(GA, 14, 1), e(WW, 20, 5), e(GB, 8, 8),
    e(SK, 24, 9), e(HA, 16, 3), e(GB, 12, 11),
  ]);

  // Section 3: Underground Tunnels (35x10)
  const s3 = section([
    '...................................',
    '...................................',
    '.........---........---............',
    '...................................',
    '..---..........---..........---....',
    '..........BB..........BB...........',
    '..##..##..##..---..##..##..---.....',
    '..##..##..##.......##..##..........',
    '..##..##..##..SSS..##..##..##..##..',
    '###################################',
  ], [
    e(WW, 6, 5), e(SK, 12, 5), e(GA, 18, 1), e(GB, 24, 4),
    e(SK, 30, 4), e(WW, 16, 7), e(HA, 22, 1),
  ]);

  // Section 4: Cemetery Chase (35x10) - wide open, many enemies
  const s4 = section([
    '...................................',
    '...................................',
    '...................................',
    '..........---......---.............',
    '..---..........................---.',
    '..........BB..---........BB........',
    '.......##..##.........##..##.......',
    '.......##..##..BB..##..##..##..BB..',
    '..SSS..##..##..##..##..##..##..##..',
    '###################################',
  ], [
    e(WW, 5, 5), e(SK, 10, 5), e(GB, 15, 6), e(GA, 20, 2),
    e(HA, 25, 1), e(WW, 28, 5), e(SK, 32, 6), e(GB, 8, 5),
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
    '............................',
    '..@............---..........',
    '..##........................',
    '..##..---..........---......',
    '..##..........VV............',
    '..###.........VV..---.......',
    '..###..##..VV.VV............',
    '..###..##..VV.....##..##....',
    '############################',
  ], [
    e(WZ, 8, 5), e(PS, 14, 5), e(MC, 20, 7), e(FE, 24, 1),
  ]);

  // Section 2: Alchemy Library (25x14) - vine barriers, open layout
  const s2 = section([
    '.........................',
    '..---....................',
    '....................---..',
    '..........---............',
    '..---..VV..........---...',
    '.......VV................',
    '..........---..VV........',
    '..---..........VV........',
    '..##...........VV..---...',
    '..##..---..VV............',
    '..##.......VV....---..##.',
    '..##.......VV.........##.',
    '..##..SSS..VV.........##.',
    '#########################',
  ], [
    e(WZ, 7, 5), e(MC, 15, 8), e(PS, 11, 2), e(FE, 20, 4),
    e(BD, 5, 10), e(WZ, 18, 10), e(PS, 13, 6),
  ]);

  // Section 3: Tower Ascent (30x14) - open zigzag with vines
  const s3 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..VV..........---........',
    '.......VV.....................',
    '..........---..VV....---......',
    '..---..........VV.............',
    '..##...........VV...---.......',
    '..##..---..VV.................',
    '..##.......VV....---..##......',
    '..##.......VV.........##......',
    '..##..SSS..VV.........##......',
    '##############################',
  ], [
    e(FE, 10, 1), e(WZ, 5, 5), e(PS, 18, 5), e(BD, 22, 8),
    e(FE, 8, 9), e(WZ, 14, 11), e(PS, 26, 10),
  ]);

  // Section 4: Rooftop (30x10)
  const s4 = section([
    '..............................',
    '..............................',
    '..............---.............',
    '.....---..................---.',
    '..............................',
    '.........---..VV..---.........',
    '..VV..........VV..........VV..',
    '..VV..##..SSS.VV.......##.VV..',
    '..VV..##......VV..##...##.VV..',
    '##############################',
  ], [
    e(BD, 5, 4), e(FE, 12, 1), e(WZ, 18, 4), e(PS, 24, 3),
    e(BD, 8, 1), e(MC, 22, 7),
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
    '................................',
    '..@............---..............',
    '..##............................',
    '..##..---..........---..........',
    '..##............................',
    '..##..........---..........BB...',
    '..###....##..........##..##.##..',
    '..####..####.SSS..#####..##.##..',
    '################################',
  ], [
    e(KW, 8, 6), e(LZ, 14, 6), e(SA, 20, 4), e(KW, 26, 6),
    e(GR, 18, 1),
  ]);

  // Section 2: Cave Entrance (30x12) - transition into cave
  const s2 = section([
    '..............................',
    '..............................',
    '.........---..............---.',
    '..............................',
    '..---..........---............',
    '.........................---..',
    '..........---..........BB.....',
    '..##..BB..........BB...##.....',
    '..##..##..---..##.##...##..##.',
    '..##..##.......##......##..##.',
    '..##..##..SSS..##......##..##.',
    '##############################',
  ], [
    e(KW, 6, 5), e(LZ, 12, 5), e(WW, 18, 4), e(SA, 24, 4),
    e(KW, 8, 8), e(GR, 22, 1),
  ]);

  // Section 3: Underground River (35x10) - gaps over spikes
  const s3 = section([
    '...................................',
    '...................................',
    '..---........BB.........---..BB....',
    '.............##.............##.....',
    '......---....##..---........##.....',
    '..........BB...............---.....',
    '..BB..##..##..---..BB..........##..',
    '..##..##..##.......##..##..##.##...',
    '..##..##..##.SS....##..##..##.##...',
    '###################################',
  ], [
    e(LZ, 6, 4), e(WW, 13, 2), e(SA, 19, 4), e(KW, 25, 2),
    e(LZ, 30, 4), e(GR, 10, 1), e(KW, 22, 5),
  ]);

  // Section 4: Deep Cave (30x12) - breakable walls, open layout
  const s4 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..BB..........---........',
    '.......##.....................',
    '..........---..BB....---......',
    '..---..........##.............',
    '..##...........##...---.......',
    '..##..---..BB.................',
    '..##.......##....---..##..BB..',
    '##############################',
  ], [
    e(WW, 5, 4), e(KW, 11, 2), e(SA, 16, 3), e(LZ, 22, 6),
    e(WW, 14, 8), e(KW, 26, 9), e(GR, 8, 1),
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
    '................................',
    '..@............---..............',
    '..##............................',
    '..##..---..BB.........---.......',
    '..##.......##...................',
    '..##..BB...##..---......BB......',
    '..##..##...##..........##.......',
    '..##..##...##..SSS..##..##......',
    '################################',
  ], [
    e(LZ, 8, 6), e(GA, 14, 1), e(SG, 20, 6), e(LZ, 24, 4),
    e(HA, 28, 1),
  ]);

  // Section 2: Ruined Halls (30x12) - open crumbling architecture
  const s2 = section([
    '..............................',
    '..............................',
    '.........---..............---.',
    '..............................',
    '..---..........---............',
    '..........BB..........BB......',
    '..##..##..##..---..##..##.....',
    '..##..##..##.......##..##.....',
    '..##..##..##..BB...##..##..##.',
    '..##..##..##..##...##..##..##.',
    '..##..##..##..##.SS.##..##.##.',
    '##############################',
  ], [
    e(SG, 5, 4), e(CY, 12, 4), e(GA, 18, 1), e(LZ, 24, 4),
    e(HA, 8, 1), e(LZ, 26, 7), e(GA, 15, 7),
  ]);

  // Section 3: Statue Gallery (30x10) - many breakable blocks
  const s3 = section([
    '..............................',
    '..............................',
    '..BB..BB..BB..BB..BB..BB......',
    '..##..##..##..##..##..##..---.',
    '..............BB..............',
    '..---..BB.....##....BB..---...',
    '.......##...........##........',
    '.......##..---..BB..##..BB....',
    '..BB..####......##..##..##....',
    '##############################',
  ], [
    e(SG, 5, 4), e(CY, 11, 4), e(GA, 17, 1), e(LZ, 23, 4),
    e(HA, 14, 1), e(SG, 26, 6), e(LZ, 8, 6),
  ]);

  // Section 4: Snake Passage (30x12) - winding descent, open
  const s4 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..BB..........---........',
    '.......##.....................',
    '..........---..BB....---......',
    '..---..........##.............',
    '..##...........##...---.......',
    '..##..---..BB.................',
    '..##.......##....---..##..BB..',
    '##############################',
  ], [
    e(SG, 5, 4), e(CY, 12, 2), e(GA, 22, 1), e(LZ, 8, 8),
    e(HA, 16, 5), e(LZ, 26, 9), e(SG, 18, 9),
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
    '..@............---..............',
    '..##............................',
    '..##..---..............---......',
    '..##..........---..........VV...',
    '..###..BB.................VV....',
    '..###..##..##..BB..##..VV.......',
    '..###..##..##..##..##..VV.......',
    '..###..##..##..##..##..##..##...',
    '..###..##..##..##..##..##..##...',
    '################################',
  ], [
    e(MO, 7, 5), e(MT, 13, 5), e(PY, 19, 4), e(BD, 25, 1),
    e(SG, 22, 7),
  ]);

  // Section 2: Cliffside Path (35x12) - platforms with both barriers
  const s2 = section([
    '...................................',
    '...................................',
    '.........---..............---......',
    '...................................',
    '..---..........---.................',
    '..........VV..........VV..---......',
    '..##..VV..VV..---..VV..VV..........',
    '..##..VV..VV.......VV..VV..BB......',
    '..##..VV..VV..BB...VV..VV..##..##..',
    '..##..VV..VV..##...VV..VV..##..##..',
    '..##..VV..VV..##.SS.VV..VV.##..##..',
    '###################################',
  ], [
    e(BD, 6, 3), e(MT, 14, 4), e(PY, 20, 4), e(MO, 26, 4),
    e(SG, 30, 7), e(BD, 10, 1), e(MT, 24, 7),
  ]);

  // Section 3: Volcano Interior (30x14) - both vines and breakable, open
  const s3 = section([
    '..............................',
    '..---.........................',
    '....................---.......',
    '..........---.................',
    '..---..VV..........---........',
    '.......VV.....................',
    '..........---..BB....---......',
    '..---..........##....VV.......',
    '..##...........##...VV........',
    '..##..---..VV..........BB.....',
    '..##.......VV....---..##......',
    '..##.......VV.........##......',
    '..##..SSS..VV.........##......',
    '##############################',
  ], [
    e(PY, 5, 4), e(BD, 12, 1), e(MT, 18, 2), e(SG, 22, 8),
    e(MO, 15, 9), e(BD, 8, 9), e(PY, 26, 10), e(MT, 20, 11),
  ]);

  // Section 4: Summit Gauntlet (35x10) - final enemy rush
  const s4 = section([
    '...................................',
    '...................................',
    '..---..........---..............---',
    '...................................',
    '..........---..........---.........',
    '..BB..VV.........BB..VV.......BB...',
    '..##..VV..---....##..VV..---..##...',
    '..##..VV.........##..VV.......##...',
    '..##..VV..SSS....##..VV..SSS..##...',
    '###################################',
  ], [
    e(MT, 5, 5), e(SG, 12, 5), e(PY, 18, 4), e(BD, 24, 1),
    e(MO, 28, 4), e(MT, 32, 5), e(SG, 8, 1), e(BD, 20, 1),
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
  // Door opening: rows in the middle-lower area of the left wall (3 tiles tall)
  const doorTop = height - 5;
  const doorBottom = height - 3;

  for (let r = 0; r < height; r++) {
    let line = '';
    for (let c = 0; c < width; c++) {
      if (r === 0 || r >= height - 2) {
        line += '#';  // ceiling and floor
      } else if (c === 0) {
        // Left wall: boss door entrance
        if (r >= doorTop && r <= doorBottom) {
          line += 'D';  // boss door tiles
        } else {
          line += '#';
        }
      } else if (c === width - 1) {
        line += '#';  // right wall
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

// ── Post-processing: fix section transitions & enemy positions ────

function isOccupied(tiles: number[][], col: number, row: number): boolean {
  if (row < 0 || row >= tiles.length || col < 0 || col >= tiles[0].length) return false;
  const t = tiles[row][col];
  return t === T.SOLID || t === T.BREAKABLE || t === T.VINE || t === T.SPIKE || t === T.BOSS_DOOR;
}

/**
 * Opens 3-tile-high passages at section boundaries so the player can
 * traverse between sections. Aligns passages at the floor level
 * (accounting for bottom-alignment of different-height sections).
 */
function fixSectionTransitions(sections: LevelSection[]): void {
  const maxHeight = Math.max(...sections.map(s => s.tiles.length));

  for (let i = 0; i < sections.length - 1; i++) {
    const current = sections[i];
    const next = sections[i + 1];

    // Boss room transitions are handled by boss door tiles
    if (next.isBossRoom) {
      // Still need to open the right edge of the previous section
      // to connect to the boss door
      const rightCol = current.tiles[0].length - 1;
      const curYOffset = maxHeight - current.tiles.length;
      const nextYOffset = maxHeight - next.tiles.length;

      // Find the boss door rows in absolute coordinates
      const doorTop = next.tiles.length - 5;
      const doorBottom = next.tiles.length - 3;

      for (let dr = doorTop; dr <= doorBottom; dr++) {
        const absRow = dr + nextYOffset;
        const curRow = absRow - curYOffset;
        // Clear 2 columns wide for the passage
        for (let dc = 0; dc < 2; dc++) {
          const col = rightCol - dc;
          if (curRow >= 0 && curRow < current.tiles.length && col >= 0) {
            current.tiles[curRow][col] = T.EMPTY;
          }
        }
      }
      // Ensure floor below the opening (2 columns wide)
      const floorAbsRow = doorBottom + 1 + nextYOffset;
      const curFloorRow = floorAbsRow - curYOffset;
      for (let dc = 0; dc < 2; dc++) {
        const col = rightCol - dc;
        if (curFloorRow >= 0 && curFloorRow < current.tiles.length && col >= 0) {
          if (current.tiles[curFloorRow][col] === T.EMPTY) {
            current.tiles[curFloorRow][col] = T.SOLID;
          }
        }
      }
      continue;
    }

    const curYOffset = maxHeight - current.tiles.length;
    const nextYOffset = maxHeight - next.tiles.length;
    const rightCol = current.tiles[0].length - 1;
    const leftCol = 0;

    // Find the floor row in current section's right column (bottommost solid row)
    let curFloorRow = current.tiles.length - 1;
    for (let r = current.tiles.length - 1; r >= 0; r--) {
      if (current.tiles[r][rightCol] === T.SOLID) {
        curFloorRow = r;
        break;
      }
    }

    // Absolute floor position
    const floorAbs = curFloorRow + curYOffset;

    // Open a 2-wide × 3-tall passage above the floor on both sides
    for (let dy = 1; dy <= 3; dy++) {
      const absRow = floorAbs - dy;

      // Clear rightmost 2 columns of current section
      for (let dc = 0; dc < 2; dc++) {
        const col = rightCol - dc;
        const curRow = absRow - curYOffset;
        if (curRow >= 0 && curRow < current.tiles.length && col >= 0) {
          current.tiles[curRow][col] = T.EMPTY;
        }
      }

      // Clear leftmost 2 columns of next section
      for (let dc = 0; dc < 2; dc++) {
        const col = leftCol + dc;
        const nextRow = absRow - nextYOffset;
        if (nextRow >= 0 && nextRow < next.tiles.length && col < next.tiles[0].length) {
          next.tiles[nextRow][col] = T.EMPTY;
        }
      }
    }

    // Ensure floor exists at the boundary (both edge columns)
    const nextFloorRow = floorAbs - nextYOffset;
    for (let dc = 0; dc < 2; dc++) {
      if (nextFloorRow >= 0 && nextFloorRow < next.tiles.length) {
        const col = leftCol + dc;
        if (col < next.tiles[0].length && next.tiles[nextFloorRow][col] === T.EMPTY) {
          next.tiles[nextFloorRow][col] = T.SOLID;
        }
      }
      const col = rightCol - dc;
      if (curFloorRow >= 0 && curFloorRow < current.tiles.length && col >= 0) {
        if (current.tiles[curFloorRow][col] === T.EMPTY) {
          current.tiles[curFloorRow][col] = T.SOLID;
        }
      }
    }
  }
}

/**
 * Ensures no enemy is spawned inside a solid/breakable/vine/spike tile.
 * Moves them upward until they're in empty space.
 */
function fixEnemyPositions(sections: LevelSection[]): void {
  for (const section of sections) {
    for (const enemy of section.enemies) {
      while (enemy.row > 0 && isOccupied(section.tiles, enemy.col, enemy.row)) {
        enemy.row--;
      }
    }
  }
}

// ── Utility exports ────────────────────────────────────────────────

export function getSectionWorldOffset(sections: LevelSection[], sectionIndex: number): { x: number; y: number } {
  let offsetX = 0;
  for (let i = 0; i < sectionIndex; i++) {
    offsetX += sections[i].tiles[0].length * TILE_SIZE;
  }
  // Bottom-align sections so floors match across different heights
  const maxHeight = Math.max(...sections.map(s => s.tiles.length));
  const sectionHeight = sections[sectionIndex].tiles.length;
  const offsetY = (maxHeight - sectionHeight) * TILE_SIZE;
  return { x: offsetX, y: offsetY };
}

export function getTotalLevelWidth(sections: LevelSection[]): number {
  return sections.reduce((sum, s) => sum + s.tiles[0].length * TILE_SIZE, 0);
}

export function getTotalLevelHeight(sections: LevelSection[]): number {
  return Math.max(...sections.map(s => s.tiles.length * TILE_SIZE));
}
