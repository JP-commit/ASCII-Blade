import { LightingEngine } from './lighting';

export enum MaterialType {
  ABYSS = 0,
  STONE_FLOOR = 1,
  STONE_WALL = 2,
  MOSS_GRASS = 3,
  WOOD_PLANK = 4,
  BONFIRE = 5,
  WATER = 6,
}

// Glyph lookup tables by material and luminance levels (0 = dimmest, 4 = brightest)
const GLYPH_RAMPS: Record<MaterialType, string[]> = {
  [MaterialType.ABYSS]: [' ', ' ', '.', '.', '*'],
  [MaterialType.STONE_FLOOR]: ['.', ',', ':', ';', 'x', 'o', '0', '#', '%'],
  [MaterialType.STONE_WALL]: ['#', '%', 'B', 'D', '0', '8', '@', 'W', 'Q'],
  [MaterialType.MOSS_GRASS]: [',', "'", ';', '"', '~', '*', 'i', 'v', 'w'],
  [MaterialType.WOOD_PLANK]: ['-', '=', '#', '%', '='],
  [MaterialType.BONFIRE]: ['*', '^', 'x', 'W', 'M', '@', '8'],
  [MaterialType.WATER]: [' ', '.', '~', '-', '~', '=', '~'],
};

// Base material color hues [R, G, B]
const MATERIAL_COLORS: Record<MaterialType, [number, number, number]> = {
  [MaterialType.ABYSS]: [15, 23, 42],       // Midnight sky
  [MaterialType.STONE_FLOOR]: [120, 130, 145], // Ancient granite slate
  [MaterialType.STONE_WALL]: [180, 190, 205],  // Heavy stone masonry
  [MaterialType.MOSS_GRASS]: [52, 211, 153],   // Vivid emerald moss
  [MaterialType.WOOD_PLANK]: [180, 130, 80],   // Weathered timber
  [MaterialType.BONFIRE]: [254, 215, 170],     // Raging flame
  [MaterialType.WATER]: [56, 189, 248],        // Cold reflective water
};

export interface MatrixCell {
  material: MaterialType;
  char: string;
  fgColor: string;
  isSolid: boolean;
}

export class AsciiMatrixWorld {
  readonly width: number;
  readonly height: number;
  readonly materials: Uint8Array;
  readonly solids: Uint8Array;
  readonly lighting: LightingEngine;
  time: number = 0;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.materials = new Uint8Array(width * height);
    this.solids = new Uint8Array(width * height);
    this.lighting = new LightingEngine();

