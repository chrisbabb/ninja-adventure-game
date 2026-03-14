import Phaser from 'phaser';
import { DEPTH, ENEMY, GAME_HEIGHT, GAME_WIDTH, OUTFITS, REG, SCENES, WORLD_WIDTH } from '../constants';
import { Player, PlayerState } from '../entities/Player';
import { Enemy, EnemyState, LanternSoldier, BeetleSamurai, CrowNinja, GeneralEmberclaw } from '../entities/Enemy';
import { Projectile } from '../entities/Projectile';
import { OutfitSystem } from '../systems/OutfitSystem';

// ── Platform / hazard data ──────────────────────────────────────────────────

interface PlatformDef { x: number; y: number; w: number; texture?: string }
interface EnemyDef    { type: 'lantern' | 'beetle' | 'crow' | 'boss'; x: number; y: number }

const PLATFORMS: PlatformDef[] = [
  // World 1 – Bamboo Outskirts (x 0–1280)
  { x:  220, y: 420, w: 128 },
  { x:  440, y: 360, w: 96  },
  { x:  640, y: 280, w: 128 },
  { x:  820, y: 340, w: 96  },
  { x:  980, y: 420, w: 160 },
  // small hop platforms
  { x: 1140, y: 370, w: 64  },
  { x: 1240, y: 300, w: 64  },

  // World 2 – Lantern Fortress (x 1280–2560)
  { x: 1360, y: 430, w: 192 },
  { x: 1560, y: 360, w: 96  },
  { x: 1660, y: 280, w: 128 },
  { x: 1820, y: 350, w: 96  },
  { x: 1960, y: 410, w: 64  },
  { x: 2080, y: 340, w: 160 },
  { x: 2220, y: 420, w: 96  },
  { x: 2340, y: 360, w: 64  },
  { x: 2460, y: 300, w: 128 },

  // World 3 – Thunder Pagoda  (x 2560–3840)
  { x: 2620, y: 430, w: 160 },
  { x: 2780, y: 360, w: 96  },
  { x: 2920, y: 290, w: 128 },
  { x: 3080, y: 360, w: 96  },
  { x: 3200, y: 430, w: 64  },
  { x: 3320, y: 340, w: 128 },
  { x: 3500, y: 280, w: 96  },
  { x: 3640, y: 370, w: 160 },
  { x: 3760, y: 430, w: 64  },

  // World 4 – Sky approach (x 3840–5120)
  { x: 3880, y: 390, w: 96  },
  { x: 4000, y: 330, w: 128 },
  { x: 4180, y: 260, w: 96  },
  { x: 4350, y: 310, w: 128 },
  { x: 4500, y: 380, w: 64  },
  { x: 4620, y: 300, w: 96  },
  { x: 4760, y: 230, w: 128 },
  { x: 4920, y: 310, w: 96  },
  { x: 5060, y: 400, w: 64  },

  // Boss arena (x 5200–6000)
  { x: 5200, y: 450, w: 256 },
  { x: 5500, y: 350, w: 96  },
  { x: 5700, y: 400, w: 192 },
  { x: 5900, y: 450, w: 256 },
];

const CRACKED_FLOORS: PlatformDef[] = [
  { x: 1060, y: 480, w: 96,  texture: 'cracked_floor' },
  { x: 2300, y: 480, w: 96,  texture: 'cracked_floor' },
  { x: 3900, y: 480, w: 96,  texture: 'cracked_floor' },
];

const FLAME_BARRIERS: { x: number; y: number; h: number }[] = [
  { x:  960, y: 400, h: 80 },
  { x: 2180, y: 300, h: 80 },
];

const ENEMY_SPAWNS: EnemyDef[] = [
  // Zone 1 – teach Lantern Soldier
  { type: 'lantern', x:  560, y: 480 },
  { type: 'lantern', x:  900, y: 480 },
  // Zone 2
  { type: 'lantern', x: 1480, y: 480 },
  { type: 'beetle',  x: 1720, y: 480 },
  { type: 'lantern', x: 2100, y: 480 },
  { type: 'beetle',  x: 2440, y: 480 },
  // Zone 3
  { type: 'crow',    x: 2780, y: 340 },
  { type: 'lantern', x: 3100, y: 480 },
  { type: 'crow',    x: 3500, y: 260 },
  { type: 'beetle',  x: 3700, y: 480 },
  // Zone 4
  { type: 'crow',    x: 4200, y: 240 },
  { type: 'beetle',  x: 4500, y: 480 },
  { type: 'crow',    x: 4800, y: 210 },
  { type: 'lantern', x: 5080, y: 480 },
  // Boss
  { type: 'boss',    x: 5650, y: 480 },
];

