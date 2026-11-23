/**
 * Real-time Dynamic Point Lighting System for High-Density ASCII Matrix
 */

export interface PointLight {
  id: string;
  x: number; // World grid cell X
  y: number; // World grid cell Y
  radius: number; // Illumination radius in cells
  intensity: number; // Base intensity (0.0 - 1.0)
  color: [number, number, number]; // RGB (0-255)
  flickerSpeed?: number;
  flickerAmount?: number;
}

export class LightingEngine {
  ambientLight: number = 0.08; // Deep nocturnal darkness
  ambientColor: [number, number, number] = [15, 20, 32]; // Midnight navy
  lights: PointLight[] = [];
  time: number = 0;

  addLight(light: PointLight) {
    this.lights.push(light);
  }

  removeLight(id: string) {
    this.lights = this.lights.filter((l) => l.id !== id);
  }

  clearLights() {
    this.lights = [];
  }

  update(dt: number) {
    this.time += dt;
  }

  /**
   * Computes lighting at a specific world coordinate (x, y)
   * Returns { intensity: number, rgb: [r, g, b] }
   */
  computeLighting(
    x: number,
    y: number
  ): { intensity: number; rgb: [number, number, number] } {
    let totalIntensity = this.ambientLight;
    let r = this.ambientColor[0] * this.ambientLight;
    let g = this.ambientColor[1] * this.ambientLight;
    let b = this.ambientColor[2] * this.ambientLight;

    for (let i = 0; i < this.lights.length; i++) {
      const light = this.lights[i];
      const dx = x - light.x;
      const dy = y - light.y;
      const distSq = dx * dx + dy * dy;
      const radiusSq = light.radius * light.radius;

      if (distSq < radiusSq) {
        const dist = Math.sqrt(distSq);
        // Smooth quadratic attenuation
        const normDist = dist / light.radius;
        const attenuation = Math.max(0, 1 - normDist * normDist);

        // Natural flame flicker
        let flicker = 1.0;
        if (light.flickerSpeed && light.flickerAmount) {
          flicker =
            1.0 -
            light.flickerAmount *
              (0.5 +
                0.5 *
                  Math.sin(this.time * light.flickerSpeed + (light.x * 3.1 + light.y * 1.7)));
        }

        const lightContrib = light.intensity * attenuation * flicker;
        totalIntensity += lightContrib;

        r += light.color[0] * lightContrib;
        g += light.color[1] * lightContrib;
        b += light.color[2] * lightContrib;
      }
    }

    const clampedIntensity = Math.min(1.0, totalIntensity);
    const cr = Math.min(255, Math.floor(r));
    const cg = Math.min(255, Math.floor(g));
    const cb = Math.min(255, Math.floor(b));

    return {
      intensity: clampedIntensity,
      rgb: [cr, cg, cb],
    };
  }
}
