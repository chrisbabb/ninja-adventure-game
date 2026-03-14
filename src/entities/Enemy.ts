import Phaser from 'phaser';
import { DEPTH, ENEMY, OutfitType } from '../constants';
import { Projectile } from './Projectile';

export enum EnemyState {
  PATROL  = 'patrol',
  CHASE   = 'chase',
  ATTACK  = 'attack',
  STAGGER = 'stagger',
  DEAD    = 'dead',
}

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  state: EnemyState = EnemyState.PATROL;
  health: number;
  maxHealth: number;
  readonly dropsOutfit: OutfitType;
  readonly moveSpeed: number;

  protected patrolLeft: number;
  protected patrolRight: number;
  protected patrolDir = 1;
  protected attackCooldown = 0;
  protected staggerTimer   = 0;
  protected stateTimer     = 0;

  // Reference to projectile group (set by GameScene)
  projectiles?: Phaser.Physics.Arcade.Group;

  // UI elements
  private healthBar!: Phaser.GameObjects.Graphics;
  private staggerStars: Phaser.GameObjects.Sprite[] = [];
  private stealPromptText!: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    health: number,
    moveSpeed: number,
    patrolRange: number,
    dropsOutfit: OutfitType,
    bodyW: number,
    bodyH: number,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.health      = health;
    this.maxHealth   = health;
    this.moveSpeed   = moveSpeed;
    this.dropsOutfit = dropsOutfit;
    this.patrolLeft  = x - patrolRange;
    this.patrolRight = x + patrolRange;

    this.setDepth(DEPTH.ENEMY);
    this.setOrigin(0.5, 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(bodyW, bodyH);
    body.setMaxVelocityX(this.moveSpeed * 1.5);

    this.createUIElements(scene);
  }

  private createUIElements(scene: Phaser.Scene): void {
    this.healthBar = scene.add.graphics().setDepth(DEPTH.UI);

    this.stealPromptText = scene.add.text(0, 0, '[C] STEAL!', {
      fontSize: '12px',
      color: '#ffee44',
      stroke: '#000000',
      strokeThickness: 3,
      backgroundColor: '#00000066',
      padding: { x: 5, y: 3 },
    })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.UI)
      .setVisible(false);
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  update(time: number, delta: number, playerX: number, playerY: number): void {
    if (this.state === EnemyState.DEAD) return;

    this.attackCooldown = Math.max(0, this.attackCooldown - delta);
    this.staggerTimer   = Math.max(0, this.staggerTimer   - delta);

    const body    = this.body as Phaser.Physics.Arcade.Body;
    const distX   = Math.abs(playerX - this.x);
    const distY   = Math.abs(playerY - this.y);
    const inRange = distX < ENEMY.DETECT_RANGE && distY < 120;

    // State transitions
    if (this.state === EnemyState.STAGGER) {
      if (this.staggerTimer <= 0) this.state = EnemyState.PATROL;
      body.setVelocityX(0);
      this.updateUI(true);
      return;
    }

    if (this.state === EnemyState.ATTACK) {
      if (this.stateTimer <= 0) {
        this.state = inRange ? EnemyState.CHASE : EnemyState.PATROL;
      }
      this.stateTimer -= delta;
      this.updateUI(false);
      return;
    }

    if (inRange) {
      const atk = distX < ENEMY.ATTACK_RANGE && distY < 60;
      if (atk && this.attackCooldown <= 0) {
        this.doAttack(playerX, playerY);
      } else {
        this.state = EnemyState.CHASE;
      }
    } else if (this.state === EnemyState.CHASE) {
      this.state = EnemyState.PATROL;
    }

    this.updateMovement(body, playerX, playerY);
    this.updateUI(false);
  }

  private updateMovement(
    body: Phaser.Physics.Arcade.Body,
    playerX: number,
    playerY: number,
  ): void {
    if (this.state === EnemyState.PATROL) {
      if (this.x <= this.patrolLeft) { this.patrolDir = 1; }
      if (this.x >= this.patrolRight) { this.patrolDir = -1; }
      body.setVelocityX(this.patrolDir * this.moveSpeed);
      this.setFlipX(this.patrolDir < 0);
    } else if (this.state === EnemyState.CHASE) {
      const dir = playerX > this.x ? 1 : -1;
      body.setVelocityX(dir * this.moveSpeed * 1.3);
      this.setFlipX(dir < 0);
    }
  }

  private updateUI(isStaggered: boolean): void {
    // Health bar
    this.healthBar.clear();
    const barW = 30;
    const barH = 4;
    const bx   = this.x - barW / 2;
    const by   = this.y - this.height - 10;
    this.healthBar.fillStyle(0x000000, 0.7);
    this.healthBar.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
    this.healthBar.fillStyle(0xcc2222);
    this.healthBar.fillRect(bx, by, barW, barH);
    const hp = Math.max(0, this.health / this.maxHealth);
    this.healthBar.fillStyle(0x22cc22);
    this.healthBar.fillRect(bx, by, barW * hp, barH);

    // Steal prompt
    const stealVisible = isStaggered && this.health > 0;
    this.stealPromptText.setVisible(stealVisible);
    if (stealVisible) {
      this.stealPromptText.setPosition(this.x, this.y - this.height - 18);
      // Pulse
      const pulse = 0.9 + 0.1 * Math.sin(this.scene.time.now * 0.006);
      this.stealPromptText.setScale(pulse);
    }
  }

  // ── Damage ─────────────────────────────────────────────────────────────────

  takeDamage(amount: number, fromX: number): boolean {
    if (this.state === EnemyState.DEAD) return false;

    this.health -= amount;
    this.setTint(0xff4444);
    this.scene.time.delayedCall(120, () => this.clearTint());

    // Knockback
    const dir = this.x > fromX ? 1 : -1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(
      dir * ENEMY.KNOCKBACK_VX,
      ENEMY.KNOCKBACK_VY,
    );

    // Stagger at 50% HP or if in stagger threshold
    if (this.health <= this.maxHealth / 2 && this.state !== EnemyState.STAGGER) {
      this.enterStagger();
    }

    if (this.health <= 0) {
      this.die();
      return true;
    }

    return false;
  }

  enterStagger(): void {
    this.state = EnemyState.STAGGER;
    this.staggerTimer = ENEMY.STAGGER_MS;
    this.setTint(0xaa88ff);

    // Spawn stagger stars
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add.sprite(
        this.x + Phaser.Math.Between(-16, 16),
        this.y - this.height - 14,
        'stagger_star',
      ).setDepth(DEPTH.FX).setScale(0.8);
      this.staggerStars.push(star);
      this.scene.tweens.add({
        targets: star,
        y: star.y - 8,
        yoyo: true,
        repeat: -1,
        duration: 400 + i * 120,
      });
    }
  }

  die(): void {
    this.state = EnemyState.DEAD;
    this.clearTint();
    this.staggerStars.forEach(s => s.destroy());
    this.healthBar.destroy();
    this.stealPromptText.destroy();

    // Death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 40,
      angle: this.x > 0 ? 60 : -60,
      scaleX: 0,
      scaleY: 0,
      duration: 500,
      onComplete: () => this.destroy(),
    });

    // Particle burst
    for (let i = 0; i < 10; i++) {
      const p = this.scene.add.rectangle(
        this.x + Phaser.Math.Between(-16, 16),
        this.y - 20,
        6, 6,
        this.scene.textures.get(this.texture.key) ? 0xffaa44 : 0xffffff,
      ).setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-50, 50),
        y: p.y + Phaser.Math.Between(-60, 0),
        alpha: 0,
        duration: Phaser.Math.Between(300, 700),
        onComplete: () => p.destroy(),
      });
    }
  }

  // Override in subclasses
  protected abstract doAttack(playerX: number, playerY: number): void;

  destroy(fromScene?: boolean): void {
    this.staggerStars.forEach(s => s.destroy());
    if (this.healthBar) this.healthBar.destroy();
    if (this.stealPromptText) this.stealPromptText.destroy();
    super.destroy(fromScene);
  }
}

