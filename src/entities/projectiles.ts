import { AsciiMatrixWorld } from '../renderer/ascii-matrix';

export type EffectType =
  | 'arrow'
  | 'arcane_orb'
  | 'blade_wave'
  | 'flame_pillar'
  | 'frost_nova'
  | 'ground_tremor';

export interface Projectile {
  id: string;
  type: EffectType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  life: number;
  maxLife: number;
  radius: number;
  damage: number;
  color: string;
  glyph: string;
  lightRadius?: number;
  lightColor?: [number, number, number];
}

export class ProjectileSystem {
  projectiles: Projectile[] = [];

  spawnProjectile(proj: Projectile, world: AsciiMatrixWorld) {
    this.projectiles.push(proj);

    // Spawn associated dynamic light if specified
    if (proj.lightRadius && proj.lightColor) {
      world.lighting.addLight({
        id: proj.id,
        x: proj.x,
        y: proj.y,
        radius: proj.lightRadius,
        intensity: 0.85,
        color: proj.lightColor,
        flickerSpeed: 0,
        flickerAmount: 0,
      });
    }
  }

  update(world: AsciiMatrixWorld) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;

      // If expanding effect (e.g. frost nova, ground tremor), expand radius
      if (p.type === 'frost_nova' || p.type === 'ground_tremor') {
        p.radius += 0.35;
      }

      // Update associated light position
      const light = world.lighting.lights.find((l) => l.id === p.id);
      if (light) {
        light.x = p.x;
        light.y = p.y;
      }

      // Check collision with solid walls or expiration
      const tile = world.getTile(Math.floor(p.x), Math.floor(p.y));
      if (p.life <= 0 || (tile.isSolid && p.type === 'arrow')) {
        // Remove light
        world.lighting.removeLight(p.id);
        this.projectiles.splice(i, 1);
      }
    }
  }

  render(
    renderCell: (
      gx: number,
      gy: number,
      char: string,
      fgColor: string
    ) => void
  ) {
    for (const p of this.projectiles) {
      if (p.type === 'arrow') {
        const normAngle = ((p.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        let arrowChar = '->';
        if (normAngle < Math.PI * 0.25 || normAngle > Math.PI * 1.75) arrowChar = '->';
        else if (normAngle < Math.PI * 0.75) arrowChar = '|v';
        else if (normAngle < Math.PI * 1.25) arrowChar = '<-';
        else arrowChar = '^|';

        const px = Math.round(p.x);
        const py = Math.round(p.y);
        renderCell(px, py, arrowChar[0], p.color);
        renderCell(px + (p.vx > 0 ? 1 : -1), py, arrowChar[1] || '>', p.color);
      } else if (p.type === 'arcane_orb') {
        const px = Math.round(p.x);
        const py = Math.round(p.y);
        renderCell(px, py, '(*)', p.color);
      } else if (p.type === 'blade_wave') {
        // Broad sweeping wave
        for (let offset = -2; offset <= 2; offset++) {
          const perpAngle = p.angle + Math.PI / 2;
          const wx = Math.round(p.x + Math.cos(perpAngle) * offset);
          const wy = Math.round(p.y + Math.sin(perpAngle) * offset * 0.7);
          renderCell(wx, wy, p.glyph, p.color);
        }
      } else if (p.type === 'flame_pillar') {
        // Dense fire cluster
        const rad = Math.round(p.radius);
        for (let dy = -rad; dy <= rad; dy++) {
          for (let dx = -rad; dx <= rad; dx++) {
            if (dx * dx + dy * dy <= rad * rad) {
              const chars = ['^', '*', 'M', 'W', '8'];
              const char = chars[Math.floor(Math.random() * chars.length)];
              const color = Math.random() > 0.4 ? '#F97316' : '#FDE047';
              renderCell(Math.round(p.x + dx), Math.round(p.y + dy), char, color);
            }
          }
        }
      } else if (p.type === 'frost_nova' || p.type === 'ground_tremor') {
        // Expanding ring
        const count = Math.floor(p.radius * 6);
        for (let step = 0; step < count; step++) {
          const theta = (step / count) * Math.PI * 2;
          const rx = Math.round(p.x + Math.cos(theta) * p.radius);
          const ry = Math.round(p.y + Math.sin(theta) * (p.radius * 0.7));
          renderCell(rx, ry, p.glyph, p.color);
        }
      }
    }
  }
}
