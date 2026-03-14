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
// Signature attack: LANTERN SLAM – charges up then drops three fire pillars
// near the player's position (telegraphed, stationary hazards).

export class LanternSoldier extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_lantern', 6, 75, 100, 'flame_ronin', 20, 36);
  }

  protected doAttack(playerX: number, playerY: number): void {
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1400;
    this.attackCooldown = 2600;

    // Telegraph: lantern glows bright then dims
    this.setTint(0xffffaa);
    this.scene.tweens.add({
      targets: this, scaleY: 1.25, scaleX: 0.85, yoyo: true, duration: 250,
    });

    this.scene.time.delayedCall(320, () => {
      if (this.state === EnemyState.DEAD) return;
      this.clearTint();
      this.scene.cameras.main.shake(140, 0.005);

      // Three fire pillars: left, center, right of player
      const groundY = playerY;
      [-70, 0, 70].forEach((ox, i) => {
        this.scene.time.delayedCall(i * 110, () => {
          if (this.state === EnemyState.DEAD) return;
          // Stationary pillar projectile
          const fb = new Projectile(
            this.scene, playerX + ox, groundY - 20,
            'enemy_fireball', 0, 0, 1, 'enemy', 950,
          );
          (fb.body as Phaser.Physics.Arcade.Body).setSize(20, 44);
          fb.setScale(1.6, 3.5);
          if (this.projectiles) this.projectiles.add(fb);

          // Visual column flash
          const flash = this.scene.add.rectangle(
            playerX + ox, groundY - 30, 18, 56, 0xff6600, 0.65,
          ).setDepth(DEPTH.FX);
          this.scene.tweens.add({
            targets: flash, alpha: 0, scaleY: 1.3,
            duration: 600, onComplete: () => flash.destroy(),
          });
        });
      });
    });
  }
}

// ─── Beetle Samurai → Stone Guard ────────────────────────────────────────────
// Signature attack: BEETLE STOMP – leaps toward player then slams down,
// sending shockwave projectiles left and right on impact.

export class BeetleSamurai extends Enemy {
  private stompActive = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_beetle', 10, 55, 80, 'stone_guard', 24, 40);
  }

  protected doAttack(playerX: number, playerY: number): void {
    if (this.stompActive) return;
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1700;
    this.attackCooldown = 3000;
    this.stompActive = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir  = playerX > this.x ? 1 : -1;

    // Telegraph: crouch with green flash
    this.setTint(0x88ff88);
    body.setVelocityX(dir * 60);

    this.scene.time.delayedCall(180, () => {
      if (this.state === EnemyState.DEAD) { this.stompActive = false; return; }
      this.clearTint();
      this.setTint(0xffffff);

      // JUMP toward player
      body.setVelocityX(dir * 220);
      body.setVelocityY(-500);

      // SLAM phase after jump apex
      this.scene.time.delayedCall(460, () => {
        if (this.state === EnemyState.DEAD) { this.stompActive = false; return; }
        this.clearTint();
        this.setTint(0x88ccff);
        body.setVelocityY(800);

        // Landing impact (timer-based – ~370ms to hit ground)
        this.scene.time.delayedCall(370, () => {
          if (this.state === EnemyState.DEAD) { this.stompActive = false; return; }
          this.stompActive = false;
          this.clearTint();
          body.setVelocityX(0);

          this.scene.cameras.main.shake(220, 0.009);

          // Two wide shockwave projectiles racing left and right
          [-1, 1].forEach(sd => {
            const sw = new Projectile(
              this.scene, this.x + sd * 30, this.y - 10,
              'enemy_fireball', sd * 210, 0, 1, 'enemy', 1500,
            );
            (sw.body as Phaser.Physics.Arcade.Body).setSize(28, 18);
            sw.setScale(2.2, 1.2);
            if (this.projectiles) this.projectiles.add(sw);
          });

          // Ground crack visual
          const crack = this.scene.add.rectangle(this.x, this.y - 4, 64, 10, 0xff8800, 0.6)
            .setDepth(DEPTH.FX);
          this.scene.tweens.add({
            targets: crack, alpha: 0, scaleX: 2,
            duration: 500, onComplete: () => crack.destroy(),
          });
        });
      });
    });
  }
}

// ─── Crow Ninja → Sky Tengu ───────────────────────────────────────────────────
// Signature attack: DIVE BOMB – repositions above the player then
// plunges straight down at high speed. Body contact deals damage.

