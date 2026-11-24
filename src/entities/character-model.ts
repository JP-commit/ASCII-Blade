/**
 * High-Fidelity Proportional ASCII Character & Weapon Model System
 * Directly modeled from @ansenjeo's viral ASCII MMORPG character art
 * (28-32 rows tall, human proportions, interlocking typography, glowing rune blade, ethereal halos)
 */

export type ArmorMaterial =
  | 'steel'
  | 'moonsteel'
  | 'gold'
  | 'bronze'
  | 'bloodiron'
  | 'emberstone'
  | 'nightglass';

export interface MaterialStyle {
  id: ArmorMaterial;
  name: string;
  metalColor: string;
  glowColor: string;
  robeColor: string;
  trimColor: string;
  lightRgb: [number, number, number];
}

export const MATERIALS: Record<ArmorMaterial, MaterialStyle> = {
  steel: {
    id: 'steel',
    name: 'Steel',
    metalColor: '#E2E8F0', // Polished Silver
    glowColor: '#38BDF8',  // Cool Cyan
    robeColor: '#1E3A8A',  // Deep Royal Blue
    trimColor: '#F59E0B',  // Amber Gold
    lightRgb: [180, 220, 255],
  },
  moonsteel: {
    id: 'moonsteel',
    name: 'Moonsteel',
    metalColor: '#F8FAFC', // Luminous White
    glowColor: '#67E8F9',  // Ethereal Moonbeam
    robeColor: '#1E1B4B',  // Midnight Indigo
    trimColor: '#A5F3FC',  // Starlight Cyan
    lightRgb: [200, 240, 255],
  },
  gold: {
    id: 'gold',
    name: 'Solar Gold',
    metalColor: '#FDE047', // Radiant Gold
    glowColor: '#F59E0B',  // Blazing Amber
    robeColor: '#7C2D12',  // Crimson Burgundy
    trimColor: '#FEF08A',  // Bright Sun Gold
    lightRgb: [255, 200, 60],
  },
  bronze: {
    id: 'bronze',
    name: 'Ancient Bronze',
    metalColor: '#D97706', // Burnished Bronze
    glowColor: '#B45309',  // Deep Amber
    robeColor: '#064E3B',  // Forest Green
    trimColor: '#FDE68A',  // Brass
    lightRgb: [230, 160, 70],
  },
  bloodiron: {
    id: 'bloodiron',
    name: 'Bloodiron',
    metalColor: '#EF4444', // Dark Crimson
    glowColor: '#DC2626',  // Blood Red
    robeColor: '#450A0A',  // Deep Blood Maroon
    trimColor: '#FCA5A5',  // Ash Rose
    lightRgb: [255, 80, 80],
  },
  emberstone: {
    id: 'emberstone',
    name: 'Emberstone',
    metalColor: '#FB923C', // Magma Orange
    glowColor: '#EA580C',  // Raging Fire
    robeColor: '#18181B',  // Volcanic Basalt
    trimColor: '#FDE047',  // Molten Gold
    lightRgb: [255, 140, 40],
  },
  nightglass: {
    id: 'nightglass',
    name: 'Nightglass',
    metalColor: '#A855F7', // Arcane Obsidian
    glowColor: '#C084FC',  // Violet Astral
    robeColor: '#0F172A',  // Void Black
    trimColor: '#E879F9',  // Magenta Arcana
    lightRgb: [190, 110, 255],
  },
};

export interface EmberParticle {
  x: number;
  y: number;
  char: string;
  color: string;
  life: number;
  maxLife: number;
  vy: number;
}

export class CharacterModel {
  material: ArmorMaterial = 'steel';
  hasFlamingSword: boolean = true;
  hasHaloCrown: boolean = true;
  activeRunes: string[] = ['+', '*', '^', '§'];

  time: number = 0;
  embers: EmberParticle[] = [];

