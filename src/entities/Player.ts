import Phaser from 'phaser';
import {
  DEPTH, GRAVITY, OUTFIT_NAMES, OUTFITS, OutfitType,
  PLAYER, REG,
} from '../constants';
import { Projectile } from './Projectile';

export enum PlayerState {
  IDLE         = 'idle',
  RUNNING      = 'running',
  JUMPING      = 'jumping',
  DOUBLE_JUMP  = 'double_jump',
  FALLING      = 'falling',
  WALL_SLIDING = 'wall_sliding',
  CROUCHING    = 'crouching',
  SLIDING      = 'sliding',
  ATTACKING    = 'attacking',
  SPECIAL      = 'special',
  STEALING     = 'stealing',
  GLIDING      = 'gliding',
  HURT         = 'hurt',
  DEAD         = 'dead',
}

interface Keys {
  left:   Phaser.Input.Keyboard.Key;
  right:  Phaser.Input.Keyboard.Key;
  down:   Phaser.Input.Keyboard.Key;
  jump:   Phaser.Input.Keyboard.Key;
  attack: Phaser.Input.Keyboard.Key;
  steal:  Phaser.Input.Keyboard.Key;
  dash:   Phaser.Input.Keyboard.Key;
  // WASD
  keyA: Phaser.Input.Keyboard.Key;
  keyD: Phaser.Input.Keyboard.Key;
  keyW: Phaser.Input.Keyboard.Key;
  keyS: Phaser.Input.Keyboard.Key;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  // Use playerState to avoid conflict with Phaser's Sprite.state
  playerState: PlayerState = PlayerState.IDLE;
  outfit: OutfitType = OUTFITS.BASE;
  health: number     = PLAYER.MAX_HEALTH;
  maxHealth: number  = PLAYER.MAX_HEALTH;
  didGroundPound     = false;

  // state timers
  private stateTimer      = 0;
  private attackTimer     = 0;
  private attackCooldown  = 0;
  private specialCooldown = 0;
  private invincibleTimer = 0;
  private slideTimer      = 0;

  // steal
  stealTarget:  Phaser.GameObjects.Sprite | null = null;
  private stealTargetX = 0;

  // movement tracking
  private jumpCount   = 0;
  private wasOnGround = false;
  private isWallLeft  = false;
  private isWallRight = false;
  private facingRight = true;
  private glideActive = false;

  // input
  private keys!: Keys;

  // attack hitbox (rectangle, no physics body)
  attackBox: Phaser.GameObjects.Rectangle;

  // projectile group – reference set by GameScene
  projectiles!: Phaser.Physics.Arcade.Group;

