import { InputState } from '../engine/input-manager';
import { AsciiMatrixWorld } from '../renderer/ascii-matrix';

export interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
}

export class PlayerController {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  aimAngle: number = 0;

  speed: number = 0.38; // Cells per frame
  dashSpeed: number = 1.1;
  dashTimer: number = 0;
  dashDuration: number = 14; // frames
  dashCooldown: number = 24;
  dashCooldownTimer: number = 0;

  isDashing: boolean = false;
  isAttacking: boolean = false;
  attackTimer: number = 0;
  comboCount: number = 0;

  slashes: SlashEffect[] = [];

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
  }

  update(input: InputState, world: AsciiMatrixWorld) {
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;

    // Handle Dash
    if (input.dashJustPressed && this.dashCooldownTimer === 0 && !this.isDashing) {
      this.isDashing = true;
      this.dashTimer = this.dashDuration;
      this.dashCooldownTimer = this.dashCooldown;

      // Dash in movement direction or aim direction
      let dashDirX = input.moveX;
      let dashDirY = input.moveY;
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = Math.cos(input.aimAngle);
        dashDirY = Math.sin(input.aimAngle);
      }
      this.vx = dashDirX * this.dashSpeed;
      this.vy = dashDirY * this.dashSpeed;
    }

    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
        this.vy = 0;
      }
    } else {
      // Normal movement
      this.vx = input.moveX * this.speed;
      this.vy = input.moveY * this.speed;
    }

    // Aim Angle
    this.aimAngle = input.aimAngle;

    // Primary Attack Trigger
    if (input.attackJustPressed && !this.isDashing) {
      this.isAttacking = true;
      this.attackTimer = 16;
      this.comboCount = (this.comboCount % 3) + 1;

      // Spawn slash arc in aim direction
      this.slashes.push({
        x: this.x + Math.cos(this.aimAngle) * 2.2,
        y: this.y + Math.sin(this.aimAngle) * 2.2,
        angle: this.aimAngle,
        radius: 3.5,
        life: 8,
        maxLife: 8,
      });

      // Temporary attack flash light
      world.lighting.addLight({
        id: `slash_light_${Date.now()}`,
        x: this.x + Math.cos(this.aimAngle) * 2.5,
        y: this.y + Math.sin(this.aimAngle) * 2.5,
        radius: 12,
        intensity: 0.9,
        color: [255, 230, 160],
        flickerSpeed: 0,
        flickerAmount: 0,
      });

      // Remove after 150ms
      setTimeout(() => {
        world.lighting.lights = world.lighting.lights.filter(
          (l) => !l.id.startsWith('slash_light')
        );
      }, 150);
    }

    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Update slash arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life--;
      if (this.slashes[i].life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // Collision detection against solid walls
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    const tileX = Math.floor(nextX);
    const tileY = Math.floor(nextY);

    if (!world.getTile(tileX, Math.floor(this.y)).isSolid) {
      this.x = nextX;
    }
    if (!world.getTile(Math.floor(this.x), tileY).isSolid) {
      this.y = nextY;
    }

    // Update Player Lantern Light
    const playerLight = world.lighting.lights.find((l) => l.id === 'player_lantern');
    if (playerLight) {
      playerLight.x = this.x;
      playerLight.y = this.y;
    } else {
      world.lighting.addLight({
        id: 'player_lantern',
        x: this.x,
        y: this.y,
        radius: 10,
        intensity: 0.75,
        color: [240, 230, 200],
        flickerSpeed: 2.5,
        flickerAmount: 0.08,
      });
    }
  }

  /**
   * Renders the player silhouette into the ASCII canvas grid
   */
  render(
    renderCell: (
      gx: number,
      gy: number,
      char: string,
      fgColor: string,
      flags?: number
    ) => void
  ) {
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    // Dynamic player ASCII silhouette based on facing angle
    // Facing right/left/up/down
    const cos = Math.cos(this.aimAngle);
    const sin = Math.sin(this.aimAngle);

    let headGlyph = '(o)';
    let bodyGlyph = '/[#]\\';
    let legGlyph = '/ \\';

    if (cos > 0.5) {
      // Facing East
      headGlyph = ' (o>)';
      bodyGlyph = '<[#]=';
      legGlyph = ' / \\ ';
    } else if (cos < -0.5) {
      // Facing West
      headGlyph = '(<o) ';
      bodyGlyph = '=[#]> ';
      legGlyph = ' / \\ ';
    } else if (sin > 0.5) {
      // Facing South
      headGlyph = ' [v] ';
      bodyGlyph = '/[#]\\';
      legGlyph = ' | | ';
    } else if (sin < -0.5) {
      // Facing North
      headGlyph = ' [^] ';
      bodyGlyph = '\\|#|/';
      legGlyph = ' / \\ ';
    }

    const playerColor = this.isDashing ? '#38BDF8' : '#F8FAFC';

    // Head
    for (let c = 0; c < headGlyph.length; c++) {
      const char = headGlyph[c];
      if (char !== ' ') renderCell(px - 2 + c, py - 1, char, '#FDE047');
    }
    // Body / Armor
    for (let c = 0; c < bodyGlyph.length; c++) {
      const char = bodyGlyph[c];
      if (char !== ' ') renderCell(px - 2 + c, py, char, playerColor);
    }
    // Legs
    for (let c = 0; c < legGlyph.length; c++) {
      const char = legGlyph[c];
      if (char !== ' ') renderCell(px - 2 + c, py + 1, char, '#94A3B8');
    }

    // Render active slash arcs
    for (const slash of this.slashes) {
      const slashRatio = slash.life / slash.maxLife;
      const alphaColor = slashRatio > 0.5 ? '#FBBF24' : '#F97316';

      // Sweep arc glyphs
      for (let p = -3; p <= 3; p++) {
        const offsetAngle = slash.angle + p * 0.22;
        const sx = Math.round(this.x + Math.cos(offsetAngle) * slash.radius);
        const sy = Math.round(this.y + Math.sin(offsetAngle) * (slash.radius * 0.7));

        let arcChar = '/';
        const normAngle = ((offsetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (normAngle < Math.PI * 0.25 || normAngle > Math.PI * 1.75) arcChar = ')';
        else if (normAngle < Math.PI * 0.75) arcChar = '~';
        else if (normAngle < Math.PI * 1.25) arcChar = '(';
        else arcChar = '-';

        renderCell(sx, sy, arcChar, alphaColor);
      }
    }
  }
}
