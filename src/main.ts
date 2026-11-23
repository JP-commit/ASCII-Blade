import knightAscii from '../assets/sprites/characters/knight.ascii?raw';
import { PaletteId } from './config/palettes';
import { TUNING } from './config/tuning';
import { CrtEffect } from './renderer/crt-effect';
import { CELL_FLAGS, GlyphGrid } from './renderer/glyph-grid';
import { SpriteAnimator } from './sprites/sprite-animator';
import { parseSprite } from './sprites/sprite-parser';

// Setup canvas and grid
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const grid = new GlyphGrid({
  cols: TUNING.GRID_COLS,
  rows: TUNING.GRID_ROWS,
  cellWidth: TUNING.CELL_WIDTH,
  cellHeight: TUNING.CELL_HEIGHT,
  fontFamily: 'ASCIIBladeMono',
  paletteId: 'full',
  useExtendedGlyphs: false,
});

const crt = new CrtEffect();
crt.enabled = true;

// UI controls
const btnPalette = document.getElementById('btn-palette') as HTMLButtonElement;
const btnCrt = document.getElementById('btn-crt') as HTMLButtonElement;
const btnExtended = document.getElementById('btn-extended') as HTMLButtonElement;

const paletteList: PaletteId[] = ['full', 'amber', 'green', 'mono', 'colorblind'];
let currentPaletteIdx = 0;

btnPalette.addEventListener('click', () => {
  currentPaletteIdx = (currentPaletteIdx + 1) % paletteList.length;
  const pId = paletteList[currentPaletteIdx];
  grid.setPalette(pId);
  btnPalette.textContent = `PALETTE: ${pId.toUpperCase()}`;
});

btnCrt.addEventListener('click', () => {
  crt.enabled = !crt.enabled;
  btnCrt.textContent = `CRT: ${crt.enabled ? 'ON' : 'OFF'}`;
});

btnExtended.addEventListener('click', () => {
  grid.useExtendedGlyphs = !grid.useExtendedGlyphs;
  grid.forceFullRedraw = true;
  btnExtended.textContent = `EXTENDED: ${grid.useExtendedGlyphs ? 'ON' : 'OFF'}`;
});

// Load Knight Sprite
const parseResult = parseSprite(knightAscii, 'knight.ascii');
let knightAnimator: SpriteAnimator | null = null;
if (parseResult.sprite) {
  knightAnimator = new SpriteAnimator(parseResult.sprite, 'run');
}

// Window resizing with aspect ratio preservation
function handleResize() {
  const targetWidth = TUNING.GRID_COLS * TUNING.CELL_WIDTH;
  const targetHeight = TUNING.GRID_ROWS * TUNING.CELL_HEIGHT;

  const windowW = window.innerWidth;
  const windowH = window.innerHeight;

  const scale = Math.min(windowW / targetWidth, windowH / targetHeight);
  const displayW = Math.floor(targetWidth * scale);
  const displayH = Math.floor(targetHeight * scale);

  canvas.width = targetWidth;
  canvas.height = targetHeight;
  canvas.style.width = `${displayW}px`;
  canvas.style.height = `${displayH}px`;

  crt.resize(targetWidth, targetHeight);
  grid.forceFullRedraw = true;
}

window.addEventListener('resize', handleResize);
handleResize();

// Game loop state
let lastTime = performance.now();
let accumulator = 0;
let frameCount = 0;
let fps = 60;
let lastFpsUpdate = performance.now();

// Preview animation sequencer for Knight
const previewAnims = ['idle', 'run', 'attack1', 'attack2', 'attack3', 'heavy_charge', 'heavy_release', 'dodge', 'block'];
let currentAnimIdx = 1;
let animTimer = 0;

function update(dt: number) {
  // Cycle preview animations every 120 frames (2 seconds)
  animTimer += dt;
  if (animTimer >= 2000) {
    animTimer = 0;
    currentAnimIdx = (currentAnimIdx + 1) % previewAnims.length;
    if (knightAnimator) {
      knightAnimator.play(previewAnims[currentAnimIdx], true);
    }
  }

  if (knightAnimator) {
    knightAnimator.update();
  }
}

