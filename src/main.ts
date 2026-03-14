import Phaser from 'phaser';
import { GAME_HEIGHT, GAME_WIDTH, GRAVITY } from './constants';
import { BootScene }     from './scenes/BootScene';
import { TitleScene }    from './scenes/TitleScene';
import { GameScene }     from './scenes/GameScene';
import { UIScene }       from './scenes/UIScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width:  GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#0d0d1a',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: GRAVITY },
      debug: false,
    },
  },
  scene: [
    BootScene,
    TitleScene,
    GameScene,
    UIScene,
    GameOverScene,
  ],
  render: {
    pixelArt: false,
    antialias: true,
  },
};

new Phaser.Game(config);
