import Phaser from 'phaser';
import { SCENE_KEYS, StageId, FormType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, FORM_NAMES, FORM_STATS } from '../constants';

export class VictoryScene extends Phaser.Scene {
  private stageId!: StageId;
  private newForm: FormType | null = null;
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];

  constructor() {
    super(SCENE_KEYS.VICTORY);
  }

  init(data: { stageId: StageId; newForm: FormType | null }): void {
    this.stageId = data.stageId;
    this.newForm = data.newForm;
  }

  create(): void {
    this.menuItems = [];
    this.selectedIndex = 0;
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.add.text(GAME_WIDTH / 2, 40, 'STAGE CLEAR!', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Boss defeated
    if (this.stageId === StageId.DRAGON) {
      this.add.text(GAME_WIDTH / 2, 80, 'THE DRAGON HAS BEEN SLAIN!\nYou are the ultimate ninja!', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#ff8844',
        align: 'center',
      }).setOrigin(0.5);
    }

    // New form unlocked
    if (this.newForm) {
      const stats = FORM_STATS[this.newForm];

      this.add.text(GAME_WIDTH / 2, 100, 'NEW FORM UNLOCKED!', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#44ff44',
      }).setOrigin(0.5);

      // Form icon
      this.add.rectangle(GAME_WIDTH / 2, 125, 24, 24, stats.color)
        .setStrokeStyle(2, 0xffffff);

      this.add.text(GAME_WIDTH / 2, 145, FORM_NAMES[this.newForm], {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      }).setOrigin(0.5);

      // Check for Master unlock
      if (this.newForm === FormType.MASTER || this.checkMasterUnlock()) {
        this.add.text(GAME_WIDTH / 2, 170, 'MASTER NINJA FORM AWAKENED!', {
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#ffdd00',
        }).setOrigin(0.5);
      }
    }

    // Victory particles
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 500, () => {
        const x = GAME_WIDTH * 0.2 + Math.random() * GAME_WIDTH * 0.6;
        const particles = this.add.particles(x, GAME_HEIGHT, 'particle', {
          speed: { min: 50, max: 150 },
          lifespan: 1000,
          quantity: 10,
          angle: { min: -120, max: -60 },
          scale: { start: 1, end: 0 },
          tint: [0xffdd44, 0xff8844, 0xffffff],
        });
        this.time.delayedCall(1200, () => particles.destroy());
      });
    }

    // Menu options
    const items = ['Continue', 'Stage Select', 'Main Menu'];
    const startY = 195;

    items.forEach((label, i) => {
      const text = this.add.text(GAME_WIDTH / 2, startY + i * 22, label, {
        fontFamily: 'monospace',
        fontSize: '10px',
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

  private checkMasterUnlock(): boolean {
    try {
      const raw = localStorage.getItem('ninja_forms_save');
      if (raw) {
        const data = JSON.parse(raw);
        return data.unlockedForms?.includes(FormType.MASTER);
      }
    } catch { /* ignore */ }
    return false;
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, i) => {
      item.setColor(i === this.selectedIndex ? '#ffdd44' : '#ffffff');
    });
  }

  private selectItem(): void {
    switch (this.selectedIndex) {
      case 0: // Continue to stage select
      case 1:
        this.scene.start(SCENE_KEYS.STAGE_SELECT);
        break;
      case 2:
        this.scene.start(SCENE_KEYS.MAIN_MENU);
        break;
    }
  }
}