  // outfit label displayed above player
  private outfitLabel!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, `player_${OUTFITS.BASE}_sheet`);

    // Add to scene manually (cast avoids the private-setState conflict with strict types)
    scene.add.existing(this as unknown as Phaser.GameObjects.GameObject);
    scene.physics.add.existing(this as unknown as Phaser.GameObjects.GameObject);

    this.setDepth(DEPTH.PLAYER);
    this.setOrigin(0.5, 1);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(PLAYER.W, PLAYER.H);
    body.setMaxVelocityX(PLAYER.SPEED * 1.5);

    this.attackBox = scene.add.rectangle(x, y, 52, 30, 0xffffff, 0.0);
    this.attackBox.setDepth(DEPTH.PROJECTILE);

    this.setupKeys(scene);

    this.outfitLabel = scene.add.text(x, y - 50, '', {
      fontSize: '11px',
      color: '#ffee44',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5, 1).setDepth(DEPTH.UI);
  }

  private setupKeys(scene: Phaser.Scene): void {
    const kb = scene.input.keyboard!;
    this.keys = {
      left:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT),
      right:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT),
      down:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.DOWN),
      jump:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      attack: kb.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      steal:  kb.addKey(Phaser.Input.Keyboard.KeyCodes.C),
      dash:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT),
      keyA:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      keyD:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      keyW:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      keyS:   kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
    };
  }

  // ── State helper (private, not overriding Sprite.setState) ────────────────

  private changeState(s: PlayerState, duration = 0): void {
    this.playerState = s;
    this.stateTimer  = duration;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  equipOutfit(outfit: OutfitType): void {
    this.outfit = outfit;
    this.setTexture(`player_${outfit}_sheet`);
    this.scene.registry.set(REG.OUTFIT, outfit);

    this.scene.tweens.add({
      targets: this,
      alpha: { from: 0.2, to: 1 },
      duration: 400,
      ease: 'Bounce.Out',
    });

    const ring = this.scene.add.sprite(this.x, this.y, 'steal_ring').setDepth(DEPTH.FX);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3, scaleY: 3,
      alpha: 0,
      duration: 600,
      onComplete: () => ring.destroy(),
    });

    this.outfitLabel.setText(OUTFIT_NAMES[outfit]);
    this.scene.time.delayedCall(2000, () => {
      if (this.outfitLabel) this.outfitLabel.setText('');
    });

    this.scene.events.emit('outfit-changed', outfit);
  }

  takeDamage(amount: number, fromX?: number): boolean {
    if (this.invincibleTimer > 0) return false;
    if (this.playerState === PlayerState.DEAD) return false;

    this.health = Math.max(0, this.health - amount);
    this.scene.registry.set(REG.HEALTH, this.health);
    this.invincibleTimer = PLAYER.INVINCIBLE_MS;

    if (fromX !== undefined) {
      const dir = this.x > fromX ? 1 : -1;
      (this.body as Phaser.Physics.Arcade.Body).setVelocity(dir * 200, -180);
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      repeat: 5,
      duration: 120,
      onComplete: () => { this.alpha = 1; },
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }

    this.changeState(PlayerState.HURT, 400);
    return true;
  }

  initiateSteal(target: Phaser.GameObjects.Sprite): void {
    if (this.playerState === PlayerState.STEALING) return;
    this.stealTarget  = target;
    this.stealTargetX = target.x;
    this.changeState(PlayerState.STEALING);
    const dir = target.x > this.x ? 1 : -1;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * PLAYER.DASH_SPEED);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(-80);
  }

  // ── Per-frame update ───────────────────────────────────────────────────────

  update(time: number, delta: number): void {
    if (this.playerState === PlayerState.DEAD) return;

    const body      = this.body as Phaser.Physics.Arcade.Body;
    const onGround  = body.blocked.down;
    this.isWallLeft  = body.blocked.left  && !onGround;
    this.isWallRight = body.blocked.right && !onGround;

    if (onGround && !this.wasOnGround) {
      this.jumpCount  = 0;
      this.glideActive = false;
      const wasSpecial = this.playerState === PlayerState.SPECIAL;
      if (this.playerState === PlayerState.FALLING
        || this.playerState === PlayerState.JUMPING
        || this.playerState === PlayerState.DOUBLE_JUMP
        || this.playerState === PlayerState.GLIDING
        || this.playerState === PlayerState.SPECIAL) {
        this.changeState(PlayerState.IDLE);
      }
      if (wasSpecial && this.outfit === OUTFITS.STONE_GUARD) {
        this.didGroundPound = true;
        this.spawnGroundPoundFX();
      }
    }
    this.wasOnGround = onGround;

    this.stateTimer      = Math.max(0, this.stateTimer      - delta);
    this.attackTimer     = Math.max(0, this.attackTimer     - delta);
    this.attackCooldown  = Math.max(0, this.attackCooldown  - delta);
    this.specialCooldown = Math.max(0, this.specialCooldown - delta);
    this.invincibleTimer = Math.max(0, this.invincibleTimer - delta);

    this.handleStateLogic(delta, onGround, body);
    this.handleInput(onGround, body);
    this.updateAttackBox();
    this.updateVisuals();
    this.updateLabel();
  }

  // ── State machine ──────────────────────────────────────────────────────────

  private handleStateLogic(delta: number, onGround: boolean, body: Phaser.Physics.Arcade.Body): void {
    switch (this.playerState) {
      case PlayerState.SLIDING:
        this.slideTimer -= delta;
        if (this.slideTimer <= 0 || (onGround && Math.abs(body.velocity.x) < 10)) {
          this.changeState(PlayerState.IDLE);
        }
        break;

      case PlayerState.STEALING:
        if (this.stealTarget && Math.abs(this.x - this.stealTargetX) < 30) {
          this.finishSteal();
        }
        break;

      case PlayerState.HURT:
        if (this.stateTimer <= 0) this.changeState(PlayerState.IDLE);
        break;

      case PlayerState.ATTACKING:
        if (this.attackTimer <= 0) {
          this.attackBox.setFillStyle(0xffffff, 0.0);
          this.changeState(onGround ? PlayerState.IDLE : PlayerState.FALLING);
        }
        break;

      case PlayerState.SPECIAL:
        if (this.outfit === OUTFITS.STONE_GUARD && !onGround) {
          if (body.velocity.y < 0) body.setVelocityY(0);
          body.setVelocityY(Math.min(body.velocity.y + 80, 900));
        }
        // Flame dash timeout
        if (this.outfit === OUTFITS.FLAME_RONIN && this.stateTimer <= 0) {
          this.clearTint();
          this.changeState(PlayerState.IDLE);
        }
        break;

      case PlayerState.GLIDING:
        body.setGravityY(-GRAVITY * 0.78);
        body.setMaxVelocityY(80);
        if (!this.keys.jump.isDown) {
          this.glideActive = false;
          body.setGravityY(0);
          body.setMaxVelocityY(1000);
          this.changeState(PlayerState.FALLING);
        }
        if (onGround) {
          body.setGravityY(0);
          body.setMaxVelocityY(1000);
          this.changeState(PlayerState.IDLE);
        }
        break;
    }
  }

  private handleInput(onGround: boolean, body: Phaser.Physics.Arcade.Body): void {
    if (this.isInputLocked()) return;

    const k      = this.keys;
    const left   = k.left.isDown  || k.keyA.isDown;
    const right  = k.right.isDown || k.keyD.isDown;
    const down   = k.down.isDown  || k.keyS.isDown;

    const jumpJust   = Phaser.Input.Keyboard.JustDown(k.jump)
                    || Phaser.Input.Keyboard.JustDown(k.keyW);
    const attackJust = Phaser.Input.Keyboard.JustDown(k.attack);
    const stealJust  = Phaser.Input.Keyboard.JustDown(k.steal);
    const dashJust   = Phaser.Input.Keyboard.JustDown(k.dash);

    // Horizontal movement
    if (this.playerState !== PlayerState.SLIDING && this.playerState !== PlayerState.SPECIAL) {
      if (left) {
        body.setVelocityX(-PLAYER.SPEED);
        this.facingRight = false;
        if (onGround && this.playerState !== PlayerState.ATTACKING) this.changeState(PlayerState.RUNNING);
      } else if (right) {
        body.setVelocityX(PLAYER.SPEED);
        this.facingRight = true;
        if (onGround && this.playerState !== PlayerState.ATTACKING) this.changeState(PlayerState.RUNNING);
      } else {
        body.setVelocityX(body.velocity.x * 0.78);
        if (onGround && this.playerState === PlayerState.RUNNING) this.changeState(PlayerState.IDLE);
      }
    }

    this.setFlipX(!this.facingRight);

    // Wall sliding
    if (!onGround && (this.isWallLeft || this.isWallRight)) {
      const pushingWall = (this.isWallLeft && left) || (this.isWallRight && right);
      if (pushingWall) {
        this.changeState(PlayerState.WALL_SLIDING);
        body.setVelocityY(Math.min(body.velocity.y, PLAYER.WALL_SLIDE_MAX_VY));
        this.jumpCount = 1;
      }
    }

    // Jump
    if (jumpJust) {
      if (onGround) {
        this.doJump(body);
      } else if (this.isWallLeft || this.isWallRight) {
        const dir = this.isWallLeft ? 1 : -1;
        body.setVelocityX(dir * PLAYER.WALL_JUMP_VX);
        body.setVelocityY(PLAYER.WALL_JUMP_VY);
        this.facingRight = dir > 0;
        this.jumpCount = 1;
        this.changeState(PlayerState.JUMPING);
      } else if (this.jumpCount < 2) {
        this.doDoubleJump(body);
      } else if (this.outfit === OUTFITS.SKY_TENGU && !this.glideActive) {
        this.glideActive = true;
        this.changeState(PlayerState.GLIDING);
        body.setGravityY(-GRAVITY * 0.78);
        body.setMaxVelocityY(80);
      }
    }

    // Auto-transition to falling
    if (!onGround && body.velocity.y > 30
      && this.playerState !== PlayerState.JUMPING
      && this.playerState !== PlayerState.DOUBLE_JUMP
      && this.playerState !== PlayerState.WALL_SLIDING
      && this.playerState !== PlayerState.GLIDING
      && this.playerState !== PlayerState.SPECIAL
      && this.playerState !== PlayerState.STEALING
      && this.playerState !== PlayerState.ATTACKING) {
      this.changeState(PlayerState.FALLING);
    }

    // Crouch / slide  (body size never changed — only visual squash to avoid
    // body.setSize centering off the floor surface and falling through)
    if (onGround && down) {
      if (dashJust && Math.abs(body.velocity.x) > 10) {
        this.doSlide(body);
      } else {
        this.changeState(PlayerState.CROUCHING);
      }
    } else if (!down && this.playerState === PlayerState.CROUCHING) {
      this.changeState(PlayerState.IDLE);
    }

    // Attack
    if (attackJust && this.attackCooldown <= 0 && this.playerState !== PlayerState.SLIDING) {
      this.doAttack(onGround);
    }

    // Special / Steal
    if (stealJust) {
      const nearStagger = (this.scene as unknown as Record<string, Function>)
        ['getNearestStaggeredEnemy']?.(this.x, this.y, PLAYER.STEAL_RANGE);
      if (nearStagger) {
        this.initiateSteal(nearStagger as Phaser.GameObjects.Sprite);
      } else if (this.specialCooldown <= 0) {
        this.doSpecial(body, onGround);
      }
    }
  }

  private doJump(body: Phaser.Physics.Arcade.Body): void {
    body.setVelocityY(PLAYER.JUMP_VEL);
    this.jumpCount = 1;
    this.glideActive = false;
    this.changeState(PlayerState.JUMPING);
    this.spawnJumpDust();
  }

  private doDoubleJump(body: Phaser.Physics.Arcade.Body): void {
    body.setVelocityY(PLAYER.DOUBLE_JUMP_VEL);
    this.jumpCount = 2;
    this.glideActive = false;
    this.changeState(PlayerState.DOUBLE_JUMP);
    this.spawnJumpDust(true);
  }

  private doSlide(body: Phaser.Physics.Arcade.Body): void {
    const dir = this.facingRight ? 1 : -1;
    body.setVelocityX(dir * PLAYER.SLIDE_SPEED);
    this.slideTimer = PLAYER.SLIDE_DURATION;
    this.changeState(PlayerState.SLIDING);
  }

  private doAttack(onGround: boolean): void {
    this.changeState(PlayerState.ATTACKING);
    this.attackTimer    = PLAYER.ATTACK_DURATION;
    this.attackCooldown = PLAYER.ATTACK_COOLDOWN;
    void onGround; // used for future anim distinction

    this.attackBox.setFillStyle(0xffffff, 0.25);

    if (this.outfit === OUTFITS.FLAME_RONIN) {
      this.scene.time.delayedCall(80, () => {
        const dir  = this.facingRight ? 1 : -1;
        const proj = new Projectile(
          this.scene, this.x + dir * 20, this.y - 18,
          'fireball', dir * 440, -20, 2, 'player',
        );
        this.projectiles?.add(proj);
        this.spawnParticles(this.x + dir * 20, this.y - 18, 0xff6600, 5);
      });
    }

    if (this.outfit === OUTFITS.SKY_TENGU) {
      this.scene.time.delayedCall(60, () => {
        const dir  = this.facingRight ? 1 : -1;
        const proj = new Projectile(
          this.scene, this.x + dir * 20, this.y - 18,
          'wind_gust', dir * 360, -10, 1, 'player', 900,
        );
        this.projectiles?.add(proj);
      });
    }
  }

  private doSpecial(body: Phaser.Physics.Arcade.Body, onGround: boolean): void {
    this.specialCooldown = PLAYER.SPECIAL_COOLDOWN;

    switch (this.outfit) {
      case OUTFITS.FLAME_RONIN: {
        // Direction: prefer currently held key, fallback to facingRight
        const left  = this.keys.left.isDown  || this.keys.keyA.isDown;
        const right = this.keys.right.isDown || this.keys.keyD.isDown;
        const dir = right ? 1 : left ? -1 : (this.facingRight ? 1 : -1);
        this.facingRight = dir > 0;
        this.setFlipX(!this.facingRight);

        // Quick burst: very high initial velocity, set tween to decelerate
        body.setVelocityX(dir * 1100);
        this.changeState(PlayerState.SPECIAL, 180);
        this.setTint(0xff6600);
        this.spawnParticles(this.x, this.y - 20, 0xff6600, 14);
        this.spawnParticles(this.x, this.y - 10, 0xffaa00, 8);

        // Decelerate after burst (makes it feel snappy not sustained)
        this.scene.time.delayedCall(80, () => {
          if (this.playerState === PlayerState.SPECIAL) {
            (this.body as Phaser.Physics.Arcade.Body).setVelocityX(dir * 300);
          }
        });
        break;
      }
      case OUTFITS.STONE_GUARD:
        if (!onGround) {
          this.changeState(PlayerState.SPECIAL);
          body.setVelocityY(0);
          this.setTint(0x7a7aaa);
          // Signal to GameScene that ground pound is incoming
          this.didGroundPound = false; // will be set true on landing
        }
        break;
      case OUTFITS.SKY_TENGU:
        if (!onGround) {
          this.glideActive = true;
          this.changeState(PlayerState.GLIDING);
          body.setGravityY(-GRAVITY * 0.78);
          body.setMaxVelocityY(80);
          // Wind slash: spawn a wide wind projectile
          const dir2 = this.facingRight ? 1 : -1;
          this.scene.time.delayedCall(50, () => {
            const proj = new Projectile(
              this.scene, this.x + dir2 * 20, this.y - 20,
              'wind_gust', dir2 * 480, -30, 2, 'player', 700,
            );
            this.projectiles?.add(proj);
            this.spawnParticles(this.x, this.y - 20, 0x88ddff, 10);
          });
        }
        break;
    }
  }

  private finishSteal(): void {
    this.changeState(PlayerState.IDLE);
    this.stealTarget = null;
    (this.body as Phaser.Physics.Arcade.Body).setVelocityX(0);
    (this.body as Phaser.Physics.Arcade.Body).setVelocityY(-100);
  }

  private updateAttackBox(): void {
    const active = this.playerState === PlayerState.ATTACKING
                || this.playerState === PlayerState.SPECIAL;
    if (!active) this.attackBox.setFillStyle(0xffffff, 0.0);

    const dir    = this.facingRight ? 1 : -1;
    const rangeX = this.outfit === OUTFITS.STONE_GUARD ? 56 : 44;
    const w      = this.outfit === OUTFITS.STONE_GUARD ? 64 : 48;
    const h      = this.outfit === OUTFITS.STONE_GUARD ? 36 : 28;
    this.attackBox.setPosition(this.x + dir * (rangeX / 2 + 4), this.y - PLAYER.H / 2);
    this.attackBox.setSize(w, h);
  }

  private updateVisuals(): void {
    const outfit = this.outfit;
    switch (this.playerState) {
      case PlayerState.IDLE:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_idle`) {
          this.play(`player_${outfit}_idle`, true);
        }
        break;
      case PlayerState.RUNNING:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_run`) {
          this.play(`player_${outfit}_run`, true);
        }
        break;
      case PlayerState.JUMPING:
      case PlayerState.DOUBLE_JUMP:
      case PlayerState.FALLING:
      case PlayerState.GLIDING:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_jump`) {
          this.play(`player_${outfit}_jump`, true);
        }
        break;
      case PlayerState.ATTACKING:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_attack`) {
          this.play(`player_${outfit}_attack`, true);
        }
        break;
      case PlayerState.SPECIAL:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_special`) {
          this.play(`player_${outfit}_special`, true);
        }
        break;
      case PlayerState.CROUCHING:
      case PlayerState.SLIDING:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_jump`) {
          this.play(`player_${outfit}_jump`, true);
        }
        this.scaleY = this.playerState === PlayerState.SLIDING ? 0.7 : 0.8;
        return; // skip the reset below
      default:
        if (!this.anims.isPlaying || this.anims.currentAnim?.key !== `player_${outfit}_idle`) {
          this.play(`player_${outfit}_idle`, true);
        }
        break;
    }
    this.scaleX = this.flipX ? -1 : 1;
    this.scaleY = 1.0;
  }

  private updateLabel(): void {
    this.outfitLabel?.setPosition(this.x, this.y - 52);
  }

  private isInputLocked(): boolean {
    return this.playerState === PlayerState.DEAD
        || this.playerState === PlayerState.STEALING;
  }

  private spawnJumpDust(double_ = false): void {
    this.spawnParticles(this.x, this.y, double_ ? 0x88ddff : 0xffffff, double_ ? 8 : 5);
  }

  spawnParticles(x: number, y: number, color: number, count: number): void {
    for (let i = 0; i < count; i++) {
      const p = this.scene.add.rectangle(
        x + Phaser.Math.Between(-12, 12),
        y + Phaser.Math.Between(-6, 6),
        Phaser.Math.Between(3, 7),
        Phaser.Math.Between(3, 7),
        color,
      ).setDepth(DEPTH.FX);
      this.scene.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-30, 30),
        y: p.y + Phaser.Math.Between(-40, 10),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: Phaser.Math.Between(300, 600),
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnGroundPoundFX(): void {
    this.clearTint();
    const ring = this.scene.add.sprite(this.x, this.y, 'pound_crack').setDepth(DEPTH.FX);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 3, alpha: 0,
      duration: 400,
      onComplete: () => ring.destroy(),
    });
    this.scene.cameras.main.shake(180, 0.006);
    this.spawnParticles(this.x, this.y, 0x888888, 12);
  }

  die(): void {
    this.changeState(PlayerState.DEAD);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, -300);
    this.scene.tweens.add({
      targets: this,
      angle: 360,
      alpha: 0,
      scaleX: 0,
      scaleY: 0,
      y: this.y - 80,
      duration: 700,
      onComplete: () => {
        this.scene.registry.set(REG.WIN, false);
        this.scene.events.emit('player-died');
      },
    });
    this.spawnParticles(this.x, this.y - 18, 0xff4466, 20);
  }
}
