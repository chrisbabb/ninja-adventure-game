import Phaser from 'phaser';
import { SCENE_KEYS } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class PauseScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.PAUSE);
  }

  create(): void {
    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6);

    this.add.text(GAME_WIDTH / 2, 60, 'PAUSED', {
      fontFamily: 'monospace',
      fontSize: '20px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const items = ['Resume', 'Restart Stage', 'Quit to Menu'];
    const startY = 110;

    items.forEach((label, i) => {
      const text = this.add.text(GAME_WIDTH / 2, startY + i * 28, label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.menuItems.push(text);
    });

    this.selectedIndex = 0;
    this.updateSelection();

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => {
        this.selectedIndex = (this.selectedIndex - 1 + items.length) % items.length;
        this.updateSelection();
      });
      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectedIndex = (this.selectedIndex + 1) % items.length;
        this.updateSelection();
      });
      this.input.keyboard.on('keydown-ENTER', () => this.selectItem());
      this.input.keyboard.on('keydown-SPACE', () => this.selectItem());
      this.input.keyboard.on('keydown-ESC', () => this.resume());
    }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.selectedIndex ? '#ffdd44' : '#ffffff');
    });
  }

  private selectItem(): void {
    switch (this.selectedIndex) {
      case 0: this.resume(); break;
      case 1: this.restart(); break;
      case 2: this.quitToMenu(); break;
    }
  }

  private resume(): void {
    this.scene.stop();
    this.scene.resume(SCENE_KEYS.GAME);
  }

  private restart(): void {
    const stageId = this.registry.get('currentStage');
    this.scene.stop(SCENE_KEYS.UI);
    this.scene.stop();
    this.scene.stop(SCENE_KEYS.GAME);
    this.scene.start(SCENE_KEYS.GAME, { stageId });
  }

  private quitToMenu(): void {
    this.scene.stop(SCENE_KEYS.UI);
    this.scene.stop();
    this.scene.stop(SCENE_KEYS.GAME);
    this.scene.start(SCENE_KEYS.MAIN_MENU);
  }
}
