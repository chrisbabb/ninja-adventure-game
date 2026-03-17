import Phaser from 'phaser';
import { SCENE_KEYS } from '../types';
import { EnemyType, BossType } from '../types';
import { ENEMY_CONFIGS, ENEMY_SPRITE_DATA, BOSS_CONFIGS, FORM_STATS, GAME_WIDTH, GAME_HEIGHT, TILE_SIZE } from '../constants';
import { FormType } from '../types';

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENE_KEYS.BOOT);
  }

  preload(): void {
    // Load sprite sheets (will gracefully fall back to procedural if missing)
    this.load.spritesheet('player_idle_sheet', 'assets/player_idle.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player_run_sheet', 'assets/player_run.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player_jump_sheet', 'assets/player_jump.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player_attack1_sheet', 'assets/player_attack1.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player_attack2_sheet', 'assets/player_attack2.png', {
      frameWidth: 96,
      frameHeight: 96,
    });
    this.load.spritesheet('player_attack3_sheet', 'assets/player_attack3.png', {
      frameWidth: 96,
      frameHeight: 96,
    });

    // Load enemy sprite sheets
    for (const [type, spriteData] of Object.entries(ENEMY_SPRITE_DATA)) {
      for (const anim of spriteData.anims) {
        const sheetKey = `enemy_${type}_${anim.key}_sheet`;
        this.load.spritesheet(sheetKey, `assets/enemies/${type}/${anim.file}`, {
          frameWidth: spriteData.frameWidth,
          frameHeight: spriteData.frameHeight,
        });
      }
    }
  }

  create(): void {
    // Generate all placeholder textures procedurally
    this.generatePlayerTextures();
    this.generateEnemyTextures();
    this.generateBossTextures();
    this.generateTileTextures();
    this.generateProjectileTextures();
    this.generateUITextures();
    this.generatePickupTextures();

    // Create animations (from file or procedural fallback)
    this.createPlayerAnimations();
    this.createEnemyAnimations();

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

  private generatePickupTextures(): void {
    // Small health pickup - green cross
    const gHS = this.add.graphics();
    gHS.fillStyle(0x44cc44, 1);
    gHS.fillRect(3, 0, 4, 10);
    gHS.fillRect(0, 3, 10, 4);
    gHS.generateTexture('pickup_health_small', 10, 10);
    gHS.destroy();

    // Big health pickup - larger green cross with white border
    const gHB = this.add.graphics();
    gHB.fillStyle(0xffffff, 1);
    gHB.fillRect(3, 0, 8, 14);
    gHB.fillRect(0, 3, 14, 8);
    gHB.fillStyle(0x22ee22, 1);
    gHB.fillRect(4, 1, 6, 12);
    gHB.fillRect(1, 4, 12, 6);
    gHB.generateTexture('pickup_health_big', 14, 14);
    gHB.destroy();

    // Energy pickup - blue/cyan orb
    const gE = this.add.graphics();
    gE.fillStyle(0x4488ff, 1);
    gE.fillCircle(5, 5, 5);
    gE.fillStyle(0x88ccff, 0.7);
    gE.fillCircle(4, 3, 2);
    gE.generateTexture('pickup_energy', 10, 10);
    gE.destroy();
  }

  private generateUITextures(): void {
    // Health bar backgrounds
    this.makeRect('ui_health_bg', 100, 10, 0x333333);
    this.makeRect('ui_health_fill', 100, 10, 0x44cc44);
    this.makeRect('ui_energy_fill', 100, 10, 0x4488ff);
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

  private createPlayerAnimations(): void {
    // Use loaded spritesheet if available, otherwise generate procedural frames
    if (this.textures.exists('player_idle_sheet')) {
      this.anims.create({
        key: 'player_idle',
        frames: this.anims.generateFrameNumbers('player_idle_sheet', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: -1,
      });
    } else {
      // Generate 6-frame idle animation procedurally
      // Ninja character with purple hair, dark outfit, subtle bob
      this.generateProceduralIdleFrames();
    }

    // Run animation
    if (this.textures.exists('player_run_sheet')) {
      this.anims.create({
        key: 'player_run',
        frames: this.anims.generateFrameNumbers('player_run_sheet', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Jump animation
    if (this.textures.exists('player_jump_sheet')) {
      this.anims.create({
        key: 'player_jump',
        frames: this.anims.generateFrameNumbers('player_jump_sheet', { start: 0, end: 2 }),
        frameRate: 8,
        repeat: 0,
      });
    }

    // Attack combo animations
    if (this.textures.exists('player_attack1_sheet')) {
      this.anims.create({
        key: 'player_attack1',
        frames: this.anims.generateFrameNumbers('player_attack1_sheet', { start: 0, end: 5 }),
        frameRate: 14,
        repeat: 0,
      });
    }
    if (this.textures.exists('player_attack2_sheet')) {
      this.anims.create({
        key: 'player_attack2',
        frames: this.anims.generateFrameNumbers('player_attack2_sheet', { start: 0, end: 4 }),
        frameRate: 14,
        repeat: 0,
      });
    }
    if (this.textures.exists('player_attack3_sheet')) {
      this.anims.create({
        key: 'player_attack3',
        frames: this.anims.generateFrameNumbers('player_attack3_sheet', { start: 0, end: 4 }),
        frameRate: 14,
        repeat: 0,
      });
    }
  }

  private createEnemyAnimations(): void {
    for (const [type, spriteData] of Object.entries(ENEMY_SPRITE_DATA)) {
      for (const anim of spriteData.anims) {
        const sheetKey = `enemy_${type}_${anim.key}_sheet`;
        if (!this.textures.exists(sheetKey)) continue;

        this.anims.create({
          key: `enemy_${type}_${anim.key}`,
          frames: this.anims.generateFrameNumbers(sheetKey, { start: 0, end: anim.frames - 1 }),
          frameRate: anim.frameRate,
          repeat: anim.repeat,
        });
      }
    }
  }

  private generateProceduralIdleFrames(): void {
    const frameCount = 5;
    const w = 96, h = 96;
    // Subtle vertical bob offsets per frame (breathing cycle)
    const bobOffsets = [0, -1, -1, 0, 1];

    for (let f = 0; f < frameCount; f++) {
      const g = this.add.graphics();
      const bob = bobOffsets[f];

      // -- Hair (purple, spiky) --
      g.fillStyle(0x6633aa, 1);
      g.fillRect(10, 2 + bob, 14, 7);   // hair base
      g.fillRect(8, 4 + bob, 3, 4);     // left spike
      g.fillRect(21, 1 + bob, 4, 5);    // right spike up
      g.fillRect(18, 0 + bob, 3, 4);    // top spike
      g.fillStyle(0x8844cc, 1);
      g.fillRect(12, 3 + bob, 10, 4);   // hair highlight

      // -- Face --
      g.fillStyle(0xffccaa, 1);
      g.fillRect(11, 7 + bob, 10, 7);   // face
      // Eyes
      g.fillStyle(0x220022, 1);
      g.fillRect(13, 9 + bob, 2, 2);    // left eye
      g.fillRect(18, 9 + bob, 2, 2);    // right eye

      // -- Body (dark outfit) --
      g.fillStyle(0x222244, 1);
      g.fillRect(10, 14 + bob, 12, 8);  // torso
      g.fillStyle(0x333366, 1);
      g.fillRect(11, 15 + bob, 10, 6);  // torso detail

      // -- Belt/sash accent --
      g.fillStyle(0xcc6633, 1);
      g.fillRect(10, 19 + bob, 12, 2);  // orange belt

      // -- Arms --
      g.fillStyle(0x222244, 1);
      g.fillRect(7, 15 + bob, 3, 6);    // left arm
      g.fillRect(22, 15 + bob, 3, 6);   // right arm
      // Hands
      g.fillStyle(0xffccaa, 1);
      g.fillRect(7, 20 + bob, 3, 2);    // left hand
      g.fillRect(22, 20 + bob, 3, 2);   // right hand

      // -- Legs --
      g.fillStyle(0x222244, 1);
      g.fillRect(11, 22 + bob, 4, 6);   // left leg
      g.fillRect(17, 22 + bob, 4, 6);   // right leg
      // Boots
      g.fillStyle(0x333355, 1);
      g.fillRect(10, 27 + bob, 5, 3);   // left boot
      g.fillRect(17, 27 + bob, 5, 3);   // right boot

      g.generateTexture(`player_idle_f${f}`, w, h);
      g.destroy();
    }

    // Create animation from individual frame textures
    this.anims.create({
      key: 'player_idle',
      frames: Array.from({ length: frameCount }, (_, i) => ({
        key: `player_idle_f${i}`,
        frame: 0,
      })),
      frameRate: 8,
      repeat: -1,
    });
  }
}
