import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, SCENES } from '../constants';

export class TitleScene extends Phaser.Scene {
  private blink = true;

  constructor() { super({ key: SCENES.TITLE }); }

  create(): void {
    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky').setScrollFactor(0);

    // Pagoda decorations
    for (let i = 0; i < 3; i++) {
      this.add.image(150 + i * 350, GAME_HEIGHT - 80, 'bg_pagoda').setAlpha(0.6).setScale(1.2);
    }

    // Title drop-in
    const title = this.add.text(GAME_WIDTH / 2, -60, 'SHADOW STITCH', {
      fontSize: '54px',
      color: '#ffee44',
      stroke: '#220011',
      strokeThickness: 8,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      y: GAME_HEIGHT * 0.27,
      ease: 'Bounce.Out',
      duration: 900,
    });

    // Subtitle
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'Steal enemy outfits. Claim their power.', {
      fontSize: '18px',
      color: '#dddddd',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setAlpha(0).setDepth(1);

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: this.children.list[this.children.list.length - 1],
        alpha: 1, duration: 600,
      });
    });

    // Controls info
    const controls = [
      'Arrow Keys / WASD  =  Move',
      'Z  =  Jump  (double-tap for double jump)',
      'X  =  Attack',
      'C  =  Steal outfit  /  Use special power',
      'Shift  =  Dash / Slide',
      'Enter  =  Pause',
    ];
    controls.forEach((line, i) => {
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.56 + i * 22, line, {
        fontSize: '13px',
        color: '#aaccff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5).setAlpha(0.9);
    });

    // Outfit hints
    const hints = [
      { color: 0xff6622, text: '🔥 Flame Ronin  –  Fire projectiles, flame dash' },
      { color: 0x6688cc, text: '🗿 Stone Guard  –  Heavy slam, ground pound' },
      { color: 0x00aaff, text: '🦅 Sky Tengu   –  Glide, wind gust' },
    ];
    hints.forEach((h, i) => {
      const t = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.78 + i * 22, h.text, {
        fontSize: '12px',
        color: `#${h.color.toString(16).padStart(6, '0')}`,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
      this.tweens.add({
        targets: t,
        alpha: { from: 0.5, to: 1 },
        yoyo: true,
        repeat: -1,
        duration: 1800 + i * 300,
        delay: i * 200,
      });
    });

    // Start prompt
    const prompt = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 36, 'Press  Z  or  SPACE  to Start', {
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    // Input
    this.input.keyboard!.once('keydown-Z', this.startGame, this);
    this.input.keyboard!.once('keydown-SPACE', this.startGame, this);
    this.input.keyboard!.once('keydown-ENTER', this.startGame, this);
  }

  private startGame(): void {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(420, () => {
      this.scene.start(SCENES.GAME);
    });
  }
}
