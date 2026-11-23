import knightAscii from '../../assets/sprites/characters/knight.ascii?raw';
import { PaletteId, PALETTES } from '../config/palettes';
import { CrtEffect } from '../renderer/crt-effect';
import { SpriteAnimator } from '../sprites/sprite-animator';
import { SpriteDefinition, SpriteFrame } from '../sprites/sprite-format';
import { parseSprite } from '../sprites/sprite-parser';

// Loaded sprite library
const SPRITE_LIBRARY: Record<string, string> = {
  'characters/knight.ascii': knightAscii,
};

let currentSpriteDef: SpriteDefinition | null = null;
let animator: SpriteAnimator | null = null;
let isPlaying = true;
let playbackSpeed = 1.0;
let zoom = 4;
let activePalette: PaletteId = 'full';
let showGrid = true;
let showAnchor = true;
let showHurtbox = true;
let showHitbox = true;
let flipHorizontal = false;

const crt = new CrtEffect();
crt.enabled = true;

// DOM Elements
const canvas = document.getElementById('sprite-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const spriteSelect = document.getElementById('sprite-select') as HTMLSelectElement;
const animSelect = document.getElementById('anim-select') as HTMLSelectElement;
const paletteSelect = document.getElementById('palette-select') as HTMLSelectElement;
const zoomSelect = document.getElementById('zoom-select') as HTMLSelectElement;
const btnPlay = document.getElementById('btn-play') as HTMLButtonElement;
const btnPrev = document.getElementById('btn-prev') as HTMLButtonElement;
const btnNext = document.getElementById('btn-next') as HTMLButtonElement;
const frameCounter = document.getElementById('frame-counter') as HTMLSpanElement;
const speedSlider = document.getElementById('speed-slider') as HTMLInputElement;
const speedDisplay = document.getElementById('speed-display') as HTMLSpanElement;

const chkGrid = document.getElementById('chk-grid') as HTMLInputElement;
const chkAnchor = document.getElementById('chk-anchor') as HTMLInputElement;
const chkHurtbox = document.getElementById('chk-hurtbox') as HTMLInputElement;
const chkHitbox = document.getElementById('chk-hitbox') as HTMLInputElement;
const chkFlip = document.getElementById('chk-flip') as HTMLInputElement;
const chkCrt = document.getElementById('chk-crt') as HTMLInputElement;

const glyphEditor = document.getElementById('glyph-editor') as HTMLTextAreaElement;
const colorEditor = document.getElementById('color-editor') as HTMLTextAreaElement;
const editorFrameName = document.getElementById('editor-frame-name') as HTMLSpanElement;
const btnApplyFrame = document.getElementById('btn-apply-frame') as HTMLButtonElement;
const btnExportAscii = document.getElementById('btn-export-ascii') as HTMLButtonElement;
const statusLog = document.getElementById('status-log') as HTMLDivElement;

function log(msg: string, isError = false) {
  statusLog.textContent = msg;
  statusLog.style.color = isError ? '#ef4444' : '#10b981';
}

function initUI() {
  // Populate sprite select
  spriteSelect.innerHTML = '';
  for (const name of Object.keys(SPRITE_LIBRARY)) {
    const opt = document.createElement('option');
    opt.value = name;
    opt.textContent = name;
    spriteSelect.appendChild(opt);
  }

  // Populate palettes
  paletteSelect.innerHTML = '';
  for (const [id, pal] of Object.entries(PALETTES)) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = pal.name;
    paletteSelect.appendChild(opt);
  }

  spriteSelect.addEventListener('change', () => loadSelectedSprite());
  paletteSelect.addEventListener('change', () => {
    activePalette = paletteSelect.value as PaletteId;
  });
  zoomSelect.addEventListener('change', () => {
    zoom = parseInt(zoomSelect.value, 10);
    resizeCanvas();
  });

  animSelect.addEventListener('change', () => {
    if (animSelect.value && animator) {
      animator.play(animSelect.value, true);
      updateEditorFields();
    }
  });

  btnPlay.addEventListener('click', () => {
    isPlaying = !isPlaying;
    btnPlay.textContent = isPlaying ? 'PAUSE' : 'PLAY';
    btnPlay.className = isPlaying ? 'active' : '';
  });

  btnPrev.addEventListener('click', () => {
    if (!animator) return;
    const anim = animator.getCurrentAnimation();
    if (!anim) return;
    isPlaying = false;
    btnPlay.textContent = 'PLAY';
    btnPlay.className = '';
    animator.currentFrameIndex =
      (animator.currentFrameIndex - 1 + anim.frameIds.length) % anim.frameIds.length;
    animator.tickTimer = 0;
    updateEditorFields();
  });

  btnNext.addEventListener('click', () => {
    if (!animator) return;
    const anim = animator.getCurrentAnimation();
    if (!anim) return;
    isPlaying = false;
    btnPlay.textContent = 'PLAY';
    btnPlay.className = '';
    animator.currentFrameIndex = (animator.currentFrameIndex + 1) % anim.frameIds.length;
    animator.tickTimer = 0;
    updateEditorFields();
  });

  speedSlider.addEventListener('input', () => {
    playbackSpeed = parseFloat(speedSlider.value);
    speedDisplay.textContent = `${playbackSpeed.toFixed(1)}x`;
  });

  chkGrid.addEventListener('change', () => (showGrid = chkGrid.checked));
  chkAnchor.addEventListener('change', () => (showAnchor = chkAnchor.checked));
  chkHurtbox.addEventListener('change', () => (showHurtbox = chkHurtbox.checked));
  chkHitbox.addEventListener('change', () => (showHitbox = chkHitbox.checked));
  chkFlip.addEventListener('change', () => {
    flipHorizontal = chkFlip.checked;
    if (animator) animator.flipX = flipHorizontal;
  });
  chkCrt.addEventListener('change', () => (crt.enabled = chkCrt.checked));

  btnApplyFrame.addEventListener('click', () => applyEditedFrame());
  btnExportAscii.addEventListener('click', () => exportCurrentSprite());

  loadSelectedSprite();
}

