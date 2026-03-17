import Phaser from 'phaser';
import { SCENE_KEYS, StageId, BossType, FormType, Difficulty, ProjectileOwner } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, TILE_SIZE, GRAVITY, DEPTH, STAGE_CONFIGS, BOSS_CONFIGS, FORM_NAMES } from '../constants';
import { Player } from '../entities/Player';
import { BaseEnemy } from '../entities/enemies/BaseEnemy';
import { createEnemy } from '../entities/enemies/EnemyFactory';
import { BaseBoss } from '../entities/bosses/BaseBoss';
import { createBoss } from '../entities/bosses/BossFactory';
import { Projectile } from '../entities/Projectile';
import { FormSystem } from '../systems/FormSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { SaveSystem } from '../systems/SaveSystem';
import { LevelManager } from '../levels/LevelManager';
import { Pickup, PickupType, rollEnemyDrop } from '../entities/Pickup';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private boss: BaseBoss | null = null;
  private levelManager!: LevelManager;
  private formSystem!: FormSystem;
  private difficultySystem!: DifficultySystem;
  private saveSystem!: SaveSystem;

  private stageId!: StageId;
  private bossType!: BossType;
  private bossActive: boolean = false;
  private bossDefeated: boolean = false;

  private escKey!: Phaser.Input.Keyboard.Key;
  private tabKey!: Phaser.Input.Keyboard.Key;
  private formToggleKey!: Phaser.Input.Keyboard.Key;

  // Melee attack hitbox (temporary zone)
  private meleeZone: Phaser.GameObjects.Zone | null = null;
  private meleeBody: Phaser.Physics.Arcade.Body | null = null;

  // Pickups
  private pickups: Pickup[] = [];

  constructor() {
    super(SCENE_KEYS.GAME);
  }

  init(data: { stageId: StageId }): void {
    this.stageId = data.stageId || StageId.HUGE_KNIGHT;
    this.bossType = STAGE_CONFIGS[this.stageId].boss;
    this.bossActive = false;
    this.bossDefeated = false;
    this.boss = null;
  }

  create(): void {
    // Systems
    this.saveSystem = new SaveSystem();
    this.saveSystem.load();

    this.formSystem = new FormSystem();
    // Restore unlocked forms from save
    const savedData = this.saveSystem.getData();
    this.formSystem.deserialize(savedData.unlockedForms);
    if (savedData.currentForm && this.formSystem.isFormUnlocked(savedData.currentForm)) {
      this.formSystem.setForm(savedData.currentForm);
    }

    this.difficultySystem = new DifficultySystem();
    const diff = (this.registry.get('difficulty') as Difficulty) || Difficulty.NORMAL;
    this.difficultySystem.setDifficulty(diff);
    const mult = this.difficultySystem.getMultipliers();

    // Build level
    this.levelManager = new LevelManager(this, this.stageId);
    this.levelManager.build(mult.enemyHealth, mult.enemyDamage, mult.enemySpeed);

    // Physics world bounds
    this.physics.world.setBounds(
      0, 0,
      this.levelManager.worldWidth,
      this.levelManager.worldHeight + 200, // extra below for falling
    );
    this.physics.world.gravity.y = GRAVITY;

    // Create player
    this.player = new Player(
      this,
      this.levelManager.playerSpawn.x,
      this.levelManager.playerSpawn.y,
      this.formSystem,
      this.difficultySystem,
    );

    this.player.onDeath = () => {
      this.player.onHealthChange = null;
      this.scene.stop(SCENE_KEYS.UI);
      this.scene.start(SCENE_KEYS.GAME_OVER, { victory: false, stageId: this.stageId });
    };

    // Camera
    this.cameras.main.setBounds(0, 0, this.levelManager.worldWidth, this.levelManager.worldHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);

    // ── Collisions ──

    // Player vs solid tiles
    this.physics.add.collider(this.player, this.levelManager.solidTiles);

    // Player vs platforms (one-way)
    const platformCollider = this.physics.add.collider(this.player, this.levelManager.platformTiles);

    // Player vs spikes
    this.physics.add.overlap(this.player, this.levelManager.spikeTiles, () => {
      this.player.takeDamage(5);
    });

    // Player vs vine barriers (pass through unless burning)
    this.physics.add.collider(this.player, this.levelManager.vineTiles);

    // Player vs breakable blocks
    this.physics.add.collider(this.player, this.levelManager.breakableTiles);

    // Player vs boss door (solid barrier until opened)
    this.physics.add.collider(this.player, this.levelManager.bossDoorTiles);

    // Set up enemy collisions
    this.levelManager.enemies.forEach(enemy => {
      this.setupEnemyCollisions(enemy);
    });

    // Player projectiles vs vine barriers
    this.physics.add.overlap(this.player.projectiles, this.levelManager.vineTiles, (proj, tile) => {
      const projectile = proj as Projectile;
      if (projectile.getData('burnsVines')) {
        this.levelManager.destroyVineTile(tile as Phaser.Physics.Arcade.Sprite);
        projectile.destroy();
      }
    });

    // ── Melee attack event ──
    this.events.on('player-melee-attack', (data: { x: number; y: number; width: number; height: number; damage: number; dirX: number }) => {
      this.handleMeleeAttack(data);
    });

    // ── Block smash event ──
    this.events.on('player-block-smash', (data: { x: number; y: number; width: number; height: number }) => {
      this.handleBlockSmash(data);
    });

    // ── Boss summon event ──
    this.events.on('boss-summon', (x: number, y: number) => {
      // Spawn a random enemy near the boss
      const enemies = STAGE_CONFIGS[this.stageId].enemies;
      if (enemies.length > 0) {
        const type = enemies[Math.floor(Math.random() * enemies.length)];
        const mult = this.difficultySystem.getMultipliers();
        const enemy = createEnemy(this, x + (Math.random() > 0.5 ? 40 : -40), y, type, mult.enemyHealth, mult.enemyDamage, mult.enemySpeed);
        this.setupEnemyCollisions(enemy);
        this.levelManager.enemies.push(enemy);
      }
    });

    // ── Boss petrify event ──
    this.events.on('boss-petrify', (x: number, y: number, dir: number) => {
      // Create danger zone visual
      const zone = this.add.rectangle(
        x + dir * 100, y, 200, 40, 0xaa44aa, 0.3,
      ).setDepth(DEPTH.PROJECTILES);

      // Warning flicker
      this.tweens.add({
        targets: zone,
        alpha: 0.6,
        yoyo: true,
        repeat: 2,
        duration: 200,
        onComplete: () => {
          // Check if player is in zone
          if (Phaser.Geom.Rectangle.Overlaps(
            zone.getBounds(),
            this.player.getBounds(),
          )) {
            this.player.takeDamage(4);
          }
          zone.destroy();
        },
      });
    });

    // ── Check for boss room entry ──
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.checkBossRoomEntry(),
    });

    // ── Input ──
    if (this.input.keyboard) {
      this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
      this.tabKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TAB);
      this.formToggleKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    }

    // Launch UI overlay
    this.scene.launch(SCENE_KEYS.UI, {
      formSystem: this.formSystem,
      player: this.player,
    });
  }

  update(time: number, delta: number): void {
    if (!this.player || !this.player.active) return;

    this.player.update(time, delta);

    // Update enemies
    this.levelManager.enemies.forEach(enemy => {
      if (enemy.active) enemy.update(time, delta);
    });

    // Update boss
    if (this.boss && this.boss.active) {
      this.boss.update(time, delta);
    }

    // Update pickups
    for (let i = this.pickups.length - 1; i >= 0; i--) {
      const pickup = this.pickups[i];
      if (!pickup.active) {
        this.pickups.splice(i, 1);
        continue;
      }
      pickup.update(time, delta);
    }

    // Pause
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.scene.pause();
      this.scene.launch(SCENE_KEYS.PAUSE, { gameScene: this });
    }

    // Fast form toggle (Q key)
    if (this.formToggleKey && Phaser.Input.Keyboard.JustDown(this.formToggleKey)) {
      this.cycleForm();
    }

    // Form menu
    if (this.tabKey && Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.scene.pause();
      this.scene.launch(SCENE_KEYS.FORM_MENU, {
        formSystem: this.formSystem,
        player: this.player,
      });
    }
  }

  private setupEnemyCollisions(enemy: BaseEnemy): void {
    enemy.setPlayerReference(this.player);

    this.physics.add.collider(enemy, this.levelManager.solidTiles);
    this.physics.add.collider(enemy, this.levelManager.platformTiles);
    this.physics.add.collider(enemy, this.levelManager.breakableTiles);

    // Player touching enemy = take damage
    this.physics.add.overlap(this.player, enemy, () => {
      if (enemy.isAlive()) {
        this.player.takeDamage(enemy.damage);
      }
    });

    // Player projectiles vs enemy
    this.physics.add.overlap(this.player.projectiles, enemy, (a, b) => {
      const projectile = (a instanceof Projectile ? a : b) as Projectile;
      const target = (a instanceof BaseEnemy ? a : b) as BaseEnemy;
      if (target.isAlive()) {
        target.takeDamage(projectile.damage);
        if (!projectile.piercing) projectile.destroy();
      }
    });

    // Enemy projectiles vs player
    this.physics.add.overlap(enemy.projectiles, this.player, (a, b) => {
      const projectile = (a instanceof Projectile ? a : b) as Projectile;
      this.player.takeDamage(projectile.damage);
      projectile.destroy();
    });

    // Drop pickup on death
    enemy.onDeathCallback = (x: number, y: number) => {
      this.spawnPickup(x, y);
    };
  }

  private spawnPickup(x: number, y: number): void {
    const pickup = rollEnemyDrop(this, x, y);
    if (!pickup) return;

    this.pickups.push(pickup);
    this.physics.add.collider(pickup, this.levelManager.solidTiles);
    this.physics.add.collider(pickup, this.levelManager.platformTiles);

    this.physics.add.overlap(this.player, pickup, () => {
      if (!pickup.active) return;
      if (pickup.pickupType === PickupType.ENERGY) {
        this.player.restoreEnergy(pickup.value);
      } else {
        this.player.heal(pickup.value);
      }
      // Collect effect
      const particles = this.add.particles(pickup.x, pickup.y, 'particle', {
        speed: { min: 30, max: 80 },
        lifespan: 300,
        quantity: 4,
        scale: { start: 0.8, end: 0 },
        tint: pickup.pickupType === PickupType.ENERGY ? 0x4488ff : 0x44cc44,
      });
      this.time.delayedCall(400, () => particles.destroy());
      pickup.destroy();
    });
  }

  private handleMeleeAttack(data: { x: number; y: number; width: number; height: number; damage: number; dirX: number }): void {
    const attackRect = new Phaser.Geom.Rectangle(
      data.x - data.width / 2,
      data.y - data.height / 2,
      data.width,
      data.height,
    );

    // Check against enemies
    this.levelManager.enemies.forEach(enemy => {
      if (!enemy.isAlive()) return;
      const enemyBounds = enemy.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(attackRect, enemyBounds)) {
        enemy.takeDamage(data.damage);
      }
    });

    // Check against boss
    if (this.boss && this.boss.isAlive()) {
      const bossBounds = this.boss.getBounds();
      if (Phaser.Geom.Rectangle.Overlaps(attackRect, bossBounds)) {
        this.boss.takeDamage(data.damage, this.formSystem.getCurrentForm());
      }
    }

    // Check against vine barriers (demon form)
    if (this.formSystem.getCurrentForm() === FormType.DEMON ||
        this.formSystem.getCurrentForm() === FormType.MASTER) {
      this.levelManager.vineTiles.children.each(child => {
        const tile = child as Phaser.Physics.Arcade.Sprite;
        if (Phaser.Geom.Rectangle.Overlaps(attackRect, tile.getBounds())) {
          this.levelManager.destroyVineTile(tile);
        }
        return true;
      });
    }

    // Visual slash effect
    const slash = this.add.rectangle(data.x, data.y, data.width, data.height, 0xffffff, 0.5);
    slash.setDepth(DEPTH.PARTICLES);
    this.tweens.add({
      targets: slash,
      alpha: 0,
      scaleX: 1.5,
      duration: 150,
      onComplete: () => slash.destroy(),
    });
  }

  private handleBlockSmash(data: { x: number; y: number; width: number; height: number }): void {
    const smashRect = new Phaser.Geom.Rectangle(
      data.x - data.width / 2,
      data.y - data.height / 2,
      data.width,
      data.height,
    );

    this.levelManager.breakableTiles.children.each(child => {
      const tile = child as Phaser.Physics.Arcade.Sprite;
      if (Phaser.Geom.Rectangle.Overlaps(smashRect, tile.getBounds())) {
        this.levelManager.destroyBreakableTile(tile);
      }
      return true;
    });
  }

  private cycleForm(): void {
    const unlocked = this.formSystem.getUnlockedForms();
    if (unlocked.length <= 1) return;

    const current = this.formSystem.getCurrentForm();
    const currentIdx = unlocked.indexOf(current);
    const nextIdx = (currentIdx + 1) % unlocked.length;
    const nextForm = unlocked[nextIdx];

    this.player.switchForm(nextForm);
    this.saveSystem.setCurrentForm(nextForm);

    // Notify UI to show toggle popup
    this.events.emit('form-toggled', FORM_NAMES[nextForm]);
  }

  private checkBossRoomEntry(): void {
    if (this.bossActive || this.bossDefeated) return;
    if (this.levelManager.bossDoorTiles.countActive() === 0) return;

    // Check if player is near the boss door
    let nearDoor = false;
    this.levelManager.bossDoorTiles.children.each(child => {
      const tile = child as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tile.x, tile.y);
      if (dist < 48) nearDoor = true;
      return true;
    });

    if (nearDoor) {
      this.openBossDoor();
    }
  }

  private openBossDoor(): void {
    // Freeze player briefly for dramatic effect
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setAllowGravity(false);

    // Camera shake
    this.cameras.main.shake(300, 0.005);

    // Store door positions before they're destroyed
    const doorPositions: { x: number; y: number }[] = [];
    this.levelManager.bossDoorTiles.children.each(child => {
      const tile = child as Phaser.Physics.Arcade.Sprite;
      doorPositions.push({ x: tile.x, y: tile.y });
      return true;
    });

    // Open the door (destroys door tiles with particle effect)
    this.levelManager.openBossDoor();

    // Brief pause then resume, seal the room, and start boss fight
    this.time.delayedCall(500, () => {
      body.setAllowGravity(true);

      // Seal the entrance with solid tiles so player can't leave
      doorPositions.forEach(pos => {
        const seal = this.levelManager.solidTiles.create(pos.x, pos.y, 'tile_solid') as Phaser.Physics.Arcade.Sprite;
        seal.setDisplaySize(TILE_SIZE, TILE_SIZE);
        seal.setDepth(DEPTH.TILES);
        seal.setTint(0x664422);
        seal.refreshBody();
      });

      this.startBossFight();
    });
  }

  private startBossFight(): void {
    this.bossActive = true;
    const mult = this.difficultySystem.getMultipliers();

    this.boss = createBoss(
      this,
      this.levelManager.bossSpawn.x,
      this.levelManager.bossSpawn.y,
      this.bossType,
      mult.enemyHealth,
      mult.enemyDamage,
    );

    if (this.levelManager.bossRoomBounds) {
      const b = this.levelManager.bossRoomBounds;
      this.boss.setBossRoom(b.left, b.right, b.top, b.bottom);
    }

    this.boss.setPlayerReference(this.player);

    // Collisions
    this.physics.add.collider(this.boss, this.levelManager.solidTiles);

    // Boss projectiles vs player
    this.physics.add.overlap(this.boss.projectiles, this.player, (a, b) => {
      const projectile = (a instanceof Projectile ? a : b) as Projectile;
      this.player.takeDamage(projectile.damage);
      projectile.destroy();
    });

    // Player projectiles vs boss
    this.physics.add.overlap(this.player.projectiles, this.boss, (a, b) => {
      const projectile = (a instanceof Projectile ? a : b) as Projectile;
      const bossRef = (a instanceof BaseBoss ? a : b) as BaseBoss;
      if (bossRef.isAlive()) {
        bossRef.takeDamage(projectile.damage, this.formSystem.getCurrentForm());
        if (!projectile.piercing) projectile.destroy();
      }
    });

    // Player touching boss = damage
    this.physics.add.overlap(this.player, this.boss, () => {
      if (this.boss && this.boss.isAlive()) {
        this.player.takeDamage(this.boss.damage);
      }
    });

    // Boss health change -> UI event
    this.boss.onHealthChange = (health, maxHealth) => {
      this.events.emit('boss-health-change', health, maxHealth);
    };

    // Boss death
    this.boss.onDeath = () => {
      this.bossDefeated = true;
      this.bossActive = false;

      // Unlock form
      const newForm = this.formSystem.unlockFormForBoss(this.bossType);

      // Save progress
      this.saveSystem.addDefeatedBoss(this.bossType);
      if (newForm) this.saveSystem.addUnlockedForm(newForm);
      this.saveSystem.save();

      // Check if all bosses beaten -> unlock hard mode
      const allBossTypes = [BossType.HUGE_KNIGHT, BossType.DEMON_BOSS, BossType.HEADLESS_HORSEMAN,
                           BossType.WITCH, BossType.CERBERUS, BossType.MEDUSA];
      const allBeaten = allBossTypes.every(b => this.saveSystem.isBossDefeated(b));
      if (allBeaten && this.bossType === BossType.DRAGON) {
        this.saveSystem.unlockHardMode();
      }

      // Victory screen
      this.time.delayedCall(2000, () => {
        this.player.onHealthChange = null;
        this.scene.stop(SCENE_KEYS.UI);
        this.scene.start(SCENE_KEYS.VICTORY, {
          stageId: this.stageId,
          newForm: newForm,
          formSystem: this.formSystem,
        });
      });
    };

    // Emit event for UI to show boss health bar
    this.events.emit('boss-fight-start', this.boss.config.type, this.boss.health, this.boss.maxHealth);
  }
}
