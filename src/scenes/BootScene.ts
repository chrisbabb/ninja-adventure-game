import Phaser from 'phaser';
import { SCENE_KEYS } from '../types';
import { EnemyType, BossType } from '../types';
import { ENEMY_CONFIGS, BOSS_CONFIGS, FORM_STATS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../constants';
import { FormType } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  create(): void {
    // Generate all placeholder textures procedurally
    this.generatePlayerTextures();
    this.generateEnemyTextures();
    this.generateBossTextures();
    this.generateTileTextures();
    this.generateProjectileTextures();
    this.generateUITextures();

    // Initialize registry defaults
    this.registry.set('musicVolume', 0.7);
    this.registry.set('sfxVolume', 0.8);

    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }

  private makeRect(key: string, w: number, h: number, color: number, outline?: number): void {
    const g = this.add.graphics();
    if (outline !== undefined) {
      g.fillStyle(outline, 1);
      g.fillRect(0, 0, w, h);
      g.fillStyle(color, 1);
      g.fillRect(2, 2, w - 4, h - 4);
    } else {
      g.fillStyle(color, 1);
      g.fillRect(0, 0, w, h);
    }
    g.generateTexture(key, w, h);
    g.destroy();
  }

  private makeCircle(key: string, radius: number, color: number): void {
    const g = this.add.graphics();
    g.fillStyle(color, 1);
    g.fillCircle(radius, radius, radius);
    g.generateTexture(key, radius * 2, radius * 2);
    g.destroy();
  }

  private generatePlayerTextures(): void {
    // Player base sprite - ninja silhouette shape
    const g = this.add.graphics();
    const color = 0x4488ff;

    // Body
    g.fillStyle(color, 1);
    g.fillRect(6, 4, 16, 20); // torso
    g.fillRect(4, 6, 20, 16); // wider mid

    // Head
    g.fillStyle(0x333355, 1);
    g.fillRect(9, 0, 10, 8);

    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(11, 2, 3, 2);
    g.fillRect(16, 2, 3, 2);

    // Legs
    g.fillStyle(color, 0.8);
    g.fillRect(7, 22, 5, 10);
    g.fillRect(16, 22, 5, 10);

    g.generateTexture('player', 28, 32);
    g.destroy();

    // Form-colored variants
    for (const form of Object.values(FormType)) {
      const stats = FORM_STATS[form];
      this.makeRect(`player_${form}`, 28, 32, stats.color, 0x222222);
    }
  }

  private generateEnemyTextures(): void {
    for (const [type, config] of Object.entries(ENEMY_CONFIGS)) {
      const g = this.add.graphics();

      // Body
      g.fillStyle(config.color, 1);
      g.fillRect(2, 2, config.width - 4, config.height - 4);

      // Outline
      g.lineStyle(2, 0x222222, 1);
      g.strokeRect(1, 1, config.width - 2, config.height - 2);

      // Eyes
      g.fillStyle(0xff0000, 1);
      const eyeY = Math.floor(config.height * 0.25);
      g.fillRect(Math.floor(config.width * 0.25), eyeY, 4, 3);
      g.fillRect(Math.floor(config.width * 0.6), eyeY, 4, 3);

      // Flying enemies get wings
      if (config.flying) {
        g.fillStyle(config.color, 0.5);
        g.fillTriangle(
          0, config.height * 0.3,
          -6, config.height * 0.1,
          4, config.height * 0.2,
        );
        g.fillTriangle(
          config.width, config.height * 0.3,
          config.width + 6, config.height * 0.1,
          config.width - 4, config.height * 0.2,
        );
      }

      g.generateTexture(`enemy_${type}`, config.width + 12, config.height);
      g.destroy();
    }
  }

  private generateBossTextures(): void {
    for (const [type, config] of Object.entries(BOSS_CONFIGS)) {
      const g = this.add.graphics();

      // Large intimidating shape
      g.fillStyle(config.color, 1);
      g.fillRect(4, 4, config.width - 8, config.height - 8);

      // Dark outline
      g.lineStyle(3, 0x111111, 1);
      g.strokeRect(2, 2, config.width - 4, config.height - 4);

      // Inner glow
      g.lineStyle(1, 0xffffff, 0.3);
      g.strokeRect(6, 6, config.width - 12, config.height - 12);

      // Menacing eyes
      g.fillStyle(0xff0000, 1);
      const eyeY = Math.floor(config.height * 0.2);
      g.fillRect(Math.floor(config.width * 0.2), eyeY, 6, 4);
      g.fillRect(Math.floor(config.width * 0.6), eyeY, 6, 4);

      // Crown / horn indicator for bosses
      g.fillStyle(0xffcc00, 1);
      g.fillTriangle(
        config.width * 0.3, 4,
        config.width * 0.35, -4,
        config.width * 0.4, 4,
      );
      g.fillTriangle(
        config.width * 0.6, 4,
        config.width * 0.65, -4,
        config.width * 0.7, 4,
      );

      g.generateTexture(`boss_${type}`, config.width, config.height + 8);
      g.destroy();
    }
  }

  private generateTileTextures(): void {
    // Solid tile
    this.makeRect('tile_solid', TILE_SIZE, TILE_SIZE, 0x556677, 0x334455);

    // Platform (one-way)
    const gPlat = this.add.graphics();
    gPlat.fillStyle(0x667788, 1);
    gPlat.fillRect(0, 0, TILE_SIZE, 8);
    gPlat.fillStyle(0x556677, 0.5);
    gPlat.fillRect(0, 8, TILE_SIZE, TILE_SIZE - 8);
    gPlat.generateTexture('tile_platform', TILE_SIZE, TILE_SIZE);
    gPlat.destroy();

    // Vine barrier (burnable)
    const gVine = this.add.graphics();
    gVine.fillStyle(0x228822, 1);
    gVine.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    for (let i = 0; i < 5; i++) {
      gVine.fillStyle(0x44aa44, 1);
      gVine.fillRect(4 + i * 6, 2, 3, TILE_SIZE - 4);
    }
    gVine.generateTexture('tile_vine', TILE_SIZE, TILE_SIZE);
    gVine.destroy();

    // Breakable block
    const gBreak = this.add.graphics();
    gBreak.fillStyle(0x887766, 1);
    gBreak.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    gBreak.lineStyle(2, 0x665544, 1);
    gBreak.lineBetween(0, TILE_SIZE / 2, TILE_SIZE, TILE_SIZE / 2);
    gBreak.lineBetween(TILE_SIZE / 2, 0, TILE_SIZE / 2, TILE_SIZE);
    gBreak.lineStyle(1, 0x998877, 0.5);
    gBreak.strokeRect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4);
    gBreak.generateTexture('tile_breakable', TILE_SIZE, TILE_SIZE);
    gBreak.destroy();

    // Spike hazard
    const gSpike = this.add.graphics();
    gSpike.fillStyle(0xcc4444, 1);
    for (let i = 0; i < 4; i++) {
      gSpike.fillTriangle(
        i * 8, TILE_SIZE,
        i * 8 + 4, 4,
        i * 8 + 8, TILE_SIZE,
      );
    }
    gSpike.generateTexture('tile_spike', TILE_SIZE, TILE_SIZE);
    gSpike.destroy();

    // Boss door
    this.makeRect('tile_boss_door', TILE_SIZE, TILE_SIZE * 2, 0x884422, 0x662211);

    // Background tiles
    this.makeRect('tile_bg', TILE_SIZE, TILE_SIZE, 0x1a1a2e);
    this.makeRect('tile_bg_detail', TILE_SIZE, TILE_SIZE, 0x22223a);
  }

  private generateProjectileTextures(): void {
    this.makeCircle('proj_shuriken', 4, 0xcccccc);
    this.makeRect('proj_arrow', 12, 3, 0x886644);
    this.makeCircle('proj_flame', 5, 0xff6622);
    this.makeCircle('proj_enemy', 5, 0xff4466);
    this.makeCircle('particle', 3, 0xffffff);
  }

  private generateUITextures(): void {
    // Health bar backgrounds
    this.makeRect('ui_health_bg', 100, 10, 0x333333);
    this.makeRect('ui_health_fill', 100, 10, 0x44cc44);
    this.makeRect('ui_health_fill_boss', 200, 12, 0xcc4444);
    this.makeRect('ui_boss_health_bg', 200, 12, 0x333333);

    // Button
    this.makeRect('ui_button', 160, 32, 0x445566, 0x334455);
    this.makeRect('ui_button_hover', 160, 32, 0x556677, 0x4488aa);

    // Panel
    this.makeRect('ui_panel', 200, 200, 0x222233, 0x445566);

    // Stage select portraits
    for (const [type, config] of Object.entries(BOSS_CONFIGS)) {
      this.makeRect(`stage_portrait_${type}`, 48, 48, config.color, 0x333333);
    }

    // Form icons
    for (const form of Object.values(FormType)) {
      const stats = FORM_STATS[form];
      this.makeRect(`form_icon_${form}`, 24, 24, stats.color, 0x222222);
    }
  }
}