function loadSelectedSprite() {
  const spriteKey = spriteSelect.value;
  const raw = SPRITE_LIBRARY[spriteKey];
  if (!raw) return;

  const result = parseSprite(raw, spriteKey);
  if (result.errors.length > 0) {
    log(`Sprite Parse Error: ${result.errors[0]}`, true);
    return;
  }

  currentSpriteDef = result.sprite!;
  animator = new SpriteAnimator(currentSpriteDef);
  animator.flipX = flipHorizontal;

  // Populate animations
  animSelect.innerHTML = '';
  for (const animName of currentSpriteDef.animations.keys()) {
    const opt = document.createElement('option');
    opt.value = animName;
    opt.textContent = animName;
    animSelect.appendChild(opt);
  }

  resizeCanvas();
  updateEditorFields();
  log(`Loaded "${currentSpriteDef.name}" (${currentSpriteDef.width}x${currentSpriteDef.height})`);
}

function resizeCanvas() {
  if (!currentSpriteDef) return;

  // Margins around sprite in cells
  const marginCols = 6;
  const marginRows = 4;
  const totalCols = currentSpriteDef.width + marginCols * 2;
  const totalRows = currentSpriteDef.height + marginRows * 2;

  const baseCellW = 10;
  const baseCellH = 18;

  canvas.width = totalCols * baseCellW * zoom;
  canvas.height = totalRows * baseCellH * zoom;
  crt.resize(canvas.width, canvas.height);
}

function updateEditorFields() {
  if (!animator || !currentSpriteDef) return;
  const anim = animator.getCurrentAnimation();
  if (!anim) return;

  const frameId = anim.frameIds[animator.currentFrameIndex];
  const frame = currentSpriteDef.frames.get(frameId);
  editorFrameName.textContent = frameId;

  if (frame) {
    glyphEditor.value = frame.glyphs.join('\n');
    colorEditor.value = frame.colorMask.join('\n');
  }
}

