/**
 * Unified Input Manager for Desktop (Keyboard & Mouse) and Mobile (Touch Joystick & Action Buttons)
 */

export interface InputState {
  moveX: number; // -1.0 to 1.0
  moveY: number; // -1.0 to 1.0
  aimAngle: number; // In radians (0 = right, pi/2 = down)
  isAttacking: boolean;
  attackJustPressed: boolean;
  isDashing: boolean;
  dashJustPressed: boolean;
  skill1JustPressed: boolean;
  skill2JustPressed: boolean;
  skill3JustPressed: boolean;
}

export class InputManager {
  readonly state: InputState = {
    moveX: 0,
    moveY: 0,
    aimAngle: 0,
    isAttacking: false,
    attackJustPressed: false,
    isDashing: false,
    dashJustPressed: false,
    skill1JustPressed: false,
    skill2JustPressed: false,
    skill3JustPressed: false,
  };

  private keysDown: Set<string> = new Set();
  private mousePos = { x: 0, y: 0 };
  private canvasCenter = { x: 0, y: 0 };

  // Touch joystick tracking
  isTouchDevice: boolean = false;
  showTouchControls: boolean = false;

  private joystickActive: boolean = false;

  constructor() {
    this.isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.showTouchControls = this.isTouchDevice;

    this.initKeyboardMouseListeners();
  }

  setCanvasCenter(cx: number, cy: number) {
    this.canvasCenter = { x: cx, y: cy };
  }

  toggleTouchControls(force?: boolean) {
    this.showTouchControls = force !== undefined ? force : !this.showTouchControls;
    const touchOverlay = document.getElementById('touch-controls-overlay');
    if (touchOverlay) {
      touchOverlay.style.display = this.showTouchControls ? 'block' : 'none';
    }
  }

  private initKeyboardMouseListeners() {
    window.addEventListener('keydown', (e) => {
      this.keysDown.add(e.code);
      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
      }

      if (e.code === 'KeyJ') {
        this.state.attackJustPressed = true;
      }
      if (e.code === 'Space' || e.code === 'ShiftLeft') {
        this.state.dashJustPressed = true;
      }
      if (e.code === 'KeyQ') this.state.skill1JustPressed = true;
      if (e.code === 'KeyE') this.state.skill2JustPressed = true;
      if (e.code === 'KeyR') this.state.skill3JustPressed = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
    });

    window.addEventListener('mousemove', (e) => {
      this.mousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        // Left click
        this.state.isAttacking = true;
        this.state.attackJustPressed = true;
      }
      if (e.button === 2) {
        // Right click
        e.preventDefault();
        this.state.dashJustPressed = true;
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.state.isAttacking = false;
      }
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Called by the touch joystick UI
   */
  setJoystickInput(vx: number, vy: number) {
    this.state.moveX = vx;
    this.state.moveY = vy;
    if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
      this.state.aimAngle = Math.atan2(vy, vx);
    }
  }

  triggerTouchAction(action: 'atk' | 'dash' | 's1' | 's2' | 's3', isDown = true) {
    if (action === 'atk') {
      this.state.isAttacking = isDown;
      if (isDown) this.state.attackJustPressed = true;
    } else if (action === 'dash') {
      this.state.isDashing = isDown;
      if (isDown) this.state.dashJustPressed = true;
    } else if (action === 's1' && isDown) {
      this.state.skill1JustPressed = true;
    } else if (action === 's2' && isDown) {
      this.state.skill2JustPressed = true;
    } else if (action === 's3' && isDown) {
      this.state.skill3JustPressed = true;
    }
  }

  update() {
    // If joystick is active, it controls moveX/moveY
    if (!this.joystickActive) {
      let mx = 0;
      let my = 0;

      if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) mx -= 1;
      if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) mx += 1;
      if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) my -= 1;
      if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) my += 1;

      // Normalize diagonal movement
      if (mx !== 0 && my !== 0) {
        const invSqrt2 = 0.70710678;
        mx *= invSqrt2;
        my *= invSqrt2;
      }

      this.state.moveX = mx;
      this.state.moveY = my;
    }

    // Aim calculation (Mouse aim on Desktop)
    if (!this.isTouchDevice && this.canvasCenter.x > 0) {
      const dx = this.mousePos.x - this.canvasCenter.x;
      const dy = this.mousePos.y - this.canvasCenter.y;
      this.state.aimAngle = Math.atan2(dy, dx);
    }
  }

  /**
   * Resets single-frame transient flags
   */
  endFrame() {
    this.state.attackJustPressed = false;
    this.state.dashJustPressed = false;
    this.state.skill1JustPressed = false;
    this.state.skill2JustPressed = false;
    this.state.skill3JustPressed = false;
  }
}
