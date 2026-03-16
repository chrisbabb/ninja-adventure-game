import Phaser from 'phaser';
import { StageId, EnemyType } from '../types';
import { TILE_SIZE, STAGE_CONFIGS, DEPTH } from '../constants';
import { LevelSection, T, generateLevel, getSectionWorldOffset, getTotalLevelWidth, getTotalLevelHeight } from './LevelData';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { createEnemy } from '../entities/enemies/EnemyFactory';

export class LevelManager {
  private scene: Phaser.Scene;
  private stageId: StageId;
  private sections: LevelSection[] = [];

  // Tile groups
  solidTiles!: Phaser.Physics.Arcade.StaticGroup;
  platformTiles!: Phaser.Physics.Arcade.StaticGroup;
  spikeTiles!: Phaser.Physics.Arcade.StaticGroup;
  vineTiles!: Phaser.Physics.Arcade.StaticGroup;
  breakableTiles!: Phaser.Physics.Arcade.StaticGroup;
  bossDoorTiles!: Phaser.Physics.Arcade.StaticGroup;

  // Enemies
  enemies: BaseEnemy[] = [];

  // Spawn points
  playerSpawn: { x: number; y: number } = { x: 64, y: 100 };
  bossSpawn: { x: number; y: number } = { x: 400, y: 100 };
  bossRoomBounds: { left: number; right: number; top: number; bottom: number } | null = null;

  worldWidth: number = 0;
  worldHeight: number = 0;

  constructor(scene: Phaser.Scene, stageId: StageId) {
    this.scene = scene;
    this.stageId = stageId;
  }

  build(healthMult: number = 1, damageMult: number = 1, speedMult: number = 1): void {
    this.sections = generateLevel(this.stageId);
    const stageConfig = STAGE_CONFIGS[this.stageId];

    this.worldWidth = getTotalLevelWidth(this.sections);
    this.worldHeight = getTotalLevelHeight(this.sections);

    // Create static groups
    this.solidTiles = this.scene.physics.add.staticGroup();
    this.platformTiles = this.scene.physics.add.staticGroup();
    this.spikeTiles = this.scene.physics.add.staticGroup();
    this.vineTiles = this.scene.physics.add.staticGroup();
    this.breakableTiles = this.scene.physics.add.staticGroup();
    this.bossDoorTiles = this.scene.physics.add.staticGroup();

    // Background
    const bg = this.scene.add.rectangle(
      this.worldWidth / 2, this.worldHeight / 2,
      this.worldWidth, this.worldHeight,
      stageConfig.bgColor,
    );
    bg.setDepth(DEPTH.BG);

    // Build tiles for each section
    this.sections.forEach((section, sIdx) => {
      const offset = getSectionWorldOffset(this.sections, sIdx);

      for (let r = 0; r < section.tiles.length; r++) {
        for (let c = 0; c < section.tiles[r].length; c++) {
          const tileType = section.tiles[r][c];
          const x = offset.x + c * TILE_SIZE + TILE_SIZE / 2;
          const y = r * TILE_SIZE + TILE_SIZE / 2;

          switch (tileType) {
            case T.SOLID:
              this.addTile(this.solidTiles, x, y, 'tile_solid', stageConfig.tileColor);
              break;
            case T.PLATFORM:
              this.addTile(this.platformTiles, x, y, 'tile_platform');
              break;
            case T.SPIKE:
              this.addTile(this.spikeTiles, x, y, 'tile_spike');
              break;
            case T.VINE:
              this.addTile(this.vineTiles, x, y, 'tile_vine');
              break;
            case T.BREAKABLE:
              this.addTile(this.breakableTiles, x, y, 'tile_breakable');
              break;
            case T.PLAYER_SPAWN:
              this.playerSpawn = { x, y };
              break;
            case T.BOSS_DOOR:
              this.addTile(this.bossDoorTiles, x, y, 'tile_boss_door', 0x884422);
              break;
            case T.BOSS_SPAWN:
              this.bossSpawn = { x, y };
              break;
          }
        }
      }

      // Spawn enemies
      section.enemies.forEach(spawn => {
        const ex = offset.x + spawn.col * TILE_SIZE + TILE_SIZE / 2;
        const ey = spawn.row * TILE_SIZE + TILE_SIZE / 2;
        const enemy = createEnemy(this.scene, ex, ey, spawn.type, healthMult, damageMult, speedMult);
        this.enemies.push(enemy);
      });

      // Record boss room bounds
      if (section.isBossRoom) {
        this.bossRoomBounds = {
          left: offset.x + TILE_SIZE,
          right: offset.x + section.tiles[0].length * TILE_SIZE - TILE_SIZE,
          top: TILE_SIZE,
          bottom: section.tiles.length * TILE_SIZE - TILE_SIZE * 2,
        };
      }
    });
  }

  private addTile(
    group: Phaser.Physics.Arcade.StaticGroup,
    x: number, y: number,
    texture: string,
    tint?: number,
  ): Phaser.Physics.Arcade.Sprite {
    const tile = group.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
    tile.setDisplaySize(TILE_SIZE, TILE_SIZE);
    tile.setDepth(DEPTH.TILES);
    if (tint) tile.setTint(tint);
    tile.refreshBody();
    return tile;
  }

  openBossDoor(): void {
    this.bossDoorTiles.children.each(child => {
      const tile = child as Phaser.Physics.Arcade.Sprite;
      // Door opening particles
      const particles = this.scene.add.particles(tile.x, tile.y, 'particle', {
        speed: { min: 40, max: 120 },
        lifespan: 500,
        quantity: 6,
        scale: { start: 1, end: 0 },
        tint: 0xffdd44,
      });
      this.scene.time.delayedCall(600, () => particles.destroy());
      tile.destroy();
      return true;
    });
  }

  destroyVineTile(tile: Phaser.Physics.Arcade.Sprite): void {
    // Burn effect
    const particles = this.scene.add.particles(tile.x, tile.y, 'particle', {
      speed: { min: 30, max: 80 },
      lifespan: 300,
      quantity: 6,
      scale: { start: 1, end: 0 },
      tint: 0xff6622,
    });
    this.scene.time.delayedCall(400, () => particles.destroy());
    tile.destroy();
  }

  destroyBreakableTile(tile: Phaser.Physics.Arcade.Sprite): void {
    // Crumble effect
    const particles = this.scene.add.particles(tile.x, tile.y, 'particle', {
      speed: { min: 40, max: 120 },
      lifespan: 400,
      quantity: 8,
      scale: { start: 1, end: 0 },
      tint: 0x887766,
    });
    this.scene.time.delayedCall(500, () => particles.destroy());
    tile.destroy();
  }
}
