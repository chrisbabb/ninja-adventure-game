import Phaser from 'phaser';
import { EnemyConfig, BehaviorType, AttackStyle } from '../../types';
import { DEPTH, ENEMY_SPRITE_DATA, EnemySpriteData } from '../../constants';
import { createEnemyProjectile, Projectile } from '../Projectile';

export enum EnemyState {
  IDLE = 'idle',
  PATROL = 'patrol',
  CHASE = 'chase',
  ATTACK = 'attack',
  HURT = 'hurt',
  DEAD = 'dead',
  AMBUSH_WAIT = 'ambush_wait',
  RETREAT = 'retreat',
}

export class BaseEnemy extends Phaser.Physics.Arcade.Sprite {
  config: EnemyConfig;
  health: number;
  maxHealth: number;
  damage: number;
  state: EnemyState;
  facingRight: boolean = false;
  private patrolDir: number = 1;
  private patrolTimer: number = 0;
  private patrolDuration: number = 2000;
  private attackTimer: number = 0;
  private stateTimer: number = 0;
  private activated: boolean = false;
  private initialX: number;
  private initialY: number;
  private flyBaseY: number;
  private flyOscillation: number = 0;
  projectiles: Phaser.Physics.Arcade.Group;
  private playerRef: Phaser.Physics.Arcade.Sprite | null = null;
  private diveTarget: { x: number; y: number } | null = null;
  private wasOnFloor: boolean = false;
  private edgeCooldown: number = 0;
  private spriteData: EnemySpriteData | null = null;
  private currentAnimKey: string = '';
  private comboCount: number = 0;
  private retreatTimer: number = 0;
  private hasDealtAttackDamage: boolean = false;
  onDeathCallback: ((x: number, y: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: EnemyConfig,
    healthMultiplier: number = 1,
    damageMultiplier: number = 1,
    speedMultiplier: number = 1,
  ) {
    // Use sprite sheet idle texture if available, otherwise procedural
    const sd = ENEMY_SPRITE_DATA[config.type] || null;
    const idleSheetKey = `enemy_${config.type}_idle_sheet`;
    const textureKey = sd && scene.textures.exists(idleSheetKey) ? idleSheetKey : `enemy_${config.type}`;

    super(scene, x, y, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.spriteData = sd && scene.textures.exists(idleSheetKey) ? sd : null;
    this.config = { ...config };
    this.config.speed *= speedMultiplier;
    this.maxHealth = Math.round(config.health * healthMultiplier);
    this.health = this.maxHealth;
    this.damage = Math.round(config.damage * damageMultiplier);

    this.initialX = x;
    this.initialY = y;
    this.flyBaseY = y;

    this.setDepth(DEPTH.ENEMIES);
    this.setDisplaySize(config.width, config.height);

    const body = this.body as Phaser.Physics.Arcade.Body;

    if (this.spriteData) {
      // Sprite-based enemy: body size & offset in source frame coordinates
      body.setSize(this.spriteData.bodyWidth, this.spriteData.bodyHeight);
      body.setOffset(this.spriteData.bodyOffsetX, this.spriteData.bodyOffsetY);
    } else {
      // Procedural enemy: auto-size body
      const bw = config.width * 0.8;
      const bh = config.height * 0.9;
      body.setSize(bw, bh);
      const scaleX = this.scaleX || 1;
      const scaleY = this.scaleY || 1;
      body.setOffset(
        (this.width - bw / scaleX) / 2,
        this.height - bh / scaleY,
      );
    }

    if (config.flying) {
      body.setAllowGravity(false);
    }

    // Set initial state
    if (config.behavior === BehaviorType.AMBUSH) {
      this.state = EnemyState.AMBUSH_WAIT;
    } else {
      this.state = EnemyState.PATROL;
    }

    // Start idle animation if sprite-based
    if (this.spriteData) {
      this.playAnim('idle');
    }

    // Create projectile group for ranged enemies
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
      allowGravity: false,
    });
  }

  setPlayerReference(player: Phaser.Physics.Arcade.Sprite): void {
    this.playerRef = player;
  }

  private playAnim(key: string): void {
    if (!this.spriteData) return;
    const animKey = `enemy_${this.config.type}_${key}`;
    if (this.currentAnimKey === animKey) return;
    if (this.anims.animationManager.exists(animKey)) {
      this.currentAnimKey = animKey;
      this.play(animKey);
    }
  }

