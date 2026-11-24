/**
 * Combat System: Hit-Stop, Screen Shake, Damage Calculations & Floating ASCII Text
 */

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
  vx: number;
}

export class CombatSystem {
  // Hit-stop impact freeze counter (frames)
  hitStopFrames: number = 0;

  // Screen shake displacement
  shakeMagnitude: number = 0;
  shakeX: number = 0;
  shakeY: number = 0;

  // Floating Combat Numbers
  floatingTexts: FloatingText[] = [];

  triggerHitStop(frames: number) {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  triggerScreenShake(magnitude: number) {
    this.shakeMagnitude = Math.max(this.shakeMagnitude, magnitude);
  }

  spawnFloatingText(
    x: number,
    y: number,
    text: string,
    color = '#FFFFFF',
    isCrit = false
  ) {
    this.floatingTexts.push({
      id: `float_${Date.now()}_${Math.random()}`,
      x,
      y,
      text: isCrit ? `CRIT ${text}!` : text,
      color: isCrit ? '#FBBF24' : color,
      life: 36,
      maxLife: 36,
      vy: -0.18,
      vx: (Math.random() - 0.5) * 0.15,
    });
  }

  update(): boolean {
    // If in hit-stop, freeze simulation
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      return true; // Skip entity simulation this tick
    }

    // Update screen shake
    if (this.shakeMagnitude > 0.05) {
      this.shakeX = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.shakeY = (Math.random() - 0.5) * this.shakeMagnitude * 2;
      this.shakeMagnitude *= 0.85; // Exponential decay
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
      this.shakeMagnitude = 0;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.x += ft.vx;
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    return false;
  }

  renderFloatingTexts(
    camX: number,
    camY: number,
    viewCols: number,
    viewRows: number,
    renderCell: (gx: number, gy: number, char: string, fgColor: string) => void
  ) {
    for (const ft of this.floatingTexts) {
      const sx = Math.round(ft.x - camX);
      const sy = Math.round(ft.y - camY);

      if (sy >= 0 && sy < viewRows) {
        for (let c = 0; c < ft.text.length; c++) {
          const col = sx + c;
          if (col >= 0 && col < viewCols) {
            renderCell(col, sy, ft.text[c], ft.color);
          }
        }
      }
    }
  }
}