export class CrowNinja extends Enemy {
  private floatPhase = 0;
  private baseY: number;
  private diveBombing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_crow', 7, 90, 110, 'sky_tengu', 22, 34);
    this.baseY = y;
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
  }

  update(time: number, delta: number, playerX: number, playerY: number): void {
    // Only bob when not in dive bomb
    if (!this.diveBombing) {
      this.floatPhase += delta * 0.003;
      this.y = this.baseY + Math.sin(this.floatPhase) * 20;
    }
    super.update(time, delta, playerX, playerY);
  }

  protected doAttack(playerX: number, playerY: number): void {
    if (this.diveBombing) return;
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1600;
    this.attackCooldown = 2800;
    this.diveBombing = true;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Reposition directly above player
    this.x = playerX;
    this.y = this.baseY - 100;
    body.reset(this.x, this.y);

    // Warning flash + camera micro-shake
    this.setTint(0xaaaaff);
    this.scene.cameras.main.shake(70, 0.003);

    this.scene.time.delayedCall(150, () => {
      if (this.state === EnemyState.DEAD) { this.diveBombing = false; return; }
      this.clearTint();
      body.setVelocityX(0);
      body.setVelocityY(820); // DIVE

      // End dive: fly back up to base float height
      this.scene.time.delayedCall(520, () => {
        this.diveBombing = false;
        if (this.state === EnemyState.DEAD) return;
        body.setVelocityY(-220);
        this.scene.time.delayedCall(280, () => {
          if (this.state === EnemyState.DEAD) return;
          body.setVelocityY(0);
          this.y = this.baseY;
        });
      });
    });
  }
}

// ─── Miniboss: General Emberclaw ──────────────────────────────────────────────
// Phase 1: INFERNO STOMP – leaps and slams, spawning 5 fire pillars.
// Phase 2: HELL COMBO – spread shot + inferno stomp combined.

export class GeneralEmberclaw extends Enemy {
  private phase = 1;
  private stompActive = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy_boss', 30, 60, 60, 'flame_ronin', 40, 58);
    this.setTint(0xffaa66);
    this.scene.time.delayedCall(200, () => this.clearTint());
  }

  protected doAttack(playerX: number, playerY: number): void {
    if (this.stompActive) return;
    this.attackCooldown = this.phase === 2 ? 1300 : 1900;
    this.state = EnemyState.ATTACK;
    this.stateTimer = 1400;
    this.stompActive = true;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir  = playerX > this.x ? 1 : -1;

    // Phase 2 fires a spread shot before the stomp
    if (this.phase === 2) {
      this.setTint(0xff2200);
      for (let i = -2; i <= 2; i++) {
        const angle = i * 0.22;
        const fb = new Projectile(
          this.scene, this.x + dir * 24, this.y - 34,
          'enemy_fireball',
          Math.cos(angle) * dir * 360,
          Math.sin(angle) * 130 - 70,
          2, 'enemy', 2200,
        );
        if (this.projectiles) this.projectiles.add(fb);
      }
    } else {
      this.setTint(0xff8800);
    }

    // Both phases: leap + slam
    body.setVelocityX(dir * 180);
    body.setVelocityY(-400);

    this.scene.time.delayedCall(480, () => {
      if (this.state === EnemyState.DEAD) { this.stompActive = false; return; }
      this.clearTint();
      body.setVelocityY(700);

      this.scene.time.delayedCall(380, () => {
        if (this.state === EnemyState.DEAD) { this.stompActive = false; return; }
        this.stompActive = false;
        this.clearTint();
        body.setVelocityX(0);
        this.spawnFloorInferno(playerX, playerY);
      });
    });
  }

  private spawnFloorInferno(playerX: number, playerY: number): void {
    this.scene.cameras.main.shake(320, 0.013);

    // 5 fire pillars spreading outward from player position
    [-120, -60, 0, 60, 120].forEach((ox, i) => {
      this.scene.time.delayedCall(i * 90, () => {
        if (this.state === EnemyState.DEAD) return;
        const fb = new Projectile(
          this.scene, playerX + ox, playerY - 24,
          'enemy_fireball', 0, 0, 2, 'enemy', 1100,
        );
        (fb.body as Phaser.Physics.Arcade.Body).setSize(22, 48);
        fb.setScale(2.0, 4.0);
        if (this.projectiles) this.projectiles.add(fb);

        const flash = this.scene.add.rectangle(
          playerX + ox, playerY - 36, 22, 68, 0xff4400, 0.75,
        ).setDepth(DEPTH.FX);
        this.scene.tweens.add({
          targets: flash, alpha: 0, scaleY: 1.4,
          duration: 750, onComplete: () => flash.destroy(),
        });
      });
    });
  }

  takeDamage(amount: number, fromX: number): boolean {
    const died = super.takeDamage(amount, fromX);
    if (!died && this.phase === 1 && this.health <= this.maxHealth / 2) {
      this.phase = 2;
      this.setTint(0xff2200);
      this.scene.time.delayedCall(300, () => this.clearTint());
      this.scene.cameras.main.shake(300, 0.01);
    }
    return died;
  }
}
