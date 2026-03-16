import Phaser from 'phaser';
import { SCENE_KEYS, StageId, BossType, Difficulty } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, STAGE_CONFIGS, BOSS_CONFIGS } from '../constants';
import { SaveSystem } from '../systems/SaveSystem';

interface StageOption {
  stageId: StageId;
  name: string;
  bossType: BossType;
  color: number;
  defeated: boolean;
}

export class StageSelectScene extends Phaser.Scene {
  private selectedIndex: number = 0;
  private stages: StageOption[] = [];
  private stageTexts: Phaser.GameObjects.Text[] = [];
  private portraits: Phaser.GameObjects.Image[] = [];
  private saveSystem: SaveSystem;
  private infoText!: Phaser.GameObjects.Text;
  private cursor!: Phaser.GameObjects.Graphics;

  constructor() {
    super(SCENE_KEYS.STAGE_SELECT);
    this.saveSystem = new SaveSystem();
  }

  create(): void {
    this.stages = [];
    this.stageTexts = [];
    this.portraits = [];
    this.selectedIndex = 0;
    this.saveSystem.load();
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.add.text(GAME_WIDTH / 2, 20, 'SELECT STAGE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#ffdd44',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Build stage list (6 selectable + dragon if all beaten)
    const selectableStages: StageId[] = [
      StageId.HUGE_KNIGHT, StageId.DEMON_BOSS, StageId.HEADLESS_HORSEMAN,
      StageId.WITCH, StageId.CERBERUS, StageId.MEDUSA,
    ];

    this.stages = selectableStages.map(id => {
      const cfg = STAGE_CONFIGS[id];
      return {
        stageId: id,
        name: cfg.name,
        bossType: cfg.boss,
        color: BOSS_CONFIGS[cfg.boss].color,
        defeated: this.saveSystem.isBossDefeated(cfg.boss),
      };
    });

    // Check if dragon stage unlocked (all 6 bosses defeated)
    const allDefeated = selectableStages.every(id =>
      this.saveSystem.isBossDefeated(STAGE_CONFIGS[id].boss)
    );
    if (allDefeated) {
      const dragonCfg = STAGE_CONFIGS[StageId.DRAGON];
      this.stages.push({
        stageId: StageId.DRAGON,
        name: dragonCfg.name,
        bossType: dragonCfg.boss,
        color: BOSS_CONFIGS[dragonCfg.boss].color,
        defeated: this.saveSystem.isBossDefeated(BossType.DRAGON),
      });
    }

    // Layout: 2 rows of 3 (+ 1 for dragon)
    const cols = 3;
    const cellW = 130;
    const cellH = 80;
    const startX = GAME_WIDTH / 2 - (cols * cellW) / 2 + cellW / 2;
    const startY = 60;

    this.stages.forEach((stage, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * (cellH + 10);

      // Portrait
      const portrait = this.add.image(x, y, `stage_portrait_${stage.bossType}`);
      portrait.setDisplaySize(48, 48);
      if (stage.defeated) {
        portrait.setAlpha(0.5);
      }
      this.portraits.push(portrait);

      // Stage name
      const text = this.add.text(x, y + 32, stage.name, {
        fontFamily: 'monospace',
        fontSize: '7px',
        color: stage.defeated ? '#666666' : '#ffffff',
        align: 'center',
      }).setOrigin(0.5);
      this.stageTexts.push(text);

      // Defeated checkmark
      if (stage.defeated) {
        this.add.text(x + 20, y - 20, '✓', {
          fontFamily: 'monospace',
          fontSize: '14px',
          color: '#44cc44',
        }).setOrigin(0.5);
      }
    });

    // Selection cursor
    this.cursor = this.add.graphics();
    this.updateCursor();

    // Info text at bottom
    this.infoText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 30, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#aaaaaa',
      align: 'center',
    }).setOrigin(0.5);
    this.updateInfo();

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 12, 'ENTER - Select | ESC - Back', {
      fontFamily: 'monospace',
      fontSize: '7px',
      color: '#666666',
    }).setOrigin(0.5);

    // Input
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1, 0));
      this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1, 0));
      this.input.keyboard.on('keydown-UP', () => this.moveSelection(0, -1));
      this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(0, 1));
      this.input.keyboard.on('keydown-ENTER', () => this.selectStage());
      this.input.keyboard.on('keydown-SPACE', () => this.selectStage());
      this.input.keyboard.on('keydown-ESC', () => {
        this.scene.start(SCENE_KEYS.MAIN_MENU);
      });
    }
  }

  private moveSelection(dx: number, dy: number): void {
    const cols = 3;
    const col = this.selectedIndex % cols;
    const row = Math.floor(this.selectedIndex / cols);

    let newCol = col + dx;
    let newRow = row + dy;

    if (newCol < 0) newCol = cols - 1;
    if (newCol >= cols) newCol = 0;
    if (newRow < 0) newRow = Math.floor((this.stages.length - 1) / cols);
    if (newRow > Math.floor((this.stages.length - 1) / cols)) newRow = 0;

    const newIdx = newRow * cols + newCol;
    if (newIdx < this.stages.length) {
      this.selectedIndex = newIdx;
      this.updateCursor();
      this.updateInfo();
    }
  }

  private updateCursor(): void {
    this.cursor.clear();
    if (this.portraits[this.selectedIndex]) {
      const p = this.portraits[this.selectedIndex];
      this.cursor.lineStyle(2, 0xffdd44, 1);
      this.cursor.strokeRect(p.x - 28, p.y - 28, 56, 56);
    }
  }

  private updateInfo(): void {
    const stage = this.stages[this.selectedIndex];
    const bossName = stage.bossType.replace(/_/g, ' ').toUpperCase();
    const status = stage.defeated ? ' [DEFEATED]' : '';
    this.infoText.setText(`Boss: ${bossName}${status}`);
  }

  private selectStage(): void {
    const stage = this.stages[this.selectedIndex];
    this.registry.set('currentStage', stage.stageId);
    this.registry.set('currentBoss', stage.bossType);
    this.scene.start(SCENE_KEYS.GAME, { stageId: stage.stageId });
  }
}