// ─── Lantern Soldier → Flame Ronin ────────────────────────────────────────────

export class LanternSoldier extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_lantern', 6, 75, 100, 'flame_ronin', 20, 36);
  }

  protected doAttack(playerX: number, playerY: number): void {
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1000;
    this.attackCooldown = 2200;

    // Throw fireball
    const dir = playerX > this.x ? 1 : -1;
    const fb = new Projectile(
      this.scene,
      this.x + dir * 16, this.y - 20,
      'enemy_fireball', dir * 320, -60,
      1, 'enemy', 2000,
    );
    if (this.projectiles) this.projectiles.add(fb);

    // Attack flash
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.2, scaleY: 0.85,
      yoyo: true,
      duration: 120,
    });
  }
}

// ─── Beetle Samurai → Stone Guard ────────────────────────────────────────────

export class BeetleSamurai extends Enemy {
  private charging = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_beetle', 10, 55, 80, 'stone_guard', 24, 40);
  }

  protected doAttack(playerX: number, playerY: number): void {
    if (this.charging) return;
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1200;
    this.attackCooldown = 2800;
    this.charging = true;

    // Charge attack
    const dir = playerX > this.x ? 1 : -1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 380);
    this.setTint(0xddddff);

    this.scene.time.delayedCall(600, () => {
      this.charging = false;
      this.clearTint();
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    });
  }
}