function applyEditedFrame() {
  if (!animator || !currentSpriteDef) return;
  const anim = animator.getCurrentAnimation();
  if (!anim) return;

  const frameId = anim.frameIds[animator.currentFrameIndex];
  const frame = currentSpriteDef.frames.get(frameId);
  if (!frame) return;

  const newGlyphs = glyphEditor.value.split('\n');
  const newColors = colorEditor.value.split('\n');

  // Validate height and width
  if (newGlyphs.length !== currentSpriteDef.height) {
    log(`Error: GLYPHS must have ${currentSpriteDef.height} rows (has ${newGlyphs.length})`, true);
    return;
  }
  for (let i = 0; i < newGlyphs.length; i++) {
    if (newGlyphs[i].length !== currentSpriteDef.width) {
      log(`Error: Row ${i} length is ${newGlyphs[i].length}, must be ${currentSpriteDef.width}`, true);
      return;
    }
  }

  frame.glyphs = newGlyphs;
  frame.colorMask = newColors.map((r) => r.padEnd(currentSpriteDef!.width, 'W'));
  log(`Successfully updated frame "${frameId}"`);
}

function exportCurrentSprite() {
  if (!currentSpriteDef) return;
  // Reconstruct file
  const lines: string[] = [
    `# ${currentSpriteDef.name}`,
    `NAME: ${currentSpriteDef.name}`,
    `WIDTH: ${currentSpriteDef.width}`,
    `HEIGHT: ${currentSpriteDef.height}`,
    `ANCHOR: ${currentSpriteDef.anchor.x},${currentSpriteDef.anchor.y}`,
    `HURTBOX: ${currentSpriteDef.hurtbox.x},${currentSpriteDef.hurtbox.y},${currentSpriteDef.hurtbox.w},${currentSpriteDef.hurtbox.h}`,
    '',
    'ANIMATIONS:',
  ];

  for (const [name, anim] of currentSpriteDef.animations) {
    let animLine = `${name} = frames:${anim.frameIds.join(',')} durations:${anim.durations.join(',')} loop:${anim.loop}`;
    for (const dmg of anim.damageFrames) {
      animLine += ` damage:${dmg.frameIndex}[${dmg.hitbox.x},${dmg.hitbox.y},${dmg.hitbox.w},${dmg.hitbox.h}]`;
      if (dmg.damageMult && dmg.damageMult !== 1) {
        animLine += `*${dmg.damageMult}`;
      }
    }
    lines.push(animLine);
  }

  for (const [id, frame] of currentSpriteDef.frames) {
    lines.push('');
    lines.push(`--- FRAME: ${id}`);
    lines.push('GLYPHS:');
    lines.push(...frame.glyphs);
    lines.push('COLORS:');
    lines.push(...frame.colorMask);
  }

  const output = lines.join('\n');
  navigator.clipboard.writeText(output).then(
    () => log(`Exported full .ascii content copied to clipboard!`),
    () => log(`Export ready (check console)`, false)
  );
  console.log(output);
}

// Render Loop
let tickAccumulator = 0;

