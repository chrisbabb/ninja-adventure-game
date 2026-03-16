import { GameSaveData, FormType, BossType, Difficulty } from '../types';

const SAVE_KEY = 'ninja_forms_save';

export class SaveSystem {
  private data: GameSaveData;

  constructor() {
    this.data = this.getDefaultData();
  }

  private getDefaultData(): GameSaveData {
    return {
      unlockedForms: [FormType.NORMAL, FormType.ARCHER],
      defeatedBosses: [],
      currentForm: FormType.NORMAL,
      difficulty: Difficulty.NORMAL,
      hardModeUnlocked: false,
      bestTimes: {},
    };
  }

  save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch {
      // localStorage might be unavailable
    }
  }

  load(): GameSaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        this.data = { ...this.getDefaultData(), ...JSON.parse(raw) };
      }
    } catch {
      this.data = this.getDefaultData();
    }
    return this.data;
  }

  getData(): GameSaveData {
    return this.data;
  }

  setDifficulty(difficulty: Difficulty): void {
    this.data.difficulty = difficulty;
    this.save();
  }

  addDefeatedBoss(boss: BossType): void {
    if (!this.data.defeatedBosses.includes(boss)) {
      this.data.defeatedBosses.push(boss);
    }
    this.save();
  }

  addUnlockedForm(form: FormType): void {
    if (!this.data.unlockedForms.includes(form)) {
      this.data.unlockedForms.push(form);
    }
    this.save();
  }

  setCurrentForm(form: FormType): void {
    this.data.currentForm = form;
    this.save();
  }

  unlockHardMode(): void {
    this.data.hardModeUnlocked = true;
    this.save();
  }

  isHardModeUnlocked(): boolean {
    return this.data.hardModeUnlocked;
  }

  isBossDefeated(boss: BossType): boolean {
    return this.data.defeatedBosses.includes(boss);
  }

  resetProgress(): void {
    const hardMode = this.data.hardModeUnlocked;
    this.data = this.getDefaultData();
    this.data.hardModeUnlocked = hardMode;
    this.save();
  }
}