  update(time: number, delta: number): void {
    if (!this.active || !this.body) return;

    const body = this.body as Phaser.Physics.Arcade.Body;

    // Keep on ground for non-flying
    if (!this.config.flying && body.velocity.y > 600) {
      body.setVelocityY(600);
    }

    // Edge detection for ground enemies
    if (!this.config.flying) {
      const onFloor = body.blocked.down;

      if (this.wasOnFloor && !onFloor && body.velocity.y >= 0 && this.edgeCooldown <= 0) {
        this.patrolDir *= -1;
        body.setVelocityX(this.patrolDir * this.config.speed * 0.6);
        this.x -= this.patrolDir * -4;
        this.edgeCooldown = 300;
      }

      this.wasOnFloor = onFloor;
    }

    this.edgeCooldown = Math.max(0, this.edgeCooldown - delta);
    this.stateTimer += delta;

    switch (this.state) {
      case EnemyState.AMBUSH_WAIT:
        this.updateAmbush();
        break;
      case EnemyState.PATROL:
        this.updatePatrol(time, delta);
        break;
      case EnemyState.CHASE:
        this.updateChase(delta);
        break;
      case EnemyState.ATTACK:
        this.updateAttack(time, delta);
        break;
      case EnemyState.HURT:
        this.updateHurt(delta);
        break;
      case EnemyState.RETREAT:
        this.updateRetreat(delta);
        break;
      case EnemyState.DEAD:
        break;
    }

    this.attackTimer = Math.max(0, this.attackTimer - delta);

    // Flip sprite based on facing
    this.setFlipX(!this.facingRight);

    // Play animations based on state
    if (this.spriteData) {
      switch (this.state) {
        case EnemyState.IDLE:
        case EnemyState.AMBUSH_WAIT:
          this.playAnim('idle');
          break;
        case EnemyState.PATROL:
        case EnemyState.CHASE:
        case EnemyState.RETREAT:
          this.playAnim('run');
          break;
        case EnemyState.ATTACK:
          // attack anim is set in startAttack
          break;
        case EnemyState.HURT:
          this.playAnim('hurt');
          break;
        case EnemyState.DEAD:
          this.playAnim('death');
          break;
      }
    }
  }

  private getDistToPlayer(): number {
    if (!this.playerRef) return Infinity;
    return Phaser.Math.Distance.Between(this.x, this.y, this.playerRef.x, this.playerRef.y);
  }

  private getHorizDistToPlayer(): number {
    if (!this.playerRef) return Infinity;
    return Math.abs(this.x - this.playerRef.x);
  }

  private getDirToPlayer(): { x: number; y: number } {
    if (!this.playerRef) return { x: 0, y: 0 };
    const angle = Phaser.Math.Angle.Between(this.x, this.y, this.playerRef.x, this.playerRef.y);
    return { x: Math.cos(angle), y: Math.sin(angle) };
  }

  private updateAmbush(): void {
    const dist = this.getDistToPlayer();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, body.velocity.y);

