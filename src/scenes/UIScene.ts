import Phaser from 'phaser';
import { DEPTH, GAME_HEIGHT, GAME_WIDTH, OUTFIT_COLORS, OUTFIT_NAMES, OutfitType, REG, SCENES } from '../constants';

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Image[] = [];
  private outfitBadge!: Phaser.GameObjects.Container;
  private outfitNameText!: Phaser.GameObjects.Text;
  private outfitColorBar!: Phaser.GameObjects.Rectangle;
  private scoreText!: Phaser.GameObjects.Text;

  private maxHealth = 6;
  private currentHealth = 6;
  private currentOutfit: OutfitType = 'base';

  constructor() { super({ key: SCENES.UI }); }

  create(): void {
    this.maxHealth     = this.registry.get(REG.MAX_HP)   as number;
    this.currentHealth = this.registry.get(REG.HEALTH)   as number;
    this.currentOutfit = this.registry.get(REG.OUTFIT)   as OutfitType;

    this.createHealthDisplay();
    this.createOutfitBadge();
    this.createScoreDisplay();

    // Listen for registry changes
    this.registry.events.on('changedata', this.onRegistryChange, this);
  }

  private onRegistryChange(parent: unknown, key: string, value: unknown): void {
    if (key === REG.HEALTH) {
      this.currentHealth = value as number;
      this.updateHearts();
    }
    if (key === REG.OUTFIT) {
      this.currentOutfit = value as OutfitType;
      this.updateOutfitBadge();
    }
    if (key === REG.SCORE) {
      this.scoreText.setText(`SCORE  ${(value as number).toString().padStart(6, '0')}`);
    }
  }

  private createHealthDisplay(): void {
    const startX = 14;
    const startY = 14;
    const spacing = 22;

    // Label
    this.add.text(startX, startY, 'HP', {
      fontSize: '11px', color: '#aaaaaa',
      stroke: '#000000', strokeThickness: 2,
    }).setDepth(DEPTH.UI + 1).setScrollFactor(0);

    // Hearts
    for (let i = 0; i < this.maxHealth; i++) {
      const h = this.add.image(startX + 28 + i * spacing, startY + 8, 'heart_full')
        .setDepth(DEPTH.UI + 1).setScrollFactor(0).setOrigin(0.5);
      this.hearts.push(h);
    }
  }

  private updateHearts(): void {
    for (let i = 0; i < this.hearts.length; i++) {
      this.hearts[i].setTexture(i < this.currentHealth ? 'heart_full' : 'heart_empty');
      // Pulse the hearts that change
      if (i === this.currentHealth) {
        this.tweens.add({
          targets: this.hearts[i],
          scaleX: 1.4, scaleY: 1.4,
          yoyo: true,
          duration: 100,
        });
      }
    }
  }

  private createOutfitBadge(): void {
    const badgeX = GAME_WIDTH - 8;
    const badgeY = 8;

    // Background
    const bg = this.add.image(badgeX, badgeY, 'outfit_badge_bg')
      .setOrigin(1, 0).setDepth(DEPTH.UI).setScrollFactor(0);

    // Color bar
    const { body } = OUTFIT_COLORS[this.currentOutfit];
    this.outfitColorBar = this.add.rectangle(
      badgeX - 6, badgeY + 4, 8, 36, body,
    ).setOrigin(1, 0).setDepth(DEPTH.UI + 1).setScrollFactor(0);

    // "OUTFIT" label
    this.add.text(badgeX - 18, badgeY + 6, 'OUTFIT', {
      fontSize: '9px', color: '#888888',
    }).setOrigin(1, 0).setDepth(DEPTH.UI + 1).setScrollFactor(0);

    // Outfit name
    this.outfitNameText = this.add.text(
      badgeX - 18, badgeY + 20,
      OUTFIT_NAMES[this.currentOutfit], {
        fontSize: '13px',
        color: '#ffee44',
        stroke: '#000000',
        strokeThickness: 2,
      },
    ).setOrigin(1, 0).setDepth(DEPTH.UI + 1).setScrollFactor(0);

    this.outfitBadge = this.add.container(0, 0, [bg, this.outfitColorBar, this.outfitNameText]);
  }

  private updateOutfitBadge(): void {
    this.outfitNameText.setText(OUTFIT_NAMES[this.currentOutfit]);
    const { body } = OUTFIT_COLORS[this.currentOutfit];
    this.outfitColorBar.setFillStyle(body);

    // Bounce animation
    this.tweens.add({
      targets: this.outfitNameText,
      scaleX: 1.3, scaleY: 1.3,
      yoyo: true,
      duration: 150,
      ease: 'Back.Out',
    });
  }

  private createScoreDisplay(): void {
    this.scoreText = this.add.text(
      GAME_WIDTH / 2, 10,
      'SCORE  000000', {
        fontSize: '14px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
      },
    ).setOrigin(0.5, 0).setDepth(DEPTH.UI + 1).setScrollFactor(0);
  }
}
