import Phaser from 'phaser';
import { FormType, SpecialAbility, ProjectileOwner } from '../types';
import {
  FORM_STATS, DEPTH, GRAVITY, MAX_FALL_SPEED,
  COYOTE_TIME, JUMP_BUFFER_TIME, INVINCIBILITY_TIME, KNOCKBACK_FORCE,
  WOLF_FAST_RUN_SPEED, WOLF_FAST_RUN_JUMP_BOOST, DOUBLE_TAP_WINDOW,
  GAME_WIDTH,
} from '../constants';
import { FormSystem } from '../systems/FormSystem';
import { DifficultySystem } from '../systems/DifficultySystem';
import { Projectile, createShuriken, createArrow, createFlame } from './Projectile';

export enum PlayerState {
  IDLE = 'idle',
  RUN = 'run',
  JUMP = 'jump',
  FALL = 'fall',
  ATTACK = 'attack',
  HURT = 'hurt',
  DEAD = 'dead',
  DASH = 'dash',
  WALL_SLIDE = 'wall_slide',
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  formSystem: FormSystem;
  difficultySystem: DifficultySystem;

  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number = 100;
  state: PlayerState = PlayerState.IDLE;
  facingRight: boolean = true;

  // Jump tracking
  private jumpsRemaining: number = 2;
  private isGrounded: boolean = false;
  private coyoteTimer: number = 0;
  private jumpBufferTimer: number = 0;
  private wasGrounded: boolean = false;

  // Attack tracking
  private attackTimer: number = 0;
  private attackCooldown: number = 0;
  private canAttack: boolean = true;
  private comboStep: number = 0; // 0, 1, 2 for the 3-hit combo
  private comboWindowTimer: number = 0; // time left to chain next attack
  private comboWindow: number = 500; // ms to input next combo hit
  private attackAnimDuration: number = 0; // current attack anim length
  private isAttacking: boolean = false;

  // Invincibility
  private invincible: boolean = false;
  private invincibilityTimer: number = 0;

  // Wolf form fast run
  private fastRunning: boolean = false;
  private lastLeftTap: number = 0;
  private lastRightTap: number = 0;
  private prevLeft: boolean = false;
  private prevRight: boolean = false;

  // Dash (Armored form)
  private isDashing: boolean = false;
  private dashTimer: number = 0;
  private dashCooldown: number = 0;
  private dashDuration: number = 250;

  // Projectiles
  projectiles: Phaser.Physics.Arcade.Group;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private attackKey!: Phaser.Input.Keyboard.Key;
  private jumpKey!: Phaser.Input.Keyboard.Key;
  private specialKey!: Phaser.Input.Keyboard.Key;
  private dashKey!: Phaser.Input.Keyboard.Key;

  // Callbacks
  onDeath: (() => void) | null = null;
  onHealthChange: ((health: number, maxHealth: number) => void) | null = null;
  onEnergyChange: ((energy: number, maxEnergy: number) => void) | null = null;

