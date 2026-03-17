import Phaser from 'phaser';
import { SCENE_KEYS } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from '../constants';
import { attachGamepadMenu } from '../utils/GamepadMenu';

interface SettingItem {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  key: string;
}

export class SettingsScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private settings: SettingItem[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private barGraphics: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super(SCENE_KEYS.SETTINGS);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.add.text(GAME_WIDTH / 2, 30, 'SETTINGS', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.settings = [
      {
        label: 'Music Volume',
        value: this.registry.get('musicVolume') ?? 0.7,
        min: 0, max: 1, step: 0.1,
        key: 'musicVolume',
      },
      {
        label: 'SFX Volume',
        value: this.registry.get('sfxVolume') ?? 0.8,
        min: 0, max: 1, step: 0.1,
        key: 'sfxVolume',
      },
    ];

    const startY = 80;
    const spacing = 50;

    this.settings.forEach((setting, i) => {
      const y = startY + i * spacing;

      const label = this.add.text(GAME_WIDTH / 2, y, setting.label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.texts.push(label);

      // Volume bar
      const barG = this.add.graphics();
      this.barGraphics.push(barG);
      this.drawBar(barG, GAME_WIDTH / 2 - 60, y + 16, 120, 8, setting.value);

      const valText = this.add.text(GAME_WIDTH / 2 + 70, y + 12, `${Math.round(setting.value * 100)}%`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#aaaaaa',
      }).setOrigin(0, 0.5);
      this.texts.push(valText);
    });

    // Controls info
    const ctrlY = startY + this.settings.length * spacing + 20;
    this.add.text(GAME_WIDTH / 2, ctrlY, 'CONTROLS', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#ffdd44',
    }).setOrigin(0.5);

    const controls = [
      'Arrows / L-Stick  -  Move',
      'Space / A btn     -  Jump',
      'Z / X btn         -  Attack',
      'X / Y btn         -  Special',
      'C / RB            -  Dash',
      'ESC / Start       -  Pause',
      'Q / LB            -  Cycle Form',
      'TAB / Select      -  Form Menu',
    ];
    controls.forEach((ctrl, i) => {
      this.add.text(GAME_WIDTH / 2, ctrlY + 18 + i * 14, ctrl, {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#aaaaaa',
      }).setOrigin(0.5);
    });

    // Back button
    const backText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 20, 'ESC - Back to Menu', {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#888888',
    }).setOrigin(0.5);

    this.updateSelection();

    // Input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-UP', () => {
        this.selectedIndex = (this.selectedIndex - 1 + this.settings.length) % this.settings.length;
        this.updateSelection();
      });
      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectedIndex = (this.selectedIndex + 1) % this.settings.length;
        this.updateSelection();
      });
      this.input.keyboard.on('keydown-LEFT', () => this.adjustSetting(-1));
      this.input.keyboard.on('keydown-RIGHT', () => this.adjustSetting(1));
      this.input.keyboard.on('keydown-ESC', () => {
        this.scene.start(SCENE_KEYS.MAIN_MENU);
      });
    }

    attachGamepadMenu(this, {
      onUp: () => {
        this.selectedIndex = (this.selectedIndex - 1 + this.settings.length) % this.settings.length;
        this.updateSelection();
      },
      onDown: () => {
        this.selectedIndex = (this.selectedIndex + 1) % this.settings.length;
        this.updateSelection();
      },
      onLeft: () => this.adjustSetting(-1),
      onRight: () => this.adjustSetting(1),
      onBack: () => this.scene.start(SCENE_KEYS.MAIN_MENU),
    });
  }

  private drawBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, value: number): void {
    g.clear();
    g.fillStyle(0x333333, 1);
    g.fillRect(x, y, w, h);
    g.fillStyle(0x44aacc, 1);
    g.fillRect(x, y, w * value, h);
    g.lineStyle(1, 0x556677, 1);
    g.strokeRect(x, y, w, h);
  }

  private adjustSetting(dir: number): void {
    const setting = this.settings[this.selectedIndex];
    setting.value = Phaser.Math.Clamp(
      Math.round((setting.value + dir * setting.step) * 10) / 10,
      setting.min,
      setting.max,
    );

    this.registry.set(setting.key, setting.value);
    this.drawBar(
      this.barGraphics[this.selectedIndex],
      GAME_WIDTH / 2 - 60,
      80 + this.selectedIndex * 50 + 16,
      120, 8,
      setting.value,
    );

    // Update percentage text (it's at index selectedIndex * 2 + 1)
    const valTextIdx = this.selectedIndex * 2 + 1;
    if (this.texts[valTextIdx]) {
      this.texts[valTextIdx].setText(`${Math.round(setting.value * 100)}%`);
    }
  }

  private updateSelection(): void {
    this.texts.forEach((text, i) => {
      // Labels are at even indices
      if (i % 2 === 0) {
        const settingIdx = Math.floor(i / 2);
        text.setColor(settingIdx === this.selectedIndex ? '#ffdd44' : '#ffffff');
      }
    });
  }
}