    if (dist < this.config.detectionRange) {
      this.state = EnemyState.CHASE;
      this.stateTimer = 0;
      this.activated = true;
    }
  }

  private updatePatrol(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = this.getDistToPlayer();

    // Check for player detection
    if (dist < this.config.detectionRange && this.playerRef && this.playerRef.active) {
      if (this.config.behavior === BehaviorType.CHASE ||
          this.config.behavior === BehaviorType.FLY_CHASE ||
          this.config.behavior === BehaviorType.FLOAT_CHASE) {
        this.state = EnemyState.CHASE;
        this.stateTimer = 0;
        return;
      }
      // Stationary or patrol enemies attack in range
      if (dist < this.config.attackRange && this.attackTimer <= 0) {
        this.startAttack();
        return;
      }
    }

    this.patrolTimer += delta;

    if (this.config.flying || this.config.behavior === BehaviorType.FLY_PATROL) {
      this.flyOscillation += delta * 0.003;
      const flyY = this.flyBaseY + Math.sin(this.flyOscillation) * 30;
      body.setVelocityX(this.patrolDir * this.config.speed * 0.6);
      body.setVelocityY((flyY - this.y) * 2);
    } else if (this.config.behavior === BehaviorType.STATIONARY) {
      body.setVelocityX(0);
      if (this.playerRef && dist < this.config.detectionRange) {
        this.facingRight = this.playerRef.x > this.x;
      }
    } else {
      body.setVelocityX(this.patrolDir * this.config.speed * 0.6);

      if (body.blocked.left || body.touching.left) {
        this.patrolDir = 1;
      } else if (body.blocked.right || body.touching.right) {
        this.patrolDir = -1;
      }
    }

    if (this.patrolTimer > this.patrolDuration) {
      this.patrolTimer = 0;
      this.patrolDir *= -1;
      this.patrolDuration = 1500 + Math.random() * 2000;
    }

    this.facingRight = this.patrolDir > 0;
  }

  private updateChase(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dist = this.getDistToPlayer();
    const horizDist = this.getHorizDistToPlayer();
    const dir = this.getDirToPlayer();

    if (!this.playerRef || !this.playerRef.active || dist > this.config.detectionRange * 2) {
      this.state = EnemyState.PATROL;
      this.stateTimer = 0;
      return;
    }

    // Face the player
    this.facingRight = dir.x > 0;

    // Attack if in range and cooldown ready
    if (horizDist < this.config.attackRange && this.attackTimer <= 0) {
      this.startAttack();
      return;
    }

    if (this.config.behavior === BehaviorType.FLOAT_CHASE) {
      body.setVelocity(dir.x * this.config.speed, dir.y * this.config.speed);
    } else if (this.config.flying) {
      body.setVelocity(dir.x * this.config.speed, dir.y * this.config.speed * 0.6);
    } else {
      // Ground chase
      if (this.edgeCooldown > 0) {
        body.setVelocityX(0);
        return;
      }

      // Run toward the player at full speed
      body.setVelocityX(dir.x * this.config.speed);

      // Jump if player is above and enemy is on the ground
      if (this.playerRef && this.playerRef.y < this.y - 30 && body.blocked.down) {
        body.setVelocityY(-280);
      }

      // Jump over obstacles (wall ahead)
      if ((body.blocked.left || body.blocked.right) && body.blocked.down) {
        body.setVelocityY(-250);
      }
    }
  }

  private startAttack(): void {
    this.state = EnemyState.ATTACK;
    this.stateTimer = 0;
    this.hasDealtAttackDamage = false;
    this.currentAnimKey = ''; // reset so attack anim replays

    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.config.attackStyle) {
      case AttackStyle.RANGED:
        this.performRangedAttack();
        break;
      case AttackStyle.CHARGE:
        this.performChargeAttack();
        break;
      case AttackStyle.DIVE:
        this.performDiveAttack();
        break;
      case AttackStyle.EXPLODE:
        this.performExplode();
        break;
      case AttackStyle.MELEE:
      default: {
        // Pick combo animation if sprite-based
        if (this.spriteData) {
          const comboAnims = ['attack', 'combo_attack_2', 'combo_attack_3'];
          const animKey = comboAnims[this.comboCount % comboAnims.length];
          // Only use combos that have animations loaded
          const fullKey = `enemy_${this.config.type}_${animKey}`;
          if (this.anims.animationManager.exists(fullKey)) {
            this.currentAnimKey = fullKey;
            this.play(fullKey);
          } else {
            this.playAnim('attack');
          }
          this.comboCount++;
        }

        // Lunge toward the player
        const dir = this.getDirToPlayer();
        body.setVelocityX(dir.x * this.config.speed * 1.8);
        break;
      }
    }

    this.attackTimer = this.config.attackCooldown;
  }

  private updateAttack(time: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;

    const attackDuration = this.config.attackStyle === AttackStyle.CHARGE ? 600 :
                          this.config.attackStyle === AttackStyle.DIVE ? 800 : 500;

    // Emit melee hitbox partway through the attack animation
    if (this.config.attackStyle === AttackStyle.MELEE && !this.hasDealtAttackDamage &&
        this.stateTimer > attackDuration * 0.35) {
      this.hasDealtAttackDamage = true;
      this.emitMeleeHitbox();
    }

    if (this.stateTimer > attackDuration) {
      body.setVelocityX(0);
      if (this.config.flying) body.setVelocityY(0);
      this.diveTarget = null;

      // After melee attack, briefly retreat before chasing again
      if (this.config.attackStyle === AttackStyle.MELEE && this.spriteData) {
        this.state = EnemyState.RETREAT;
        this.stateTimer = 0;
        this.retreatTimer = 300 + Math.random() * 200;
        // Reset combo after 3 hits or randomly
        if (this.comboCount >= 3 || Math.random() < 0.3) {
          this.comboCount = 0;
        }
      } else {
        this.state = EnemyState.CHASE;
        this.stateTimer = 0;
      }
      return;
    }

    // Stop charge attacks at platform edges
    if (this.config.attackStyle === AttackStyle.CHARGE && !this.config.flying && this.edgeCooldown > 0) {
      body.setVelocityX(0);
      return;
    }

    // Continue dive motion
    if (this.config.attackStyle === AttackStyle.DIVE && this.diveTarget) {
      const dir = Phaser.Math.Angle.Between(this.x, this.y, this.diveTarget.x, this.diveTarget.y);
      body.setVelocity(Math.cos(dir) * this.config.speed * 2, Math.sin(dir) * this.config.speed * 2);
    }
  }

  private emitMeleeHitbox(): void {
    if (!this.playerRef) return;

    const dirX = this.facingRight ? 1 : -1;
    const range = this.config.attackRange;
    const hitX = this.x + dirX * (range / 2 + 8);
    const hitY = this.y;
    const hitW = range;
    const hitH = 30;

    const attackRect = new Phaser.Geom.Rectangle(
      hitX - hitW / 2, hitY - hitH / 2, hitW, hitH,
    );
    const playerBounds = this.playerRef.getBounds();

    if (Phaser.Geom.Rectangle.Overlaps(attackRect, playerBounds)) {
      // Access takeDamage through the player reference - emit event instead
      this.scene.events.emit('enemy-melee-attack', {
        x: hitX,
        y: hitY,
        width: hitW,
        height: hitH,
        damage: this.damage,
      });
    }
  }

  private updateRetreat(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const dir = this.getDirToPlayer();

    // Back away from the player briefly
    this.facingRight = dir.x > 0;

    if (this.edgeCooldown <= 0) {
      body.setVelocityX(-dir.x * this.config.speed * 0.6);
    } else {
      body.setVelocityX(0);
    }

    if (this.stateTimer > this.retreatTimer) {
      body.setVelocityX(0);
      this.state = EnemyState.CHASE;
      this.stateTimer = 0;
    }
  }

  private performRangedAttack(): void {
    if (!this.playerRef) return;
    const dir = this.getDirToPlayer();
    const speed = this.config.projectileSpeed || 160;
    const proj = createEnemyProjectile(
      this.scene,
      this.x + dir.x * 16,
      this.y,
      dir.x * speed,
      dir.y * speed * 0.3,
      this.damage,
    );
    this.projectiles.add(proj);
  }

  private performChargeAttack(): void {
    const dir = this.getDirToPlayer();
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(dir.x * this.config.speed * 2.5);
  }

  private performDiveAttack(): void {
    if (!this.playerRef) return;
    this.diveTarget = { x: this.playerRef.x, y: this.playerRef.y };
  }

  private performExplode(): void {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(200, () => {
      this.takeDamage(999);
    });
  }

  private updateHurt(delta: number): void {
    if (this.stateTimer > 300) {
      this.clearTint();
      // After hurt, immediately chase the player
      this.state = EnemyState.CHASE;
      this.stateTimer = 0;
    }
  }

  takeDamage(amount: number): void {
    if (this.state === EnemyState.DEAD) return;

    this.health -= amount;
    this.setTint(0xff0000);

    if (this.health <= 0) {
      this.die();
      return;
    }

    this.state = EnemyState.HURT;
    this.stateTimer = 0;
    this.currentAnimKey = ''; // reset so hurt anim replays

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (this.playerRef) {
      const dir = this.x < this.playerRef.x ? -1 : 1;
      body.setVelocityX(dir * 150);
      if (!this.config.flying) body.setVelocityY(-100);
    }
  }

  private die(): void {
    this.state = EnemyState.DEAD;
    this.currentAnimKey = ''; // reset so death anim plays
    this.onDeathCallback?.(this.x, this.y);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    // Death animation for sprite-based enemies
    const deathAnimKey = `enemy_${this.config.type}_death`;
    if (this.spriteData && this.anims.animationManager.exists(deathAnimKey)) {
      this.play(deathAnimKey);
      this.once('animationcomplete', () => {
        this.scene?.tweens.add({
          targets: this,
          alpha: 0,
          duration: 200,
          onComplete: () => this.destroy(),
        });
      });
    } else {
      // Procedural death effect
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => {
          this.destroy();
        },
      });
    }

    // Spawn particles
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 150 },
      lifespan: 400,
      quantity: 8,
      scale: { start: 1, end: 0 },
      tint: this.config.color,
    });
    this.scene.time.delayedCall(500, () => particles.destroy());
  }

  isAlive(): boolean {
    return this.state !== EnemyState.DEAD && this.active;
  }
}
