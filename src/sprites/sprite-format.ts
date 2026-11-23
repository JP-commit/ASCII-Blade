/**
 * Data structures for ASCII Sprite Definitions
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SpriteFrame {
  id: string;
  glyphs: string[];      // Array of strings, each of length WIDTH, total lines = HEIGHT
  colorMask: string[];   // Array of strings, matching glyphs layout
}

export interface DamageFrameDef {
  frameIndex: number;    // Index within the animation sequence (0-based)
  hitbox: Rect;          // Hitbox relative to sprite origin (top-left 0,0)
  damageMult?: number;   // Damage multiplier for this hit
  knockbackMult?: number;
}

export interface SpriteAnimation {
  name: string;
  frameIds: string[];
  durations: number[];    // Duration in ticks/frames for each frame
  loop: boolean;
  damageFrames: DamageFrameDef[];
}

export interface SpriteDefinition {
  name: string;
  width: number;
  height: number;
  anchor: { x: number; y: number };
  hurtbox: Rect;
  animations: Map<string, SpriteAnimation>;
  frames: Map<string, SpriteFrame>;
  rawSource?: string;
}
