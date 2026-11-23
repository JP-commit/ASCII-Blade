import { DamageFrameDef, Rect, SpriteAnimation, SpriteDefinition, SpriteFrame } from './sprite-format';

export interface ParseResult {
  sprite?: SpriteDefinition;
  errors: string[];
}

export function parseSprite(source: string, filename = 'unknown'): ParseResult {
  const errors: string[] = [];
  const lines = source.split(/\r?\n/);

  let name = '';
  let width = 0;
  let height = 0;
  let anchor = { x: 0, y: 0 };
  let hurtbox: Rect = { x: 0, y: 0, w: 0, h: 0 };
  const animations = new Map<string, SpriteAnimation>();
  const frames = new Map<string, SpriteFrame>();

  let hasAnchor = false;
  let hasHurtbox = false;

  let lineIdx = 0;
  let inAnimationsSection = false;

  // 1. Parse Header
  while (lineIdx < lines.length) {
    const rawLine = lines[lineIdx];
    const trimmed = rawLine.trim();

    if (trimmed.startsWith('---')) {
      // Beginning of frames section
      break;
    }

    lineIdx++;

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    if (trimmed.startsWith('NAME:')) {
      name = trimmed.substring(5).trim();
    } else if (trimmed.startsWith('WIDTH:')) {
      width = parseInt(trimmed.substring(6).trim(), 10);
      if (isNaN(width) || width <= 0) {
        errors.push(`[${filename}:${lineIdx}] Invalid WIDTH: "${trimmed}"`);
      }
    } else if (trimmed.startsWith('HEIGHT:')) {
      height = parseInt(trimmed.substring(7).trim(), 10);
      if (isNaN(height) || height <= 0) {
        errors.push(`[${filename}:${lineIdx}] Invalid HEIGHT: "${trimmed}"`);
      }
    } else if (trimmed.startsWith('ANCHOR:')) {
      const parts = trimmed.substring(7).trim().split(',');
      if (parts.length === 2) {
        anchor = { x: parseInt(parts[0], 10), y: parseInt(parts[1], 10) };
        hasAnchor = true;
      } else {
        errors.push(`[${filename}:${lineIdx}] Invalid ANCHOR format: expected "x,y", got "${trimmed}"`);
      }
    } else if (trimmed.startsWith('HURTBOX:')) {
      const parts = trimmed.substring(8).trim().split(',');
      if (parts.length === 4) {
        hurtbox = {
          x: parseInt(parts[0], 10),
          y: parseInt(parts[1], 10),
          w: parseInt(parts[2], 10),
          h: parseInt(parts[3], 10),
        };
        hasHurtbox = true;
      } else {
        errors.push(`[${filename}:${lineIdx}] Invalid HURTBOX format: expected "x,y,w,h", got "${trimmed}"`);
      }
    } else if (trimmed === 'ANIMATIONS:') {
      inAnimationsSection = true;
    } else if (inAnimationsSection && trimmed.includes('=')) {
      // Parse animation definition line:
      // idle = frames:idle_0,idle_1 durations:20,20 loop:true
      // attack1 = frames:atk1_0,atk1_1 durations:5,8 loop:false damage:1[4,1,4,5]
      const eqIdx = trimmed.indexOf('=');
      const animName = trimmed.substring(0, eqIdx).trim();
      const rest = trimmed.substring(eqIdx + 1).trim();

      const anim = parseAnimationLine(animName, rest, lineIdx, filename, errors);
      if (anim) {
        animations.set(animName, anim);
      }
    }
  }

  if (!name) errors.push(`[${filename}] Missing NAME in header`);
  if (!width) errors.push(`[${filename}] Missing WIDTH in header`);
  if (!height) errors.push(`[${filename}] Missing HEIGHT in header`);
  if (!hasAnchor) errors.push(`[${filename}] Missing ANCHOR in header`);
  if (!hasHurtbox) errors.push(`[${filename}] Missing HURTBOX in header`);

  // 2. Parse Frames
  let currentFrameId = '';
  let collectingSection: 'NONE' | 'GLYPHS' | 'COLORS' = 'NONE';
  let currentGlyphs: string[] = [];
  let currentColors: string[] = [];
  let frameStartLine = lineIdx;

  function commitCurrentFrame() {
    if (!currentFrameId) return;

    if (currentGlyphs.length !== height) {
      errors.push(
        `[${filename}:${frameStartLine}] Frame "${currentFrameId}" has ${currentGlyphs.length} GLYPH rows, expected ${height}`
      );
    }
    if (currentColors.length > 0 && currentColors.length !== height) {
      errors.push(
        `[${filename}:${frameStartLine}] Frame "${currentFrameId}" has ${currentColors.length} COLOR rows, expected ${height}`
      );
    }

    // Default colors to white 'W' if not provided
    if (currentColors.length === 0 && height > 0 && width > 0) {
      for (let r = 0; r < height; r++) {
        currentColors.push('W'.repeat(width));
      }
    }

    // Validate row widths and printable ASCII
    for (let r = 0; r < currentGlyphs.length; r++) {
      const gRow = currentGlyphs[r];
      if (gRow.length !== width) {
        errors.push(
          `[${filename}:${frameStartLine}] Frame "${currentFrameId}" GLYPH row ${r} length is ${gRow.length}, expected ${width} (content: "${gRow}")`
        );
      }
      for (let c = 0; c < gRow.length; c++) {
        const code = gRow.charCodeAt(c);
        if (code < 0x20 || code > 0x7e) {
          errors.push(
            `[${filename}:${frameStartLine}] Non-ASCII character (0x${code.toString(16)}) in frame "${currentFrameId}" row ${r} col ${c}: "${gRow[c]}"`
          );
        }
      }
    }

    for (let r = 0; r < currentColors.length; r++) {
      const cRow = currentColors[r];
      if (cRow.length !== width) {
        errors.push(
          `[${filename}:${frameStartLine}] Frame "${currentFrameId}" COLOR row ${r} length is ${cRow.length}, expected ${width} (content: "${cRow}")`
        );
      }
    }

    frames.set(currentFrameId, {
      id: currentFrameId,
      glyphs: [...currentGlyphs],
      colorMask: [...currentColors],
    });

    currentGlyphs = [];
    currentColors = [];
    currentFrameId = '';
    collectingSection = 'NONE';
  }

  while (lineIdx < lines.length) {
    const rawLine = lines[lineIdx];
    lineIdx++;

    if (rawLine.startsWith('---')) {
      commitCurrentFrame();
      frameStartLine = lineIdx;

      // Check if frame id is on the delimiter line: --- FRAME: idle_0
      const match = rawLine.match(/^---\s*(?:FRAME:\s*)?([A-Za-z0-9_-]+)?/);
      if (match && match[1]) {
        currentFrameId = match[1];
      }
      continue;
    }

    const trimmed = rawLine.trim();
    if (!currentFrameId && trimmed.startsWith('FRAME:')) {
      currentFrameId = trimmed.substring(6).trim();
      continue;
    }

    if (trimmed === 'GLYPHS:') {
      collectingSection = 'GLYPHS';
      continue;
    }

    if (trimmed === 'COLORS:') {
      collectingSection = 'COLORS';
      continue;
    }

    if (collectingSection === 'GLYPHS') {
      if (currentGlyphs.length < height) {
        // Keep whitespace exactly as written!
        // Pad with spaces if the editor trimmed trailing spaces up to width
        let row = rawLine;
        if (row.length < width) {
          row = row.padEnd(width, ' ');
        }
        currentGlyphs.push(row);
      }
    } else if (collectingSection === 'COLORS') {
      if (currentColors.length < height) {
        let row = rawLine;
        if (row.length < width) {
          row = row.padEnd(width, ' ');
        }
        currentColors.push(row);
      }
    }
  }

  // Commit last frame
  commitCurrentFrame();

  // Validate that all referenced frames in animations exist
  for (const [animName, anim] of animations.entries()) {
    for (const frameId of anim.frameIds) {
      if (!frames.has(frameId)) {
        errors.push(
          `[${filename}] Animation "${animName}" references nonexistent frame "${frameId}"`
        );
      }
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    sprite: {
      name,
      width,
      height,
      anchor,
      hurtbox,
      animations,
      frames,
      rawSource: source,
    },
    errors: [],
  };
}

function parseAnimationLine(
  animName: string,
  rest: string,
  lineIdx: number,
  filename: string,
  errors: string[]
): SpriteAnimation | null {
  // Example: frames:atk1_0,atk1_1 durations:5,8 loop:false damage:1[4,1,4,5]
  const tokens = rest.split(/\s+/);
  let frameIds: string[] = [];
  let durations: number[] = [];
  let loop = true;
  const damageFrames: DamageFrameDef[] = [];

  for (const token of tokens) {
    if (token.startsWith('frames:')) {
      frameIds = token.substring(7).split(',').filter(Boolean);
    } else if (token.startsWith('durations:')) {
      durations = token.substring(10).split(',').map((d) => parseInt(d, 10));
    } else if (token.startsWith('loop:')) {
      loop = token.substring(5).toLowerCase() === 'true';
    } else if (token.startsWith('damage:')) {
      // e.g. damage:1[4,1,4,5] or damage:1[4,1,4,5]*1.5
      const m = token.match(/damage:(\d+)\[(\d+),(\d+),(\d+),(\d+)\](?:\*([\d.]+))?/);
      if (m) {
        damageFrames.push({
          frameIndex: parseInt(m[1], 10),
          hitbox: {
            x: parseInt(m[2], 10),
            y: parseInt(m[3], 10),
            w: parseInt(m[4], 10),
            h: parseInt(m[5], 10),
          },
          damageMult: m[6] ? parseFloat(m[6]) : 1.0,
        });
      } else {
        errors.push(`[${filename}:${lineIdx}] Invalid damage specifier: "${token}"`);
      }
    }
  }

  if (frameIds.length === 0) {
    errors.push(`[${filename}:${lineIdx}] Animation "${animName}" has no frames`);
    return null;
  }

  if (durations.length === 0) {
    durations = frameIds.map(() => 8); // Default 8 ticks
  } else if (durations.length !== frameIds.length) {
    errors.push(
      `[${filename}:${lineIdx}] Animation "${animName}" durations count (${durations.length}) does not match frame count (${frameIds.length})`
    );
  }

  return {
    name: animName,
    frameIds,
    durations,
    loop,
    damageFrames,
  };
}
