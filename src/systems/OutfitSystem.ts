import Phaser from 'phaser';
import { DEPTH, OUTFIT_NAMES, OUTFITS, OutfitType } from '../constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

/**
 * OutfitSystem – manages the steal interaction between Player and Enemies.
 * Call `checkStealInteraction` each frame; it handles proximity detection,
 * prompt display, and outfit transfer.
 */
export class OutfitSystem {
  private scene: Phaser.Scene;
  private player: Player;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene  = scene;
    this.player = player;
  }

  /**
   * Returns the nearest staggered enemy within range, or null.
   * Used by the Player's input handler.
   */
  getNearestStaggeredEnemy(
    enemies: Enemy[],
    px: number,
    py: number,
    range: number,
  ): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDist = Infinity;

    for (const e of enemies) {
      if (e.state !== 'stagger' || !e.active) continue;
      const dx = e.x - px;
      const dy = e.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < range && dist < nearestDist) {
        nearest = e;
        nearestDist = dist;
      }
    }
    return nearest;
  }

  /**
   * Execute the steal: remove enemy, grant outfit, spawn flashy effects.
   */
  executeSteal(enemy: Enemy): void {
    const outfit = enemy.dropsOutfit;

    // Kill enemy with special steal effect
    this.spawnStealFX(enemy.x, enemy.y - enemy.height / 2, outfit);
    enemy.die();

    // Equip outfit on player (slight delay for drama)
    this.scene.time.delayedCall(180, () => {
      this.player.equipOutfit(outfit);
      this.showOutfitBanner(outfit);
    });
  }

  private spawnStealFX(x: number, y: number, outfit: OutfitType): void {
    // Big ring burst
    const ring = this.scene.add.sprite(x, y, 'steal_ring').setDepth(DEPTH.FX).setScale(0.3);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 4, scaleY: 4,
      alpha: 0,
      duration: 700,
      ease: 'Quad.Out',
      onComplete: () => ring.destroy(),
    });

    // Particle burst
    const colors: Record<OutfitType, number> = {
      base:        0xffffff,
      flame_ronin: 0xff6600,
      stone_guard: 0x8888ff,
      sky_tengu:   0x00ccff,
    };
    const col = colors[outfit];
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 180);
      const p = this.scene.add.rectangle(x, y, 6, 6, col).setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: p,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0, scaleY: 0,
        duration: Phaser.Math.Between(400, 800),
        onComplete: () => p.destroy(),
      });
    }

    // Screen flash
    const cam = this.scene.cameras.main;
    cam.flash(200, 255, 255, 255, false);
    cam.shake(100, 0.003);
  }

  private showOutfitBanner(outfit: OutfitType): void {
    const cam   = this.scene.cameras.main;
    const cx    = cam.scrollX + cam.width / 2;
    const cy    = cam.scrollY + cam.height / 2;

    const bg = this.scene.add.rectangle(cx, cy - 60, 360, 56, 0x000000, 0.75)
      .setDepth(DEPTH.UI + 5)
      .setOrigin(0.5)
      .setScrollFactor(0);

    const label = this.scene.add.text(cx, cy - 60, `OUTFIT STOLEN: ${OUTFIT_NAMES[outfit]}`, {
      fontSize: '20px',
      color: '#ffee44',
      stroke: '#000000',
      strokeThickness: 4,
    })
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 6)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: [bg, label],
      y: '-=20',
      duration: 300,
      ease: 'Back.Out',
    });

    this.scene.time.delayedCall(1800, () => {
      this.scene.tweens.add({
        targets: [bg, label],
        alpha: 0,
        duration: 300,
        onComplete: () => { bg.destroy(); label.destroy(); },
      });
    });
  }
}
