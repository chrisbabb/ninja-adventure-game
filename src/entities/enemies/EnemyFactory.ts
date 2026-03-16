import Phaser from 'phaser';
import { EnemyType } from '../../types';
import { ENEMY_CONFIGS } from '../../constants';
import { BaseEnemy } from './BaseEnemy';

export function createEnemy(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: EnemyType,
  healthMult: number = 1,
  damageMult: number = 1,
  speedMult: number = 1,
): BaseEnemy {
  const config = ENEMY_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown enemy type: ${type}`);
  }
  return new BaseEnemy(scene, x, y, config, healthMult, damageMult, speedMult);
}

export function createEnemyGroup(scene: Phaser.Scene): Phaser.Physics.Arcade.Group {
  return scene.physics.add.group({
    classType: BaseEnemy,
    runChildUpdate: true,
  });
}
