import { FormType, BossType } from '../types';
import { FORM_STATS } from '../constants';

export class FormSystem {
  private unlockedForms: Set<FormType> = new Set([FormType.NORMAL, FormType.ARCHER]);
  private currentForm: FormType = FormType.NORMAL;

  getCurrentForm(): FormType {
    return this.currentForm;
  }

  getCurrentStats() {
    return FORM_STATS[this.currentForm];
  }

  setForm(form: FormType): boolean {
    if (!this.unlockedForms.has(form)) return false;
    this.currentForm = form;
    return true;
  }

  unlockForm(form: FormType): void {
    this.unlockedForms.add(form);
    this.checkMasterUnlock();
  }

  isFormUnlocked(form: FormType): boolean {
    return this.unlockedForms.has(form);
  }

  getUnlockedForms(): FormType[] {
    return Array.from(this.unlockedForms);
  }

  unlockFormForBoss(bossType: BossType): FormType | null {
    const bossFormMap: Partial<Record<BossType, FormType>> = {
      [BossType.HUGE_KNIGHT]: FormType.ARMORED,
      [BossType.DEMON_BOSS]: FormType.DEMON,
      [BossType.HEADLESS_HORSEMAN]: FormType.DOUBLE_SWORD,
      [BossType.WITCH]: FormType.PANDA,
      [BossType.CERBERUS]: FormType.WOLF,
      [BossType.MEDUSA]: FormType.EXECUTIONER,
    };

    const form = bossFormMap[bossType];
    if (form) {
      this.unlockForm(form);
      return form;
    }
    return null;
  }

  private checkMasterUnlock(): void {
    const requiredForms = [
      FormType.DOUBLE_SWORD, FormType.DEMON, FormType.PANDA,
      FormType.WOLF, FormType.ARMORED, FormType.ARCHER, FormType.EXECUTIONER,
    ];
    if (requiredForms.every(f => this.unlockedForms.has(f))) {
      this.unlockedForms.add(FormType.MASTER);
    }
  }

  hasAllBossForms(): boolean {
    return this.unlockedForms.has(FormType.MASTER);
  }

  serialize(): FormType[] {
    return Array.from(this.unlockedForms);
  }

  deserialize(forms: FormType[]): void {
    this.unlockedForms = new Set(forms);
  }
}
