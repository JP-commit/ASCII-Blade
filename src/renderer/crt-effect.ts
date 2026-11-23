export class CrtEffect {
  enabled: boolean = true;
  scanlineIntensity: number = 0.18;
  vignetteIntensity: number = 0.35;
  glowIntensity: number = 0.2;

  private scanlineCanvas: HTMLCanvasElement | null = null;
  private vignetteCanvas: HTMLCanvasElement | null = null;

  init(width: number, height: number) {
    // Generate scanlines pattern offscreen
    this.scanlineCanvas = document.createElement('canvas');
    this.scanlineCanvas.width = width;
    this.scanlineCanvas.height = height;
    const sCtx = this.scanlineCanvas.getContext('2d');
    if (sCtx) {
      sCtx.fillStyle = `rgba(0, 0, 0, ${this.scanlineIntensity})`;
      for (let y = 0; y < height; y += 3) {
        sCtx.fillRect(0, y, width, 1.2);
      }
    }

    // Generate vignette overlay offscreen
    this.vignetteCanvas = document.createElement('canvas');
    this.vignetteCanvas.width = width;
    this.vignetteCanvas.height = height;
    const vCtx = this.vignetteCanvas.getContext('2d');
    if (vCtx) {
      const gradient = vCtx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.45,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.72
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
      vCtx.fillStyle = gradient;
      vCtx.fillRect(0, 0, width, height);
    }
  }

  resize(width: number, height: number) {
    this.init(width, height);
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number) {
    if (!this.enabled) return;

    if (!this.scanlineCanvas || this.scanlineCanvas.width !== width || this.scanlineCanvas.height !== height) {
      this.init(width, height);
    }

    if (this.scanlineCanvas) {
      ctx.drawImage(this.scanlineCanvas, 0, 0);
    }

    if (this.vignetteCanvas) {
      ctx.drawImage(this.vignetteCanvas, 0, 0);
    }
  }
}
