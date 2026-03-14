import Phaser from 'phaser';
import { SCENES } from '../constants';

/**
 * BootScene – draws every game texture procedurally.
 * No external art files needed.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.BOOT }); }

  create(): void {
    this.makeBackground();
    this.makePlayerTextures();
    this.makeEnemyTextures();
    this.makeTileTextures();
    this.makeProjectileTextures();
    this.makeUITextures();
    this.scene.start(SCENES.TITLE);
  }

  // ── helpers ────────────────────────────────────────────────────────────────

  /** Create a disposable Graphics object (not added to display list). */
  private g(): Phaser.GameObjects.Graphics {
    return this.make.graphics({ x: 0, y: 0 });
  }

  /** Shade a hex color darker or lighter by `amount` (-100..100). */
  private shade(hex: number, amount: number): number {
    const c = Phaser.Display.Color.ValueToColor(hex);
    return amount > 0 ? c.lighten(amount).color : c.darken(-amount).color;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // BACKGROUNDS
  // ══════════════════════════════════════════════════════════════════════════

  private makeBackground(): void {
    // Sky – deep indigo gradient
    {
      const g = this.g();
      g.fillGradientStyle(0x0a0618, 0x0a0618, 0x1e1250, 0x1e1250, 1);
      g.fillRect(0, 0, 960, 540);
      // Stars
      const rng = new Phaser.Math.RandomDataGenerator(['ss']);
      g.fillStyle(0xffffff);
      for (let i = 0; i < 160; i++) {
        const sx = rng.integerInRange(0, 960);
        const sy = rng.integerInRange(0, 340);
        const sr = rng.pick([1, 1, 1, 2]);
        g.fillRect(sx, sy, sr, sr);
      }
      // Moon
      g.fillStyle(0xffe8b0);
      g.fillCircle(860, 70, 28);
      g.fillStyle(0x0a0618);
      g.fillCircle(872, 62, 22); // crescent cutout
      g.generateTexture('bg_sky', 960, 540);
      g.destroy();
    }

    // Mid-ground silhouette strip – pagoda outlines
    {
      const W = 400, H = 280;
      const g = this.g();
      g.fillStyle(0x110a2a, 0.85);

      // Draw a pagoda shape
      const drawPagoda = (ox: number, oy: number, scale: number) => {
        const w = 60 * scale, h = 120 * scale;
        // Main tower
        g.fillRect(ox - w * 0.2, oy - h, w * 0.4, h);
        // Tiered roofs (3)
        for (let t = 0; t < 3; t++) {
          const ry   = oy - h * (0.3 + t * 0.33);
          const rw   = (w * 0.7) * (1 - t * 0.18);
          const rh   = h * 0.06;
          g.fillRect(ox - rw / 2, ry - rh, rw, rh);
          // Upturned corners
          g.fillTriangle(ox - rw / 2, ry, ox - rw / 2 - 14 * scale, ry - 8 * scale, ox - rw / 2 + 2 * scale, ry - 8 * scale);
          g.fillTriangle(ox + rw / 2, ry, ox + rw / 2 + 14 * scale, ry - 8 * scale, ox + rw / 2 - 2 * scale, ry - 8 * scale);
        }
        // Spire
        g.fillTriangle(ox - 4 * scale, oy - h, ox + 4 * scale, oy - h, ox, oy - h - 20 * scale);
      };

      drawPagoda(80,  H, 1.0);
      drawPagoda(220, H, 0.7);
      drawPagoda(340, H, 1.2);

      // Ground silhouette at bottom
      g.fillStyle(0x0c0820, 0.9);
      g.fillRect(0, H - 20, W, 40);

      g.generateTexture('bg_pagoda', W, H);
      g.destroy();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PLAYER TEXTURES
  // ══════════════════════════════════════════════════════════════════════════

  private makePlayerTextures(): void {
    this.drawBaseNinja();
    this.drawFlameRonin();
    this.drawStoneGuard();
    this.drawSkyTengu();
    this.drawAttackBox();
    this.drawStealRing();
  }

  private drawBaseNinja(): void {
    const W = 28, H = 48;
    const g = this.g();

    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(W / 2, H - 2, 22, 6);

    // Legs
    g.fillStyle(0x12102a);
    g.fillRect(5, 34, 7, 14);
    g.fillRect(16, 34, 7, 14);
    // Leg wraps
    g.fillStyle(0x2a2660, 0.6);
    g.fillRect(5, 37, 7, 3);
    g.fillRect(16, 37, 7, 3);
    g.fillRect(5, 43, 7, 3);
    g.fillRect(16, 43, 7, 3);

    // Body
    g.fillStyle(0x1c1836);
    g.fillRect(4, 16, 20, 20);
    // Chest highlight
    g.fillStyle(0x2e2a54, 0.7);
    g.fillRect(6, 17, 8, 10);

    // Scarf (red, flowing)
    g.fillStyle(0xcc1111);
    g.fillRect(3, 14, 22, 5);
    // Scarf tail
    g.fillStyle(0xaa0000);
    g.fillRect(2, 19, 6, 8);
    g.fillRect(1, 27, 4, 6);

    // Belt
    g.fillStyle(0x4a3800);
    g.fillRect(4, 28, 20, 4);
    g.fillStyle(0xaa8800);
    g.fillRect(11, 28, 6, 4); // buckle

    // Right arm (sword arm)
    g.fillStyle(0x1c1836);
    g.fillRect(22, 18, 6, 14);
    // Left arm
    g.fillRect(0, 18, 6, 12);

    // Sword (right side, at hip)
    g.fillStyle(0x888899);
    g.fillRect(24, 28, 3, 14); // blade
    g.fillStyle(0x5a3a00);
    g.fillRect(23, 26, 5, 4);  // hilt
    g.fillStyle(0xccaa44);
    g.fillRect(22, 27, 7, 2);  // guard

    // Head (mask)
    g.fillStyle(0xdde8f0); // pale mask
    g.fillRect(6, 2, 16, 14);
    // Mask seam
    g.fillStyle(0xaab8c4);
    g.fillRect(6, 8, 16, 2);
    // Eyes (narrow slits)
    g.fillStyle(0x1a1030);
    g.fillRect(8, 5, 4, 2);
    g.fillRect(16, 5, 4, 2);
    // Eye glow
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(9, 5, 2, 1);
    g.fillRect(17, 5, 2, 1);
    // Headband
    g.fillStyle(0xcc1111);
    g.fillRect(5, 1, 18, 3);
    // Knot
    g.fillStyle(0xaa0000);
    g.fillRect(22, 0, 4, 4);
    g.fillRect(23, 4, 3, 4);

    g.generateTexture('player_base', W, H);
    g.destroy();
  }

  private drawFlameRonin(): void {
    const W = 30, H = 50;
    const g = this.g();

    // Flame aura base (glow behind)
    g.fillStyle(0xff6600, 0.18);
    g.fillEllipse(W / 2, H / 2, W + 10, H + 8);

    // Legs
    g.fillStyle(0x550000);
    g.fillRect(4, 34, 8, 16);
    g.fillRect(18, 34, 8, 16);
    // Leg armor plates
    g.fillStyle(0x8b0000);
    g.fillRect(4, 34, 8, 6);
    g.fillRect(18, 34, 8, 6);
    g.fillStyle(0xcc2200);
    g.fillRect(5, 35, 6, 4);
    g.fillRect(19, 35, 6, 4);

    // Body/armor
    g.fillStyle(0x8b0000);
    g.fillRect(3, 15, 24, 22);
    // Chest armor face
    g.fillStyle(0xaa1100);
    g.fillRect(5, 16, 20, 18);
    // Chest detail lines
    g.fillStyle(0xff4400, 0.5);
    g.fillRect(10, 18, 10, 2);
    g.fillRect(10, 22, 10, 2);
    g.fillRect(10, 26, 10, 2);
    // Center crest (flame emblem)
    g.fillStyle(0xff8800);
    g.fillTriangle(15, 15, 12, 22, 18, 22);
    g.fillStyle(0xffcc00);
    g.fillTriangle(15, 17, 13, 22, 17, 22);

    // Shoulder plates (pauldrons)
    g.fillStyle(0xaa1100);
    g.fillRect(0, 14, 8, 10);
    g.fillRect(22, 14, 8, 10);
    g.fillStyle(0xff4400, 0.4);
    g.fillRect(1, 15, 6, 7);
    g.fillRect(23, 15, 6, 7);

    // Arms
    g.fillStyle(0x8b0000);
    g.fillRect(0, 22, 5, 12);
    g.fillRect(25, 22, 5, 10);

    // Flaming katana (right side)
    g.fillStyle(0x888899);
    g.fillRect(27, 14, 2, 26); // blade
    g.fillStyle(0xffaa00, 0.8); // flame on blade
    g.fillTriangle(27, 14, 29, 14, 28, 8);
    g.fillTriangle(27, 18, 29, 18, 28, 12);
    g.fillStyle(0x5a3a00);
    g.fillRect(26, 30, 4, 5); // hilt
    g.fillStyle(0xffcc44);
    g.fillRect(25, 29, 6, 2); // guard

    // Sash / belt
    g.fillStyle(0x330000);
    g.fillRect(3, 34, 24, 4);
    g.fillStyle(0xff6600);
    g.fillRect(11, 34, 8, 4); // center sash accent

    // Neck / collar flame
    g.fillStyle(0xff6600, 0.6);
    g.fillTriangle(10, 15, 15, 10, 20, 15);

    // Head (oni mask – red with horns)
    g.fillStyle(0xdd2200);
    g.fillRect(6, 1, 18, 14);
    // Mask horns
    g.fillStyle(0xffaa00);
    g.fillTriangle(6, 3, 3, -4, 9, 3);
    g.fillTriangle(24, 3, 27, -4, 21, 3);
    // Mask markings
    g.fillStyle(0xff8800, 0.7);
    g.fillRect(7, 4, 4, 2);
    g.fillRect(19, 4, 4, 2);
    // Eyes (fierce)
    g.fillStyle(0xffee00);
    g.fillRect(8, 6, 5, 3);
    g.fillRect(17, 6, 5, 3);
    g.fillStyle(0xff3300);
    g.fillRect(9, 7, 3, 2);
    g.fillRect(18, 7, 3, 2);
    // Snarl line
    g.fillStyle(0x330000);
    g.fillRect(10, 11, 10, 2);
    g.fillRect(12, 13, 2, 2);
    g.fillRect(16, 13, 2, 2);

    g.generateTexture('player_flame_ronin', W, H);
    g.destroy();
  }

  private drawStoneGuard(): void {
    const W = 36, H = 52;
    const g = this.g();

    // Legs (thick, armored)
    g.fillStyle(0x3a3a4a);
    g.fillRect(4, 34, 12, 18);
    g.fillRect(20, 34, 12, 18);
    // Leg armor
    g.fillStyle(0x5a5a70);
    g.fillRect(4, 34, 12, 8);
    g.fillRect(20, 34, 12, 8);
    g.fillStyle(0x7a7a90, 0.7);
    g.fillRect(5, 35, 10, 6);
    g.fillRect(21, 35, 10, 6);
    // Greaves
    g.fillStyle(0x4a4a5e);
    g.fillRect(4, 44, 12, 8);
    g.fillRect(20, 44, 12, 8);

    // Body / heavy breastplate
    g.fillStyle(0x4a4a5a);
    g.fillRect(2, 14, 32, 24);
    // Breastplate face
    g.fillStyle(0x6a6a7e);
    g.fillRect(4, 15, 28, 20);
    // Plate ridges
    g.fillStyle(0x8a8aa0, 0.5);
    g.fillRect(4, 20, 28, 3);
    g.fillRect(4, 28, 28, 3);
    // Center emblem (diamond/earth)
    g.fillStyle(0x2244aa);
    g.fillRect(13, 18, 10, 10);
    g.fillStyle(0x4466cc);
    g.fillRect(15, 20, 6, 6);

    // Massive shoulder plates
    g.fillStyle(0x5a5a6e);
    g.fillRect(-2, 12, 14, 14);
    g.fillRect(24, 12, 14, 14);
    // Shoulder highlight
    g.fillStyle(0x8888a0, 0.5);
    g.fillRect(-1, 13, 10, 6);
    g.fillRect(25, 13, 10, 6);
    // Shoulder rivets
    g.fillStyle(0xaaaacc);
    g.fillRect(0, 19, 3, 3);
    g.fillRect(6, 19, 3, 3);
    g.fillRect(27, 19, 3, 3);
    g.fillRect(33, 19, 3, 3);

    // Arms (gauntlets)
    g.fillStyle(0x4a4a5a);
    g.fillRect(-2, 24, 7, 14);
    g.fillRect(31, 24, 7, 14);
    // Gauntlet details
    g.fillStyle(0x6a6a7e);
    g.fillRect(-1, 30, 5, 6);
    g.fillRect(32, 30, 5, 6);

    // Massive hammer (right side, vertical)
    g.fillStyle(0x555568);
    g.fillRect(34, 10, 5, 22); // handle
    g.fillStyle(0x6a6a80);
    g.fillRect(32, 6, 9, 12);  // hammerhead
    g.fillStyle(0x888899);
    g.fillRect(33, 7, 7, 10);  // face
    g.fillStyle(0x4a4a58);
    g.fillRect(32, 14, 9, 4);  // band

    // Belt / waist
    g.fillStyle(0x2a2a38);
    g.fillRect(2, 35, 32, 5);
    g.fillStyle(0x4466cc);
    g.fillRect(13, 36, 10, 3); // buckle

    // Neck
    g.fillStyle(0x5a5a6e);
    g.fillRect(13, 10, 10, 6);

    // Head (heavy sallet helmet)
    g.fillStyle(0x5a5a70);
    g.fillRect(6, -2, 24, 16); // helmet shell
    g.fillStyle(0x3a3a50);
    g.fillRect(6, 10, 24, 6);  // visor area
    // Visor slit
    g.fillStyle(0x2244aa);
    g.fillRect(8, 11, 20, 3);
    g.fillStyle(0x88aaff, 0.8);
    g.fillRect(9, 11, 18, 2);
    // Helmet ridge
    g.fillStyle(0x8888a0);
    g.fillRect(16, -4, 4, 14); // top fin
    // Cheek guards
    g.fillStyle(0x4a4a60);
    g.fillRect(6, 10, 5, 8);
    g.fillRect(25, 10, 5, 8);

    g.generateTexture('player_stone_guard', W, H);
    g.destroy();
  }

  private drawSkyTengu(): void {
    const W = 40, H = 50;
    const g = this.g();

    // Wing glow aura
    g.fillStyle(0x00aaff, 0.1);
    g.fillEllipse(W / 2, H / 2, W + 20, H + 10);

    // Wings (behind body)
    g.fillStyle(0x0a3d5c);
    // Left wing
    g.fillTriangle(2, 20, -12, 38, 8, 40);
    g.fillTriangle(2, 18, -8, 12, 12, 22);
    // Right wing
    g.fillTriangle(38, 20, 52, 38, 32, 40);
    g.fillTriangle(38, 18, 48, 12, 28, 22);
    // Wing feather lines
    g.fillStyle(0x1a6a8a, 0.6);
    g.fillRect(-10, 26, 14, 2);
    g.fillRect(-6, 30, 12, 2);
    g.fillRect(-4, 34, 10, 2);
    g.fillRect(36, 26, 14, 2);
    g.fillRect(34, 30, 12, 2);
    g.fillRect(34, 34, 10, 2);

    // Legs / tabi boots
    g.fillStyle(0x082840);
    g.fillRect(11, 36, 7, 14);
    g.fillRect(22, 36, 7, 14);
    g.fillStyle(0x0a3d5c);
    g.fillRect(11, 42, 8, 8); // boot
    g.fillRect(22, 42, 8, 8);

    // Flowing robe body
    g.fillStyle(0x082840);
    g.fillRect(8, 16, 24, 24);
    // Robe inner
    g.fillStyle(0x0d4060);
    g.fillRect(10, 17, 20, 20);
    // Robe front opening
    g.fillStyle(0x0a2d48);
    g.fillTriangle(20, 16, 16, 36, 24, 36);
    // Robe sash
    g.fillStyle(0x00aaff, 0.8);
    g.fillRect(8, 30, 24, 4);
    g.fillStyle(0x88ddff, 0.7);
    g.fillRect(17, 30, 6, 4);
    // Robe feather trim
    g.fillStyle(0x1a6a8a, 0.6);
    g.fillRect(8, 36, 6, 4);
    g.fillRect(26, 36, 6, 4);

    // Arms / wide sleeves
    g.fillStyle(0x082840);
    g.fillRect(3, 18, 8, 14);
    g.fillRect(29, 18, 8, 14);
    // Sleeve hem
    g.fillStyle(0x00aaff, 0.6);
    g.fillRect(3, 29, 8, 3);
    g.fillRect(29, 29, 8, 3);

    // Neck/collar
    g.fillStyle(0x0a3d5c);
    g.fillRect(14, 12, 12, 6);

    // Feather collar
    g.fillStyle(0x1a6a8a);
    for (let i = 0; i < 5; i++) {
      g.fillTriangle(10 + i * 5, 14, 12 + i * 5, 8, 14 + i * 5, 14);
    }

    // Head (tengu mask – long nose)
    g.fillStyle(0x8acfea);
    g.fillRect(12, 0, 16, 14);
    // Mask shape (angular)
    g.fillStyle(0xaadff5);
    g.fillRect(13, 1, 14, 12);
    // Long tengu nose
    g.fillStyle(0x8acfea);
    g.fillTriangle(16, 8, 24, 8, 26, 12);
    g.fillStyle(0x70b8da);
    g.fillTriangle(17, 9, 23, 9, 25, 12);
    // Eyes (narrow, intense)
    g.fillStyle(0x001020);
    g.fillRect(13, 4, 5, 2);
    g.fillRect(22, 4, 5, 2);
    g.fillStyle(0x00ccff, 0.9);
    g.fillRect(14, 4, 3, 1);
    g.fillRect(23, 4, 3, 1);
    // Headdress
    g.fillStyle(0x0a3d5c);
    g.fillRect(11, -1, 18, 3);
    g.fillStyle(0x00aaff);
    g.fillTriangle(20, -6, 17, 0, 23, 0);
    g.fillStyle(0x88ddff);
    g.fillTriangle(20, -4, 18, 0, 22, 0);

    g.generateTexture('player_sky_tengu', W, H);
    g.destroy();
  }

  private drawAttackBox(): void {
    const g = this.g();
    g.fillStyle(0xffffff, 0.0);
    g.fillRect(0, 0, 52, 32);
    g.generateTexture('attack_box', 52, 32);
    g.destroy();
  }

  private drawStealRing(): void {
    const g = this.g();
    for (let r = 40; r >= 32; r -= 2) {
      const a = 0.9 * (r - 32) / 8;
      g.lineStyle(3, 0xffee44, a);
      g.strokeCircle(40, 40, r);
    }
    g.generateTexture('steal_ring', 80, 80);
    g.destroy();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ENEMY TEXTURES
  // ══════════════════════════════════════════════════════════════════════════

  private makeEnemyTextures(): void {
    this.drawLanternSoldier();
    this.drawBeetleSamurai();
    this.drawCrowNinja();
    this.drawGeneralEmberclaw();
    this.drawStaggerStar();
  }

  private drawLanternSoldier(): void {
    const W = 28, H = 50;
    const g = this.g();

    // Legs
    g.fillStyle(0x7a3300);
    g.fillRect(5, 34, 8, 16);
    g.fillRect(15, 34, 8, 16);
    // Leg wraps
    g.fillStyle(0xaa5500, 0.5);
    g.fillRect(5, 36, 8, 3);
    g.fillRect(15, 36, 8, 3);

    // Body armor
    g.fillStyle(0x8b3a00);
    g.fillRect(4, 16, 20, 20);
    g.fillStyle(0xcc5500);
    g.fillRect(6, 17, 16, 16);
    // Flame emblem on chest
    g.fillStyle(0xff9900);
    g.fillTriangle(14, 18, 11, 26, 17, 26);
    g.fillStyle(0xffee00);
    g.fillTriangle(14, 20, 12, 25, 16, 25);
    // Shoulder pieces
    g.fillStyle(0x7a3300);
    g.fillRect(0, 14, 6, 8);
    g.fillRect(22, 14, 6, 8);

    // Arms
    g.fillStyle(0x8b3a00);
    g.fillRect(0, 20, 5, 12);
    g.fillRect(23, 20, 5, 12);

    // Spear / polearm
    g.fillStyle(0x5a3a00);
    g.fillRect(25, 2, 3, 36); // shaft
    g.fillStyle(0x888899);
    g.fillRect(24, 0, 5, 8);  // spearhead
    g.fillStyle(0xaaaacc);
    g.fillRect(25, 0, 3, 6);  // blade highlight

    // Belt
    g.fillStyle(0x4a2200);
    g.fillRect(4, 33, 20, 4);
    g.fillStyle(0xff8800);
    g.fillRect(10, 33, 8, 4);

    // LANTERN HEAD (the signature feature)
    // Outer lantern frame
    g.fillStyle(0xff8800);
    g.fillRect(6, -2, 16, 18);
    // Lantern glow
    g.fillStyle(0xffee00, 0.9);
    g.fillRect(8, 0, 12, 14);
    // Inner bright core
    g.fillStyle(0xffffff, 0.8);
    g.fillRect(10, 2, 8, 8);
    // Lantern frame bars
    g.fillStyle(0x884400);
    g.fillRect(6, 6, 16, 2);  // horizontal bar
    g.fillRect(13, -2, 2, 18); // vertical bar
    // Lantern top cap
    g.fillStyle(0x554400);
    g.fillRect(8, -4, 12, 4);
    g.fillRect(10, -7, 8, 4);
    g.fillRect(12, -10, 4, 4);
    // Flame wisps at top
    g.fillStyle(0xff6600, 0.7);
    g.fillTriangle(12, -10, 10, -16, 14, -14);
    g.fillTriangle(15, -10, 13, -16, 17, -14);
    // Eyes visible through lantern
    g.fillStyle(0xff3300);
    g.fillRect(9, 4, 4, 3);
    g.fillRect(15, 4, 4, 3);

    g.generateTexture('enemy_lantern', W, H + 16);
    g.destroy();
  }

  private drawBeetleSamurai(): void {
    const W = 34, H = 52;
    const g = this.g();

    // Thick legs
    g.fillStyle(0x1d3a1a);
    g.fillRect(4, 36, 10, 16);
    g.fillRect(20, 36, 10, 16);
    // Leg armor
    g.fillStyle(0x2d5a27);
    g.fillRect(4, 36, 10, 8);
    g.fillRect(20, 36, 10, 8);

    // SHELL (the signature feature – rounded beetle elytra)
    g.fillStyle(0x1a3d17);
    g.fillEllipse(17, 24, 28, 26);
    // Shell sheen
    g.fillStyle(0x2d6628, 0.6);
    g.fillEllipse(14, 18, 14, 12);
    // Shell wing line (center seam)
    g.fillStyle(0x0f2a0d);
    g.fillRect(16, 12, 2, 22);
    // Shell spots
    g.fillStyle(0x336b2e, 0.7);
    g.fillCircle(11, 22, 3);
    g.fillCircle(23, 22, 3);
    g.fillCircle(11, 30, 3);
    g.fillCircle(23, 30, 3);

    // Body behind shell
    g.fillStyle(0x2d5a27);
    g.fillRect(5, 14, 24, 26);

    // Shoulder guards
    g.fillStyle(0x1d3a1a);
    g.fillRect(0, 14, 8, 10);
    g.fillRect(26, 14, 8, 10);
    g.fillStyle(0x2d5a27, 0.7);
    g.fillRect(1, 15, 6, 7);
    g.fillRect(27, 15, 6, 7);

    // Arms (clawed)
    g.fillStyle(0x2d5a27);
    g.fillRect(0, 22, 7, 14);
    g.fillRect(27, 22, 7, 14);
    // Claws
    g.fillStyle(0x1a3d17);
    g.fillTriangle(0, 36, 3, 40, 6, 36);
    g.fillTriangle(28, 36, 31, 40, 34, 36);

    // Belt / abdominal segment
    g.fillStyle(0x0f2a0d);
    g.fillRect(5, 36, 24, 4);

    // Head (samurai kabuto helmet)
    g.fillStyle(0x1d3a1a);
    g.fillRect(8, 0, 18, 14);
    // Helmet dome
    g.fillStyle(0x2d5a27);
    g.fillEllipse(17, 6, 18, 12);
    // Helmet crest
    g.fillStyle(0x1a3d17);
    g.fillRect(15, -6, 4, 8); // center fin
    g.fillStyle(0x336b2e, 0.7);
    g.fillRect(16, -5, 2, 7);
    // Faceguard (mempo)
    g.fillStyle(0x1a3d17);
    g.fillRect(7, 8, 20, 8);
    // Eyes
    g.fillStyle(0xff3300);
    g.fillRect(9, 9, 5, 3);
    g.fillRect(20, 9, 5, 3);
    g.fillStyle(0xff6600, 0.7);
    g.fillRect(10, 9, 3, 2);
    g.fillRect(21, 9, 3, 2);
    // Moustache/faceplate detail
    g.fillStyle(0x0f2a0d);
    g.fillRect(12, 13, 10, 3);
    g.fillRect(14, 12, 2, 2);
    g.fillRect(18, 12, 2, 2);
    // Neck guard (fukigaeshi)
    g.fillStyle(0x2d5a27);
    g.fillRect(4, 12, 6, 4);
    g.fillRect(24, 12, 6, 4);

    g.generateTexture('enemy_beetle', W, H);
    g.destroy();
  }

  private drawCrowNinja(): void {
    const W = 34, H = 48;
    const g = this.g();

    // Feather cloak (WIDE silhouette behind body)
    g.fillStyle(0x111122);
    g.fillTriangle(17, 12, -4, 44, 14, 38);
    g.fillTriangle(17, 12, 38, 44, 20, 38);
    // Cloak feather texture
    g.fillStyle(0x1c1c2e, 0.8);
    g.fillRect(-2, 22, 10, 3);
    g.fillRect(-4, 28, 12, 3);
    g.fillRect(-2, 34, 10, 3);
    g.fillRect(26, 22, 10, 3);
    g.fillRect(26, 28, 12, 3);
    g.fillRect(26, 34, 10, 3);
    // Cloak edge highlights
    g.fillStyle(0x2a2a40, 0.5);
    g.fillRect(-3, 20, 2, 22);
    g.fillRect(35, 20, 2, 22);

    // Legs
    g.fillStyle(0x111122);
    g.fillRect(10, 36, 6, 12);
    g.fillRect(18, 36, 6, 12);

    // Body under cloak
    g.fillStyle(0x1a1a2e);
    g.fillRect(8, 14, 18, 26);
    // Chest cloth wrapping
    g.fillStyle(0x111122);
    g.fillRect(10, 15, 14, 20);
    // Wrap lines
    g.fillStyle(0x2a2a40, 0.5);
    g.fillRect(10, 18, 14, 2);
    g.fillRect(10, 22, 14, 2);
    g.fillRect(10, 26, 14, 2);

    // Belt with throwing stars
    g.fillStyle(0x0a0a18);
    g.fillRect(8, 34, 18, 4);
    // Shuriken on belt
    g.fillStyle(0x888899);
    for (let i = 0; i < 3; i++) {
      const sx = 11 + i * 5;
      g.fillRect(sx, 35, 4, 4);
      g.fillRect(sx + 1, 34, 2, 6);
    }

    // Arms
    g.fillStyle(0x1a1a2e);
    g.fillRect(4, 16, 6, 16);
    g.fillRect(24, 16, 6, 16);

    // Hands with kunai
    g.fillStyle(0x888899);
    g.fillRect(2, 30, 2, 8);
    g.fillStyle(0xccccdd);
    g.fillRect(2, 30, 2, 4);

    // CROW HEAD (the signature feature)
    // Hood/cowl
    g.fillStyle(0x111122);
    g.fillRect(8, 0, 18, 14);
    g.fillEllipse(17, 5, 18, 14);
    // BEAK (prominent crow beak)
    g.fillStyle(0x222233);
    g.fillTriangle(14, 8, 22, 8, 23, 14);
    g.fillStyle(0x1a1a28);
    g.fillTriangle(15, 9, 21, 9, 22, 13);
    // Tip of beak
    g.fillStyle(0x0a0a16);
    g.fillRect(20, 12, 3, 2);
    // Eyes (glowing white, corvid-like)
    g.fillStyle(0xffffff);
    g.fillCircle(13, 6, 3);
    g.fillCircle(21, 6, 3);
    g.fillStyle(0x000000);
    g.fillCircle(13, 6, 2);
    g.fillCircle(21, 6, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(12, 5, 1);
    g.fillCircle(20, 5, 1);
    // Feather crest
    g.fillStyle(0x1a1a2e);
    g.fillTriangle(12, 0, 10, -6, 14, 0);
    g.fillTriangle(17, 0, 15, -8, 19, 0);
    g.fillTriangle(22, 0, 20, -5, 24, 0);

    g.generateTexture('enemy_crow', W, H);
    g.destroy();
  }

  private drawGeneralEmberclaw(): void {
    const W = 56, H = 72;
    const g = this.g();

    // Flame aura
    g.fillStyle(0xff4400, 0.2);
    g.fillEllipse(W / 2, H / 2, W + 20, H + 10);

    // Legs (massive)
    g.fillStyle(0x660000);
    g.fillRect(6, 50, 16, 22);
    g.fillRect(34, 50, 16, 22);
    // Leg armor
    g.fillStyle(0x990000);
    g.fillRect(6, 50, 16, 10);
    g.fillRect(34, 50, 16, 10);
    g.fillStyle(0xcc2200, 0.5);
    g.fillRect(7, 51, 14, 8);
    g.fillRect(35, 51, 14, 8);

    // Body
    g.fillStyle(0x880000);
    g.fillRect(4, 18, 48, 36);
    // Breastplate
    g.fillStyle(0xaa1100);
    g.fillRect(8, 20, 40, 30);
    // Chest flame crest (large)
    g.fillStyle(0xff6600);
    g.fillTriangle(28, 20, 20, 36, 36, 36);
    g.fillStyle(0xffaa00);
    g.fillTriangle(28, 23, 23, 35, 33, 35);
    g.fillStyle(0xffee00, 0.7);
    g.fillTriangle(28, 26, 25, 34, 31, 34);
    // Armor lines
    g.fillStyle(0x660000, 0.5);
    g.fillRect(8, 38, 40, 3);

    // Giant shoulder pauldrons
    g.fillStyle(0x880000);
    g.fillRect(-6, 16, 18, 18);
    g.fillRect(44, 16, 18, 18);
    g.fillStyle(0xaa1100, 0.6);
    g.fillRect(-5, 17, 15, 14);
    g.fillRect(45, 17, 15, 14);
    // Flames on shoulders
    g.fillStyle(0xff6600, 0.7);
    g.fillTriangle(-1, 16, -4, 8, 3, 14);
    g.fillTriangle(57, 16, 54, 8, 60, 14);

    // Arms
    g.fillStyle(0x880000);
    g.fillRect(-6, 30, 10, 20);
    g.fillRect(52, 30, 10, 20);
    // Gauntlets (clawed)
    g.fillStyle(0xaa1100);
    g.fillRect(-6, 44, 10, 10);
    g.fillRect(52, 44, 10, 10);
    // Claws
    g.fillStyle(0xddaa44);
    g.fillTriangle(-6, 54, -4, 60, -2, 54);
    g.fillTriangle(-2, 54, 0, 60, 2, 54);
    g.fillTriangle(2, 54, 4, 60, 6, 54);
    g.fillTriangle(50, 54, 52, 60, 54, 54);
    g.fillTriangle(54, 54, 56, 60, 58, 54);
    g.fillTriangle(58, 54, 60, 60, 62, 54);

    // Belt
    g.fillStyle(0x440000);
    g.fillRect(4, 52, 48, 6);
    g.fillStyle(0xff8800);
    g.fillRect(22, 53, 12, 4);

    // LANTERN HEAD (giant, boss version)
    g.fillStyle(0xff6600);
    g.fillRect(12, -4, 32, 24); // outer frame
    // Lantern glow
    g.fillStyle(0xffcc00, 0.9);
    g.fillRect(16, -1, 24, 18);
    // Core
    g.fillStyle(0xffffff, 0.85);
    g.fillRect(20, 2, 16, 12);
    // Frame bars
    g.fillStyle(0x882200);
    g.fillRect(12, 8, 32, 3);
    g.fillRect(26, -4, 4, 24);
    // Top decoration
    g.fillStyle(0x664400);
    g.fillRect(18, -8, 20, 6);
    g.fillRect(22, -14, 12, 8);
    g.fillRect(25, -20, 6, 8);
    // Giant flame wisps
    g.fillStyle(0xff4400, 0.8);
    g.fillTriangle(22, -20, 18, -32, 26, -28);
    g.fillTriangle(28, -20, 25, -34, 32, -28);
    g.fillStyle(0xffaa00, 0.7);
    g.fillTriangle(24, -24, 21, -30, 27, -30);
    // Boss eyes (large, fierce)
    g.fillStyle(0xff0000);
    g.fillRect(15, 2, 10, 6);
    g.fillRect(31, 2, 10, 6);
    g.fillStyle(0xffee00);
    g.fillRect(16, 3, 8, 4);
    g.fillRect(32, 3, 8, 4);
    g.fillStyle(0x000000);
    g.fillRect(19, 3, 4, 4);
    g.fillRect(35, 3, 4, 4);

    g.generateTexture('enemy_boss', W, H + 34);
    g.destroy();
  }

  private drawStaggerStar(): void {
    const g = this.g();
    g.fillStyle(0xffff00);
    for (let i = 0; i < 5; i++) {
      const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const a2 = a1 + Math.PI / 5;
      g.fillTriangle(
        10 + Math.cos(a1) * 10, 10 + Math.sin(a1) * 10,
        10 + Math.cos(a2) * 5,  10 + Math.sin(a2) * 5,
        10 + Math.cos(a1 + Math.PI * 2 / 5) * 10,
        10 + Math.sin(a1 + Math.PI * 2 / 5) * 10,
      );
    }
    g.fillStyle(0xffee44, 0.6);
    g.fillCircle(10, 10, 3);
    g.generateTexture('stagger_star', 20, 20);
    g.destroy();
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TILE TEXTURES
  // ══════════════════════════════════════════════════════════════════════════

  private makeTileTextures(): void {
    // Ground tile (earthen, with grass cap)
    {
      const g = this.g();
      // Main earth body
      g.fillStyle(0x3d2b1f);
      g.fillRect(0, 0, 32, 32);
      // Dirt texture layers
      g.fillStyle(0x4a3326, 0.7);
      g.fillRect(2, 6, 28, 4);
      g.fillRect(4, 14, 24, 3);
      g.fillRect(2, 22, 28, 3);
      // Grass cap (top 6px)
      g.fillStyle(0x3a6b2a);
      g.fillRect(0, 0, 32, 7);
      g.fillStyle(0x4d8c38);
      g.fillRect(0, 0, 32, 4);
      // Grass blades
      g.fillStyle(0x5da043);
      for (let gx = 2; gx < 30; gx += 5) {
        g.fillTriangle(gx, 3, gx + 2, 3, gx + 1, -1);
        g.fillTriangle(gx + 2, 4, gx + 4, 4, gx + 3, 0);
      }
      // Dirt edge detail
      g.fillStyle(0x2a1d14);
      g.fillRect(0, 7, 32, 1);
      // Side edge shading
      g.fillStyle(0x000000, 0.2);
      g.fillRect(0, 0, 2, 32);
      g.fillRect(30, 0, 2, 32);
      g.generateTexture('ground_tile', 32, 32);
      g.destroy();
    }

    // Platform tile (wooden, with rope lashing)
    {
      const g = this.g();
      // Wood planks base
      g.fillStyle(0x7a5c3a);
      g.fillRect(0, 0, 32, 20);
      // Plank lines (horizontal)
      g.fillStyle(0x5a3e22);
      g.fillRect(0, 9, 32, 2);
      // Wood grain
      g.fillStyle(0x8a6a4a, 0.5);
      g.fillRect(4, 2, 2, 6);
      g.fillRect(10, 2, 2, 6);
      g.fillRect(18, 2, 2, 6);
      g.fillRect(26, 2, 2, 6);
      g.fillRect(6, 11, 2, 6);
      g.fillRect(14, 11, 2, 6);
      g.fillRect(22, 11, 2, 6);
      // Top cap (lighter)
      g.fillStyle(0x9a7050);
      g.fillRect(0, 0, 32, 4);
      // Rope lashing at corners
      g.fillStyle(0xd4a044);
      g.fillRect(0, 4, 4, 2);
      g.fillRect(28, 4, 4, 2);
      g.fillRect(2, 4, 2, 12);
      g.fillRect(28, 4, 2, 12);
      // Knot
      g.fillStyle(0xaa8030);
      g.fillRect(1, 9, 3, 3);
      g.fillRect(28, 9, 3, 3);
      // Bottom shading
      g.fillStyle(0x3a2810);
      g.fillRect(0, 17, 32, 3);
      g.generateTexture('platform_tile', 32, 20);
      g.destroy();
    }

    // Flame barrier
    {
      const g = this.g();
      // Stone post
      g.fillStyle(0x441100);
      g.fillRect(4, 0, 16, 80);
      g.fillStyle(0x661a00);
      g.fillRect(6, 0, 12, 80);
      // Rune markings
      g.fillStyle(0xff6600, 0.5);
      g.fillRect(8, 8, 8, 2);
      g.fillRect(9, 10, 6, 4);
      g.fillRect(8, 28, 8, 2);
      g.fillRect(9, 30, 6, 4);
      g.fillRect(8, 48, 8, 2);
      g.fillRect(9, 50, 6, 4);
      // Flames
      for (let fy = 0; fy < 80; fy += 18) {
        g.fillStyle(0xff4400, 0.8);
        g.fillTriangle(2, fy + 18, 12, fy + 18, 7, fy);
        g.fillStyle(0xff8800, 0.7);
        g.fillTriangle(4, fy + 18, 10, fy + 18, 7, fy + 6);
        g.fillStyle(0xffcc00, 0.6);
        g.fillTriangle(6, fy + 18, 8, fy + 18, 7, fy + 10);
        g.fillStyle(0xff4400, 0.8);
        g.fillTriangle(12, fy + 18, 22, fy + 18, 17, fy + 2);
        g.fillStyle(0xff8800, 0.7);
        g.fillTriangle(14, fy + 18, 20, fy + 18, 17, fy + 8);
        g.fillStyle(0xffcc00, 0.6);
        g.fillTriangle(15, fy + 18, 19, fy + 18, 17, fy + 12);
      }
      g.generateTexture('flame_barrier', 24, 80);
      g.destroy();
    }

    // Cracked floor
    {
      const g = this.g();
      g.fillStyle(0x5c4033);
      g.fillRect(0, 0, 96, 20);
      g.fillStyle(0x7a5c44);
      g.fillRect(0, 0, 96, 6);
      // Crack pattern
      g.fillStyle(0x2a1208, 0.9);
      g.fillRect(20, 0, 2, 20);   // main crack 1
      g.fillRect(20, 8, 12, 2);   // branch
      g.fillRect(30, 8, 2, 12);
      g.fillRect(48, 0, 2, 20);   // main crack 2
      g.fillRect(44, 6, 6, 2);    // branch
      g.fillRect(70, 2, 2, 16);   // main crack 3
      g.fillRect(70, 10, 14, 2);  // branch
      // Highlight edges
      g.fillStyle(0x3a1c08, 0.4);
      g.fillRect(0, 16, 96, 4);
      g.generateTexture('cracked_floor', 96, 20);
      g.destroy();
    }

    // Exit gate
    {
      const g = this.g();
      // Stone arch sides
      g.fillStyle(0x334466);
      g.fillRect(0, 0, 48, 64);
      g.fillStyle(0x4466aa);
      g.fillRect(4, 4, 40, 56);
      // Portal glow (inner)
      g.fillStyle(0x2255cc);
      g.fillRect(8, 8, 32, 48);
      g.fillStyle(0x4488ff, 0.6);
      g.fillRect(10, 10, 28, 44);
      g.fillStyle(0x88bbff, 0.4);
      g.fillRect(14, 14, 20, 36);
      // Arch columns
      g.fillStyle(0x334466);
      g.fillRect(4, 4, 10, 56);
      g.fillRect(34, 4, 10, 56);
      // Gate symbols
      g.fillStyle(0xaaccff, 0.8);
      g.fillRect(20, 10, 8, 2);
      g.fillRect(20, 16, 8, 2);
      g.fillRect(24, 10, 2, 8);
      g.fillRect(20, 32, 8, 2);
      g.fillRect(20, 38, 8, 2);
      g.fillRect(24, 32, 2, 8);
      // Shimmer lines
      g.fillStyle(0xffffff, 0.3);
      g.fillRect(12, 8, 2, 48);
      g.fillRect(34, 8, 2, 48);
      g.generateTexture('exit_gate', 48, 64);
      g.destroy();
    }

    // Scroll collectible
    {
      const g = this.g();
      // Scroll rolls
      g.fillStyle(0xd4b870);
      g.fillEllipse(10, 4, 20, 8);
      g.fillEllipse(10, 20, 20, 8);
      // Scroll body
      g.fillStyle(0xf0e0a0);
      g.fillRect(2, 4, 16, 16);
      // Scroll lines
      g.fillStyle(0x8a6a20);
      g.fillRect(4, 8, 12, 1);
      g.fillRect(4, 12, 12, 1);
      g.fillRect(4, 16, 8, 1);
      // Gold cap cylinders
      g.fillStyle(0xcc9933);
      g.fillEllipse(10, 4, 18, 6);
      g.fillEllipse(10, 20, 18, 6);
      g.generateTexture('scroll', 20, 24);
      g.destroy();
    }

    // Health orb
    {
      const g = this.g();
      // Outer ring
      g.fillStyle(0xcc0033);
      g.fillCircle(10, 10, 10);
      // Inner fill
      g.fillStyle(0xff4466);
      g.fillCircle(10, 10, 8);
      // Shine
      g.fillStyle(0xff88aa, 0.8);
      g.fillCircle(7, 7, 4);
      g.fillStyle(0xffffff, 0.5);
      g.fillCircle(7, 7, 2);
      // Heart symbol
      g.fillStyle(0xcc0033);
      g.fillCircle(8, 10, 2);
      g.fillCircle(12, 10, 2);
      g.fillTriangle(6, 11, 14, 11, 10, 15);
      g.generateTexture('health_orb', 20, 20);
      g.destroy();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PROJECTILE TEXTURES
  // ══════════════════════════════════════════════════════════════════════════

  private makeProjectileTextures(): void {
    // Fireball (player)
    {
      const g = this.g();
      g.fillStyle(0xff4400, 0.5);
      g.fillEllipse(14, 7, 28, 16);
      g.fillStyle(0xff7700);
      g.fillEllipse(14, 7, 22, 12);
      g.fillStyle(0xffaa00);
      g.fillEllipse(14, 7, 14, 8);
      g.fillStyle(0xffee88, 0.8);
      g.fillEllipse(12, 6, 8, 6);
      g.generateTexture('fireball', 28, 14);
      g.destroy();
    }

    // Wind gust (player)
    {
      const g = this.g();
      g.fillStyle(0x88ddff, 0.25);
      g.fillEllipse(20, 10, 40, 20);
      g.fillStyle(0xaaeeff, 0.5);
      g.fillEllipse(20, 10, 30, 14);
      g.fillStyle(0xffffff, 0.7);
      // Streaks
      g.fillRect(4, 7, 32, 2);
      g.fillRect(8, 11, 24, 2);
      g.fillRect(12, 15, 16, 2);
      g.generateTexture('wind_gust', 40, 20);
      g.destroy();
    }

    // Enemy fireball
    {
      const g = this.g();
      g.fillStyle(0xcc1100, 0.5);
      g.fillEllipse(10, 6, 20, 12);
      g.fillStyle(0xff3300);
      g.fillEllipse(10, 6, 14, 9);
      g.fillStyle(0xff8844, 0.8);
      g.fillEllipse(8, 5, 7, 5);
      g.generateTexture('enemy_fireball', 20, 12);
      g.destroy();
    }

    // Shuriken
    {
      const g = this.g();
      g.fillStyle(0x8899aa);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const nx = Math.cos(a), ny = Math.sin(a);
        const tx = Math.cos(a + Math.PI / 4), ty = Math.sin(a + Math.PI / 4);
        g.fillTriangle(
          7 + nx * 7, 7 + ny * 7,
          7 + tx * 3, 7 + ty * 3,
          7 - nx * 4, 7 - ny * 4,
        );
      }
      g.fillStyle(0xccddee);
      g.fillCircle(7, 7, 2);
      g.fillStyle(0x4466aa);
      g.fillCircle(7, 7, 1);
      g.generateTexture('enemy_shuriken', 14, 14);
      g.destroy();
    }

    // Ground pound crack
    {
      const g = this.g();
      g.fillStyle(0x888888, 0.3);
      g.fillEllipse(40, 10, 80, 20);
      g.lineStyle(2, 0xaaaaaa, 0.6);
      g.strokeEllipse(40, 10, 78, 18);
      g.generateTexture('pound_crack', 80, 20);
      g.destroy();
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // UI TEXTURES
  // ══════════════════════════════════════════════════════════════════════════

  private makeUITextures(): void {
    // Full heart
    {
      const g = this.g();
      g.fillStyle(0xff2244);
      g.fillCircle(5, 5, 5);
      g.fillCircle(13, 5, 5);
      g.fillTriangle(0, 6, 18, 6, 9, 16);
      g.fillStyle(0xff6688, 0.7);
      g.fillCircle(4, 4, 2);
      g.generateTexture('heart_full', 18, 16);
      g.destroy();
    }

    // Empty heart
    {
      const g = this.g();
      g.lineStyle(2, 0x882244);
      g.strokeCircle(5, 5, 5);
      g.strokeCircle(13, 5, 5);
      g.strokeTriangle(0, 6, 18, 6, 9, 16);
      g.generateTexture('heart_empty', 18, 16);
      g.destroy();
    }

    // Outfit badge background
    {
      const g = this.g();
      g.fillStyle(0x000000, 0.7);
      g.fillRoundedRect(0, 0, 150, 48, 8);
      g.lineStyle(2, 0x445566, 0.6);
      g.strokeRoundedRect(0, 0, 150, 48, 8);
      g.generateTexture('outfit_badge_bg', 150, 48);
      g.destroy();
    }

    // Steal ring (burst)
    {
      const g = this.g();
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r1 = 32, r2 = 40;
        g.fillStyle(0xffee44, 0.9 - i * 0.03);
        g.fillRect(
          40 + Math.cos(a) * r1 - 2,
          40 + Math.sin(a) * r1 - 2,
          4, 4,
        );
        g.lineStyle(3, 0xffcc00, 0.8);
        g.lineBetween(
          40 + Math.cos(a) * r1, 40 + Math.sin(a) * r1,
          40 + Math.cos(a) * r2, 40 + Math.sin(a) * r2,
        );
      }
      g.lineStyle(3, 0xffee44, 0.7);
      g.strokeCircle(40, 40, 36);
      g.generateTexture('steal_ring', 80, 80);
      g.destroy();
    }

    // Particle
    {
      const g = this.g();
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 5, 5);
      g.generateTexture('particle', 5, 5);
      g.destroy();
    }
  }
}
