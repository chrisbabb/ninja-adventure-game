import Phaser from 'phaser';
import { BossType } from '../../types';
import { BOSS_CONFIGS } from '../../constants';
import { BaseBoss } from './BaseBoss';

export function createBoss(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: BossType,
  healthMult: number = 1,
  damageMult: number = 1,
): BaseBoss {
  const config = BOSS_CONFIGS[type];
  if (!config) {
    throw new Error(`Unknown boss type: ${type}`);
  }
  return new BaseBoss(scene, x, y, config, healthMult, damageMult);
}
