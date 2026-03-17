import Phaser from 'phaser';

/**
 * Lightweight gamepad navigation helper for menu scenes.
 * Call `attach()` in create() — it hooks into the scene's update event
 * and fires callbacks on d-pad/stick/button presses.
 */
export interface GamepadMenuCallbacks {
  onUp?: () => void;
  onDown?: () => void;
  onLeft?: () => void;
  onRight?: () => void;
  onConfirm?: () => void;
  onBack?: () => void;
}

const STICK_DEADZONE = 0.5;
const REPEAT_DELAY = 250; // ms before d-pad repeats

export function attachGamepadMenu(scene: Phaser.Scene, cb: GamepadMenuCallbacks): void {
  const prev: boolean[] = new Array(16).fill(false);
  let stickPrevX = 0;
  let stickPrevY = 0;

  scene.events.on('update', () => {
    const pad = scene.input.gamepad?.pad1;
    if (!pad) return;

    const btnPressed = (i: number) => pad.buttons[i]?.pressed ?? false;
    const justDown = (i: number) => btnPressed(i) && !prev[i];

    // D-pad: up=12, down=13, left=14, right=15
    // Stick axes
    const stickX = pad.axes.length > 0 ? pad.axes[0].getValue() : 0;
    const stickY = pad.axes.length > 1 ? pad.axes[1].getValue() : 0;

    const stickLeft = stickX < -STICK_DEADZONE;
    const stickRight = stickX > STICK_DEADZONE;
    const stickUp = stickY < -STICK_DEADZONE;
    const stickDown = stickY > STICK_DEADZONE;

    const prevStickLeft = stickPrevX < -STICK_DEADZONE;
    const prevStickRight = stickPrevX > STICK_DEADZONE;
    const prevStickUp = stickPrevY < -STICK_DEADZONE;
    const prevStickDown = stickPrevY > STICK_DEADZONE;

    // Navigation — "just pressed" for d-pad buttons and stick deflection
    if ((justDown(12) || (stickUp && !prevStickUp)) && cb.onUp) cb.onUp();
    if ((justDown(13) || (stickDown && !prevStickDown)) && cb.onDown) cb.onDown();
    if ((justDown(14) || (stickLeft && !prevStickLeft)) && cb.onLeft) cb.onLeft();
    if ((justDown(15) || (stickRight && !prevStickRight)) && cb.onRight) cb.onRight();

    // A button (0) = confirm
    if (justDown(0) && cb.onConfirm) cb.onConfirm();
    // B button (1) or Start (9) = back
    if ((justDown(1) || justDown(9)) && cb.onBack) cb.onBack();

    // Save prev state
    for (let i = 0; i < prev.length; i++) {
      prev[i] = btnPressed(i);
    }
    stickPrevX = stickX;
    stickPrevY = stickY;
  });
}
