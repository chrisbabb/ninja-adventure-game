import Phaser from 'phaser';
import { OUTFIT_COLORS, OUTFITS, OutfitType, SCENES } from '../constants';

/**
 * BootScene – runs once at startup, draws all game textures procedurally.
 * No external image files are needed.
 */
export class BootScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.BOOT }); }

  create(): void {
    this.makePlayerTextures();
    this.makeEnemyTextures();
    this.makeProjectileTextures();
    this.makeTileTextures();
    this.makeFXTextures();
    this.scene.start(SCENES.TITLE);
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  private gfx(_w: number, _h: number): Phaser.GameObjects.Graphics {
    return this.make.graphics({ x: 0, y: 0 });
  }

  private drawPlayer(
    key: string,
    bodyColor: number,
    headColor: number,
    accentColor: number,
    wings = false,
    bulk = false,
  ): void {
    const W = bulk ? 30 : 26, H = bulk ? 44 : 40;
    const g = this.gfx(W, H);

    // scarf / accent ribbon
    g.fillStyle(accentColor);
    g.fillRect(0, 10, W, 6);

    // body
    g.fillStyle(bodyColor);
    g.fillRect(bulk ? 1 : 3, 14, W - (bulk ? 2 : 6), H - 18);

    // legs
    g.fillStyle(Phaser.Display.Color.ValueToColor(bodyColor).darken(25).color);
    g.fillRect(bulk ? 2 : 4, H - 10, (W - (bulk ? 4 : 8)) / 2 - 1, 10);
    g.fillRect(bulk ? (W / 2) + 1 : (W / 2), H - 10, (W - (bulk ? 4 : 8)) / 2 - 1, 10);

    // head / mask
    g.fillStyle(headColor);
    g.fillRect(bulk ? 3 : 5, 0, W - (bulk ? 6 : 10), 14);

    // eyes
    g.fillStyle(0x000000);
    g.fillRect(bulk ? 7 : 8, 4, 4, 3);
    g.fillRect(bulk ? 15 : 14, 4, 4, 3);

    // wing silhouette for Sky Tengu
    if (wings) {
      g.fillStyle(accentColor, 0.8);
      g.fillTriangle(0, 16, -10, 30, 0, 32);
      g.fillTriangle(W, 16, W + 10, 30, W, 32);
    }

    // heavy shoulder plates for Stone Guard
    if (bulk) {
      g.fillStyle(Phaser.Display.Color.ValueToColor(headColor).darken(10).color);
      g.fillRect(-2, 12, 8, 10);
      g.fillRect(W - 6, 12, 8, 10);
    }

    g.generateTexture(key, W + (wings ? 20 : 0), H);
    g.destroy();
  }

  private makePlayerTextures(): void {
    const outfits: OutfitType[] = [OUTFITS.BASE, OUTFITS.FLAME_RONIN, OUTFITS.STONE_GUARD, OUTFITS.SKY_TENGU];
    for (const o of outfits) {
      const { body, head, accent } = OUTFIT_COLORS[o];
      const wings = o === OUTFITS.SKY_TENGU;
      const bulk  = o === OUTFITS.STONE_GUARD;
      this.drawPlayer(`player_${o}`, body, head, accent, wings, bulk);
    }

    // attack hitbox flash sprite (just a semi-transparent white rect)
    const ag = this.gfx(48, 32);
    ag.fillStyle(0xffffff, 0.35);
    ag.fillRect(0, 0, 48, 32);
    ag.generateTexture('attack_box', 48, 32);
    ag.destroy();

    // steal prompt particle
    const sp = this.gfx(120, 24);
    sp.fillStyle(0xffee44, 0.92);
    sp.fillRoundedRect(0, 0, 120, 24, 6);
    sp.generateTexture('steal_prompt', 120, 24);
    sp.destroy();
  }

  private makeEnemyTextures(): void {
    // Lantern Soldier – orange/amber, glowing head, → Flame Ronin
    {
      const g = this.gfx(26, 40);
      g.fillStyle(0xcc5500);
      g.fillRect(3, 14, 20, 20);
      g.fillStyle(0xff9900); // glowing lantern head
      g.fillCircle(13, 8, 10);
      g.fillStyle(0xffee00, 0.6);
      g.fillCircle(13, 8, 6);
      g.fillStyle(0xcc5500); // legs
      g.fillRect(4, 34, 7, 8);
      g.fillRect(15, 34, 7, 8);
      g.fillStyle(0xffcc00); // accent belt
      g.fillRect(3, 22, 20, 4);
      g.generateTexture('enemy_lantern', 26, 42);
      g.destroy();
    }

    // Beetle Samurai – dark green shell, → Stone Guard
    {
      const g = this.gfx(30, 44);
      g.fillStyle(0x2d5a27);
      g.fillRect(1, 14, 28, 24);
      g.fillStyle(0x1a3d17); // shell
      g.fillEllipse(15, 18, 26, 20);
      g.fillStyle(0x7a9a77); // head
      g.fillRect(7, 2, 16, 14);
      g.fillStyle(0x000000); // eyes
      g.fillRect(9, 6, 4, 3);
      g.fillRect(17, 6, 4, 3);
      g.fillStyle(0x2d5a27); // legs
      g.fillRect(2, 38, 8, 8);
      g.fillRect(20, 38, 8, 8);
      g.generateTexture('enemy_beetle', 30, 46);
      g.destroy();
    }

    // Crow Ninja – black, feathered cape, → Sky Tengu
    {
      const g = this.gfx(32, 40);
      g.fillStyle(0x111111);
      g.fillRect(4, 14, 24, 20);
      // cape / wings
      g.fillStyle(0x1a1a2e);
      g.fillTriangle(0, 14, 4, 34, 14, 22);
      g.fillTriangle(32, 14, 28, 34, 18, 22);
      g.fillStyle(0x333344); // head
      g.fillRect(8, 0, 16, 14);
      g.fillStyle(0xffffff); // eyes (glowing)
      g.fillRect(10, 4, 4, 3);
      g.fillRect(18, 4, 4, 3);
      g.fillStyle(0xcccccc); // beak
      g.fillTriangle(13, 10, 19, 10, 16, 15);
      g.fillStyle(0x111111); // legs
      g.fillRect(6, 34, 7, 8);
      g.fillRect(19, 34, 7, 8);
      g.generateTexture('enemy_crow', 32, 42);
      g.destroy();
    }

    // Miniboss – big lantern general
    {
      const g = this.gfx(48, 64);
      g.fillStyle(0x882200); // body
      g.fillRect(4, 20, 40, 36);
      g.fillStyle(0xff6600); // glowing head
      g.fillCircle(24, 12, 16);
      g.fillStyle(0xffdd00, 0.7);
      g.fillCircle(24, 12, 10);
      g.fillStyle(0x882200); // legs
      g.fillRect(6, 56, 14, 10);
      g.fillRect(28, 56, 14, 10);
      g.fillStyle(0xffaa00); // pauldrons
      g.fillRect(0, 18, 14, 10);
      g.fillRect(34, 18, 14, 10);
      g.fillStyle(0xffcc44); // belt
      g.fillRect(4, 38, 40, 6);
      g.generateTexture('enemy_boss', 48, 66);
      g.destroy();
    }

    // Stagger indicator (spinning star)
    {
      const g = this.gfx(20, 20);
      g.fillStyle(0xffff00);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        g.fillCircle(10 + Math.cos(a) * 8, 10 + Math.sin(a) * 8, 3);
      }
      g.generateTexture('stagger_star', 20, 20);
      g.destroy();
    }
  }

  private makeProjectileTextures(): void {
    // Fireball
    {
      const g = this.gfx(20, 14);
      g.fillStyle(0xff8800);
      g.fillEllipse(10, 7, 20, 14);
      g.fillStyle(0xffee44);
      g.fillEllipse(10, 7, 12, 8);
      g.generateTexture('fireball', 20, 14);
      g.destroy();
    }

    // Wind gust
    {
      const g = this.gfx(36, 18);
      g.fillStyle(0x88ddff, 0.7);
      g.fillEllipse(18, 9, 36, 18);
      g.fillStyle(0xffffff, 0.4);
      g.fillEllipse(18, 9, 20, 10);
      g.generateTexture('wind_gust', 36, 18);
      g.destroy();
    }

    // Shockwave ring
    {
      const g = this.gfx(80, 20);
      g.lineStyle(4, 0x88ddff, 0.9);
      g.strokeEllipse(40, 10, 80, 20);
      g.generateTexture('shockwave', 80, 20);
      g.destroy();
    }

    // Ground pound crack
    {
      const g = this.gfx(80, 20);
      g.fillStyle(0x888888, 0.5);
      g.fillEllipse(40, 10, 80, 20);
      g.generateTexture('pound_crack', 80, 20);
      g.destroy();
    }

    // Enemy fireball (red)
    {
      const g = this.gfx(16, 12);
      g.fillStyle(0xff3300);
      g.fillEllipse(8, 6, 16, 12);
      g.fillStyle(0xff8844);
      g.fillEllipse(8, 6, 8, 6);
      g.generateTexture('enemy_fireball', 16, 12);
      g.destroy();
    }

    // Enemy shuriken
    {
      const g = this.gfx(14, 14);
      g.fillStyle(0xaaaaaa);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        g.fillTriangle(
          7, 7,
          7 + Math.cos(a) * 7, 7 + Math.sin(a) * 7,
          7 + Math.cos(a + 0.5) * 4, 7 + Math.sin(a + 0.5) * 4,
        );
      }
      g.fillStyle(0xdddddd);
      g.fillCircle(7, 7, 2);
      g.generateTexture('enemy_shuriken', 14, 14);
      g.destroy();
    }
  }

  private makeTileTextures(): void {
    // Ground tile
    {
      const g = this.gfx(32, 32);
      g.fillStyle(0x3d2b1f); // dark earth
      g.fillRect(0, 0, 32, 32);
      g.fillStyle(0x5c4033);
      g.fillRect(0, 0, 32, 6);
      g.lineStyle(1, 0x2a1d14, 0.5);
      g.strokeRect(0, 0, 32, 32);
      g.generateTexture('ground_tile', 32, 32);
      g.destroy();
    }

    // Platform tile
    {
      const g = this.gfx(32, 20);
      g.fillStyle(0x5c4033);
      g.fillRect(0, 0, 32, 20);
      g.fillStyle(0x7a5c44);
      g.fillRect(0, 0, 32, 6);
      g.fillStyle(0x4a3028);
      g.fillRect(0, 16, 32, 4);
      g.lineStyle(1, 0x3d2218, 0.4);
      g.strokeRect(0, 0, 32, 20);
      g.generateTexture('platform_tile', 32, 20);
      g.destroy();
    }

    // Flame barrier (destructible with Flame Ronin)
    {
      const g = this.gfx(24, 80);
      g.fillStyle(0x661100);
      g.fillRect(0, 0, 24, 80);
      g.fillStyle(0xaa3300);
      g.fillRect(4, 4, 16, 72);
      for (let y = 0; y < 80; y += 20) {
        g.fillStyle(0xff6600, 0.6);
        g.fillTriangle(4, y + 20, 20, y + 20, 12, y);
      }
      g.generateTexture('flame_barrier', 24, 80);
      g.destroy();
    }

    // Cracked floor (breakable with Stone Guard ground pound)
    {
      const g = this.gfx(96, 20);
      g.fillStyle(0x5c4033);
      g.fillRect(0, 0, 96, 20);
      g.fillStyle(0x7a5c44);
      g.fillRect(0, 0, 96, 6);
      g.lineStyle(2, 0x2a1208, 0.9);
      g.lineBetween(20, 2, 30, 20);
      g.lineBetween(50, 0, 40, 20);
      g.lineBetween(70, 2, 80, 18);
      g.generateTexture('cracked_floor', 96, 20);
      g.destroy();
    }

    // Exit gate
    {
      const g = this.gfx(48, 64);
      g.fillStyle(0x224488);
      g.fillRect(0, 0, 48, 64);
      g.fillStyle(0x4488cc);
      g.fillRect(4, 4, 40, 56);
      g.fillStyle(0xaaccff, 0.4);
      g.fillRect(8, 8, 32, 48);
      g.lineStyle(3, 0x88bbff);
      g.strokeRect(4, 4, 40, 56);
      g.generateTexture('exit_gate', 48, 64);
      g.destroy();
    }

    // Scroll collectible
    {
      const g = this.gfx(20, 24);
      g.fillStyle(0xf0e0a0);
      g.fillRect(2, 4, 16, 16);
      g.fillStyle(0xcc9933);
      g.fillRect(0, 0, 20, 6);
      g.fillRect(0, 18, 20, 6);
      g.lineStyle(1, 0x996622);
      g.lineBetween(4, 10, 16, 10);
      g.lineBetween(4, 14, 12, 14);
      g.generateTexture('scroll', 20, 24);
      g.destroy();
    }

    // Health orb
    {
      const g = this.gfx(20, 20);
      g.fillStyle(0xff4466);
      g.fillCircle(10, 10, 10);
      g.fillStyle(0xff88aa);
      g.fillCircle(7, 7, 4);
      g.generateTexture('health_orb', 20, 20);
      g.destroy();
    }
  }

  private makeFXTextures(): void {
    // Particle (small square)
    {
      const g = this.gfx(6, 6);
      g.fillStyle(0xffffff);
      g.fillRect(0, 0, 6, 6);
      g.generateTexture('particle', 6, 6);
      g.destroy();
    }

    // Steal flash ring
    {
      const g = this.gfx(80, 80);
      g.lineStyle(6, 0xffee44, 0.9);
      g.strokeCircle(40, 40, 36);
      g.generateTexture('steal_ring', 80, 80);
      g.destroy();
    }

    // Heart (for UI)
    {
      const g = this.gfx(18, 16);
      g.fillStyle(0xff4466);
      g.fillCircle(5, 5, 5);
      g.fillCircle(13, 5, 5);
      g.fillTriangle(0, 6, 18, 6, 9, 16);
      g.generateTexture('heart_full', 18, 16);
      g.destroy();
    }

    // Empty heart
    {
      const g = this.gfx(18, 16);
      g.lineStyle(2, 0x884466);
      g.strokeCircle(5, 5, 5);
      g.strokeCircle(13, 5, 5);
      g.strokeTriangle(0, 6, 18, 6, 9, 16);
      g.generateTexture('heart_empty', 18, 16);
      g.destroy();
    }

    // Outfit badge background
    {
      const g = this.gfx(140, 44);
      g.fillStyle(0x000000, 0.65);
      g.fillRoundedRect(0, 0, 140, 44, 8);
      g.lineStyle(2, 0xffffff, 0.3);
      g.strokeRoundedRect(0, 0, 140, 44, 8);
      g.generateTexture('outfit_badge_bg', 140, 44);
      g.destroy();
    }

    // Background sky layers (drawn as solid gradient bands)
    for (const [key, top, bottom] of [
      ['bg_sky',    0x1a1a3e, 0x2d2050] as [string, number, number],
      ['bg_mid',    0x2a1f3d, 0x1e1432] as [string, number, number],
      ['bg_far',    0x0d0d20, 0x150f28] as [string, number, number],
    ]) {
      const g = this.gfx(960, 540);
      g.fillGradientStyle(top, top, bottom, bottom, 1);
      g.fillRect(0, 0, 960, 540);
      // Add some star dots for bg_sky
      if (key === 'bg_sky') {
        g.fillStyle(0xffffff, 0.5);
        const rng = new Phaser.Math.RandomDataGenerator(['stars']);
        for (let i = 0; i < 120; i++) {
          const sx = rng.integerInRange(0, 960);
          const sy = rng.integerInRange(0, 300);
          g.fillRect(sx, sy, rng.pick([1, 1, 1, 2]), rng.pick([1, 1, 1, 2]));
        }
      }
      g.generateTexture(key, 960, 540);
      g.destroy();
    }

    // Pagoda silhouette decoration tiles
    {
      const g = this.gfx(200, 200);
      g.fillStyle(0x110d22, 0.8);
      g.fillRect(80, 60, 40, 140);      // tower body
      g.fillTriangle(60, 60, 140, 60, 100, 20);   // roof 1
      g.fillRect(60, 80, 80, 8);        // eave 1
      g.fillRect(55, 120, 90, 8);       // eave 2
      g.generateTexture('bg_pagoda', 200, 200);
      g.destroy();
    }
  }
}