// ─── Crow Ninja → Sky Tengu ───────────────────────────────────────────────────

export class CrowNinja extends Enemy {
  private floatPhase = 0;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_crow', 7, 90, 110, 'sky_tengu', 22, 34);
    this.baseY = y;
    // Crow ninjas float in the air – no gravity
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  update(time: number, delta: number, playerX: number, playerY: number): void {
    // Float bob
    this.floatPhase += delta * 0.003;
    this.y = this.baseY + Math.sin(this.floatPhase) * 20;
    super.update(time, delta, playerX, playerY);
  }

  protected doAttack(playerX: number, playerY: number): void {
    this.state = EnemyState.ATTACK;
    this.stateTimer = 900;
    this.attackCooldown = 2000;

    // Triple shuriken fan
    const dir = playerX > this.x ? 1 : -1;
    for (let i = -1; i <= 1; i++) {
      const angle = i * 0.25;
      const vx = Math.cos(angle) * dir * 300;
      const vy = Math.sin(angle) * 200;
      const s = new Projectile(
        this.scene,
        this.x + dir * 16, this.y - 16,
        'enemy_shuriken', vx, vy,
        1, 'enemy', 1600,
      );
      if (this.projectiles) this.projectiles.add(s);
    }
  }
}

// ─── Miniboss: General Emberclaw ──────────────────────────────────────────────

export class GeneralEmberclaw extends Enemy {
  private phase = 1;
  private chargeActive = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_boss', 30, 60, 60, 'flame_ronin', 40, 58);
    // Boss has deeper red glow
    this.setTint(0xffaa66);
    this.scene.time.delayedCall(200, () => this.clearTint());
  }

  protected doAttack(playerX: number, playerY: number): void {
    if (this.chargeActive) return;
    this.attackCooldown = this.phase === 2 ? 1400 : 2000;
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1000;

    if (this.phase === 2 && this.attackCooldown > 700) {
      // Phase 2: spread shot
      const dir = playerX > this.x ? 1 : -1;
      for (let i = -2; i <= 2; i++) {
        const angle = i * 0.22;
        const fb = new Projectile(
          this.scene,
          this.x + dir * 24, this.y - 28,
          'enemy_fireball',
          Math.cos(angle) * dir * 340,
          Math.sin(angle) * 120 - 60,
          2, 'enemy', 2200,
        );
        if (this.projectiles) this.projectiles.add(fb);
      }
    } else {
      // Phase 1: charge + fireball
      const dir = playerX > this.x ? 1 : -1;
      this.chargeActive = true;
      (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 500);
      this.setTint(0xff4400);
      this.scene.time.delayedCall(500, () => {
        this.chargeActive = false;
        this.clearTint();
        (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);

        const fb = new Projectile(
          this.scene,
          this.x + dir * 28, this.y - 28,
          'enemy_fireball', dir * 380, -40,
          2, 'enemy', 2000,
        );
        if (this.projectiles) this.projectiles.add(fb);
      });
    }
  }

  takeDamage(amount: number, fromX: number): boolean {
    const died = super.takeDamage(amount, fromX);
    // Enter phase 2 at 50%
    if (!died && this.phase === 1 && this.health <= this.maxHealth / 2) {
      this.phase = 2;
      this.setTint(0xff2200);
      this.scene.time.delayedCall(300, () => this.clearTint());
      this.scene.cameras.main.shake(300, 0.01);
    }
    return died;
  }
}
