import { Palette, PALETTES, PaletteId } from '../config/palettes';
import { SpriteFrame } from '../sprites/sprite-format';

export interface GridOptions {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  fontFamily: string;
  paletteId: PaletteId;
  useExtendedGlyphs?: boolean;
}

export const CELL_FLAGS = {
  NONE: 0,
  BOLD: 1 << 0,
  INVERT: 1 << 1,
  FLASH: 1 << 2,
  DIM: 1 << 3,
};

export class GlyphGrid {
  readonly cols: number;
  readonly rows: number;
  cellWidth: number;
  cellHeight: number;
  fontFamily: string;
  palette: Palette;
  useExtendedGlyphs: boolean;

  // Front buffer
  chars: string[];
  fgColors: string[];
  bgColors: string[];
  flags: Uint8Array;

  // Back buffer for dirty checking
  prevChars: string[];
  prevFgColors: string[];
  prevBgColors: string[];
  prevFlags: Uint8Array;

  forceFullRedraw: boolean = true;

  constructor(options: GridOptions) {
    this.cols = options.cols;
    this.rows = options.rows;
    this.cellWidth = options.cellWidth;
    this.cellHeight = options.cellHeight;
    this.fontFamily = options.fontFamily;
    this.palette = PALETTES[options.paletteId] || PALETTES.full;
    this.useExtendedGlyphs = options.useExtendedGlyphs ?? false;

    const total = this.cols * this.rows;
    this.chars = new Array(total).fill(' ');
    this.fgColors = new Array(total).fill('#FFFFFF');
    this.bgColors = new Array(total).fill('transparent');
    this.flags = new Uint8Array(total);

    this.prevChars = new Array(total).fill('');
    this.prevFgColors = new Array(total).fill('');
    this.prevBgColors = new Array(total).fill('');
    this.prevFlags = new Uint8Array(total);
  }

  setPalette(paletteId: PaletteId) {
    if (PALETTES[paletteId]) {
      this.palette = PALETTES[paletteId];
      this.forceFullRedraw = true;
    }
  }

