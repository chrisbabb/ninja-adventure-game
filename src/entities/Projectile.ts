import Phaser from 'phaser';
import { DEPTH } from '../constants';

export type ProjectileOwner = 'player' | 'enemy';

export class Projectile extends Phaser.Physics.Arcade.Sprite {
  damage: number;
  owner: ProjectileOwner;
  private lifeMs: number;
  private elapsed = 0;

  constructor(
    scene: Phaser.Scene,
    x: number, y: number,
    texture: string,
    velocityX: number,
    velocityY: number,
    damage: number,
    owner: ProjectileOwner,
    lifeMs = 1800,
  ) {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.damage  = damage;
    this.owner   = owner;
    this.lifeMs  = lifeMs;
    this.setDepth(DEPTH.PROJECTILE);
    this.setCollideWorldBounds(false);
    (this.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.setVelocity(velocityX, velocityY);

    // spin shurikens
    if (texture === 'enemy_shuriken') {
      scene.tweens.add({ targets: this, angle: 360, duration: 400, repeat: -1 });
    }
  }

  update(_time: number, delta: number): void {
    this.elapsed += delta;
    if (this.elapsed >= this.lifeMs) this.destroy();
  }
}