  update(dt: number) {
    this.time += dt * 0.001;

    // Spawn drifting rune embers from the blade
    if (this.hasFlamingSword && Math.random() < 0.35) {
      const runeChars = ['+', '*', '^', 'x', '~', '°'];
      const char = runeChars[Math.floor(Math.random() * runeChars.length)];
      const mat = MATERIALS[this.material];
      const color = Math.random() > 0.4 ? mat.glowColor : '#FFFFFF';

      this.embers.push({
        x: 10 + (Math.random() - 0.5) * 4,
        y: 12 + Math.random() * 8,
        char,
        color,
        life: 25,
        maxLife: 25,
        vy: -0.15 - Math.random() * 0.1,
      });
    }

    // Update embers
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.y += e.vy;
      e.life--;
      if (e.life <= 0) {
        this.embers.splice(i, 1);
      }
    }
  }

  /**
   * Renders the 28-row proportional character model centered at (originX, originY)
   */
  render(
    originX: number,
    originY: number,
    renderCell: (x: number, y: number, char: string, fgColor: string) => void
  ) {
    const mat = MATERIALS[this.material];
    const breathe = Math.sin(this.time * 2.2) * 0.4;
    const oy = Math.round(originY + breathe);
    const ox = Math.round(originX);

    // ==========================================
    // 1. ETHEREAL HALO / CREST (Rows 0-5)
    // ==========================================
    if (this.hasHaloCrown) {
      const haloRunes = [
        { x: -3, y: -13, char: '^', color: mat.glowColor },
        { x: -2, y: -14, char: '*', color: '#FFFFFF' },
        { x: -1, y: -15, char: '°', color: mat.glowColor },
        { x: 0,  y: -15, char: '^', color: '#FFFFFF' },
        { x: 1,  y: -15, char: '°', color: mat.glowColor },
        { x: 2,  y: -14, char: '*', color: '#FFFFFF' },
        { x: 3,  y: -13, char: '^', color: mat.glowColor },

        // Inner crown ring
        { x: -2, y: -12, char: '/', color: mat.glowColor },
        { x: -1, y: -13, char: 'o', color: '#FFFFFF' },
        { x: 0,  y: -13, char: 'O', color: mat.glowColor },
        { x: 1,  y: -13, char: 'o', color: '#FFFFFF' },
        { x: 2,  y: -12, char: '\\', color: mat.glowColor },
      ];

      for (const h of haloRunes) {
        renderCell(ox + h.x, oy + h.y, h.char, h.color);
      }
    }

    // ==========================================
    // 2. HEAD & FACE SILHOUETTE (Rows 6-8)
    // ==========================================
    const headLines = [
      { y: -11, text: '  .---.  ', fg: mat.metalColor },
      { y: -10, text: ' / |#| \\ ', fg: mat.metalColor },
      { y: -9,  text: ' | [o] | ', fg: '#FFFFFF' },
      { y: -8,  text: '  \\_=_/  ', fg: mat.metalColor },
    ];
    for (const h of headLines) {
      for (let c = 0; c < h.text.length; c++) {
        const char = h.text[c];
        if (char !== ' ') renderCell(ox - 4 + c, oy + h.y, char, h.fg);
      }
    }

    // ==========================================
    // 3. PAULDRONS, CHESTPLATE & CHAINMAIL (Rows 9-16)
    // Authentic interlocking typography from reference
    // ==========================================
    const torsoLines = [
      { y: -7, text: ' // / 6 8 \\ = (%-\\  ', fg: mat.metalColor },
      { y: -6, text: ' (( ) ((@@&@@@@\\    ', fg: mat.metalColor },
      { y: -5, text: ' &/ ) |- /6@@@@@@\\  ', fg: '#FFFFFF' },
      { y: -4, text: '( - / e / %&@@@)ss\\\\', fg: mat.metalColor },
      { y: -3, text: '((((((( 8&@@@@@@\\)/ ', fg: '#FFFFFF' },
      { y: -2, text: '@(((((( \\_&&@--_&/% ', fg: mat.metalColor },
      { y: -1, text: ' ((cx)&(^\\/6_ss     ', fg: mat.metalColor },
      { y: 0,  text: ' (\\o/s-* -s@x       ', fg: mat.trimColor },
    ];

    for (const t of torsoLines) {
      for (let c = 0; c < t.text.length; c++) {
        const char = t.text[c];
        if (char !== ' ') {
          // If weapon is ignited, illuminate right side with warm weapon glow!
          let color = t.fg;
          if (this.hasFlamingSword && c > 8) {
            color = mat.glowColor;
          }
          renderCell(ox - 8 + c, oy + t.y, char, color);
        }
      }
    }

    // ==========================================
    // 4. FLOWING PLEATED TABARD & ROBES (Rows 17-23)
    // Textured chainmail weave with gold runic hem
    // ==========================================
    const robeLines = [
      { y: 1, text: '  (@@%  (@@%   ', fg: mat.robeColor },
      { y: 2, text: ' @@@8( @@@8(   ', fg: mat.robeColor },
      { y: 3, text: ' (((^c (((^c   ', fg: mat.robeColor },
      { y: 4, text: ' |#@@% |#@@%   ', fg: mat.robeColor },
      { y: 5, text: ' --- \\c6\\ ---- ', fg: mat.trimColor },
      { y: 6, text: ' *+*§*+*§*+*§* ', fg: mat.trimColor }, // Embroidered Runic Hem
    ];

    for (const r of robeLines) {
      for (let c = 0; c < r.text.length; c++) {
        const char = r.text[c];
        if (char !== ' ') {
          renderCell(ox - 7 + c, oy + r.y, char, r.fg);
        }
      }
    }

    // ==========================================
    // 5. GREAVES & COMBAT BOOTS (Rows 24-27)
    // ==========================================
    const legLines = [
      { y: 7, text: '  [##]    [##]  ', fg: mat.metalColor },
      { y: 8, text: '  |##|    |##|  ', fg: mat.metalColor },
      { y: 9, text: ' _/  \\_  _/  \\_ ', fg: '#94A3B8' },
    ];

    for (const l of legLines) {
      for (let c = 0; c < l.text.length; c++) {
        const char = l.text[c];
        if (char !== ' ') renderCell(ox - 8 + c, oy + l.y, char, l.fg);
      }
    }

    // ==========================================
    // 6. HIGH-FIDELITY GLOWING WEAPON (Image 5 & 1)
    // "Moonlace Blade / Sunfire Greatsword" held in hand
    // ==========================================
    if (this.hasFlamingSword) {
      // Slanted blade extending upwards to the right
      const bladeSegments = [
        // Tip
        { dx: 11, dy: -12, char: '+', color: '#FFFFFF' },
        { dx: 10, dy: -11, char: '*', color: mat.glowColor },
        { dx: 9,  dy: -10, char: '^', color: '#FFFFFF' },
        { dx: 8,  dy: -9,  char: '§', color: mat.glowColor },
        { dx: 8,  dy: -8,  char: '/', color: '#FFFFFF' },
        { dx: 7,  dy: -7,  char: 'x', color: mat.glowColor },
        { dx: 7,  dy: -6,  char: '°', color: '#FFFFFF' },
        { dx: 6,  dy: -5,  char: '+', color: mat.glowColor },
        { dx: 6,  dy: -4,  char: '/', color: '#FFFFFF' },
        { dx: 5,  dy: -3,  char: '*', color: mat.glowColor },
        { dx: 5,  dy: -2,  char: '~', color: '#FFFFFF' },
        { dx: 4,  dy: -1,  char: '>', color: mat.glowColor },
        // Blade Spine
        { dx: 10, dy: -10, char: '#', color: mat.metalColor },
        { dx: 9,  dy: -9,  char: '@', color: mat.metalColor },
        { dx: 8,  dy: -7,  char: '%', color: mat.metalColor },
        { dx: 7,  dy: -5,  char: '8', color: mat.metalColor },
        { dx: 6,  dy: -3,  char: 'B', color: mat.metalColor },
        { dx: 5,  dy: -1,  char: '0', color: mat.metalColor },
        // Crossguard & Hilt in hand
        { dx: 3,  dy: 0,   char: '=', color: mat.trimColor },
        { dx: 4,  dy: 0,   char: '[', color: mat.trimColor },
        { dx: 5,  dy: 0,   char: ']', color: mat.trimColor },
        { dx: 4,  dy: 1,   char: '|', color: '#A1A1AA' },
        { dx: 4,  dy: 2,   char: 'o', color: mat.trimColor }, // Pommel
      ];

      for (const b of bladeSegments) {
        renderCell(ox + b.dx, oy + b.dy, b.char, b.color);
      }

      // Render Drifting Ember Particles
      for (const e of this.embers) {
        renderCell(Math.round(ox + e.x), Math.round(oy + e.y), e.char, e.color);
      }
    }
  }
}
