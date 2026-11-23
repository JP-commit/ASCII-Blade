import { DamageFrameDef, Rect, SpriteAnimation, SpriteDefinition, SpriteFrame } from './sprite-format';

export class SpriteAnimator {
  readonly definition: SpriteDefinition;
  currentAnimationName: string = '';
  currentFrameIndex: number = 0;
  tickTimer: number = 0;
  isFinished: boolean = false;
  flipX: boolean = false;

  constructor(definition: SpriteDefinition, defaultAnim = 'idle') {
    this.definition = definition;
    this.play(defaultAnim);
  }

  play(animName: string, forceRestart = false) {
    if (this.currentAnimationName === animName && !forceRestart && !this.isFinished) {
      return;
    }

    if (!this.definition.animations.has(animName)) {
      console.warn(`[SpriteAnimator] Unknown animation "${animName}" for ${this.definition.name}`);
      return;
    }

    this.currentAnimationName = animName;
    this.currentFrameIndex = 0;
    this.tickTimer = 0;
    this.isFinished = false;
  }

  getCurrentAnimation(): SpriteAnimation | undefined {
    return this.definition.animations.get(this.currentAnimationName);
  }

  getCurrentFrame(): SpriteFrame | undefined {
    const anim = this.getCurrentAnimation();
    if (!anim) return undefined;
    const frameId = anim.frameIds[this.currentFrameIndex];
    return this.definition.frames.get(frameId);
  }

  update(): boolean {
    const anim = this.getCurrentAnimation();
    if (!anim || this.isFinished) return false;

    this.tickTimer++;
    const currentDuration = anim.durations[this.currentFrameIndex] || 8;

    if (this.tickTimer >= currentDuration) {
      this.tickTimer = 0;
      if (this.currentFrameIndex < anim.frameIds.length - 1) {
        this.currentFrameIndex++;
        return true; // Frame changed
      } else {
        if (anim.loop) {
          this.currentFrameIndex = 0;
          return true; // Looped
        } else {
          this.isFinished = true;
          return false;
        }
      }
    }

    return false;
  }

  /**
   * Returns active damage hitbox definition for the current frame if one exists
   */
  getActiveDamageDef(): DamageFrameDef | undefined {
    const anim = this.getCurrentAnimation();
    if (!anim) return undefined;
    return anim.damageFrames.find((d) => d.frameIndex === this.currentFrameIndex);
  }

  /**
   * Returns world-space damage hitbox given entity anchor position
   */
  getWorldHitbox(entityX: number, entityY: number): Rect | null {
    const dmgDef = this.getActiveDamageDef();
    if (!dmgDef) return null;

    const box = dmgDef.hitbox;
    const anchor = this.definition.anchor;

    // Relative to anchor
    let relX = box.x - anchor.x;
    if (this.flipX) {
      // Invert horizontal offset
      relX = -(box.x + box.w - anchor.x);
    }
    const relY = box.y - anchor.y;

    return {
      x: entityX + relX,
      y: entityY + relY,
      w: box.w,
      h: box.h,
    };
  }

  /**
   * Returns world-space hurtbox given entity anchor position
   */
  getWorldHurtbox(entityX: number, entityY: number): Rect {
    const box = this.definition.hurtbox;
    const anchor = this.definition.anchor;

    let relX = box.x - anchor.x;
    if (this.flipX) {
      relX = -(box.x + box.w - anchor.x);
    }
    const relY = box.y - anchor.y;

    return {
      x: entityX + relX,
      y: entityY + relY,
      w: box.w,
      h: box.h,
    };
  }
}
