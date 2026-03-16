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
  const DW = EnemyType.DWARF_WARRIOR;   // melee patrol
  const SK = EnemyType.SKELETON_WARRIOR; // melee patrol
  const GB = EnemyType.GOBLIN;           // melee chase (fast)
  const SA = EnemyType.SATYR_ARCHER;     // ranged patrol (shoots arrows)
  const GR = EnemyType.GRYPHON;          // flying dive-bomber

  // Section 1: Castle Gate (30x10)
  // Gryphon patrols sky, archers snipe from ramparts, goblins rush on ground
  const s1 = section([
    '..............................',
    '..............---.............',
    '..@.......................---.',
    '..##..---..........---........',
    '..##...........##.............',
    '......BB......##..---..##.....',
    '..##..##..---..........##.....',
    '..##..##..........##...##.....',
    '..##..##..SSS..#####..###.##..',
    '##############################',
  ], [
    e(GR, 14, 0), e(SA, 8, 1), e(SA, 22, 3), e(GB, 15, 7),
    e(DW, 26, 2), e(SK, 12, 6), e(GB, 5, 3),
  ]);

  // Section 2: Courtyard & Ramparts (35x12)
  // Archers snipe from high platforms, gryphon dives, melee guards below
  const s2 = section([
    '...................................',
    '......---....................---...',
    '...................................',
    '..---........---..........---......',
    '............##.....................',
    '.........##.##.....---..##.........',
    '..##..BB.##........##..##..---.....',
    '..##..##.##..---...##..##..........',
    '..##..##.##........##..##..##.BB...',
    '..##..##.##..SSS...##..##..##.##...',
    '..##..##.##..SSS...##..##..##.##...',
    '###################################',
  ], [
    e(SA, 6, 1), e(GR, 20, 0), e(SA, 28, 1), e(DW, 16, 3),
    e(GB, 10, 8), e(GB, 32, 7), e(SK, 19, 5), e(DW, 8, 5),
  ]);

  // Section 3: Tower Ascent (30x14) - zigzag with archers sniping from each level
  const s3 = section([
    '..............................',
    '..---......................---',
    '..............................',
    '..........---......---........',
    '.........##...................',
    '..---...##.............---....',
    '.......##..BB.................',
    '..........##..---......##.....',
    '..---......##..........##.....',
    '..##.......##...---....##.....',
    '..##..---..BB..........##.....',
    '..##.......##....---..###.....',
    '..##..SSS..##.........###.##..',
    '##############################',
  ], [
    e(GR, 15, 0), e(SA, 4, 1), e(SA, 26, 1), e(DW, 14, 3),
    e(GB, 6, 5), e(SK, 10, 4), e(SA, 18, 7),
    e(DW, 24, 8), e(GB, 12, 10), e(SK, 20, 11),
  ]);

  // Section 4: Rampart Run (35x10) - gauntlet with archers above, gryphon swooping
  const s4 = section([
    '...................................',
    '..---........---........---..---...',
    '...................................',
    '.........---..........---..........',
    '..##..BB........BB..........BB..##.',
    '..##..##..---...##..---..##..##.##.',
    '..##..##........##........##.##.##.',
    '..##..##..SSS...##..SSS...##.##.##.',
    '..##..##..SSS...##..SSS...##.##.##.',
    '###################################',
  ], [
    e(SA, 4, 1), e(GR, 12, 0), e(SA, 24, 1), e(GR, 30, 0),
    e(GB, 10, 3), e(GB, 20, 3), e(DW, 28, 3),
    e(SK, 6, 5), e(SK, 18, 5),
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
  const IM = EnemyType.IMP;              // flying ranged (fire shots)
  const PY = EnemyType.PYROMANCER;       // stationary ranged (fire blasts)
  const KW = EnemyType.KOBOLD_WARRIOR;   // melee patrol
  const FE = EnemyType.FLYING_EYE;       // flying ranged (eye beams)
  const LZ = EnemyType.LIZARDMAN;        // melee patrol

  // Section 1: Volcanic Entrance (32x10)
  // Imps fly overhead shooting, pyromancers snipe from platforms, lizards patrol ground
  const s1 = section([
    '................................',
    '..............---...............',
    '..@.......................---...',
    '..##..---..........##...........',
    '..##..........---..##..---......',
    '..##..VV..##.......##...........',
    '..##..VV..##..---..##..##..VV...',
    '..##..VV..##.......##..##..VV...',
    '..##..VV..##.SSSS..##..##..VV...',
    '################################',
  ], [
    e(IM, 8, 1), e(PY, 18, 3), e(FE, 14, 0), e(LZ, 10, 4),
    e(KW, 24, 4), e(IM, 28, 2), e(PY, 6, 3),
  ]);

  // Section 2: Fire Corridors with vine barriers (30x12)
  // Flying eyes patrol above, pyromancers on platforms, melee guards below
  const s2 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '..VV..---......---..VV........',
    '..VV.........##....VV..---....',
    '..VV..##.....##....VV.........',
    '......##..---..VV..........##.',
    '..##..##.......VV..---..##.##.',
    '..##..##..VV...VV......##.##..',
    '..##..##..VV.......##..##.##..',
    '..##..##..VV.SSSS..##..##.##..',
    '##############################',
  ], [
    e(PY, 10, 4), e(LZ, 4, 1), e(IM, 16, 0), e(FE, 24, 0),
    e(KW, 20, 3), e(IM, 8, 6), e(LZ, 14, 7),
    e(KW, 22, 6), e(PY, 26, 3),
  ]);

  // Section 3: Lava Platforms (35x10) - imps swarm air, pyromancers snipe, melee on ground
  const s3 = section([
    '...................................',
    '..---........---........---........',
    '...................................',
    '.........---..........---..........',
    '..##..VV........VV........VV..##...',
    '..##..VV..---...VV..---...VV..##...',
    '..##..VV........VV........VV..##...',
    '..##..VV..##....VV..##....VV..##...',
    '..##..VV..##.SS.VV..##.SS.VV..##...',
    '###################################',
  ], [
    e(IM, 5, 0), e(FE, 18, 0), e(IM, 30, 0), e(PY, 12, 1),
    e(PY, 24, 1), e(LZ, 9, 3), e(KW, 21, 3),
    e(LZ, 15, 5), e(KW, 27, 5),
  ]);

  // Section 4: Descent into Inferno (30x14) - all enemy types in final push
  const s4 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..VV..##..........##..VV......',
    '..VV..##..---..##.##..VV......',
    '......##.......##.....VV......',
    '..##..##..VV...##..---........',
    '..##......VV........##..VV....',
    '..##..---..VV..---..##..VV....',
    '..##.......VV.......##..VV....',
    '..##..##...VV..##...##..##....',
    '..##..##.SS.VV.##.SS.##.##....',
    '##############################',
  ], [
    e(PY, 4, 1), e(IM, 16, 0), e(FE, 24, 0), e(KW, 22, 3),
    e(LZ, 10, 3), e(IM, 8, 6), e(PY, 18, 5),
    e(LZ, 14, 9), e(KW, 6, 9), e(FE, 26, 7),
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
  const WW = EnemyType.WEREWOLF;         // melee chase (fast)
  const GA = EnemyType.GARGOYLE;         // flying ambush dive
  const SM = EnemyType.SKELETON_MAGE;    // ranged patrol (magic bolts)
  const GB = EnemyType.GOBLIN;           // melee chase
  const HA = EnemyType.HARPY;            // flying dive chase

  // Section 1: Graveyard Entrance (32x10) - harpies swoop, mages snipe, werewolves rush
  const s1 = section([
    '................................',
    '..............---...............',
    '..@.......................---...',
    '..##..---..BB.......BB..........',
    '..##.......##..---..##..##......',
    '..##..BB...##.......##..##......',
    '..##..##...##..---..##..##..BB..',
    '..##..##...##.......##..##..##..',
    '..##..##...##..SSS..##..##..##..',
    '################################',
  ], [
    e(SM, 8, 3), e(GA, 14, 0), e(HA, 22, 0), e(WW, 24, 4),
    e(GB, 10, 7), e(SM, 20, 6), e(HA, 28, 2),
  ]);

  // Section 2: Crypt Descent (30x14) - gargoyles lurk, mages snipe from ledges
  const s2 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..BB..##..........##..BB......',
    '..##..##..---..##.##..##......',
    '......##.......##.....##......',
    '..##..##..BB...##..---........',
    '..##......##........##..BB....',
    '..##..---..##..---..##..##....',
    '..##.......##.......##..##....',
    '..##..##...##..##...##..##....',
    '..##..##.SS.##.##.SS.##.##....',
    '##############################',
  ], [
    e(GA, 4, 0), e(HA, 24, 0), e(SM, 14, 3), e(SM, 22, 3),
    e(WW, 8, 5), e(GB, 18, 5), e(GA, 10, 7),
    e(GB, 26, 8), e(WW, 14, 9), e(SM, 20, 11),
  ]);

  // Section 3: Underground Tunnels (35x10) - harpies above, mages on platforms
  const s3 = section([
    '...................................',
    '..---........---........---........',
    '...................................',
    '.........---..........---..........',
    '..##..BB........BB........BB..##...',
    '..##..##..---...##..---...##..##...',
    '..##..##........##........##..##...',
    '..##..##..##....##..##....##..##...',
    '..##..##..##.SS.##..##.SS.##..##...',
    '###################################',
  ], [
    e(SM, 4, 1), e(HA, 15, 0), e(SM, 24, 1), e(WW, 10, 3),
    e(GA, 20, 0), e(GB, 6, 5), e(GB, 28, 5),
    e(WW, 16, 5), e(HA, 32, 0),
  ]);

  // Section 4: Cemetery Chase (35x10) - swarm with flying and ranged
  const s4 = section([
    '...................................',
    '..---........---........---..---...',
    '...................................',
    '.........---..........---..........',
    '..BB..##........BB........BB..##...',
    '..##..##..---...##..---...##..##...',
    '..##..##........##........##..##...',
    '..##..##..BB....##..BB....##..##...',
    '..##..##..##.SS.##..##.SS.##..##...',
    '###################################',
  ], [
    e(WW, 4, 1), e(HA, 15, 0), e(GA, 24, 0), e(WW, 32, 1),
    e(GB, 10, 3), e(SM, 20, 3), e(GB, 28, 3),
    e(SM, 6, 5), e(GA, 18, 0), e(WW, 30, 5),
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
  const WZ = EnemyType.WIZARD;           // stationary ranged (magic bolts)
  const MC = EnemyType.MIMIC_CHEST;      // ambush melee (surprise attack)
  const MO = EnemyType.MASKED_ORC;       // melee patrol
  const FE = EnemyType.FLYING_EYE;       // flying ranged (eye beams)
  const BD = EnemyType.BABY_DRAGON;      // flying ranged (fire breath)

  // Section 1: Tower Base (28x10)
  // Baby dragons fly overhead, wizards snipe from platforms, orcs patrol
  const s1 = section([
    '............................',
    '..............---...........',
    '..@.....................---.',
    '..##..---..........##.......',
    '..##..........---..##.......',
    '..##..VV..##.......##.......',
    '..##..VV..##..---..##..VV...',
    '..##..VV..##.......##..VV...',
    '..##..VV..##..SSS..##..VV...',
    '############################',
  ], [
    e(WZ, 10, 3), e(BD, 8, 0), e(FE, 20, 0), e(MO, 16, 4),
    e(MC, 24, 6), e(WZ, 18, 3), e(MO, 6, 6),
  ]);

  // Section 2: Alchemy Library (25x14) - flying eyes above, wizards on ledges, mimics hiding
  const s2 = section([
    '.........................',
    '..---................---.',
    '.........................',
    '.........---......---....',
    '..VV..##..........##..VV.',
    '..VV..##..---..##.##..VV.',
    '......##.......##.....VV.',
    '..##..##..VV...##..---...',
    '..##......VV........##...',
    '..##..---..VV..---..##...',
    '..##.......VV.......##...',
    '..##..##...VV..##...##...',
    '..##..##.SS.VV.##.SS.##..',
    '#########################',
  ], [
    e(WZ, 4, 1), e(BD, 16, 0), e(FE, 22, 0), e(MC, 10, 3),
    e(MO, 18, 3), e(WZ, 8, 5), e(FE, 14, 0),
    e(MC, 22, 7), e(BD, 6, 0), e(MO, 20, 9),
  ]);

  // Section 3: Tower Ascent (30x14) - dragons swoop, wizards on every level
  const s3 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..VV..##..........##..VV......',
    '..VV..##..---..##.##..VV......',
    '......##.......##.....VV......',
    '..##..##..VV...##..---........',
    '..##......VV........##..VV....',
    '..##..---..VV..---..##..VV....',
    '..##.......VV.......##..VV....',
    '..##..##...VV..##...##..##....',
    '..##..##.SS.VV.##.SS.##.##....',
    '##############################',
  ], [
    e(BD, 4, 0), e(FE, 24, 0), e(WZ, 14, 3), e(WZ, 22, 3),
    e(MO, 8, 4), e(MC, 10, 5), e(FE, 18, 0),
    e(BD, 6, 0), e(MO, 24, 7), e(WZ, 14, 9),
  ]);

  // Section 4: Rooftop (30x10) - open sky, dragon swarm + wizard snipers
  const s4 = section([
    '..............................',
    '..---........---........---...',
    '..............................',
    '.........---..........---.....',
    '..VV..##........VV........##..',
    '..VV..##..---...VV..---...##..',
    '..VV..##........VV........##..',
    '..VV..##..##....VV..##....##..',
    '..VV..##..##.SS.VV..##.SS.##..',
    '##############################',
  ], [
    e(BD, 4, 0), e(FE, 15, 0), e(BD, 24, 0), e(WZ, 10, 1),
    e(MO, 20, 3), e(MC, 6, 5), e(WZ, 22, 5),
    e(FE, 28, 0), e(MO, 14, 5),
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
  const KW = EnemyType.KOBOLD_WARRIOR;   // melee patrol
  const CY = EnemyType.CYCLOPS;          // ranged patrol (boulder throw)
  const SA = EnemyType.SATYR_ARCHER;     // ranged patrol (arrows)
  const GR = EnemyType.GRYPHON;          // flying dive chase
  const WW = EnemyType.WEREWOLF;         // melee chase (fast)

  // Section 1: Forest Approach (32x10)
  // Gryphon dive-bombs, archers & cyclops snipe from platforms, werewolves rush
  const s1 = section([
    '................................',
    '..............---...............',
    '..@.......................---...',
    '..##..---..........##...........',
    '..##..........---..##..---......',
    '..##..BB..##.......##...........',
    '..##..##..##..---..##..##..BB...',
    '..##..##..##.......##..##..##...',
    '..##..##..##..SSS..##..##..##...',
    '################################',
  ], [
    e(SA, 8, 1), e(GR, 18, 0), e(KW, 14, 4), e(CY, 22, 3),
    e(WW, 26, 3), e(KW, 6, 6), e(SA, 28, 6),
  ]);

  // Section 2: Cave Entrance (30x12) - cyclops on high ground, gryphon swoops
  const s2 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..BB..##..........##..BB......',
    '..##..##..---..##.##..##......',
    '......##.......##.....##......',
    '..##..##..BB...##..---........',
    '..##......##........##..BB....',
    '..##..---..##..---..##..##....',
    '..##.......##.......##..##....',
    '##############################',
  ], [
    e(CY, 4, 1), e(GR, 24, 0), e(SA, 14, 3), e(KW, 22, 3),
    e(WW, 8, 5), e(SA, 18, 5), e(KW, 26, 7),
    e(CY, 10, 7), e(WW, 20, 9),
  ]);

  // Section 3: Underground River (35x10) - gryphons above, ranged on platforms
  const s3 = section([
    '...................................',
    '..---........---........---........',
    '...................................',
    '.........---..........---..........',
    '..##..BB........BB........BB..##...',
    '..##..##..---...##..---...##..##...',
    '..##..##........##........##..##...',
    '..##..##..##....##..##....##..##...',
    '..##..##..##.SS.##..##.SS.##..##...',
    '###################################',
  ], [
    e(SA, 4, 1), e(GR, 15, 0), e(CY, 24, 1), e(WW, 10, 3),
    e(GR, 20, 0), e(KW, 6, 5), e(KW, 28, 5),
    e(WW, 16, 5), e(SA, 32, 3),
  ]);

  // Section 4: Deep Cave (30x12) - all types, heavy resistance
  const s4 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..BB..##..........##..BB......',
    '..##..##..---..##.##..##......',
    '......##.......##.....##......',
    '..##..##..BB...##..---........',
    '..##......##........##..BB....',
    '..##..---..##..---..##..##....',
    '..##.......##.......##..##....',
    '##############################',
  ], [
    e(GR, 4, 0), e(CY, 24, 1), e(WW, 14, 3), e(SA, 22, 3),
    e(KW, 8, 5), e(SA, 18, 5), e(WW, 26, 7),
    e(KW, 10, 7), e(CY, 20, 9),
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
  const SG = EnemyType.STONE_GOLEM;      // melee patrol (tanky)
  const CY = EnemyType.CYCLOPS;          // ranged patrol (boulder throw)
  const HA = EnemyType.HARPY;            // flying dive chase
  const GA = EnemyType.GARGOYLE;         // flying ambush dive
  const SK = EnemyType.SKELETON_WARRIOR;  // melee patrol

  // Section 1: Temple Entrance (32x10) - harpies swoop, cyclops snipes, golems block
  const s1 = section([
    '................................',
    '..............---...............',
    '..@.......................---...',
    '..##..---..BB.......BB..........',
    '..##.......##..---..##..##......',
    '..##..BB...##.......##..##......',
    '..##..##...##..---..##..##..BB..',
    '..##..##...##.......##..##..##..',
    '..##..##...##..SSS..##..##..##..',
    '################################',
  ], [
    e(CY, 8, 1), e(HA, 18, 0), e(GA, 14, 0), e(SG, 22, 4),
    e(SK, 10, 6), e(SK, 20, 6), e(GA, 28, 0),
  ]);

  // Section 2: Ruined Halls (30x12) - harpies above, cyclops on ledges
  const s2 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..BB..##..........##..BB......',
    '..##..##..---..##.##..##......',
    '......##.......##.....##......',
    '..##..##..BB...##..---........',
    '..##......##........##..BB....',
    '..##..---..##..---..##..##....',
    '..##.......##.......##..##....',
    '##############################',
  ], [
    e(CY, 4, 1), e(HA, 24, 0), e(SG, 14, 3), e(SK, 22, 3),
    e(GA, 8, 0), e(SK, 18, 5), e(SG, 26, 7),
    e(GA, 10, 0), e(HA, 20, 0),
  ]);

  // Section 3: Statue Gallery (30x10) - gargoyle ambushes from above
  const s3 = section([
    '..............................',
    '..---........---........---...',
    '..............................',
    '.........---..........---.....',
    '..BB..##........BB........##..',
    '..##..##..---...##..---...##..',
    '..##..##........##........##..',
    '..##..##..BB....##..BB....##..',
    '..##..##..##.SS.##..##.SS.##..',
    '##############################',
  ], [
    e(CY, 4, 1), e(HA, 15, 0), e(CY, 24, 1), e(GA, 10, 0),
    e(GA, 20, 0), e(SG, 6, 5), e(SK, 16, 5),
    e(SG, 28, 5), e(SK, 12, 7),
  ]);

  // Section 4: Snake Passage (30x12) - heavy resistance, all types
  const s4 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..BB..##..........##..BB......',
    '..##..##..---..##.##..##......',
    '......##.......##.....##......',
    '..##..##..BB...##..---........',
    '..##......##........##..BB....',
    '..##..---..##..---..##..##....',
    '..##.......##.......##..##....',
    '##############################',
  ], [
    e(SG, 4, 1), e(HA, 16, 0), e(CY, 24, 1), e(GA, 14, 0),
    e(SK, 22, 3), e(SG, 8, 5), e(GA, 18, 0),
    e(SK, 26, 7), e(HA, 10, 0), e(CY, 20, 9),
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
  const MT = EnemyType.MINOTAUR;         // melee charge (powerful)
  const PY = EnemyType.PYROMANCER;       // stationary ranged (fire blasts)
  const BD = EnemyType.BABY_DRAGON;      // flying ranged (fire breath)
  const SG = EnemyType.STONE_GOLEM;      // melee patrol (tanky)
  const HA = EnemyType.HARPY;            // flying dive chase

  // Section 1: Mountain Base (32x12) - dragons and harpies fly, pyromancers snipe
  const s1 = section([
    '................................',
    '..............---...............',
    '..@.......................---...',
    '..##..---..........##...........',
    '..##..........---..##..---......',
    '..##..VV..##.......##...........',
    '..##..VV..##..---..##..##..VV...',
    '..##..VV..##.......##..##..VV...',
    '..##..VV..##..BB...##..##..VV...',
    '..##..VV..##..##...##..##..VV...',
    '..##..VV..##..##.SS.##.##..VV...',
    '################################',
  ], [
    e(PY, 8, 1), e(BD, 18, 0), e(MT, 14, 4), e(HA, 22, 0),
    e(SG, 26, 3), e(BD, 6, 0), e(HA, 28, 0),
  ]);

  // Section 2: Cliffside Path (35x12) - both barriers, heavy air and ranged
  const s2 = section([
    '...................................',
    '..---....................---.......',
    '...................................',
    '.........---......---..............',
    '..VV..##..........##..VV..BB.......',
    '..VV..##..---..##.##..VV..##.......',
    '......##.......##.....VV..##.......',
    '..##..##..VV...##..---.............',
    '..##......VV........##..VV..BB.....',
    '..##..---..VV..---..##..VV..##.....',
    '..##.......VV.......##..VV..##.....',
    '###################################',
  ], [
    e(BD, 4, 0), e(PY, 24, 1), e(MT, 14, 3), e(SG, 22, 3),
    e(HA, 8, 0), e(BD, 18, 0), e(PY, 30, 4),
    e(MT, 10, 7), e(HA, 26, 0), e(SG, 20, 9),
  ]);

  // Section 3: Volcano Interior (30x14) - hardest interior, full mix
  const s3 = section([
    '..............................',
    '..---....................---..',
    '..............................',
    '.........---......---.........',
    '..VV..##..........##..VV......',
    '..VV..##..---..##.##..VV......',
    '......##.......##.....VV......',
    '..##..##..VV...##..---........',
    '..##......VV........##..BB....',
    '..##..---..VV..---..##..##....',
    '..##.......VV.......##..##....',
    '..##..##...VV..##...##..##....',
    '..##..##.SS.VV.##.SS.##.##....',
    '##############################',
  ], [
    e(BD, 4, 0), e(PY, 24, 0), e(MT, 14, 3), e(SG, 22, 3),
    e(HA, 8, 0), e(BD, 18, 0), e(PY, 10, 7),
    e(MT, 20, 7), e(SG, 26, 9), e(HA, 14, 0),
    e(BD, 6, 0),
  ]);

  // Section 4: Summit Gauntlet (35x10) - final rush, dragons and harpies everywhere
  const s4 = section([
    '...................................',
    '..---........---........---..---...',
    '...................................',
    '.........---..........---..........',
    '..BB..VV........BB..VV......BB..##.',
    '..##..VV..---...##..VV..---..##.##.',
    '..##..VV........##..VV......##.##..',
    '..##..VV..##....##..VV..##...##.##.',
    '..##..VV..##.SS.##..VV..##.SS.##.##',
    '###################################',
  ], [
    e(MT, 4, 1), e(PY, 15, 1), e(BD, 24, 0), e(SG, 32, 1),
    e(HA, 10, 0), e(MT, 20, 3), e(HA, 30, 0),
    e(PY, 6, 5), e(BD, 18, 0), e(SG, 28, 5),
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
