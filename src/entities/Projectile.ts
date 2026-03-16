import Phaser from 'phaser';
import { ProjectileOwner } from '../types';
import { DEPTH } from '../constants';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  owner: ProjectileOwner;
  damage: number;
  private lifetime: number;
  private spawnTime: number;
  piercing: boolean;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    velocityX: number,
    velocityY: number,
    damage: number,
    owner: ProjectileOwner,
    lifetime: number = 3000,
    piercing: boolean = false,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.owner = owner;
    this.damage = damage;
    this.lifetime = lifetime;
    this.spawnTime = scene.time.now;
    this.piercing = piercing;

    this.setDepth(DEPTH.PROJECTILES);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setSize(this.width, this.height);

    // Set velocity AFTER disabling gravity to prevent frame-1 drop
    body.setVelocity(velocityX, velocityY);
  }

  // Re-apply gravity override when added to a group (groups can reset it)
  addedToScene(): void {
    super.addedToScene();
    if (this.body) {
      (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    }
  }

  update(time: number): void {
    if (time - this.spawnTime > this.lifetime) {
      this.destroy();
      return;
    }
    // Destroy if off screen (with margin)
    const cam = this.scene.cameras.main;
    const margin = 64;
    if (
      this.x < cam.scrollX - margin ||
      this.x > cam.scrollX + cam.width + margin ||
      this.y < cam.scrollY - margin ||
      this.y > cam.scrollY + cam.height + margin
    ) {
      this.destroy();
    }
  }
}

// Factory functions for common projectile types
export function createShuriken(
  scene: Phaser.Scene, x: number, y: number,
  dirX: number, speed: number = 300, damage: number = 3,
): Projectile {
  return new Projectile(
    scene, x, y, 'proj_shuriken',
    dirX * speed, 0, damage,
    ProjectileOwner.PLAYER, 2000,
  );
}

export function createArrow(
  scene: Phaser.Scene, x: number, y: number,
  dirX: number, speed: number = 350, damage: number = 4,
): Projectile {
  return new Projectile(
    scene, x, y, 'proj_arrow',
    dirX * speed, 0, damage,
    ProjectileOwner.PLAYER, 2500,
  );
}

export function createFlame(
  scene: Phaser.Scene, x: number, y: number,
  dirX: number, speed: number = 250, damage: number = 4,
): Projectile {
  return new Projectile(
    scene, x, y, 'proj_flame',
    dirX * speed, 0, damage,
    ProjectileOwner.PLAYER, 1500,
  );
}

export function createEnemyProjectile(
  scene: Phaser.Scene, x: number, y: number,
  velX: number, velY: number, damage: number, color: string = 'proj_enemy',
): Projectile {
  return new Projectile(
    scene, x, y, color,
    velX, velY, damage,
    ProjectileOwner.ENEMY, 4000,
  );
}
