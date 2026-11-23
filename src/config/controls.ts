/**
 * Controls and Keybindings for ASCIIBLADE
 */

export interface KeyBindings {
  moveLeft: string[];
  moveRight: string[];
  jump: string[];
  lightAttack: string[];
  heavyAttack: string[];
  special: string[];
  dodge: string[];
  block: string[];
  interact: string[];
  inventory: string[];
  pause: string[];
  debug: string[];
}

export const DEFAULT_KEY_BINDINGS: KeyBindings = {
  moveLeft: ['KeyA', 'ArrowLeft'],
  moveRight: ['KeyD', 'ArrowRight'],
  jump: ['KeyW', 'Space', 'ArrowUp'],
  lightAttack: ['KeyJ'],
  heavyAttack: ['KeyK'],
  special: ['KeyL'],
  dodge: ['ShiftLeft', 'ShiftRight'],
  block: ['KeyU'],
  interact: ['KeyE'],
  inventory: ['Tab'],
  pause: ['Escape'],
  debug: ['Backquote'],
};

export interface GamepadBindings {
  moveLeftAxis: number;
  moveRightAxis: number;
  jumpButton: number;       // A (Button 0)
  lightAttackButton: number; // X (Button 2)
  heavyAttackButton: number; // Y (Button 3)
  specialButton: number;     // B (Button 1)
  dodgeButton: number;       // RB (Button 5)
  blockButton: number;       // LB (Button 4)
  interactButton: number;    // D-Pad Up or Select
  pauseButton: number;       // Start (Button 9)
}

export const DEFAULT_GAMEPAD_BINDINGS: GamepadBindings = {
  moveLeftAxis: 0,
  moveRightAxis: 0,
  jumpButton: 0,
  lightAttackButton: 2,
  heavyAttackButton: 3,
  specialButton: 1,
  dodgeButton: 5,
  blockButton: 4,
  interactButton: 12,
  pauseButton: 9,
};
