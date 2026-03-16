import { FormType, BossType } from '../types';
import { BOSS_CONFIGS } from '../constants';

export class WeaknessSystem {
  getDamageMultiplier(attackerForm: FormType, bossType: BossType): number {
    const config = BOSS_CONFIGS[bossType];

    // Dragon special rule: only Normal and Master can damage it
    if (bossType === BossType.DRAGON) {
      if (attackerForm === FormType.MASTER) return config.masterDamageMultiplier;
      if (attackerForm === FormType.NORMAL) return 1.0;
      return 0; // immune to all other forms
    }

    // Master Ninja is effective against all bosses
    if (attackerForm === FormType.MASTER) return config.masterDamageMultiplier;

    // Primary weakness
    if (attackerForm === config.weakness) return config.weaknessDamageMultiplier;

    // Normal damage
    return 1.0;
  }

  isImmune(attackerForm: FormType, bossType: BossType): boolean {
    if (bossType === BossType.DRAGON) {
      return attackerForm !== FormType.NORMAL && attackerForm !== FormType.MASTER;
    }
    return false;
  }

  getWeaknessForm(bossType: BossType): FormType {
    return BOSS_CONFIGS[bossType].weakness;
  }
}
