import Phaser from 'phaser';
import { SCENE_KEYS, StageId } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';

export class GameOverScene extends Phaser.Scene {
  private stageId!: StageId;
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.GAME_OVER);
  }

  init(data: { victory: boolean; stageId: StageId }): void {
    this.stageId = data.stageId;
  }

  create(): void {
    this.menuItems = [];
    this.selectedIndex = 0;
    this.cameras.main.setBackgroundColor(0x0a0000);

    this.add.text(GAME_WIDTH / 2, 60, 'GAME OVER', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#cc4444',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 100, 'The ninja has fallen...', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#888888',
    }).setOrigin(0.5);

    const items = ['Retry Stage', 'Stage Select', 'Main Menu'];
    const startY = 140;

    items.forEach((label, i) => {
      const text = this.add.text(GAME_WIDTH / 2, startY + i * 26, label, {
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
    }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.selectedIndex ? '#ffdd44' : '#ffffff');
    });
  }

  private selectItem(): void {
    switch (this.selectedIndex) {
      case 0:
        this.scene.start(SCENE_KEYS.GAME, { stageId: this.stageId });
        break;
      case 1:
        this.scene.start(SCENE_KEYS.STAGE_SELECT);
        break;
      case 2:
        this.scene.start(SCENE_KEYS.MAIN_MENU);
        break;
    }
  }
}
