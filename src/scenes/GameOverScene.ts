import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, REG, SCENES } from '../constants';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: SCENES.GAME_OVER }); }

  create(): void {
    const win   = this.registry.get(REG.WIN) as boolean;
    const score = this.registry.get(REG.SCORE) as number;

    // Background
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky');

    // Big result text
    const resultText = win ? 'STAGE CLEAR!' : 'GAME OVER';
    const resultColor = win ? '#ffee44' : '#ff4444';

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.28, resultText, {
      fontSize: '56px',
      color: resultColor,
      stroke: '#000000',
      strokeThickness: 8,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Sub message
    const subMsg = win
      ? 'You mastered the art of Shadow Stitch!'
      : 'The ninja\'s journey continues...';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.44, subMsg, {
      fontSize: '18px',
      color: '#dddddd',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Score
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.56, `FINAL SCORE:  ${score}`, {
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Outfit breakdown
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.67,
      win
        ? '⚔ Flame Ronin  ·  🗿 Stone Guard  ·  🦅 Sky Tengu  — All outfits mastered!'
        : 'Tip: Weaken enemies first, then press C to steal their outfit!', {
        fontSize: '13px',
        color: win ? '#ffcc44' : '#88aaff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);

    // Play again / title
    const retryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.80, 'Press Z to Play Again', {
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT * 0.89, 'Press T to return to Title', {
      fontSize: '13px',
      color: '#aaaaaa',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: retryText,
      alpha: { from: 1, to: 0.3 },
      yoyo: true,
      repeat: -1,
      duration: 700,
    });

    // Particle celebration for win
    if (win) {
      this.time.addEvent({
        delay: 200,
        callback: () => {
          const colors = [0xffee44, 0xff6600, 0x00aaff, 0xff4488];
          const color  = colors[Phaser.Math.Between(0, colors.length - 1)];
          const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
          const p = this.add.rectangle(x, GAME_HEIGHT + 10, 8, 8, color);
          this.tweens.add({
            targets: p,
            y: Phaser.Math.Between(50, 300),
            alpha: 0,
            angle: Phaser.Math.Between(-180, 180),
            duration: Phaser.Math.Between(1000, 2000),
            onComplete: () => p.destroy(),
          });
        },
        repeat: 30,
      });
    }

    // Input
    this.input.keyboard!.once('keydown-Z', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start(SCENES.GAME));
    });
    this.input.keyboard!.once('keydown-T', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(320, () => this.scene.start(SCENES.TITLE));
    });

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
}