  clear(bgColor = 'transparent') {
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      this.chars[i] = ' ';
      this.fgColors[i] = '#FFFFFF';
      this.bgColors[i] = bgColor;
      this.flags[i] = CELL_FLAGS.NONE;
    }
  }

  setCell(
    col: number,
    row: number,
    char: string,
    fgColor = 'W',
    bgColor = 'transparent',
    cellFlags = CELL_FLAGS.NONE
  ) {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return;

    const idx = row * this.cols + col;
    // Strict ASCII filter if extended glyphs is disabled
    let c = char[0] || ' ';
    if (!this.useExtendedGlyphs) {
      const code = c.charCodeAt(0);
      if (code < 0x20 || code > 0x7e) {
        c = '?';
      }
    }

    this.chars[idx] = c;
    this.fgColors[idx] = fgColor;
    this.bgColors[idx] = bgColor;
    this.flags[idx] = cellFlags;
  }

  resolveColor(colorRef: string): string {
    if (colorRef.startsWith('#') || colorRef.startsWith('rgb')) {
      return colorRef;
    }
    if (colorRef === 'transparent' || colorRef === '.' || colorRef === ' ') {
      return 'transparent';
    }
    return this.palette.colors[colorRef] || this.palette.colors['W'] || '#FFFFFF';
  }

  drawString(
    col: number,
    row: number,
    text: string,
    fgColor = 'W',
    bgColor = 'transparent',
    cellFlags = CELL_FLAGS.NONE
  ) {
    for (let i = 0; i < text.length; i++) {
      this.setCell(col + i, row, text[i], fgColor, bgColor, cellFlags);
    }
  }

  drawBox(
    col: number,
    row: number,
    w: number,
    h: number,
    fgColor = 'W',
    bgColor = 'transparent',
    title?: string
  ) {
    if (w <= 1 || h <= 1) return;

    let tl = '+', tr = '+', bl = '+', br = '+', hz = '-', vt = '|';
    if (this.useExtendedGlyphs) {
      tl = '┌'; tr = '┐'; bl = '└'; br = '┘'; hz = '─'; vt = '│';
    }

    // Top & Bottom
    this.setCell(col, row, tl, fgColor, bgColor);
    this.setCell(col + w - 1, row, tr, fgColor, bgColor);
    this.setCell(col, row + h - 1, bl, fgColor, bgColor);
    this.setCell(col + w - 1, row + h - 1, br, fgColor, bgColor);

    for (let x = 1; x < w - 1; x++) {
      this.setCell(col + x, row, hz, fgColor, bgColor);
      this.setCell(col + x, row + h - 1, hz, fgColor, bgColor);
    }

    // Left & Right
    for (let y = 1; y < h - 1; y++) {
      this.setCell(col, row + y, vt, fgColor, bgColor);
      this.setCell(col + w - 1, row + y, vt, fgColor, bgColor);
      // Fill background
      if (bgColor !== 'transparent') {
        for (let x = 1; x < w - 1; x++) {
          this.setCell(col + x, row + y, ' ', fgColor, bgColor);
        }
      }
    }

    // Title
    if (title && title.length < w - 2) {
      const titleStart = col + Math.floor((w - title.length) / 2);
      this.drawString(titleStart, row, title, fgColor, bgColor, CELL_FLAGS.BOLD);
    }
  }

  drawProgressBar(
    col: number,
    row: number,
    width: number,
    current: number,
    max: number,
    fgColor = 'G',
    emptyColor = 'K',
    bgColor = 'transparent'
  ) {
    const clampedRatio = Math.max(0, Math.min(1, max > 0 ? current / max : 0));
    const fillWidth = Math.round((width - 2) * clampedRatio);
    const emptyWidth = width - 2 - fillWidth;

    let fillChar = '#';
    let emptyChar = '-';
    if (this.useExtendedGlyphs) {
      fillChar = '█';
      emptyChar = '░';
    }

    this.setCell(col, row, '[', fgColor, bgColor);
    for (let i = 0; i < fillWidth; i++) {
      this.setCell(col + 1 + i, row, fillChar, fgColor, bgColor);
    }
    for (let i = 0; i < emptyWidth; i++) {
      this.setCell(col + 1 + fillWidth + i, row, emptyChar, emptyColor, bgColor);
    }
    this.setCell(col + width - 1, row, ']', fgColor, bgColor);
  }

  drawSprite(
    targetCol: number,
    targetRow: number,
    frame: SpriteFrame,
    flipX = false,
    colorOverride?: string,
    flash = false
  ) {
    const height = frame.glyphs.length;
    if (height === 0) return;
    const width = frame.glyphs[0].length;

    for (let r = 0; r < height; r++) {
      const gRow = frame.glyphs[r];
      const cRow = frame.colorMask[r] || '';

      for (let c = 0; c < width; c++) {
        const srcCol = flipX ? width - 1 - c : c;
        let glyph = gRow[srcCol];

        if (!glyph || glyph === ' ') continue;

        // Invert directional glyphs when flipped
        if (flipX) {
          if (glyph === '/') glyph = '\\';
          else if (glyph === '\\') glyph = '/';
          else if (glyph === '<') glyph = '>';
          else if (glyph === '>') glyph = '<';
          else if (glyph === '(') glyph = ')';
          else if (glyph === ')') glyph = '(';
          else if (glyph === '[') glyph = ']';
          else if (glyph === ']') glyph = '[';
          else if (glyph === '{') glyph = '}';
          else if (glyph === '}') glyph = '{';
        }

        const rawColor = cRow[srcCol] || 'W';
        let fgColor = colorOverride || rawColor;
        let flags = CELL_FLAGS.NONE;

        if (flash) {
          fgColor = '#FFFFFF';
          flags |= CELL_FLAGS.FLASH;
        }

        this.setCell(targetCol + c, targetRow + r, glyph, fgColor, 'transparent', flags);
      }
    }
  }

  renderToCanvas(ctx: CanvasRenderingContext2D, offsetX = 0, offsetY = 0) {
    ctx.font = `${this.cellHeight - 2}px ${this.fontFamily}, monospace`;
    ctx.textBaseline = 'top';

    const cellW = this.cellWidth;
    const cellH = this.cellHeight;

    for (let r = 0; r < this.rows; r++) {
      const rowOffset = r * this.cols;
      const y = offsetY + r * cellH;

      for (let c = 0; c < this.cols; c++) {
        const idx = rowOffset + c;
        const char = this.chars[idx];
        const fg = this.fgColors[idx];
        const bg = this.bgColors[idx];
        const flag = this.flags[idx];

        // Dirty checking
        if (
          !this.forceFullRedraw &&
          char === this.prevChars[idx] &&
          fg === this.prevFgColors[idx] &&
          bg === this.prevBgColors[idx] &&
          flag === this.prevFlags[idx]
        ) {
          continue;
        }

        const x = offsetX + c * cellW;

        // Background
        const resolvedBg = this.resolveColor(bg);
        if (resolvedBg !== 'transparent') {
          ctx.fillStyle = resolvedBg;
          ctx.fillRect(x, y, cellW, cellH);
        } else {
          ctx.fillStyle = this.palette.bg;
          ctx.fillRect(x, y, cellW, cellH);
        }

        // Foreground Glyph
        if (char && char !== ' ') {
          let resolvedFg = this.resolveColor(fg);

          if (flag & CELL_FLAGS.FLASH) {
            resolvedFg = '#FFFFFF';
          }

          if (flag & CELL_FLAGS.INVERT) {
            ctx.fillStyle = resolvedFg;
            ctx.fillRect(x, y, cellW, cellH);
            ctx.fillStyle = this.palette.bg;
          } else {
            ctx.fillStyle = resolvedFg;
          }

          // Center the glyph slightly within the cell
          ctx.fillText(char, x + 1, y + 1);
        }

        this.prevChars[idx] = char;
        this.prevFgColors[idx] = fg;
        this.prevBgColors[idx] = bg;
        this.prevFlags[idx] = flag;
      }
    }

    this.forceFullRedraw = false;
  }
}