function renderLab() {
  requestAnimationFrame(renderLab);

  if (!currentSpriteDef || !animator) return;

  // Animation Update
  if (isPlaying) {
    tickAccumulator += playbackSpeed;
    while (tickAccumulator >= 1) {
      const changed = animator.update();
      if (changed) {
        updateEditorFields();
      }
      tickAccumulator -= 1;
    }
  }

  const anim = animator.getCurrentAnimation();
  if (anim) {
    frameCounter.textContent = `FRAME: ${animator.currentFrameIndex + 1} / ${anim.frameIds.length}`;
  }

  const frame: SpriteFrame | undefined = animator.getCurrentFrame();
  const pal = PALETTES[activePalette];

  // Clear Background
  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const baseCellW = 10 * zoom;
  const baseCellH = 18 * zoom;
  const marginCols = 6;
  const marginRows = 4;
  const spriteOriginX = marginCols * baseCellW;
  const spriteOriginY = marginRows * baseCellH;

  // Draw Grid Overlay
  if (showGrid) {
    ctx.strokeStyle = activePalette === 'amber' ? '#592D00' : '#1f2937';
    ctx.lineWidth = 1;
    const totalCols = currentSpriteDef.width + marginCols * 2;
    const totalRows = currentSpriteDef.height + marginRows * 2;

    for (let c = 0; c <= totalCols; c++) {
      ctx.beginPath();
      ctx.moveTo(c * baseCellW, 0);
      ctx.lineTo(c * baseCellW, canvas.height);
      ctx.stroke();
    }
    for (let r = 0; r <= totalRows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * baseCellH);
      ctx.lineTo(canvas.width, r * baseCellH);
      ctx.stroke();
    }
  }

  // Draw Sprite Glyphs
  if (frame) {
    ctx.font = `${baseCellH - 4 * zoom}px 'ASCIIBladeMono', monospace`;
    ctx.textBaseline = 'top';

    const w = currentSpriteDef.width;
    const h = currentSpriteDef.height;

    for (let r = 0; r < h; r++) {
      const gRow = frame.glyphs[r];
      const cRow = frame.colorMask[r] || '';

      for (let c = 0; c < w; c++) {
        const srcCol = flipHorizontal ? w - 1 - c : c;
        let char = gRow[srcCol];
        if (!char || char === ' ') continue;

        if (flipHorizontal) {
          if (char === '/') char = '\\';
          else if (char === '\\') char = '/';
          else if (char === '<') char = '>';
          else if (char === '>') char = '<';
          else if (char === '(') char = ')';
          else if (char === ')') char = '(';
          else if (char === '[') char = ']';
          else if (char === ']') char = '[';
        }

        const colorCode = cRow[srcCol] || 'W';
        const hex = pal.colors[colorCode] || pal.colors['W'] || '#FFFFFF';

        ctx.fillStyle = hex;
        const cellX = spriteOriginX + c * baseCellW;
        const cellY = spriteOriginY + r * baseCellH;
        ctx.fillText(char, cellX + 1 * zoom, cellY + 1 * zoom);
      }
    }
  }

  // Draw Overlays: Hurtbox
  if (showHurtbox) {
    const hb = currentSpriteDef.hurtbox;
    const hbX = flipHorizontal
      ? spriteOriginX + (currentSpriteDef.width - hb.x - hb.w) * baseCellW
      : spriteOriginX + hb.x * baseCellW;
    const hbY = spriteOriginY + hb.y * baseCellH;

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(hbX, hbY, hb.w * baseCellW, hb.h * baseCellH);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.15)';
    ctx.fillRect(hbX, hbY, hb.w * baseCellW, hb.h * baseCellH);
  }

  // Draw Overlays: Hitbox (if active damage frame)
  if (showHitbox) {
    const dmgDef = animator.getActiveDamageDef();
    if (dmgDef) {
      const hb = dmgDef.hitbox;
      const hbX = flipHorizontal
        ? spriteOriginX + (currentSpriteDef.width - hb.x - hb.w) * baseCellW
        : spriteOriginX + hb.x * baseCellW;
      const hbY = spriteOriginY + hb.y * baseCellH;

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(hbX, hbY, hb.w * baseCellW, hb.h * baseCellH);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.fillRect(hbX, hbY, hb.w * baseCellW, hb.h * baseCellH);

      // Hitbox label
      ctx.fillStyle = '#ef4444';
      ctx.font = `bold 12px monospace`;
      ctx.fillText(`HITBOX (${dmgDef.damageMult || 1.0}x)`, hbX + 4, hbY + 4);
    }
  }

  // Draw Overlays: Anchor (+)
  if (showAnchor) {
    const anc = currentSpriteDef.anchor;
    const ancCol = flipHorizontal ? currentSpriteDef.width - 1 - anc.x : anc.x;
    const ancX = spriteOriginX + ancCol * baseCellW + baseCellW / 2;
    const ancY = spriteOriginY + anc.y * baseCellH + baseCellH / 2;

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ancX - 10, ancY);
    ctx.lineTo(ancX + 10, ancY);
    ctx.moveTo(ancX, ancY - 10);
    ctx.lineTo(ancX, ancY + 10);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '10px monospace';
    ctx.fillText(`ANCHOR (${anc.x},${anc.y})`, ancX + 8, ancY + 8);
  }

  // Post-FX: CRT Scanlines and Vignette
  crt.render(ctx, canvas.width, canvas.height);
}

// Start Lab
initUI();
requestAnimationFrame(renderLab);