const SCROLL_POSITIONS = [
  { x: 380,  y: 320 },
  { x: 1660, y: 240 },
  { x: 3500, y: 240 },
  { x: 4760, y: 190 },
  { x: 5500, y: 310 },
];

const HEALTH_ORB_POSITIONS = [
  { x: 800,  y: 460 },
  { x: 1900, y: 440 },
  { x: 3200, y: 440 },
  { x: 4620, y: 260 },
];

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies: Enemy[] = [];
  private outfitSystem!: OutfitSystem;

  // Physics groups
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private crackedFloors!: Phaser.Physics.Arcade.StaticGroup;
  private flameBarriers!: Phaser.Physics.Arcade.StaticGroup;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private scrolls!: Phaser.Physics.Arcade.StaticGroup;
  private healthOrbs!: Phaser.Physics.Arcade.StaticGroup;
  private exitGate!: Phaser.Physics.Arcade.StaticGroup;

  // UI overlay
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private paused = false;
  private pauseOverlay!: Phaser.GameObjects.Container;

  // Controls help
  private controlsText!: Phaser.GameObjects.Text;

  constructor() { super({ key: SCENES.GAME }); }

  create(): void {
    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);

    // Registry defaults
    this.registry.set(REG.HEALTH, 6);
    this.registry.set(REG.MAX_HP, 6);
    this.registry.set(REG.OUTFIT, OUTFITS.BASE);
    this.registry.set(REG.SCORE, 0);
    this.registry.set(REG.WIN, false);

    this.createBackground();
    this.createLevel();
    this.createPlayer();
    this.createEnemies();
    this.createPickups();
    this.setupCamera();
    this.setupCollisions();
    this.setupUI();

    this.outfitSystem = new OutfitSystem(this, this.player);

    // Pause key
    this.pauseKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

    // Event: player died
    this.events.on('player-died', () => {
      this.time.delayedCall(800, () => {
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.GAME_OVER);
      });
    });

    // Start UI scene on top
    this.scene.launch(SCENES.UI);

    // Welcome banner
    this.showBanner('SHADOW STITCH', 'Steal enemy outfits to gain their powers!', 3000);
  }

  update(time: number, delta: number): void {
    if (this.paused) return;

    // Pause toggle
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.togglePause();
      return;
    }

    if (this.player.state === PlayerState.DEAD) return;

    this.player.update(time, delta);

    // Update enemies
    for (const e of this.enemies) {
      if (e.active) {
        e.update(time, delta, this.player.x, this.player.y);
      }
    }

    // Update projectiles
    this.projectiles.getChildren().forEach(p => {
      if ((p as Projectile).active) (p as Projectile).update(time, delta);
    });

    // Check steal interaction
    this.checkStealInteraction();

    // Flame barrier destruction
    this.checkFlameBarrierDestroy();

    // Cracked floor destruction
    this.checkCrackedFloorDestroy();

    // Pit death
    if (this.player.y > GAME_HEIGHT + 50) {
      this.player.takeDamage(99, this.player.x);
    }

    // Exit gate check
    this.checkExitGate();
  }

  // ── Public helper called by Player ────────────────────────────────────────

  getNearestStaggeredEnemy(px: number, py: number, range: number): Enemy | null {
    return this.outfitSystem.getNearestStaggeredEnemy(this.enemies, px, py, range);
  }

  // ── Level creation ────────────────────────────────────────────────────────

  private createBackground(): void {
    // Parallax layers (fixed to camera)
    this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg_sky')
      .setScrollFactor(0).setDepth(DEPTH.BG);

    // Mid-ground pagoda silhouettes (slow scroll)
    for (let i = 0; i < 12; i++) {
      this.add.image(i * 600 + 100, 340, 'bg_pagoda')
        .setScrollFactor(0.15).setDepth(DEPTH.BG + 1).setAlpha(0.5);
    }

    // Far ground band
    this.add.rectangle(WORLD_WIDTH / 2, GAME_HEIGHT - 10, WORLD_WIDTH, 20, 0x1a0d08)
      .setDepth(DEPTH.BG + 2);
  }

  private createLevel(): void {
    // Ground (full width)
    const groundY = GAME_HEIGHT - 20;
    this.platforms = this.physics.add.staticGroup();

    // Ground tiles
    const tileW = 32;
    for (let tx = 0; tx < WORLD_WIDTH; tx += tileW) {
      // Gap between 1020-1100 and 2440-2520 (need Flame Ronin to clear barrier)
      const inGap1 = tx >= 1020 && tx < 1100;
      const inGap2 = tx >= 2440 && tx < 2520;
      if (!inGap1 && !inGap2) {
        this.platforms.create(tx + tileW / 2, groundY, 'ground_tile')
          .setDepth(DEPTH.TILES).refreshBody();
      }
    }

    // Floating platforms
    for (const pd of PLATFORMS) {
      const tiles = Math.ceil(pd.w / tileW);
      for (let t = 0; t < tiles; t++) {
        this.platforms.create(
          pd.x + t * tileW + tileW / 2,
          pd.y,
          pd.texture ?? 'platform_tile',
        ).setDepth(DEPTH.TILES).refreshBody();
      }
    }

    // Cracked floors (separate group, can be removed)
    this.crackedFloors = this.physics.add.staticGroup();
    for (const cf of CRACKED_FLOORS) {
      const img = this.add.image(cf.x, cf.y, 'cracked_floor')
        .setDepth(DEPTH.TILES)
        .setOrigin(0, 0.5);
      const body = this.physics.add.staticImage(cf.x + cf.w / 2, cf.y, 'cracked_floor');
      body.setDisplaySize(cf.w, 20).refreshBody();
      body.setDepth(DEPTH.TILES);
      this.crackedFloors.add(body);
    }

    // Flame barriers
    this.flameBarriers = this.physics.add.staticGroup();
    for (const fb of FLAME_BARRIERS) {
      const barrier = this.physics.add.staticImage(fb.x, fb.y + fb.h / 2, 'flame_barrier');
      barrier.setDisplaySize(24, fb.h).refreshBody();
      barrier.setDepth(DEPTH.HAZARD);
      this.flameBarriers.add(barrier);
    }

    // Exit gate
    this.exitGate = this.physics.add.staticGroup();
    const gate = this.physics.add.staticImage(WORLD_WIDTH - 80, groundY - 42, 'exit_gate');
    gate.setDepth(DEPTH.TILES).refreshBody();
    this.exitGate.add(gate);

    // Decorative sign near boss
    const sign = this.add.text(5200, groundY - 50, '⚔ GENERAL EMBERCLAW AWAITS', {
      fontSize: '13px',
      color: '#ff8844',
      stroke: '#000000',
      strokeThickness: 3,
    }).setDepth(DEPTH.UI);

    // Zone signs
    const signs = [
      [80,   'BAMBOO OUTSKIRTS'],
      [1400, 'LANTERN FORTRESS'],
      [2680, 'THUNDER PAGODA'],
      [3960, 'SKY APPROACH'],
    ];
    for (const [sx, label] of signs) {
      this.add.text(sx as number, groundY - 50, label as string, {
        fontSize: '11px',
        color: '#aaccff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setDepth(DEPTH.UI);
    }
  }

  private createPlayer(): void {
    this.player = new Player(this, 80, GAME_HEIGHT - 80);
    this.player.projectiles = this.physics.add.group();
    this.projectiles = this.player.projectiles;

    // Give scene a reference so Player can call getNearestStaggeredEnemy
    (this as any).getNearestStaggeredEnemy = this.getNearestStaggeredEnemy.bind(this);
  }

  private createEnemies(): void {
    for (const def of ENEMY_SPAWNS) {
      let e: Enemy;
      // Ground tile center is at GAME_HEIGHT-20=520; tile is 32px tall so its
      // top surface (where characters stand) is at 520-16=504.
      const groundSurface = GAME_HEIGHT - 36;
      switch (def.type) {
        case 'lantern': e = new LanternSoldier(this, def.x, groundSurface); break;
        case 'beetle':  e = new BeetleSamurai(this, def.x, groundSurface);  break;
        case 'crow':    e = new CrowNinja(this, def.x, def.y);              break;
        case 'boss':    e = new GeneralEmberclaw(this, def.x, groundSurface); break;
      }
      e.projectiles = this.projectiles;
      this.enemies.push(e);
    }
  }

  private createPickups(): void {
    // Crest scrolls
    this.scrolls = this.physics.add.staticGroup();
    for (const sp of SCROLL_POSITIONS) {
      this.scrolls.create(sp.x, sp.y, 'scroll').setDepth(DEPTH.TILES).refreshBody();
    }

    // Health orbs
    this.healthOrbs = this.physics.add.staticGroup();
    for (const hp of HEALTH_ORB_POSITIONS) {
      this.healthOrbs.create(hp.x, hp.y, 'health_orb').setDepth(DEPTH.TILES).refreshBody();
    }
  }

  private setupCamera(): void {
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(
      this.player as unknown as Phaser.GameObjects.GameObject,
      true, 0.1, 0.1,
    );
    this.cameras.main.setDeadzone(80, 60);
  }

  private setupCollisions(): void {
    // Cast player to bypass strict type check caused by private method name collision
    type AC = Phaser.Types.Physics.Arcade.ArcadeColliderType;
    const p = this.player as unknown as AC;

    // Player ↔ world
    this.physics.add.collider(p, this.platforms);
    this.physics.add.collider(p, this.crackedFloors);
    this.physics.add.collider(p, this.flameBarriers,
      this.onPlayerHitBarrier as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this);

    // Enemies ↔ world
    for (const e of this.enemies) {
      this.physics.add.collider(e, this.platforms);
      this.physics.add.collider(e, this.crackedFloors);
    }

    // Player attack box ↔ enemies
    this.physics.add.overlap(
      this.player.attackBox,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      this.onPlayerAttackHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );

    // Player projectiles ↔ enemies
    this.physics.add.overlap(
      this.projectiles,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      this.onProjectileHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );

    // Enemy projectiles ↔ player
    this.physics.add.overlap(
      p,
      this.projectiles,
      this.onEnemyProjectileHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      (_pl, proj) => (proj as Projectile).owner === 'enemy',
      this,
    );

    // Enemy bodies ↔ player (contact damage)
    this.physics.add.overlap(
      p,
      this.enemies as unknown as Phaser.GameObjects.GameObject[],
      this.onPlayerTouchEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );

    // Pickups
    this.physics.add.overlap(
      p, this.scrolls,
      this.onScrollPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
    this.physics.add.overlap(
      p, this.healthOrbs,
      this.onHealthOrbPickup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined, this,
    );
  }

  // ── Collision callbacks ───────────────────────────────────────────────────

  private onPlayerAttackHitEnemy(
    _box: Phaser.GameObjects.GameObject,
    enemyGO: Phaser.GameObjects.GameObject,
  ): void {
    const enemy = enemyGO as Enemy;
    if (enemy.state === EnemyState.DEAD) return;
    if (this.player.playerState !== PlayerState.ATTACKING
      && this.player.playerState !== PlayerState.SPECIAL
      && this.player.playerState !== PlayerState.SLIDING) return;

    const dmg = this.player.outfit === 'stone_guard' ? 3 : 2;
    enemy.takeDamage(dmg, this.player.x);

    // Score
    this.registry.set(REG.SCORE, (this.registry.get(REG.SCORE) as number) + 10);
  }

  private onProjectileHitEnemy(
    projGO: Phaser.GameObjects.GameObject,
    enemyGO: Phaser.GameObjects.GameObject,
  ): void {
    const proj  = projGO  as Projectile;
    const enemy = enemyGO as Enemy;
    if (proj.owner !== 'player') return;
    if (enemy.state === EnemyState.DEAD) return;

    enemy.takeDamage(proj.damage, proj.x);
    proj.destroy();
    this.registry.set(REG.SCORE, (this.registry.get(REG.SCORE) as number) + 5);
  }

  private onEnemyProjectileHitPlayer(
    _playerGO: Phaser.GameObjects.GameObject,
    projGO: Phaser.GameObjects.GameObject,
  ): void {
    const proj = projGO as Projectile;
    if (proj.owner !== 'enemy') return;
    this.player.takeDamage(proj.damage, proj.x);
    proj.destroy();
  }

  private onPlayerTouchEnemy(
    _playerGO: Phaser.GameObjects.GameObject,
    enemyGO: Phaser.GameObjects.GameObject,
  ): void {
    const enemy = enemyGO as Enemy;
    if (enemy.state === EnemyState.DEAD || enemy.state === EnemyState.STAGGER) return;
    // Sliding through enemy deals damage
    if (this.player.playerState === PlayerState.SLIDING
      || this.player.playerState === PlayerState.SPECIAL) {
      enemy.takeDamage(2, this.player.x);
    } else {
      this.player.takeDamage(1, enemy.x);
    }
  }

  private onPlayerHitBarrier(
    _playerGO: Phaser.GameObjects.GameObject,
    _barrierGO: Phaser.GameObjects.GameObject,
  ): void {
    // Flame Ronin's dash / flame attack destroys barriers (handled in checkFlameBarrierDestroy)
    this.player.takeDamage(1, (_barrierGO as Phaser.Physics.Arcade.Image).x);
  }

  private onScrollPickup(
    _p: Phaser.GameObjects.GameObject,
    scrollGO: Phaser.GameObjects.GameObject,
  ): void {
    const scroll = scrollGO as Phaser.Physics.Arcade.Image;
    scroll.destroy();
    this.registry.set(REG.SCORE, (this.registry.get(REG.SCORE) as number) + 100);
    this.showBanner('CREST SCROLL', '+100 Score!', 1400);
    this.player.spawnParticles(this.player.x, this.player.y - 20, 0xf0e0a0, 10);
  }

  private onHealthOrbPickup(
    _p: Phaser.GameObjects.GameObject,
    orbGO: Phaser.GameObjects.GameObject,
  ): void {
    const orb = orbGO as Phaser.Physics.Arcade.Image;
    orb.destroy();
    const hp = Math.min(this.player.health + 2, this.player.maxHealth);
    this.player.health = hp;
    this.registry.set(REG.HEALTH, hp);
    this.events.emit('health-changed', hp);
    this.player.spawnParticles(this.player.x, this.player.y - 20, 0xff4466, 8);
  }

  // ── Game logic checks ─────────────────────────────────────────────────────

  private checkStealInteraction(): void {
    const nearest = this.outfitSystem.getNearestStaggeredEnemy(
      this.enemies, this.player.x, this.player.y, 80,
    );

    // If player just initiated steal, execute it
    if (this.player.playerState === PlayerState.STEALING && this.player.stealTarget) {
      const target = this.player.stealTarget as Enemy;
      if (target && Math.abs(this.player.x - target.x) < 32) {
        this.outfitSystem.executeSteal(target);
        this.player.stealTarget = null;
        this.enemies = this.enemies.filter(e => e !== target);
      }
    }
  }

  private checkFlameBarrierDestroy(): void {
    if (this.player.outfit !== 'flame_ronin') return;
    if (this.player.playerState !== PlayerState.SPECIAL && this.player.playerState !== PlayerState.ATTACKING) return;

    this.flameBarriers.getChildren().forEach((barrierGO) => {
      const barrier = barrierGO as Phaser.Physics.Arcade.Image;
      const dx = Math.abs(this.player.x - barrier.x);
      const dy = Math.abs(this.player.y - barrier.y);
      if (dx < 48 && dy < 60) {
        this.spawnBreakFX(barrier.x, barrier.y, 0xff6600);
        barrier.destroy();
      }
    });

    // Also let player projectiles destroy barriers
    this.projectiles.getChildren().forEach(projGO => {
      const proj = projGO as Projectile;
      if (proj.owner !== 'player') return;
      this.flameBarriers.getChildren().forEach(barrierGO => {
        const barrier = barrierGO as Phaser.Physics.Arcade.Image;
        const dx = Math.abs(proj.x - barrier.x);
        const dy = Math.abs(proj.y - barrier.y);
        if (dx < 30 && dy < 50) {
          this.spawnBreakFX(barrier.x, barrier.y, 0xff6600);
          barrier.destroy();
          proj.destroy();
        }
      });
    });
  }

  private checkCrackedFloorDestroy(): void {
    if (this.player.outfit !== 'stone_guard') return;
    if (!this.player.didGroundPound) return;
    this.player.didGroundPound = false;

    this.crackedFloors.getChildren().forEach(floorGO => {
      const floor = floorGO as Phaser.Physics.Arcade.Image;
      const dx = Math.abs(this.player.x - floor.x);
      const dy = Math.abs(this.player.y - floor.y);
      if (dx < 70 && dy < 30) {
        this.spawnBreakFX(floor.x, floor.y, 0x8b5a2b);
        floor.destroy();
      }
    });
  }

  private checkExitGate(): void {
    const gate = this.exitGate.getFirstAlive() as Phaser.Physics.Arcade.Image | null;
    if (!gate) return;

    const bossAlive = this.enemies.some(e => e instanceof GeneralEmberclaw && e.active && e.state !== (EnemyState.DEAD as string));
    if (bossAlive) {
      // Pulse the gate
      if (!gate.getData('locked')) {
        gate.setData('locked', true);
        gate.setTint(0x444444);
      }
      return;
    }

    // Boss defeated – unlock gate
    if (gate.getData('locked')) {
      gate.setData('locked', false);
      gate.clearTint();
      this.showBanner('BOSS DEFEATED!', 'Reach the exit gate!', 2500);
    }

    // Check player overlap
    const dx = Math.abs(this.player.x - gate.x);
    const dy = Math.abs(this.player.y - gate.y);
    if (dx < 40 && dy < 60) {
      this.win();
    }
  }

  private win(): void {
    this.registry.set(REG.WIN, true);
    this.player.setVelocity(0, 0);
    this.player.playerState = PlayerState.DEAD;
    this.cameras.main.flash(400, 255, 255, 255);

    this.time.delayedCall(600, () => {
      this.showBanner('STAGE CLEAR!', `Score: ${this.registry.get(REG.SCORE)}`, 999999);
      this.time.delayedCall(2500, () => {
        this.scene.stop(SCENES.UI);
        this.scene.start(SCENES.GAME_OVER);
      });
    });
  }

  // ── Setup UI ──────────────────────────────────────────────────────────────

  private setupUI(): void {
    // Controls reminder (scrolls with camera → use scrollFactor 0)
    this.controlsText = this.add.text(GAME_WIDTH - 12, 12,
      'Z=Jump  X=Attack  C=Steal/Special  Shift=Slide  Enter=Pause',
      { fontSize: '10px', color: '#aaaaaa', stroke: '#000', strokeThickness: 2 },
    ).setOrigin(1, 0).setScrollFactor(0).setDepth(DEPTH.UI);

    // Pause overlay (hidden by default)
    const pauseBg = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
      .setOrigin(0).setScrollFactor(0).setDepth(DEPTH.UI + 10);
    const pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED\n\nPress ENTER to resume', {
      fontSize: '28px',
      color: '#ffffff',
      align: 'center',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.UI + 11);
    this.pauseOverlay = this.add.container(0, 0, [pauseBg, pauseText]);
    this.pauseOverlay.setVisible(false);
  }

  private togglePause(): void {
    this.paused = !this.paused;
    this.pauseOverlay.setVisible(this.paused);
    if (this.paused) {
      this.physics.pause();
    } else {
      this.physics.resume();
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private spawnBreakFX(x: number, y: number, color: number): void {
    this.cameras.main.shake(150, 0.005);
    for (let i = 0; i < 12; i++) {
      const p = this.add.rectangle(
        x + Phaser.Math.Between(-20, 20),
        y + Phaser.Math.Between(-10, 10),
        Phaser.Math.Between(4, 10),
        Phaser.Math.Between(4, 10),
        color,
      ).setDepth(DEPTH.FX);
      this.tweens.add({
        targets: p,
        x: p.x + Phaser.Math.Between(-50, 50),
        y: p.y + Phaser.Math.Between(-60, 10),
        alpha: 0,
        duration: Phaser.Math.Between(300, 700),
        onComplete: () => p.destroy(),
      });
    }
  }

  showBanner(title: string, subtitle: string, duration: number): void {
    const cam = this.cameras.main;
    const cx  = cam.scrollX + GAME_WIDTH / 2;
    const cy  = cam.scrollY + GAME_HEIGHT / 2;

    const bg = this.add.rectangle(cx, cy - 40, 480, 70, 0x000000, 0.8)
      .setDepth(DEPTH.UI + 3).setOrigin(0.5).setScrollFactor(0);
    const t1 = this.add.text(cx, cy - 55, title, {
      fontSize: '22px',
      color: '#ffee44',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.UI + 4).setScrollFactor(0);
    const t2 = this.add.text(cx, cy - 28, subtitle, {
      fontSize: '13px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(DEPTH.UI + 4).setScrollFactor(0);

    this.tweens.add({
      targets: [bg, t1, t2],
      y: '-=16',
      duration: 300,
      ease: 'Back.Out',
    });

    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: [bg, t1, t2],
        alpha: 0,
        duration: 300,
        onComplete: () => { bg.destroy(); t1.destroy(); t2.destroy(); },
      });
    });
  }
}
