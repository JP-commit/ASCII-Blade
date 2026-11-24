import { CombatSystem } from './combat/combat-system';
import { SynthAudio } from './engine/audio/synth-audio';
import { InputManager } from './engine/input-manager';
import { ClassId } from './entities/classes';
import { WaveSpawner } from './entities/enemies/wave-spawner';
import { PlayerController } from './entities/player-controller';
import { ProjectileSystem } from './entities/projectiles';
import { AsciiMatrixWorld } from './renderer/ascii-matrix';
import { CrtEffect } from './renderer/crt-effect';
import { CharacterStudio } from './ui/character-studio';

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
  Math.floor(WORLD_HEIGHT / 2) + 6,
  'swordsman'
);

const studio = new CharacterStudio(player.model);
const projSys = new ProjectileSystem();
const combat = new CombatSystem();
const audio = new SynthAudio();
const spawner = new WaveSpawner();
const input = new InputManager();
const crt = new CrtEffect();
crt.enabled = true;

// Start Wave 1
spawner.startWave(1, world);

// Studio Button & Keybindings
const btnToggleStudio = document.getElementById('btn-toggle-studio') as HTMLButtonElement;
btnToggleStudio.addEventListener('click', () => {
  studio.toggle();
  btnToggleStudio.classList.toggle('active', studio.isOpen);
});

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyC') {
    studio.toggle();
    btnToggleStudio.classList.toggle('active', studio.isOpen);
  } else if (studio.isOpen) {
    if (e.code === 'Escape') {
      studio.isOpen = false;
      btnToggleStudio.classList.remove('active');
    } else if (e.code === 'Digit1') studio.setMaterial('steel');
    else if (e.code === 'Digit2') studio.setMaterial('moonsteel');
    else if (e.code === 'Digit3') studio.setMaterial('gold');
    else if (e.code === 'Digit4') studio.setMaterial('bronze');
    else if (e.code === 'Digit5') studio.setMaterial('bloodiron');
    else if (e.code === 'Digit6') studio.setMaterial('emberstone');
    else if (e.code === 'Digit7') studio.setMaterial('nightglass');
    else if (e.code === 'KeyF') studio.toggleSword();
    else if (e.code === 'KeyH') studio.toggleHalo();
  }
});

// Class Switching Buttons
const classButtons: Record<ClassId, HTMLButtonElement> = {
  swordsman: document.getElementById('btn-class-swordsman') as HTMLButtonElement,
  archer: document.getElementById('btn-class-archer') as HTMLButtonElement,
  tank: document.getElementById('btn-class-tank') as HTMLButtonElement,
  magician: document.getElementById('btn-class-magician') as HTMLButtonElement,
};

function selectClass(classId: ClassId) {
  player.switchClass(classId);
  for (const [id, btn] of Object.entries(classButtons)) {
    btn.classList.toggle('active', id === classId);
  }
}

for (const [id, btn] of Object.entries(classButtons)) {
  btn.addEventListener('click', () => selectClass(id as ClassId));
}

// UI Elements
const btnToggleTouch = document.getElementById('btn-toggle-touch') as HTMLButtonElement;
const btnToggleCrt = document.getElementById('btn-toggle-crt') as HTMLButtonElement;
const btnToggleAudio = document.getElementById('btn-toggle-audio') as HTMLButtonElement;
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

