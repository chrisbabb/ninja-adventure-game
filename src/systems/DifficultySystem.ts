import { Difficulty } from '../types';
import { DIFFICULTY_MULTIPLIERS } from '../constants';

export class DifficultySystem {
  private difficulty: Difficulty = Difficulty.NORMAL;

  setDifficulty(diff: Difficulty): void {
    this.difficulty = diff;
  }

  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  getMultipliers() {
    return DIFFICULTY_MULTIPLIERS[this.difficulty];
  }

  scaleEnemyHealth(baseHealth: number): number {
    return Math.round(baseHealth * this.getMultipliers().enemyHealth);
  }

  scaleEnemyDamage(baseDamage: number): number {
    return Math.round(baseDamage * this.getMultipliers().enemyDamage);
  }

  scaleEnemySpeed(baseSpeed: number): number {
    return baseSpeed * this.getMultipliers().enemySpeed;
  }

  scalePlayerDamage(baseDamage: number): number {
    return Math.round(baseDamage * this.getMultipliers().playerDamage);
  }
}