  // Wall slide / wall jump
  private wallSlideDir: number = 0;
  private wallJumpLockTimer: number = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    formSystem: FormSystem,
    difficultySystem: DifficultySystem,
  ) {
    // Use first idle frame if available, otherwise fall back to procedural texture
    const hasIdleSheet = scene.textures.exists('player_idle_sheet');
    const hasIdleProc = scene.textures.exists('player_idle_f0');
    const initialTexture = hasIdleSheet ? 'player_idle_sheet' : hasIdleProc ? 'player_idle_f0' : 'player';
    super(scene, x, y, initialTexture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.formSystem = formSystem;
    this.difficultySystem = difficultySystem;

    const stats = formSystem.getCurrentStats();
    this.maxHealth = stats.maxHealth;
    this.health = this.maxHealth;
    this.energy = this.maxEnergy;

    this.setDepth(DEPTH.PLAYER);
    this.setDisplaySize(80, 80);

    const body = this.body as Phaser.Physics.Arcade.Body;
    // Character occupies x:34-58, y:29-65 in the 96x96 frame
    // Body tightly wraps the visible pixels
    body.setSize(25, 37);
    body.setOffset(34, 29);
    body.setMaxVelocityY(MAX_FALL_SPEED);
    body.setCollideWorldBounds(false);

    // Input
    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.attackKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
      this.jumpKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.specialKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
      this.dashKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.C);
    }

    // Projectile group
    this.projectiles = scene.physics.add.group({
      classType: Projectile,
      runChildUpdate: true,
      allowGravity: false,
    });

    this.applyFormStats();

    // Start idle animation if available
    if (scene.anims.exists('player_idle')) {
      this.play('player_idle');
    }
  }

  applyFormStats(): void {
    const stats = this.formSystem.getCurrentStats();
    this.maxHealth = stats.maxHealth;
    if (this.health > this.maxHealth) this.health = this.maxHealth;
    this.jumpsRemaining = stats.maxJumps;
    // Only tint when not playing a sprite animation
    const hasAnim = this.state === PlayerState.IDLE || this.state === PlayerState.RUN || this.state === PlayerState.JUMP || this.state === PlayerState.FALL || this.state === PlayerState.ATTACK;
    if (!hasAnim) {
      this.setTint(stats.color);
    }
    this.onHealthChange?.(this.health, this.maxHealth);
  }

  switchForm(form: FormType): boolean {
    if (!this.formSystem.setForm(form)) return false;
    this.applyFormStats();
    return true;
  }

  update(time: number, delta: number): void {
    if (!this.active || !this.body) return;
    if (this.state === PlayerState.DEAD) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const stats = this.formSystem.getCurrentStats();

    // Passive energy regeneration (3 per second)
    if (this.energy < this.maxEnergy) {
      this.energy = Math.min(this.maxEnergy, this.energy + 3 * (delta / 1000));
      this.onEnergyChange?.(this.energy, this.maxEnergy);
    }

    // Ground check
    this.wasGrounded = this.isGrounded;
    this.isGrounded = body.blocked.down || body.touching.down;

    if (this.isGrounded) {
      this.jumpsRemaining = stats.maxJumps;
      this.coyoteTimer = COYOTE_TIME;
      this.wallJumpLockTimer = 0;
      this.fastRunning = this.fastRunning && (this.cursors.left.isDown || this.cursors.right.isDown);
    } else {
      this.coyoteTimer = Math.max(0, this.coyoteTimer - delta);
    }

    // Invincibility
    if (this.invincible) {
      this.invincibilityTimer -= delta;
      if (this.invincibilityTimer <= 0) {
        this.invincible = false;
        this.setAlpha(1);
      } else {
        // Flicker
        this.setAlpha(Math.sin(time * 0.02) > 0 ? 1 : 0.3);
      }
    }

    // Dash cooldown
    if (this.dashCooldown > 0) this.dashCooldown -= delta;

    // Handle states
    if (this.state === PlayerState.HURT) {
      this.updateHurt(delta);
      return;
    }

    if (this.isDashing) {
      this.updateDash(delta);
      return;
    }

    // ── Movement ──

    // Wolf form double-tap fast run detection
    if (stats.specialAbility === SpecialAbility.FAST_RUN || stats.specialAbility === SpecialAbility.MASTER_ALL) {
      this.detectDoubleTap(time);
    }

    // Wall jump lock prevents input from overriding wall jump velocity
    if (this.wallJumpLockTimer > 0) {
      this.wallJumpLockTimer -= delta;
    } else {
      let moveSpeed = stats.speed;
      if (this.fastRunning) {
        moveSpeed = WOLF_FAST_RUN_SPEED;
      }

      let moveX = 0;
      if (this.cursors.left.isDown) {
        moveX = -moveSpeed;
        this.facingRight = false;
      } else if (this.cursors.right.isDown) {
        moveX = moveSpeed;
        this.facingRight = true;
      }

      body.setVelocityX(moveX);
    }
    this.setFlipX(!this.facingRight);

    // ── Wall Slide ──
    this.wallSlideDir = 0;
    if (!this.isGrounded && this.wallJumpLockTimer <= 0 &&
        ((body.blocked.left && this.cursors.left.isDown) || (body.blocked.right && this.cursors.right.isDown))) {
      this.wallSlideDir = body.blocked.left ? -1 : 1;
      if (body.velocity.y > 50) {
        body.setVelocityY(50); // Slow fall
        this.state = PlayerState.WALL_SLIDE;
      }
    }

    // ── Jump ──
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - delta);

    const jumpJustPressed = Phaser.Input.Keyboard.JustDown(this.jumpKey) || Phaser.Input.Keyboard.JustDown(this.cursors.up);
    if (jumpJustPressed) {
      this.jumpBufferTimer = JUMP_BUFFER_TIME;
    }

    // Wall jump takes priority over regular jump
    if (this.wallSlideDir !== 0 && jumpJustPressed) {
      body.setVelocityX(-this.wallSlideDir * stats.speed * 1.3);
      body.setVelocityY(stats.jumpForce * 0.85);
      this.facingRight = this.wallSlideDir < 0;
      this.wallJumpLockTimer = 150; // Brief lock so input doesn't override kick-off
      this.jumpsRemaining = Math.max(1, this.jumpsRemaining); // Restore one air jump
      this.jumpBufferTimer = 0;
    } else if (this.jumpBufferTimer > 0) {
      if (this.coyoteTimer > 0 || this.jumpsRemaining > 0) {
        this.performJump(stats);
        this.jumpBufferTimer = 0;
      }
    }

    // ── Attack ──
    this.attackCooldown = Math.max(0, this.attackCooldown - delta);

    // Track attack animation duration
    if (this.isAttacking) {
      this.attackAnimDuration -= delta;
      if (this.attackAnimDuration <= 0) {
        this.isAttacking = false;
        this.comboWindowTimer = this.comboWindow;
      }
    }

    // Combo window countdown
    if (this.comboWindowTimer > 0) {
      this.comboWindowTimer -= delta;
      if (this.comboWindowTimer <= 0) {
        this.comboStep = 0; // reset combo if window expired
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.attackKey) && !this.isAttacking) {
      this.performAttack(stats);
    }

    // ── Special / Dash ──
    if (!this.isAttacking) {
      if (Phaser.Input.Keyboard.JustDown(this.dashKey) && this.dashCooldown <= 0) {
        if (stats.specialAbility === SpecialAbility.SHURIKEN_DASH || stats.specialAbility === SpecialAbility.MASTER_ALL) {
          this.performDash();
        }
      }

      if (Phaser.Input.Keyboard.JustDown(this.specialKey)) {
        this.performSpecial(stats);
      }
    }

    // ── State Update ──
    const prevState = this.state;
    if (this.isAttacking) {
      this.state = PlayerState.ATTACK;
    } else if (this.isGrounded) {
      if (Math.abs(body.velocity.x) > 0) {
        this.state = PlayerState.RUN;
      } else {
        this.state = PlayerState.IDLE;
      }
    } else {
      if (this.wallSlideDir !== 0) {
        this.state = PlayerState.WALL_SLIDE;
      } else if (body.velocity.y < 0) {
        this.state = PlayerState.JUMP;
      } else {
        this.state = PlayerState.FALL;
      }
    }

    // ── Animation ──
    if (this.state !== prevState) {
      this.updateAnimation();
    }

    // Fall off bottom = death
    if (this.y > this.scene.physics.world.bounds.height + 100) {
      this.die();
    }
  }

  private performJump(stats: ReturnType<typeof this.formSystem.getCurrentStats>): void {
    const body = this.body as Phaser.Physics.Arcade.Body;
    let jumpForce = stats.jumpForce;

    // Wolf fast run jump boost
    if (this.fastRunning) {
      jumpForce *= WOLF_FAST_RUN_JUMP_BOOST;
    }

    if (this.coyoteTimer > 0 && this.isGrounded) {
      // First jump (ground)
      body.setVelocityY(jumpForce);
      this.coyoteTimer = 0;
      this.jumpsRemaining = stats.maxJumps - 1;
    } else if (this.jumpsRemaining > 0) {
      // Air jumps
      body.setVelocityY(jumpForce * 0.9);
      this.jumpsRemaining--;
    }

    this.state = PlayerState.JUMP;
  }

  private performAttack(stats: ReturnType<typeof this.formSystem.getCurrentStats>): void {
    const dirX = this.facingRight ? 1 : -1;
    const form = this.formSystem.getCurrentForm();
    const damage = this.difficultySystem.scalePlayerDamage(stats.attackDamage);

    // Advance combo step (0 -> 1 -> 2 -> 0)
    if (this.comboWindowTimer > 0 && this.comboStep < 3) {
      // Continue combo
    } else {
      this.comboStep = 0; // reset
    }

    // Animation durations: attack1=6f, attack2=5f, attack3=5f at 14fps
    const animDurations = [6 / 14 * 1000, 5 / 14 * 1000, 5 / 14 * 1000];
    this.attackAnimDuration = animDurations[this.comboStep];
    this.isAttacking = true;
    this.comboWindowTimer = 0;
    this.state = PlayerState.ATTACK;
    this.updateAnimation();

    // Advance combo for next press
    this.comboStep = (this.comboStep + 1) % 3;

    switch (form) {
      case FormType.ARCHER:
        this.spawnProjectile(createArrow(this.scene, this.x + dirX * 16, this.y, dirX, 350, damage));
        break;

      case FormType.DEMON:
        this.spawnProjectile(createFlame(this.scene, this.x + dirX * 16, this.y, dirX, 250, damage));
        break;

      case FormType.ARMORED:
        // Shuriken throw
        this.spawnProjectile(createShuriken(this.scene, this.x + dirX * 16, this.y, dirX, 300, damage));
        break;

      case FormType.MASTER:
        // Shuriken + melee
        this.spawnProjectile(createShuriken(this.scene, this.x + dirX * 16, this.y, dirX, 300, damage));
        this.emitMeleeHitbox(dirX, stats.attackRange, damage);
        break;

      default:
        // Melee attack
        this.emitMeleeHitbox(dirX, stats.attackRange, damage);
        break;
    }
  }

  private emitMeleeHitbox(dirX: number, range: number, damage: number): void {
    this.scene.events.emit('player-melee-attack', {
      x: this.x + dirX * (range / 2 + 8),
      y: this.y,
      width: range,
      height: 28,
      damage,
      dirX,
    });
  }

  private spawnProjectile(proj: Projectile): void {
    this.projectiles.add(proj);
  }

  private getSpecialCost(ability: SpecialAbility): number {
    switch (ability) {
      case SpecialAbility.FLAME_SWORD: return 15;
      case SpecialAbility.BLOCK_SMASH: return 20;
      case SpecialAbility.SHURIKEN_DASH: return 12;
      case SpecialAbility.ARROW_SHOT: return 10;
      case SpecialAbility.MASTER_ALL: return 25;
      default: return 0;
    }
  }

  private performSpecial(stats: ReturnType<typeof this.formSystem.getCurrentStats>): void {
    const dirX = this.facingRight ? 1 : -1;
    const damage = this.difficultySystem.scalePlayerDamage(stats.attackDamage);
    const cost = this.getSpecialCost(stats.specialAbility);

    if (cost > 0 && !this.useEnergy(cost)) return;

    switch (stats.specialAbility) {
      case SpecialAbility.FLAME_SWORD:
        // Extra flame that burns vine barriers
        const flame = createFlame(this.scene, this.x + dirX * 20, this.y, dirX, 200, damage);
        flame.setData('burnsVines', true);
        this.spawnProjectile(flame);
        break;

      case SpecialAbility.BLOCK_SMASH:
        // Downward smash (emits event for breakable blocks)
        this.scene.events.emit('player-block-smash', {
          x: this.x,
          y: this.y + 20,
          width: 40,
          height: 20,
        });
        break;

      case SpecialAbility.SHURIKEN_DASH:
        // Extra shuriken in three directions
        this.spawnProjectile(createShuriken(this.scene, this.x, this.y, dirX, 300, damage));
        this.spawnProjectile(createShuriken(this.scene, this.x, this.y, dirX, 280, damage));
        break;

      case SpecialAbility.MASTER_ALL:
        // Powerful radial shuriken burst
        for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
          const proj = createShuriken(this.scene, this.x, this.y, 1, 250, damage);
          proj.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
          this.spawnProjectile(proj);
        }
        break;

      default:
        break;
    }
  }

  private performDash(): void {
    if (!this.useEnergy(10)) return;

    const body = this.body as Phaser.Physics.Arcade.Body;
    const dirX = this.facingRight ? 1 : -1;

    this.isDashing = true;
    this.dashTimer = this.dashDuration;
    this.dashCooldown = 600;
    this.invincible = true;
    this.invincibilityTimer = this.dashDuration;

    body.setVelocityX(dirX * 350);
    body.setVelocityY(0);
    body.setAllowGravity(false);

    // Dash trail effect
    this.setAlpha(0.6);
  }

  private updateDash(delta: number): void {
    this.dashTimer -= delta;
    if (this.dashTimer <= 0) {
      this.isDashing = false;
      const body = this.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(true);
      body.setVelocityX(0);
      this.setAlpha(1);
    }
  }

  private detectDoubleTap(time: number): void {
    const leftJustDown = this.cursors.left.isDown && !this.prevLeft;
    const rightJustDown = this.cursors.right.isDown && !this.prevRight;

    if (leftJustDown) {
      if (time - this.lastLeftTap < DOUBLE_TAP_WINDOW) {
        this.fastRunning = true;
      }
      this.lastLeftTap = time;
    }

    if (rightJustDown) {
      if (time - this.lastRightTap < DOUBLE_TAP_WINDOW) {
        this.fastRunning = true;
      }
      this.lastRightTap = time;
    }

    // Stop fast running if direction changes or stops
    if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
      this.fastRunning = false;
    }

    this.prevLeft = this.cursors.left.isDown;
    this.prevRight = this.cursors.right.isDown;
  }

  private updateHurt(delta: number): void {
    this.attackTimer += delta;
    if (this.attackTimer > 300) {
      this.state = PlayerState.IDLE;
      this.attackTimer = 0;
    }
  }

  takeDamage(amount: number): void {
    if (this.invincible || this.state === PlayerState.DEAD) return;

    const stats = this.formSystem.getCurrentStats();
    const finalDamage = Math.max(1, Math.round(amount * (1 - stats.armor)));

    this.health -= finalDamage;
    this.onHealthChange?.(this.health, this.maxHealth);

    if (this.health <= 0) {
      this.health = 0;
      this.die();
      return;
    }

    // Hurt state
    this.state = PlayerState.HURT;
    this.attackTimer = 0;
    this.invincible = true;
    this.invincibilityTimer = INVINCIBILITY_TIME;

    // Knockback
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityY(-150);

    // Flash red
    this.setTint(0xff0000);
    this.scene.time.delayedCall(200, () => {
      if (this.active) this.setTint(stats.color);
    });
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.onHealthChange?.(this.health, this.maxHealth);
  }

  restoreEnergy(amount: number): void {
    this.energy = Math.min(this.maxEnergy, this.energy + amount);
    this.onEnergyChange?.(this.energy, this.maxEnergy);
  }

  private useEnergy(cost: number): boolean {
    if (this.energy < cost) return false;
    this.energy -= cost;
    this.onEnergyChange?.(this.energy, this.maxEnergy);
    return true;
  }

  private die(): void {
    this.state = PlayerState.DEAD;
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, -200);

    this.setTint(0xff0000);

    // Death particles
    const particles = this.scene.add.particles(this.x, this.y, 'particle', {
      speed: { min: 50, max: 200 },
      lifespan: 500,
      quantity: 16,
      scale: { start: 1, end: 0 },
      tint: this.formSystem.getCurrentStats().color,
    });
    this.scene.time.delayedCall(600, () => particles.destroy());

    this.scene.time.delayedCall(1500, () => {
      this.onDeath?.();
    });
  }

  isAlive(): boolean {
    return this.state !== PlayerState.DEAD;
  }

  getFormType(): FormType {
    return this.formSystem.getCurrentForm();
  }

  isFastRunning(): boolean {
    return this.fastRunning;
  }

  private updateAnimation(): void {
    switch (this.state) {
      case PlayerState.IDLE:
        if (this.scene.anims.exists('player_idle')) {
          this.play('player_idle', true);
          this.clearTint();
        }
        break;
      case PlayerState.RUN:
        if (this.scene.anims.exists('player_run')) {
          this.play('player_run', true);
          this.clearTint();
        }
        break;
      case PlayerState.JUMP:
      case PlayerState.FALL:
        if (this.scene.anims.exists('player_jump')) {
          this.play('player_jump', true);
          this.clearTint();
        }
        break;
      case PlayerState.ATTACK: {
        // comboStep was already advanced, so current attack is comboStep - 1
        const currentAttack = ((this.comboStep - 1) % 3 + 3) % 3;
        const animKey = `player_attack${currentAttack + 1}`;
        if (this.scene.anims.exists(animKey)) {
          this.play(animKey, true);
          this.clearTint();
        }
        break;
      }
      default:
        // Stop animation for states without sprite sheets yet
        this.stop();
        this.setTint(this.formSystem.getCurrentStats().color);
        break;
    }
  }
}