function draw() {
  grid.clear('transparent');

  // Outer Screen Border
  grid.drawBox(0, 0, TUNING.GRID_COLS, TUNING.GRID_ROWS, 'K', 'transparent', ' ASCIIBLADE // ENGINE STAGE 1 ');

  // Big ASCII Logo in Center
  const logo = [
    '   _   ____   ____ ___ ___ ____  _        _    ____  _____ ',
    '  / \\ / ___| / ___|_ _|_ _| __ )| |      / \\  |  _ \\| ____|',
    ' / _ \\\\___ \\| |    | | | ||  _ \\| |     / _ \\ | | | |  _|  ',
    '/ ___ \\___) | |___ | | | || |_) | |___ / ___ \\| |_| | |___ ',
    '/_/   \\_\\____/ \\____|___|___|____/|_____/_/   \\_\\____/|_____|',
  ];

  const logoY = 4;
  for (let r = 0; r < logo.length; r++) {
    const text = logo[r];
    const x = Math.floor((TUNING.GRID_COLS - text.length) / 2);
    grid.drawString(x, logoY + r, text, 'G', 'transparent', CELL_FLAGS.BOLD);
  }

  grid.drawString(
    Math.floor(TUNING.GRID_COLS / 2) - 30,
    10,
    'A PURE ASCII HACK-AND-SLASH ACTION ROGUELITE - ZERO EXTERNAL ART ASSETS',
    'Y'
  );

  // Status & Telemetry Box
  grid.drawBox(10, 13, 60, 28, 'B', 'D', ' ENGINE TELEMETRY ');
  grid.drawString(13, 16, `SCREEN RESOLUTION : ${TUNING.GRID_COLS} x ${TUNING.GRID_ROWS} Monospace Cells`, 'W');
  grid.drawString(13, 18, `TARGET TIMESTEP   : 60 FPS Fixed (16.66 ms)`, 'W');
  grid.drawString(13, 20, `ACTIVE PALETTE    : ${grid.palette.name}`, 'G');
  grid.drawString(13, 22, `CRT SCANLINES     : ${crt.enabled ? 'ENABLED' : 'DISABLED'}`, 'C');
  grid.drawString(13, 24, `EXTENDED GLYPHS   : ${grid.useExtendedGlyphs ? 'BOX-DRAWING ON' : 'STRICT ASCII (0x20-0x7E)'}`, 'O');
  grid.drawString(13, 26, `ACTIVE FPS        : ${fps.toFixed(1)}`, 'E');

  // Mock HUD Components
  grid.drawString(13, 29, `MOCK PLAYER HUD:`, 'Y', 'transparent', CELL_FLAGS.BOLD);
  grid.drawString(13, 31, `HP `, 'R');
  grid.drawProgressBar(17, 31, 30, 95, 120, 'R', 'K');
  grid.drawString(49, 31, `95/120`, 'W');

  grid.drawString(13, 33, `STA`, 'G');
  grid.drawProgressBar(17, 33, 30, 80, 100, 'G', 'K');
  grid.drawString(49, 33, `80/100`, 'W');

  grid.drawString(13, 35, `COMBO: 14 HITS [x2.5 DMG]`, 'O', 'transparent', CELL_FLAGS.BOLD);
  grid.drawString(13, 37, `PRESS [OPEN SPRITE LAB] TO INSPECT SPRITES & LIVE EDIT`, 'C');

  // Sprite Preview Box
  grid.drawBox(74, 13, 76, 28, 'P', 'D', ' SPRITE ENGINE PREVIEW: KNIGHT ');
  grid.drawString(77, 16, `SPRITE NAME : Knight (Player Character)`, 'W');
  grid.drawString(77, 18, `DIMENSIONS  : 9 cols x 7 rows | Anchor: (4, 6)`, 'W');
  grid.drawString(77, 20, `ANIMATION   : ${previewAnims[currentAnimIdx]}`, 'Y', 'transparent', CELL_FLAGS.BOLD);

  // Render Knight Preview Sprite
  if (knightAnimator) {
    const frame = knightAnimator.getCurrentFrame();
    if (frame) {
      // Draw normal facing
      grid.drawSprite(90, 24, frame, false);
      grid.drawString(88, 32, '[FACING RIGHT]', 'K');

      // Draw flipped facing
      grid.drawSprite(115, 24, frame, true);
      grid.drawString(113, 32, '[FACING LEFT]', 'K');

      // Draw hit-flash preview
      grid.drawSprite(135, 24, frame, false, undefined, true);
      grid.drawString(132, 32, '[HIT-FLASH]', 'K');
    }
  }

  // Bottom Instructions & Controls
  grid.drawBox(10, 42, 140, 3, 'K', 'transparent');
  grid.drawString(13, 42, `[STAGE 1 VERIFICATION READY] - Monospace Glyph Grid, Color Palettes, Sprite Lab & Linter`, 'E', 'transparent', CELL_FLAGS.BOLD);

  // Render to canvas
  grid.renderToCanvas(ctx);

  // CRT Post-Processing
  crt.render(ctx, canvas.width, canvas.height);
}

function gameLoop(now: number) {
  requestAnimationFrame(gameLoop);

  const delta = now - lastTime;
  lastTime = now;
  accumulator += delta;

  // FPS calculation
  frameCount++;
  if (now - lastFpsUpdate >= 1000) {
    fps = (frameCount * 1000) / (now - lastFpsUpdate);
    frameCount = 0;
    lastFpsUpdate = now;
  }

  while (accumulator >= TUNING.TIME_STEP_MS) {
    update(TUNING.TIME_STEP_MS);
    accumulator -= TUNING.TIME_STEP_MS;
  }

  draw();
}

requestAnimationFrame((now) => {
  lastTime = now;
  lastFpsUpdate = now;
  gameLoop(now);
});
