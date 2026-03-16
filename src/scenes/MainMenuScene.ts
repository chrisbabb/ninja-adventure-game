import Phaser from 'phaser';
import { SCENE_KEYS, Difficulty } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';

export class MainMenuScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private menuItems: Phaser.GameObjects.Text[] = [];
  private difficulty: Difficulty = Difficulty.NORMAL;
  private hardModeUnlocked: boolean = false;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private enterKey!: Phaser.Input.Keyboard.Key;
  private titleText!: Phaser.GameObjects.Text;
  private difficultyText!: Phaser.GameObjects.Text;

  constructor() {
    super(SCENE_KEYS.MAIN_MENU);
  }

  init(): void {
    // Load save data to check hard mode
    try {
      const raw = localStorage.getItem('ninja_forms_save');
      if (raw) {
        const data = JSON.parse(raw);
        this.hardModeUnlocked = data.hardModeUnlocked || false;
        this.difficulty = data.difficulty || Difficulty.NORMAL;
      }
    } catch { /* ignore */ }
  }

  create(): void {
    this.menuItems = [];
    this.selectedIndex = 0;
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    // Title
    this.titleText = this.add.text(GAME_WIDTH / 2, 50, 'NINJA FORMS\nSHADOW BLADE', {
      fontFamily: 'monospace',
      fontSize: '24px',
      color: '#ffdd44',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(GAME_WIDTH / 2, 100, 'Press ENTER to select', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#888888',
    }).setOrigin(0.5);

    // Menu items
    const menuY = 130;
    const spacing = 28;
    const items = ['Start Game', `Difficulty: ${this.getDifficultyLabel()}`, 'Settings'];

    items.forEach((label, i) => {
      const text = this.add.text(GAME_WIDTH / 2, menuY + i * spacing, label, {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 1,
      }).setOrigin(0.5);
      this.menuItems.push(text);
    });

    this.difficultyText = this.menuItems[1];
    this.updateSelection();

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

      this.input.keyboard.on('keydown-UP', () => {
        this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
        this.updateSelection();
      });

      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
        this.updateSelection();
      });

      this.input.keyboard.on('keydown-ENTER', () => this.selectItem());
      this.input.keyboard.on('keydown-SPACE', () => this.selectItem());

      this.input.keyboard.on('keydown-LEFT', () => {
        if (this.selectedIndex === 1) this.cycleDifficulty(-1);
      });
      this.input.keyboard.on('keydown-RIGHT', () => {
        if (this.selectedIndex === 1) this.cycleDifficulty(1);
      });
    }

    // Decorative ninja stars
    for (let i = 0; i < 20; i++) {
      const star = this.add.circle(
        Math.random() * GAME_WIDTH,
        Math.random() * GAME_HEIGHT,
        1,
        0x445566,
        Math.random() * 0.5 + 0.2,
      );
      this.tweens.add({
        targets: star,
        alpha: 0,
        yoyo: true,
        repeat: -1,
        duration: 1000 + Math.random() * 2000,
      });
    }
  }

  private getDifficultyLabel(): string {
    switch (this.difficulty) {
      case Difficulty.EASY: return 'Easy';
      case Difficulty.NORMAL: return 'Normal';
      case Difficulty.HARD: return this.hardModeUnlocked ? 'Hard' : 'Locked';
    }
  }

  private cycleDifficulty(dir: number): void {
    const options = [Difficulty.EASY, Difficulty.NORMAL];
    if (this.hardModeUnlocked) options.push(Difficulty.HARD);

    let idx = options.indexOf(this.difficulty);
    idx = (idx + dir + options.length) % options.length;
    this.difficulty = options[idx];

    this.difficultyText.setText(`Difficulty: ${this.getDifficultyLabel()}`);

    // Save preference
    try {
      const raw = localStorage.getItem('ninja_forms_save');
      const data = raw ? JSON.parse(raw) : {};
      data.difficulty = this.difficulty;
      localStorage.setItem('ninja_forms_save', JSON.stringify(data));
    } catch { /* ignore */ }
  }

  private updateSelection(): void {
    this.menuItems.forEach((item, i) => {
      if (i === this.selectedIndex) {
        item.setColor('#ffdd44');
        item.setText('> ' + item.text.replace(/^> /, '') + ' <');
      } else {
        item.setColor('#ffffff');
        item.setText(item.text.replace(/^> /, '').replace(/ <$/, ''));
      }
    });
  }

  private selectItem(): void {
    switch (this.selectedIndex) {
      case 0: // Start Game - always fresh run
        {
          const save = new SaveSystem();
          save.load();
          save.resetProgress(); // clears bosses/forms but keeps hard mode unlock
          save.setDifficulty(this.difficulty);
          this.registry.set('difficulty', this.difficulty);
          this.scene.start(SCENE_KEYS.STAGE_SELECT);
        }
        break;
      case 1: // Difficulty (handled by left/right)
        this.cycleDifficulty(1);
        break;
      case 2: // Settings
        this.scene.start(SCENE_KEYS.SETTINGS);
        break;
    }
  }
}
