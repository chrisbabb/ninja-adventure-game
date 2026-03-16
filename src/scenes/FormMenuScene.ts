import Phaser from 'phaser';
import { SCENE_KEYS, FormType } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, FORM_NAMES, FORM_STATS } from '../constants';
import { FormSystem } from '../systems/FormSystem';
import { Player } from '../entities/Player';

export class FormMenuScene extends Phaser.Scene {
  private formSystem!: FormSystem;
  private player!: Player;
  private selectedIndex: number = 0;
  private formEntries: { form: FormType; unlocked: boolean }[] = [];
  private formTexts: Phaser.GameObjects.Text[] = [];
  private infoText!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENE_KEYS.FORM_MENU);
  }

  init(data: { formSystem: FormSystem; player: Player }): void {
    this.formSystem = data.formSystem;
    this.player = data.player;
  }

  create(): void {
    this.formEntries = [];
    this.formTexts = [];
    this.selectedIndex = 0;
    // Dim overlay
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7);

    this.add.text(GAME_WIDTH / 2, 20, 'NINJA FORMS', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Build form list
    const allForms = [
      FormType.NORMAL, FormType.DOUBLE_SWORD, FormType.DEMON, FormType.PANDA,
      FormType.WOLF, FormType.ARMORED, FormType.ARCHER, FormType.EXECUTIONER,
      FormType.MASTER,
    ];

    this.formEntries = allForms.map(form => ({
      form,
      unlocked: this.formSystem.isFormUnlocked(form),
    }));

    // Find current form index
    const currentForm = this.formSystem.getCurrentForm();
    this.selectedIndex = this.formEntries.findIndex(e => e.form === currentForm);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    // Layout: 3x3 grid
    const cols = 3;
    const cellW = 140;
    const cellH = 40;
    const startX = GAME_WIDTH / 2 - (cols * cellW) / 2 + cellW / 2;
    const startY = 50;

    this.formEntries.forEach((entry, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const name = entry.unlocked ? FORM_NAMES[entry.form] : '???';
      const color = entry.unlocked ? '#ffffff' : '#555555';
      const isCurrentForm = entry.form === currentForm;

      const text = this.add.text(x, y, name, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: isCurrentForm ? '#ffdd44' : color,
      }).setOrigin(0.5);

      if (entry.unlocked) {
        // Color indicator
        this.add.rectangle(x - 56, y, 8, 8, FORM_STATS[entry.form].color);
      }

      if (isCurrentForm) {
        text.setText('* ' + text.text);
      }

      this.formTexts.push(text);
    });

    // Cursor
    this.cursor = this.add.graphics();
    this.updateCursor();

    // Info panel
    this.infoText = this.add.text(GAME_WIDTH / 2, 190, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa',
      align: 'center',
      wordWrap: { width: 300 },
    }).setOrigin(0.5);
    this.updateInfo();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 15, 'ENTER - Select | TAB/ESC - Close', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#666666',
    }).setOrigin(0.5);

    // Input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.move(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.move(1));
      this.input.keyboard.on('keydown-UP', () => this.move(-3));
      this.input.keyboard.on('keydown-DOWN', () => this.move(3));
      this.input.keyboard.on('keydown-ENTER', () => this.selectForm());
      this.input.keyboard.on('keydown-SPACE', () => this.selectForm());
      this.input.keyboard.on('keydown-TAB', () => this.close());
      this.input.keyboard.on('keydown-ESC', () => this.close());
    }
  }

  private move(offset: number): void {
    const newIdx = this.selectedIndex + offset;
    if (newIdx >= 0 && newIdx < this.formEntries.length) {
      this.selectedIndex = newIdx;
      this.updateCursor();
      this.updateInfo();
    }
  }

  private updateCursor(): void {
    this.cursor.clear();
    const text = this.formTexts[this.selectedIndex];
    if (text) {
      this.cursor.lineStyle(1, 0xffdd44, 1);
      this.cursor.strokeRect(text.x - 60, text.y - 8, 120, 16);
    }
  }

  private updateInfo(): void {
    const entry = this.formEntries[this.selectedIndex];
    if (!entry.unlocked) {
      this.infoText.setText('??? - Not yet unlocked');
      return;
    }

    const stats = FORM_STATS[entry.form];
    const info = [
      `${FORM_NAMES[entry.form]}`,
      `HP: ${stats.maxHealth} | DMG: ${stats.attackDamage} | SPD: ${stats.speed}`,
      `Jumps: ${stats.maxJumps} | Armor: ${Math.round(stats.armor * 100)}%`,
      `Attack: ${stats.attackType} | Range: ${stats.attackRange}`,
      this.getAbilityDescription(entry.form),
    ].join('\n');

    this.infoText.setText(info);
  }

  private getAbilityDescription(form: FormType): string {
    switch (form) {
      case FormType.NORMAL: return 'Balanced ninja. Can damage the Dragon.';
      case FormType.DOUBLE_SWORD: return 'Fast attacks, triple jump.';
      case FormType.DEMON: return 'Flame sword. Burns vine barriers.';
      case FormType.PANDA: return 'Tanky. Extra HP and armor. Single jump only.';
      case FormType.WOLF: return 'Double-tap to dash. Further jumps while dashing.';
      case FormType.ARMORED: return 'Shurikens + dash attack. Good armor.';
      case FormType.ARCHER: return 'Long range arrow attacks.';
      case FormType.EXECUTIONER: return 'Massive damage. Can smash breakable blocks.';
      case FormType.MASTER: return 'All abilities combined. Ultimate ninja form.';
      default: return '';
    }
  }

  private selectForm(): void {
    const entry = this.formEntries[this.selectedIndex];
    if (!entry.unlocked) return;

    this.player.switchForm(entry.form);
    this.close();
  }

  private close(): void {
    this.scene.stop();
    this.scene.resume(SCENE_KEYS.GAME);
  }
}
