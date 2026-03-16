import Phaser from 'phaser';
import { SCENE_KEYS, FormType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, DEPTH, FORM_NAMES, FORM_STATS } from '../constants';
import { FormSystem } from '../systems/FormSystem';
import { Player } from '../entities/Player';

export class UIScene extends Phaser.Scene {
  private formSystem!: FormSystem;
  private player!: Player;

  // Health bar
  private healthBarBg!: Phaser.GameObjects.Rectangle;
  private healthBarFill!: Phaser.GameObjects.Rectangle;
  private healthText!: Phaser.GameObjects.Text;

  // Form indicator
  private formText!: Phaser.GameObjects.Text;
  private formIcon!: Phaser.GameObjects.Rectangle;

  // Boss health
  private bossHealthBarBg!: Phaser.GameObjects.Rectangle;
  private bossHealthBarFill!: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossHealthVisible: boolean = false;

  constructor() {
    super(SCENE_KEYS.UI);
  }

  init(data: { formSystem: FormSystem; player: Player }): void {
    this.formSystem = data.formSystem;
    this.player = data.player;
  }

  create(): void {
    // Player health bar
    const hx = 10, hy = 10;
    this.healthBarBg = this.add.rectangle(hx + 50, hy + 5, 100, 10, 0x333333).setOrigin(0, 0.5);
    this.healthBarFill = this.add.rectangle(hx + 50, hy + 5, 100, 10, 0x44cc44).setOrigin(0, 0.5);
    this.healthText = this.add.text(hx, hy, 'HP', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#44cc44',
    });

    // Form indicator
    this.formIcon = this.add.rectangle(hx, hy + 20, 12, 12, FORM_STATS[this.formSystem.getCurrentForm()].color);
    this.formText = this.add.text(hx + 18, hy + 16, FORM_NAMES[this.formSystem.getCurrentForm()], {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ffffff',
    });

    // Boss health bar (hidden initially)
    const bx = GAME_WIDTH / 2;
    this.bossNameText = this.add.text(bx, GAME_HEIGHT - 30, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#ff6666',
    }).setOrigin(0.5).setVisible(false);

    this.bossHealthBarBg = this.add.rectangle(bx, GAME_HEIGHT - 18, 200, 12, 0x333333)
      .setOrigin(0.5).setVisible(false);
    this.bossHealthBarFill = this.add.rectangle(bx - 100, GAME_HEIGHT - 18, 200, 12, 0xcc4444)
      .setOrigin(0, 0.5).setVisible(false);

    // Listen for events from GameScene
    const gameScene = this.scene.get(SCENE_KEYS.GAME);

    gameScene.events.on('boss-fight-start', (bossType: string, health: number, maxHealth: number) => {
      this.bossHealthVisible = true;
      const name = bossType.replace(/_/g, ' ').toUpperCase();
      this.bossNameText.setText(name).setVisible(true);
      this.bossHealthBarBg.setVisible(true);
      this.bossHealthBarFill.setVisible(true);
      this.updateBossHealth(health, maxHealth);
    });

    gameScene.events.on('boss-health-change', (health: number, maxHealth: number) => {
      this.updateBossHealth(health, maxHealth);
    });

    // Player callbacks
    this.player.onHealthChange = (health: number, maxHealth: number) => {
      this.updatePlayerHealth(health, maxHealth);
    };

    // Initial update
    this.updatePlayerHealth(this.player.health, this.player.maxHealth);
  }

  update(): void {
    // Update form display if it changed
    const currentForm = this.formSystem.getCurrentForm();
    const formName = FORM_NAMES[currentForm];
    if (this.formText.text !== formName) {
      this.formText.setText(formName);
      this.formIcon.setFillStyle(FORM_STATS[currentForm].color);
    }
  }

  private updatePlayerHealth(health: number, maxHealth: number): void {
    const percent = Math.max(0, health / maxHealth);
    this.healthBarFill.setDisplaySize(100 * percent, 10);

    // Color changes based on health
    if (percent > 0.5) {
      this.healthBarFill.setFillStyle(0x44cc44);
    } else if (percent > 0.25) {
      this.healthBarFill.setFillStyle(0xcccc44);
    } else {
      this.healthBarFill.setFillStyle(0xcc4444);
    }

    this.healthText.setText(`HP ${Math.ceil(health)}/${maxHealth}`);
  }

  private updateBossHealth(health: number, maxHealth: number): void {
    const percent = Math.max(0, health / maxHealth);
    this.bossHealthBarFill.setDisplaySize(200 * percent, 12);
  }
}
