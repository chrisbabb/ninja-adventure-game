import Phaser from 'phaser';
import { BossConfig, BossType, BossPhase, BossAttackPattern, FormType } from '../../types';
import { DEPTH } from '../../constants';
import { createEnemyProjectile, Projectile } from '../Projectile';
import { WeaknessSystem } from '../../systems/WeaknessSystem';

export enum BossState {
  INTRO = 'intro',
  IDLE = 'idle',
  MOVING = 'moving',
  ATTACKING = 'attacking',
  HURT = 'hurt',
  PHASE_TRANSITION = 'phase_transition',
  DEAD = 'dead',
}

export class BaseBoss extends Phaser.Physics.Arcade.Sprite {
  config: BossConfig;
  health: number;
  maxHealth: number;
  damage: number;
  state: BossState = BossState.INTRO;
  facingRight: boolean = false;

  private currentPhaseIndex: number = 0;
  private stateTimer: number = 0;
  private attackCooldownTimer: number = 0;
  private currentAttack: BossAttackPattern | null = null;
  private attackProgress: number = 0;
  private introTimer: number = 0;

  projectiles: Phaser.Physics.Arcade.Group;
  private playerRef: Phaser.Physics.Arcade.Sprite | null = null;
  private weaknessSystem: WeaknessSystem;

  private bossRoom: { left: number; right: number; top: number; bottom: number };

  // Attack-specific state
  private teleportTarget: { x: number; y: number } | null = null;
  private attackSubState: number = 0;

