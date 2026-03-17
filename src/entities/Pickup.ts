import Phaser from 'phaser';
import { DEPTH } from '../constants';

export enum PickupType {
  HEALTH_SMALL = 'health_small',
  HEALTH_BIG = 'health_big',
  ENERGY = 'energy',
}

const PICKUP_CONFIG = {
  [PickupType.HEALTH_SMALL]: { texture: 'pickup_health_small', value: 3, lifetime: 8000 },
  [PickupType.HEALTH_BIG]: { texture: 'pickup_health_big', value: 8, lifetime: 8000 },
  [PickupType.ENERGY]: { texture: 'pickup_energy', value: 25, lifetime: 8000 },
};

export class Pickup extends Phaser.Physics.Arcade.Sprite {
  pickupType: PickupType;
  value: number;
  private lifetime: number;
  private bobTimer: number = 0;
  private baseY: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PickupType) {
    const config = PICKUP_CONFIG[type];
    super(scene, x, y, config.texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.pickupType = type;
    this.value = config.value;
    this.lifetime = config.lifetime;
    this.baseY = y;

    this.setDepth(DEPTH.ENEMIES + 5);
    this.setDisplaySize(type === PickupType.HEALTH_BIG ? 14 : 10, type === PickupType.HEALTH_BIG ? 14 : 10);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(true);
    body.setVelocityY(-120);
    body.setVelocityX((Math.random() - 0.5) * 80);
    body.setBounce(0.3);
    body.setDragX(50);
  }

  update(time: number, delta: number): void {
    if (!this.active) return;

    this.lifetime -= delta;
    if (this.lifetime <= 0) {
      this.destroy();
      return;
    }

    // Blink when about to expire
    if (this.lifetime < 2000) {
      this.setAlpha(Math.sin(time * 0.01) > 0 ? 1 : 0.3);
    }

    // Gentle bob once on ground
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      this.bobTimer += delta * 0.003;
      this.y = body.y + body.halfHeight + Math.sin(this.bobTimer) * 2;
    }
  }
}

/** Roll for a random drop from a defeated enemy. Returns null if no drop. */
export function rollEnemyDrop(scene: Phaser.Scene, x: number, y: number): Pickup | null {
  const roll = Math.random();

  // 50% chance of a drop
  if (roll > 0.50) return null;

  // Of the drops: 40% small health, 20% big health, 40% energy
  const typeRoll = Math.random();
  let type: PickupType;
  if (typeRoll < 0.40) {
    type = PickupType.HEALTH_SMALL;
  } else if (typeRoll < 0.60) {
    type = PickupType.HEALTH_BIG;
  } else {
    type = PickupType.ENERGY;
  }

  return new Pickup(scene, x, y, type);
}
