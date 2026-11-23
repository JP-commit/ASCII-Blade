import { InputManager } from './engine/input-manager';
import { PlayerController } from './entities/player-controller';
import { AsciiMatrixWorld } from './renderer/ascii-matrix';
import { CrtEffect } from './renderer/crt-effect';

// Canvas setup
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

// Screen & Grid metrics (High-density character grid)
const CELL_W = 10;
const CELL_H = 16;
let viewCols = 100;
let viewRows = 55;

// World & Engine setup
const WORLD_WIDTH = 120;
const WORLD_HEIGHT = 80;
const world = new AsciiMatrixWorld(WORLD_WIDTH, WORLD_HEIGHT);

const player = new PlayerController(
  Math.floor(WORLD_WIDTH / 2),
  Math.floor(WORLD_HEIGHT / 2) + 6
);

const input = new InputManager();
const crt = new CrtEffect();
crt.enabled = true;

// UI Elements
const btnToggleTouch = document.getElementById('btn-toggle-touch') as HTMLButtonElement;
const btnToggleCrt = document.getElementById('btn-toggle-crt') as HTMLButtonElement;
const touchOverlay = document.getElementById('touch-overlay') as HTMLDivElement;

let showTouchControls = true;

btnToggleTouch.addEventListener('click', () => {
  showTouchControls = !showTouchControls;
  touchOverlay.style.display = showTouchControls ? 'block' : 'none';
  btnToggleTouch.textContent = `TOUCH UI: ${showTouchControls ? 'ON' : 'OFF'}`;
  btnToggleTouch.classList.toggle('active', showTouchControls);
});

btnToggleCrt.addEventListener('click', () => {
  crt.enabled = !crt.enabled;
  btnToggleCrt.textContent = `CRT: ${crt.enabled ? 'ON' : 'OFF'}`;
  btnToggleCrt.classList.toggle('active', crt.enabled);
});

// Setup Touch Joystick
const joystickZone = document.getElementById('joystick-zone') as HTMLDivElement;
const joystickKnob = document.getElementById('joystick-knob') as HTMLDivElement;
let isTouchingJoystick = false;
let joystickStartPos = { x: 0, y: 0 };
const MAX_JOYSTICK_RADIUS = 40;

function handleJoystickStart(clientX: number, clientY: number) {
  isTouchingJoystick = true;
  joystickStartPos = { x: clientX, y: clientY };
}

function handleJoystickMove(clientX: number, clientY: number) {
  if (!isTouchingJoystick) return;
  const dx = clientX - joystickStartPos.x;
  const dy = clientY - joystickStartPos.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  let clampedDist = dist;
  let angle = Math.atan2(dy, dx);
  if (clampedDist > MAX_JOYSTICK_RADIUS) {
    clampedDist = MAX_JOYSTICK_RADIUS;
  }

  const knobX = Math.cos(angle) * clampedDist;
  const knobY = Math.sin(angle) * clampedDist;
  joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

  const normX = knobX / MAX_JOYSTICK_RADIUS;
  const normY = knobY / MAX_JOYSTICK_RADIUS;
  input.setJoystickInput(normX, normY);
}

function handleJoystickEnd() {
  isTouchingJoystick = false;
  joystickKnob.style.transform = `translate(0px, 0px)`;
  input.setJoystickInput(0, 0);
}

// Touch events for joystick
joystickZone.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  handleJoystickStart(touch.clientX, touch.clientY);
});

window.addEventListener('touchmove', (e) => {
  if (!isTouchingJoystick) return;
  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    handleJoystickMove(touch.clientX, touch.clientY);
  }
});

window.addEventListener('touchend', () => handleJoystickEnd());
window.addEventListener('touchcancel', () => handleJoystickEnd());

// Mouse simulation of joystick for testing on desktop
joystickZone.addEventListener('mousedown', (e) => {
  handleJoystickStart(e.clientX, e.clientY);
  const onMouseMove = (ev: MouseEvent) => handleJoystickMove(ev.clientX, ev.clientY);
  const onMouseUp = () => {
    handleJoystickEnd();
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  };
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);
});