btnToggleAudio.addEventListener('click', () => {
  audio.enabled = !audio.enabled;
  btnToggleAudio.textContent = `AUDIO: ${audio.enabled ? 'ON' : 'OFF'}`;
  btnToggleAudio.classList.toggle('active', audio.enabled);
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
  const angle = Math.atan2(dy, dx);
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
const btnTouchS3 = document.getElementById('btn-touch-s3') as HTMLButtonElement;

function bindTouchButton(
  btn: HTMLElement,
  action: 'atk' | 'dash' | 's1' | 's2' | 's3'
) {
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
bindTouchButton(btnTouchS3, 's3');

// Sound triggers on attack/dash
window.addEventListener('mousedown', () => {
  if (player.currentClass.id === 'archer') audio.playArrowShoot();
  else audio.playSlash();
});
btnTouchAtk.addEventListener('click', () => {
  if (player.currentClass.id === 'archer') audio.playArrowShoot();
  else audio.playSlash();
});
btnTouchDash.addEventListener('click', () => audio.playDash());

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

  const isFrozen = combat.update();
  if (!isFrozen) {
    world.update(dt);
    player.update(input.state, world, projSys);
    spawner.update(world);

    // Update Enemies
    for (const enemy of spawner.enemies) {
      enemy.update(player, world, projSys, (type, x, y) =>
        spawner.spawnMinion(type, x, y)
      );
    }

    projSys.update(world);

    // Collision & Combat Processing
    processCombatInteractions();
  }

  input.endFrame();
}

function processCombatInteractions() {
  // 1. Check Player Slashes against Enemies
  for (const slash of player.slashes) {
    for (const enemy of spawner.enemies) {
      if (enemy.state === 'dead') continue;

      const dx = enemy.x - slash.x;
      const dy = enemy.y - slash.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < slash.radius + 1.2) {
        const isCrit = Math.random() < 0.25;
        const baseDmg =
          player.currentClass.id === 'tank'
            ? 45
            : player.currentClass.id === 'swordsman'
            ? 35
            : 25;
        const finalDmg = isCrit ? Math.round(baseDmg * 2.2) : baseDmg;

        const knockDirX = (dx / (dist || 1)) * 0.8;
        const knockDirY = (dy / (dist || 1)) * 0.8;

        const died = enemy.takeDamage(finalDmg, knockDirX, knockDirY);

        combat.spawnFloatingText(enemy.x, enemy.y - 1, `${finalDmg}`, '#FFFFFF', isCrit);
        combat.triggerHitStop(isCrit ? 5 : 3);
        combat.triggerScreenShake(isCrit ? 2.5 : 1.2);

        if (isCrit) audio.playCrit();
        else audio.playHit();

        if (died && enemy.isBoss) {
          audio.playBossRoar();
          combat.triggerScreenShake(4.0);
        }
      }
    }
  }

  // 2. Check Projectiles against Enemies
  for (let i = projSys.projectiles.length - 1; i >= 0; i--) {
    const p = projSys.projectiles[i];

    for (const enemy of spawner.enemies) {
      if (enemy.state === 'dead') continue;

      const dist = Math.hypot(enemy.x - p.x, enemy.y - p.y);
      if (dist < p.radius + 1.0) {
        const isCrit = Math.random() < 0.2;
        const finalDmg = isCrit ? Math.round(p.damage * 2.0) : p.damage;

        const died = enemy.takeDamage(finalDmg, p.vx * 0.4, p.vy * 0.4);

        combat.spawnFloatingText(enemy.x, enemy.y - 1, `${finalDmg}`, p.color, isCrit);
        combat.triggerHitStop(3);
        combat.triggerScreenShake(1.5);

        if (isCrit) audio.playCrit();
        else audio.playHit();

        if (died && enemy.isBoss) {
          audio.playBossRoar();
          combat.triggerScreenShake(4.0);
        }

        // Single target arrows expire on hit
        if (p.type === 'arrow') {
          world.lighting.removeLight(p.id);
          projSys.projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
}

function render() {
  // Clear canvas
  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.font = `${CELL_H - 2}px 'ASCIIBladeMono', monospace`;
  ctx.textBaseline = 'top';

  // Camera follows player with screen shake offset
  const camX = Math.round(player.x - viewCols / 2 + combat.shakeX);
  const camY = Math.round(player.y - viewRows / 2 + combat.shakeY);

  // 1. Render High-Density ASCII Matrix
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

  // 2. Render Projectiles & Area Effects
  projSys.render((worldX, worldY, char, fgColor) => {
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

  // 3. Render Enemies
  for (const enemy of spawner.enemies) {
    enemy.render((worldX, worldY, char, fgColor) => {
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
  }

  // 4. Render Player Silhouette & Slash Arcs into Screen Grid
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

  // 5. Render Floating ASCII Damage Numbers
  combat.renderFloatingTexts(camX, camY, viewCols, viewRows, (gx, gy, char, fgColor) => {
    ctx.fillStyle = fgColor;
    ctx.fillText(char, gx * CELL_W + 1, gy * CELL_H + 1);
  });

  // 6. Render Rich ASCII HUD in Top-Left & Boss Bar
  renderHUD();

  // 7. Render CRAFT · Look Character Studio Modal (if open)
  if (studio.isOpen) {
    studio.render(viewCols, viewRows, (gx, gy, char, fgColor, bgColor) => {
      if (gx >= 0 && gx < viewCols && gy >= 0 && gy < viewRows) {
        if (bgColor && bgColor !== 'transparent') {
          ctx.fillStyle = bgColor;
          ctx.fillRect(gx * CELL_W, gy * CELL_H, CELL_W, CELL_H);
        }
        ctx.fillStyle = fgColor;
        ctx.fillText(char, gx * CELL_W + 1, gy * CELL_H + 1);
      }
    });
  }

  // 8. CRT Scanlines & Glow
  crt.render(ctx, canvas.width, canvas.height);
}

function renderHUD() {
  const hudX = 14;
  const hudY = 46;

  // Background Box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(hudX - 6, hudY - 6, 265, 120);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.strokeRect(hudX - 6, hudY - 6, 265, 120);

  // Class Name & Title
  const cDef = player.currentClass;
  ctx.fillStyle = cDef.color;
  ctx.fillText(`JOB: [${cDef.name.toUpperCase()}] - ${cDef.title}`, hudX, hudY);

  // HP Bar
  const hpRatio = Math.max(0, player.hp / cDef.maxHp);
  const hpFilled = Math.round(hpRatio * 16);
  const hpBar = '[' + '#'.repeat(hpFilled) + '-'.repeat(16 - hpFilled) + ']';
  ctx.fillStyle = '#EF4444';
  ctx.fillText(
    `HP  ${hpBar} ${Math.round(player.hp)}/${cDef.maxHp}`,
    hudX,
    hudY + 18
  );

  // Resource Bar
  const resRatio = Math.max(0, player.resource / cDef.resourceMax);
  const resFilled = Math.round(resRatio * 16);
  const resBar = '[' + '#'.repeat(resFilled) + '-'.repeat(16 - resFilled) + ']';
  ctx.fillStyle =
    cDef.resourceName === 'MANA'
      ? '#C084FC'
      : cDef.resourceName === 'FOCUS'
      ? '#34D399'
      : cDef.resourceName === 'RAGE'
      ? '#F97316'
      : '#38BDF8';
  ctx.fillText(
    `${cDef.resourceName.padEnd(4, ' ')} ${resBar} ${Math.round(
      player.resource
    )}/${cDef.resourceMax}`,
    hudX,
    hudY + 36
  );

  // Skills & Cooldowns Cards
  const skills = cDef.skills;
  let skillText = '';
  for (let i = 0; i < 3; i++) {
    const s = skills[i];
    const cd = player.skillCooldowns[i];
    const cdSec = (cd / 60).toFixed(1);
    const status = cd > 0 ? `${cdSec}s` : 'READY';
    skillText += `[${s.key}:${s.name.slice(0, 5)} ${status}] `;
  }

  ctx.fillStyle = '#FBBF24';
  ctx.fillText(skillText, hudX, hudY + 56);

  // Wave Status & Live Enemies Counter
  const aliveEnemies = spawner.enemies.filter((e) => e.state !== 'dead').length;
  ctx.fillStyle = '#10B981';
  ctx.fillText(
    `${spawner.getCurrentWaveName()} (${aliveEnemies} Alive)`,
    hudX,
    hudY + 76
  );

  // Combo Status
  ctx.fillStyle = '#F59E0B';
  ctx.fillText(
    `COMBO: ${player.comboCount > 0 ? player.comboCount + 'x STRIKE' : 'READY'}`,
    hudX,
    hudY + 94
  );

  // Boss Health Bar (Top Center)
  const boss = spawner.getBoss();
  if (boss) {
    const bossW = 340;
    const bossX = Math.floor((canvas.width - bossW) / 2);
    const bossY = 46;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(bossX - 6, bossY - 6, bossW + 12, 38);
    ctx.strokeStyle = '#DC2626';
    ctx.strokeRect(bossX - 6, bossY - 6, bossW + 12, 38);

    const bRatio = Math.max(0, boss.hp / boss.maxHp);
    const bFilled = Math.round(bRatio * 24);
    const bBar = '[' + '#'.repeat(bFilled) + '-'.repeat(24 - bFilled) + ']';

    ctx.fillStyle = '#EF4444';
    ctx.fillText(
      `BOSS: ${boss.name} (PHASE ${boss.bossPhase})`,
      bossX,
      bossY
    );
    ctx.fillText(`${bBar} ${boss.hp}/${boss.maxHp}`, bossX, bossY + 16);
  }
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