  onDeath: (() => void) | null = null;
  onHealthChange: ((health: number, maxHealth: number) => void) | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    config: BossConfig,
    healthMult: number = 1,
    damageMult: number = 1,
  ) {
    super(scene, x, y, `boss_${config.type}`);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.config = config;
    this.maxHealth = Math.round(config.health * healthMult);
    this.health = this.maxHealth;
    this.damage = Math.round(config.damage * damageMult);

    this.setDepth(DEPTH.ENEMIES + 5);
    this.setDisplaySize(config.width, config.height);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(config.width * 0.8, config.height * 0.85);
    body.setOffset(
      (this.width - config.width * 0.8) / 2,
      (this.height - config.height * 0.85),
    );
    body.setCollideWorldBounds(false);

    // Boss room bounds (will be set externally)
    this.bossRoom = { left: x - 200, right: x + 200, top: y - 200, bottom: y + 100 };

    this.weaknessSystem = new WeaknessSystem();

    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
    });
  }

  setBossRoom(left: number, right: number, top: number, bottom: number): void {
    this.bossRoom = { left, right, top, bottom };
  }

  setPlayerReference(player: Phaser.Physics.Arcade.Sprite): void {
    this.playerRef = player;
  }

  private getCurrentPhase(): BossPhase {
    return this.config.phases[this.currentPhaseIndex];
  }

  private checkPhaseTransition(): void {
    const healthPercent = this.health / this.maxHealth;
    for (let i = this.config.phases.length - 1; i > this.currentPhaseIndex; i--) {
      if (healthPercent <= this.config.phases[i].healthThreshold) {
        this.currentPhaseIndex = i;
        this.state = BossState.PHASE_TRANSITION;
        this.stateTimer = 0;
        // Flash effect
        this.scene.tweens.add({
          targets: this,
          alpha: 0.3,
          yoyo: true,
          repeat: 3,
          duration: 150,
        });
        return;
      }
    }
  }

  update(time: number, delta: number): void {
    if (!this.active || !this.body) return;

    this.stateTimer += delta;
    const body = this.body as Phaser.Physics.Arcade.Body;

    switch (this.state) {
      case BossState.INTRO:
        this.updateIntro(delta);
        break;
      case BossState.IDLE:
        this.updateIdle(delta);
        break;
      case BossState.MOVING:
        this.updateMoving(delta);
        break;
      case BossState.ATTACKING:
        this.updateAttacking(delta);
        break;
      case BossState.HURT:
        this.updateHurt(delta);
        break;
      case BossState.PHASE_TRANSITION:
        this.updatePhaseTransition(delta);
        break;
      case BossState.DEAD:
        break;
    }

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer -= delta;
    }

    // Face player
    if (this.playerRef && this.state !== BossState.DEAD && this.state !== BossState.INTRO) {
      this.facingRight = this.playerRef.x > this.x;
      this.setFlipX(!this.facingRight);
    }
  }

  private updateIntro(delta: number): void {
    this.introTimer += delta;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);

    if (this.introTimer > 1500) {
      this.state = BossState.IDLE;
      this.stateTimer = 0;
    }
  }

  private updateIdle(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(0);

    if (this.attackCooldownTimer <= 0) {
      // Choose next action: move or attack
      if (Math.random() < 0.4) {
        this.state = BossState.MOVING;
        this.stateTimer = 0;
      } else {
        this.selectAndStartAttack();
      }
    } else if (this.stateTimer > 500) {
      // Move while waiting for cooldown
      this.state = BossState.MOVING;
      this.stateTimer = 0;
    }
  }

  private updateMoving(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    const phase = this.getCurrentPhase();

    if (!this.playerRef) return;

    const dirToPlayer = this.playerRef.x > this.x ? 1 : -1;
    const distToPlayer = Math.abs(this.playerRef.x - this.x);

    // Move toward player but keep some distance
    if (distToPlayer > 100) {
      body.setVelocityX(dirToPlayer * phase.speed);
    } else if (distToPlayer < 60) {
      body.setVelocityX(-dirToPlayer * phase.speed * 0.7);
    } else {
      body.setVelocityX(0);
    }

    // Constrain to boss room
    if (this.x < this.bossRoom.left + 20) body.setVelocityX(Math.abs(body.velocity.x));
    if (this.x > this.bossRoom.right - 20) body.setVelocityX(-Math.abs(body.velocity.x));

    // Transition to attack
    if (this.stateTimer > 800 && this.attackCooldownTimer <= 0) {
      this.selectAndStartAttack();
    }

    if (this.stateTimer > 2000) {
      this.state = BossState.IDLE;
      this.stateTimer = 0;
    }
  }

  private selectAndStartAttack(): void {
    const phase = this.getCurrentPhase();
    const patterns = phase.attackPatterns;

    // Weighted random selection
    const totalWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let selected = patterns[0];
    for (const pattern of patterns) {
      roll -= pattern.weight;
      if (roll <= 0) {
        selected = pattern;
        break;
      }
    }

    this.currentAttack = selected;
    this.attackProgress = 0;
    this.attackSubState = 0;
    this.state = BossState.ATTACKING;
    this.stateTimer = 0;
  }

  private updateAttacking(delta: number): void {
    if (!this.currentAttack || !this.playerRef) return;

    this.attackProgress += delta;

    // Execute attack pattern based on boss type and attack name
    this.executeAttack(this.currentAttack.name, this.attackProgress, delta);

    if (this.attackProgress >= this.currentAttack.duration) {
      this.attackCooldownTimer = this.currentAttack.cooldown;
      this.currentAttack = null;
      this.state = BossState.IDLE;
      this.stateTimer = 0;
    }
  }

  private executeAttack(name: string, progress: number, delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!this.playerRef) return;

    const dirToPlayer = this.playerRef.x > this.x ? 1 : -1;

    switch (name) {
      // ── Generic attacks used by multiple bosses ──
      case 'sword_slam':
      case 'claw_swipe':
      case 'tail_sweep':
      case 'shadow_slash':
      case 'triple_bite':
        // Melee lunge
        if (this.attackSubState === 0) {
          body.setVelocityX(dirToPlayer * this.getCurrentPhase().speed * 2);
          this.attackSubState = 1;
        }
        if (progress > 300) {
          body.setVelocityX(0);
        }
        break;

      case 'shield_charge':
      case 'horse_charge':
      case 'pounce':
        // Fast charge across room
        if (this.attackSubState === 0) {
          body.setVelocityX(dirToPlayer * this.getCurrentPhase().speed * 3);
          this.attackSubState = 1;
        }
        break;

      case 'ground_pound':
      case 'tail_slam':
        // Jump and slam
        if (this.attackSubState === 0) {
          body.setVelocityY(-350);
          this.attackSubState = 1;
        }
        if (progress > 500 && this.attackSubState === 1 && body.blocked.down) {
          // Shockwave projectiles
          this.spawnShockwave();
          this.attackSubState = 2;
        }
        break;

      case 'sword_combo':
      case 'spectral_wave':
      case 'stone_burst':
        // Multi-hit: spawn spread projectiles
        if (this.attackSubState === 0) {
          this.spawnSpreadProjectiles(5, 200);
          this.attackSubState = 1;
        }
        break;

      case 'fire_blast':
      case 'snake_shot':
      case 'potion_throw':
      case 'hex_beam':
        // Single aimed projectile
        if (this.attackSubState === 0) {
          const dir = Phaser.Math.Angle.Between(this.x, this.y, this.playerRef.x, this.playerRef.y);
          this.spawnProjectile(Math.cos(dir) * 200, Math.sin(dir) * 200);
          this.attackSubState = 1;
        }
        break;

      case 'teleport_strike':
        // Teleport near player then strike
        if (this.attackSubState === 0) {
          this.setAlpha(0.3);
          this.attackSubState = 1;
        }
        if (progress > 300 && this.attackSubState === 1) {
          // Teleport to player's position
          const targetX = Phaser.Math.Clamp(
            this.playerRef.x + (Math.random() > 0.5 ? 60 : -60),
            this.bossRoom.left + 30,
            this.bossRoom.right - 30,
          );
          this.setPosition(targetX, this.y);
          this.setAlpha(1);
          body.setVelocityX(dirToPlayer * 300);
          this.attackSubState = 2;
        }
        break;

      case 'fire_pillar':
      case 'cauldron_blast':
      case 'inferno':
        // Multiple projectiles aimed up then raining down
        if (this.attackSubState === 0) {
          for (let i = 0; i < 4; i++) {
            const offsetX = (i - 1.5) * 60;
            this.scene.time.delayedCall(i * 200, () => {
              if (this.active) {
                this.spawnProjectile(0, -250, this.playerRef!.x + offsetX - this.x, -100);
              }
            });
          }
          this.attackSubState = 1;
        }
        break;

      case 'demon_rage':
      case 'howl':
        // Radial burst of projectiles
        if (this.attackSubState === 0) {
          this.spawnRadialProjectiles(8, 180);
          this.attackSubState = 1;
        }
        break;

      case 'head_throw':
        // Boomerang projectile
        if (this.attackSubState === 0) {
          const p = this.spawnProjectile(dirToPlayer * 250, -50);
          if (p) {
            this.scene.time.delayedCall(600, () => {
              if (p.active) {
                p.setVelocity(-dirToPlayer * 250, 50);
              }
            });
          }
          this.attackSubState = 1;
        }
        break;

      case 'summon_minion':
        // Visual effect (actual minion spawning handled by GameScene)
        if (this.attackSubState === 0) {
          this.setTint(0xff00ff);
          this.scene.time.delayedCall(500, () => this.clearTint());
          this.scene.events.emit('boss-summon', this.x, this.y);
          this.attackSubState = 1;
        }
        break;

      case 'petrify_gaze':
        // Warning beam then damage zone
        if (this.attackSubState === 0) {
          // Emit event for GameScene to create danger zone
          this.scene.events.emit('boss-petrify', this.x, this.y, dirToPlayer);
          this.attackSubState = 1;
        }
        break;

      case 'fire_breath':
        // Stream of projectiles
        if (progress % 200 < delta && this.attackSubState < 5) {
          this.spawnProjectile(dirToPlayer * 220, (Math.random() - 0.5) * 60);
          this.attackSubState++;
        }
        break;

      case 'dive_bomb':
        // Fly up then dive at player
        if (this.attackSubState === 0) {
          body.setAllowGravity(false);
          body.setVelocityY(-300);
          this.attackSubState = 1;
        }
        if (progress > 500 && this.attackSubState === 1) {
          const angle = Phaser.Math.Angle.Between(this.x, this.y, this.playerRef.x, this.playerRef.y);
          body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);
          this.attackSubState = 2;
        }
        if (body.blocked.down && this.attackSubState === 2) {
          body.setAllowGravity(true);
          body.setVelocity(0, 0);
          this.spawnShockwave();
          this.attackSubState = 3;
        }
        break;

      case 'fire_rain':
        // Projectiles from above
        if (progress % 250 < delta) {
          const rainX = this.bossRoom.left + Math.random() * (this.bossRoom.right - this.bossRoom.left);
          this.spawnProjectile(0, 200, rainX - this.x, -200);
        }
        break;
    }
  }

  private spawnProjectile(velX: number, velY: number, offsetX: number = 0, offsetY: number = 0): Projectile | null {
    if (!this.active) return null;
    const proj = createEnemyProjectile(
      this.scene,
      this.x + offsetX,
      this.y + offsetY,
      velX, velY,
      this.damage,
    );
    this.projectiles.add(proj);
    return proj;
  }

  private spawnShockwave(): void {
    this.spawnProjectile(-200, 0);
    this.spawnProjectile(200, 0);
  }

  private spawnSpreadProjectiles(count: number, speed: number): void {
    const angleStep = Math.PI / (count - 1);
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + angleStep * i;
      this.spawnProjectile(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  private spawnRadialProjectiles(count: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.spawnProjectile(Math.cos(angle) * speed, Math.sin(angle) * speed);
    }
  }

  private updateHurt(delta: number): void {
    if (this.stateTimer > 400) {
      this.clearTint();
      this.state = BossState.IDLE;
      this.stateTimer = 0;
    }
  }

  private updatePhaseTransition(delta: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, body.velocity.y);

    if (this.stateTimer > 1200) {
      this.state = BossState.IDLE;
      this.stateTimer = 0;
      this.attackCooldownTimer = 0;
    }
  }

  takeDamage(amount: number, attackerForm: FormType): number {
    if (this.state === BossState.DEAD || this.state === BossState.INTRO) return 0;

    const multiplier = this.weaknessSystem.getDamageMultiplier(attackerForm, this.config.type);
    if (multiplier === 0) return 0; // Immune

    const finalDamage = Math.round(amount * multiplier);
    this.health -= finalDamage;

    // Visual feedback
    if (multiplier >= 2) {
      this.setTint(0xffff00); // Super effective flash
    } else {
      this.setTint(0xff6666);
    }

    this.onHealthChange?.(this.health, this.maxHealth);

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return finalDamage;
    }

    // Check for phase transition
    const prevPhase = this.currentPhaseIndex;
    this.checkPhaseTransition();
    if (this.currentPhaseIndex === prevPhase) {
      this.state = BossState.HURT;
      this.stateTimer = 0;
    }

    return finalDamage;
  }

  private die(): void {
    this.state = BossState.DEAD;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    body.setEnable(false);

    // Destroy all projectiles
    this.projectiles.clear(true, true);

    // Epic death animation
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
    });

    // Explosion particles
    const colors = [0xff4400, 0xffaa00, 0xffffff, this.config.color];
    for (let i = 0; i < 4; i++) {
      this.scene.time.delayedCall(i * 300, () => {
        if (!this.scene) return;
        const particles = this.scene.add.particles(
          this.x + (Math.random() - 0.5) * 40,
          this.y + (Math.random() - 0.5) * 40,
          'particle',
          {
            speed: { min: 80, max: 200 },
            lifespan: 600,
            quantity: 12,
            scale: { start: 1.5, end: 0 },
            tint: colors[i],
          },
        );
        this.scene.time.delayedCall(700, () => particles.destroy());
      });
    }

    this.scene.time.delayedCall(1800, () => {
      this.onDeath?.();
    });
  }

  getHealthPercent(): number {
    return this.health / this.maxHealth;
  }

  isAlive(): boolean {
    return this.state !== BossState.DEAD && this.active;
  }
}