// Setup Touch Action Buttons
const btnTouchAtk = document.getElementById('btn-touch-atk') as HTMLButtonElement;
const btnTouchDash = document.getElementById('btn-touch-dash') as HTMLButtonElement;
const btnTouchS1 = document.getElementById('btn-touch-s1') as HTMLButtonElement;
const btnTouchS2 = document.getElementById('btn-touch-s2') as HTMLButtonElement;

function bindTouchButton(btn: HTMLElement, action: 'atk' | 'dash' | 's1' | 's2') {
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    input.triggerTouchAction(action, true);
  });
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.triggerTouchAction(action, false);
  });
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    input.triggerTouchAction(action, true);
  });
  btn.addEventListener('mouseup', (e) => {
    e.preventDefault();
    input.triggerTouchAction(action, false);
  });
}

bindTouchButton(btnTouchAtk, 'atk');
bindTouchButton(btnTouchDash, 'dash');
bindTouchButton(btnTouchS1, 's1');
bindTouchButton(btnTouchS2, 's2');

// Responsive Canvas Resize
function handleResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;

  viewCols = Math.max(70, Math.floor(w / CELL_W));
  viewRows = Math.max(40, Math.floor(h / CELL_H));

  canvas.width = viewCols * CELL_W;
  canvas.height = viewRows * CELL_H;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  input.setCanvasCenter(w / 2, h / 2);
  crt.resize(canvas.width, canvas.height);
}

window.addEventListener('resize', handleResize);
handleResize();

// Game Loop
let lastTime = performance.now();
const TARGET_DT = 1000 / 60; // 60 FPS fixed step
let accumulator = 0;

function update(dt: number) {
  input.update();
  world.update(dt);
  player.update(input.state, world);
  input.endFrame();
}

function render() {
  // Clear canvas
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${CELL_H - 2}px 'ASCIIBladeMono', monospace`;
  ctx.textBaseline = 'top';

  // Camera follows player
  const camX = Math.round(player.x - viewCols / 2);
  const camY = Math.round(player.y - viewRows / 2);

  // Render High-Density ASCII Matrix
  for (let r = 0; r < viewRows; r++) {
    const worldY = camY + r;
    const screenY = r * CELL_H;

    for (let c = 0; c < viewCols; c++) {
      const worldX = camX + c;
      const screenX = c * CELL_W;

      const cell = world.evaluateCell(worldX, worldY);

      if (cell.char !== ' ') {
        ctx.fillStyle = cell.fgColor;
        ctx.fillText(cell.char, screenX + 1, screenY + 1);
      }
    }
  }

  // Render Player & Slash Arcs into Screen Grid
  player.render((worldX, worldY, char, fgColor) => {
    const screenCol = worldX - camX;
    const screenRow = worldY - camY;

    if (
      screenCol >= 0 &&
      screenCol < viewCols &&
      screenRow >= 0 &&
      screenRow < viewRows
    ) {
      ctx.fillStyle = fgColor;
      ctx.fillText(char, screenCol * CELL_W + 1, screenRow * CELL_H + 1);
    }
  });

  // Render Mini-HUD in Top-Left (ASCII Style)
  renderHUD();

  // CRT Scanlines & Glow
  crt.render(ctx, canvas.width, canvas.height);
}

function renderHUD() {
  const hudX = 14;
  const hudY = 38;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fillRect(hudX - 6, hudY - 6, 220, 68);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(hudX - 6, hudY - 6, 220, 68);

  ctx.fillStyle = '#EF4444';
  ctx.fillText('HP  [############----] 120/150', hudX, hudY);

  ctx.fillStyle = '#38BDF8';
  ctx.fillText('STA [################] 100/100', hudX, hudY + 18);

  ctx.fillStyle = '#F59E0B';
  ctx.fillText(
    `COMBO: ${player.comboCount > 0 ? player.comboCount + 'x SLASH' : 'READY'}`,
    hudX,
    hudY + 36
  );
}

function gameLoop(now: number) {
  requestAnimationFrame(gameLoop);

  const delta = now - lastTime;
  lastTime = now;
  accumulator += delta;

  while (accumulator >= TARGET_DT) {
    update(TARGET_DT);
    accumulator -= TARGET_DT;
  }

  render();
}

requestAnimationFrame((now) => {
  lastTime = now;
  gameLoop(now);
});