    this.generateTestTower();
  }

  setTile(x: number, y: number, material: MaterialType, isSolid = false) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const idx = y * this.width + x;
    this.materials[idx] = material;
    this.solids[idx] = isSolid ? 1 : 0;
  }

  getTile(x: number, y: number): { material: MaterialType; isSolid: boolean } {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return { material: MaterialType.ABYSS, isSolid: true };
    }
    const idx = y * this.width + x;
    return {
      material: this.materials[idx] as MaterialType,
      isSolid: this.solids[idx] === 1,
    };
  }

  /**
   * Generates the "Tower High Ground" matching the reference images:
   * Circular ruined castle keep, battlements, overgrown moss, central bonfire, and corner torch braziers.
   */
  generateTestTower() {
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const towerRadius = Math.min(centerX, centerY) - 8;

    // Fill with abyss
    this.materials.fill(MaterialType.ABYSS);
    this.solids.fill(0);

    // Build circular tower platform
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const dx = x - centerX;
        const dy = (y - centerY) * 1.5; // Aspect compensation for monospace font ratio
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= towerRadius) {
          // Inside tower
          if (dist >= towerRadius - 2) {
            // Battlement parapet (broken in certain sections)
            const angle = Math.atan2(dy, dx);
            const isGap = Math.sin(angle * 8) > 0.65; // Gaps in battlements

            if (!isGap) {
              this.setTile(x, y, MaterialType.STONE_WALL, true);
            } else {
              // Edge overhang moss
              this.setTile(x, y, MaterialType.MOSS_GRASS, false);
            }
          } else {
            // Tower floor: flagstones with moss patches
            const mossNoise = Math.sin(x * 0.25) * Math.cos(y * 0.28) + Math.sin(dist * 0.3);
            if (mossNoise > 0.55 && dist > 8) {
              this.setTile(x, y, MaterialType.MOSS_GRASS, false);
            } else {
              this.setTile(x, y, MaterialType.STONE_FLOOR, false);
            }
          }
        }
      }
    }

    // Add four stone pillar ruins at diagonals
    const pillarDist = Math.floor(towerRadius * 0.6);
    const corners = [
      { x: centerX - pillarDist, y: centerY - Math.floor(pillarDist / 1.5) },
      { x: centerX + pillarDist, y: centerY - Math.floor(pillarDist / 1.5) },
      { x: centerX - pillarDist, y: centerY + Math.floor(pillarDist / 1.5) },
      { x: centerX + pillarDist, y: centerY + Math.floor(pillarDist / 1.5) },
    ];

    corners.forEach((c, idx) => {
      // 2x2 stone pillar
      this.setTile(c.x, c.y, MaterialType.STONE_WALL, true);
      this.setTile(c.x + 1, c.y, MaterialType.STONE_WALL, true);
      this.setTile(c.x, c.y + 1, MaterialType.STONE_WALL, true);
      this.setTile(c.x + 1, c.y + 1, MaterialType.STONE_WALL, true);

      // Sconce torch light on pillars
      this.lighting.addLight({
        id: `torch_${idx}`,
        x: c.x + 0.5,
        y: c.y + 0.5,
        radius: 16,
        intensity: 0.9,
        color: [255, 140, 40],
        flickerSpeed: 4.2 + idx * 0.5,
        flickerAmount: 0.18,
      });
    });

    // Central Tower Bonfire (Heart of the High Ground)
    this.setTile(centerX, centerY, MaterialType.BONFIRE, true);
    this.setTile(centerX - 1, centerY, MaterialType.BONFIRE, false);
    this.setTile(centerX + 1, centerY, MaterialType.BONFIRE, false);
    this.setTile(centerX, centerY - 1, MaterialType.BONFIRE, false);
    this.setTile(centerX, centerY + 1, MaterialType.BONFIRE, false);

    // Roaring Bonfire Light
    this.lighting.addLight({
      id: 'central_bonfire',
      x: centerX,
      y: centerY,
      radius: 26,
      intensity: 1.0,
      color: [255, 160, 40],
      flickerSpeed: 5.5,
      flickerAmount: 0.22,
    });
  }

  update(dt: number) {
    this.time += dt * 0.001; // In seconds
    this.lighting.update(dt * 0.001);
  }

  /**
   * Evaluates the visual cell at (x, y) accounting for material, wind, and dynamic lighting
   */
  evaluateCell(x: number, y: number): MatrixCell {
    const tile = this.getTile(x, y);
    const { intensity, rgb } = this.lighting.computeLighting(x, y);

    const ramp = GLYPH_RAMPS[tile.material];
    let char = ' ';

    if (tile.material === MaterialType.ABYSS) {
      // Subtle starry sky
      const starNoise = Math.sin(x * 12.9898 + y * 78.233);
      if (starNoise > 0.96) {
        char = intensity > 0.2 ? '*' : '.';
      } else if (starNoise > 0.92) {
        char = '.';
      }
    } else if (tile.material === MaterialType.MOSS_GRASS) {
      // Wind-reactive moss and grass
      const windWave =
        Math.sin(x * 0.35 + this.time * 2.8) +
        Math.cos(y * 0.25 + this.time * 2.1);
      const windIndex = Math.floor(Math.abs(windWave * 2.5)) % ramp.length;
      char = ramp[windIndex];
    } else if (tile.material === MaterialType.BONFIRE) {
      // Roaring fire animation
      const fireIndex = Math.floor((Math.sin(x * 5 + this.time * 12) + 1) * 3) % ramp.length;
      char = ramp[fireIndex];
    } else {
      // Tone mapping from luminance intensity to character density
      const rampIndex = Math.min(
        ramp.length - 1,
        Math.floor(intensity * ramp.length)
      );
      char = ramp[rampIndex];
    }

    // Multiply base material color with dynamic lighting color
    const baseColor = MATERIAL_COLORS[tile.material];
    const finalR = Math.min(255, Math.floor((baseColor[0] * rgb[0]) / 255));
    const finalG = Math.min(255, Math.floor((baseColor[1] * rgb[1]) / 255));
    const finalB = Math.min(255, Math.floor((baseColor[2] * rgb[2]) / 255));

    const fgColor = `rgb(${finalR},${finalG},${finalB})`;

    return {
      material: tile.material,
      char,
      fgColor,
      isSolid: tile.isSolid,
    };
  }
}
