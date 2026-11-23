/**
 * Palette configurations for ASCIIBLADE
 * Supports Full Colour, Amber Monitor, Green Phosphor, Monochrome, and Colorblind.
 */

export type PaletteId = 'full' | 'amber' | 'green' | 'mono' | 'colorblind';

export interface Palette {
  id: PaletteId;
  name: string;
  bg: string;
  border: string;
  colors: Record<string, string>; // Maps single-character color code to hex color
}

// Default Full Color mapping
const FULL_COLOR_MAP: Record<string, string> = {
  '.': 'transparent',
  ' ': 'transparent',
  'W': '#E2E8F0', // Bright Silver / White
  'K': '#4A5568', // Dark Slate / Shadow
  'B': '#3182CE', // Steel Blue
  'C': '#0BC5EA', // Cyan / Frost
  'R': '#E53E3E', // Crimson / Blood
  'G': '#ECC94B', // Gold / Rare
  'Y': '#FAF089', // Bright Yellow
  'E': '#38A169', // Emerald Green / Acid
  'P': '#9F7AEA', // Arcane Purple / Epic
  'O': '#DD6B20', // Flame Orange / Legendary
  'M': '#ED64A6', // Magenta
  'D': '#1A202C', // Pitch Black
  'T': '#CBD5E0', // Light Slate / Bone
};

// Generates a monochromatic gradient from brightness weights
function generateMonoPalette(
  id: PaletteId,
  name: string,
  baseBg: string,
  border: string,
  colorLevels: { dark: string; mid: string; light: string; bright: string }
): Palette {
  return {
    id,
    name,
    bg: baseBg,
    border,
    colors: {
      '.': 'transparent',
      ' ': 'transparent',
      'W': colorLevels.bright,
      'K': colorLevels.dark,
      'B': colorLevels.mid,
      'C': colorLevels.light,
      'R': colorLevels.bright,
      'G': colorLevels.light,
      'Y': colorLevels.bright,
      'E': colorLevels.mid,
      'P': colorLevels.mid,
      'O': colorLevels.light,
      'M': colorLevels.light,
      'D': baseBg,
      'T': colorLevels.mid,
    },
  };
}

export const PALETTES: Record<PaletteId, Palette> = {
  full: {
    id: 'full',
    name: 'Full Colour',
    bg: '#0A0E17',
    border: '#4A5568',
    colors: FULL_COLOR_MAP,
  },
  amber: generateMonoPalette('amber', 'Amber Monitor', '#120A00', '#D97706', {
    dark: '#592D00',
    mid: '#B45309',
    light: '#F59E0B',
    bright: '#FDE68A',
  }),
  green: generateMonoPalette('green', 'Green Phosphor', '#021505', '#10B981', {
    dark: '#064E3B',
    mid: '#059669',
    light: '#34D399',
    bright: '#A7F3D0',
  }),
  mono: generateMonoPalette('mono', 'Monochrome (Paper)', '#080808', '#71717A', {
    dark: '#3F3F46',
    mid: '#A1A1AA',
    light: '#E4E4E7',
    bright: '#FFFFFF',
  }),
  colorblind: {
    id: 'colorblind',
    name: 'High Contrast (Accessible)',
    bg: '#000000',
    border: '#FFFFFF',
    colors: {
      ...FULL_COLOR_MAP,
      'R': '#D55E00', // Vermillion (distinguishable from green)
      'E': '#009E73', // Bluish green
      'B': '#0072B2', // Blue
      'Y': '#F0E442', // Yellow
      'P': '#CC79A7', // Reddish purple
      'C': '#56B4E9', // Sky blue
    },
  },
};
