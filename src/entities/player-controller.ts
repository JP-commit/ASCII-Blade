import { InputState } from '../engine/input-manager';
import { AsciiMatrixWorld } from '../renderer/ascii-matrix';
import { ClassDef, CLASSES, ClassId } from './classes';
import { ProjectileSystem } from './projectiles';

export interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  radius: number;
  life: number;
  maxLife: number;
  color?: string;
}

export class PlayerController {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  aimAngle: number = 0;

  currentClass: ClassDef;
  hp: number;
  resource: number;

  isDashing: boolean = false;
  dashTimer: number = 0;
  dashCooldownTimer: number = 0;

  isAttacking: boolean = false;
  attackTimer: number = 0;
  comboCount: number = 0;

  // Cooldown timers for skills 1, 2, 3 (in frames)
  skillCooldowns: [number, number, number] = [0, 0, 0];

  // Active barrier / shield status
  isShieldWallActive: boolean = false;
  shieldWallTimer: number = 0;

  // Active whirlwind status
  isWhirlwindActive: boolean = false;
  whirlwindTimer: number = 0;

  slashes: SlashEffect[] = [];

  constructor(startX: number, startY: number, initialClass: ClassId = 'swordsman') {
    this.x = startX;
    this.y = startY;
    this.currentClass = CLASSES[initialClass];
    this.hp = this.currentClass.maxHp;
    this.resource = this.currentClass.resourceMax;
  }

  switchClass(classId: ClassId) {
    if (!CLASSES[classId]) return;
    this.currentClass = CLASSES[classId];
    this.hp = this.currentClass.maxHp;
    this.resource = this.currentClass.resourceMax;
    this.skillCooldowns = [0, 0, 0];
    this.isDashing = false;
    this.isAttacking = false;
    this.isShieldWallActive = false;
    this.isWhirlwindActive = false;
  }

  update(
    input: InputState,
    world: AsciiMatrixWorld,
    projSys: ProjectileSystem
  ) {
    // Regenerate Class Resource
    this.resource = Math.min(
      this.currentClass.resourceMax,
      this.resource + this.currentClass.resourceRegen
    );

    // Decrement Cooldowns
    if (this.dashCooldownTimer > 0) this.dashCooldownTimer--;
    for (let i = 0; i < 3; i++) {
      if (this.skillCooldowns[i] > 0) this.skillCooldowns[i]--;
    }

    if (this.shieldWallTimer > 0) {
      this.shieldWallTimer--;
      if (this.shieldWallTimer <= 0) this.isShieldWallActive = false;
    }

    if (this.whirlwindTimer > 0) {
      this.whirlwindTimer--;
      if (this.whirlwindTimer <= 0) this.isWhirlwindActive = false;
      // Emit continuous whirlwind slashes
      if (this.whirlwindTimer % 3 === 0) {
        this.slashes.push({
          x: this.x,
          y: this.y,
          angle: (this.whirlwindTimer * 0.8) % (Math.PI * 2),
          radius: 3.8,
          life: 6,
          maxLife: 6,
          color: '#38BDF8',
        });
      }
    }

    // Handle Dash / Dodge
    if (
      input.dashJustPressed &&
      this.dashCooldownTimer === 0 &&
      !this.isDashing
    ) {
      this.isDashing = true;
      this.dashTimer = 12;
      this.dashCooldownTimer = this.currentClass.dashCooldown;

      let dashDirX = input.moveX;
      let dashDirY = input.moveY;
      if (dashDirX === 0 && dashDirY === 0) {
        dashDirX = Math.cos(input.aimAngle);
        dashDirY = Math.sin(input.aimAngle);
      }
      this.vx = dashDirX * this.currentClass.dashSpeed;
      this.vy = dashDirY * this.currentClass.dashSpeed;
    }

    if (this.isDashing) {
      this.dashTimer--;
      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.vx = 0;
        this.vy = 0;
      }
    } else {
      // Normal movement
      this.vx = input.moveX * this.currentClass.moveSpeed;
      this.vy = input.moveY * this.currentClass.moveSpeed;
    }

    // Aim Angle
    this.aimAngle = input.aimAngle;

    // Handle Primary Attack
    if (input.attackJustPressed && !this.isDashing) {
      this.executePrimaryAttack(world, projSys);
    }

    if (this.isAttacking) {
      this.attackTimer--;
      if (this.attackTimer <= 0) {
        this.isAttacking = false;
      }
    }

    // Handle Skills 1, 2, 3
    if (input.skill1JustPressed) this.executeSkill(0, world, projSys);
    if (input.skill2JustPressed) this.executeSkill(1, world, projSys);
    if (input.skill3JustPressed) this.executeSkill(2, world, projSys);

    // Update slash arcs
    for (let i = this.slashes.length - 1; i >= 0; i--) {
      this.slashes[i].life--;
      if (this.slashes[i].life <= 0) {
        this.slashes.splice(i, 1);
      }
    }

    // World Collision detection against solid walls
    const nextX = this.x + this.vx;
    const nextY = this.y + this.vy;

    if (!world.getTile(Math.floor(nextX), Math.floor(this.y)).isSolid) {
      this.x = nextX;
    }
    if (!world.getTile(Math.floor(this.x), Math.floor(nextY)).isSolid) {
      this.y = nextY;
    }

    // Update Player Lantern Light
    const playerLight = world.lighting.lights.find((l) => l.id === 'player_lantern');
    if (playerLight) {
      playerLight.x = this.x;
      playerLight.y = this.y;
    } else {
      world.lighting.addLight({
        id: 'player_lantern',
        x: this.x,
        y: this.y,
        radius: 10,
        intensity: 0.75,
        color: [240, 230, 200],
        flickerSpeed: 2.5,
        flickerAmount: 0.08,
      });
    }
  }

  private executePrimaryAttack(world: AsciiMatrixWorld, projSys: ProjectileSystem) {
    this.isAttacking = true;
    this.attackTimer = 14;
    this.comboCount = (this.comboCount % 3) + 1;

    const classId = this.currentClass.id;

    if (classId === 'swordsman') {
      // 3-hit sweeping slash with forward momentum
      this.slashes.push({
        x: this.x + Math.cos(this.aimAngle) * 2.2,
        y: this.y + Math.sin(this.aimAngle) * 2.2,
        angle: this.aimAngle,
        radius: 3.5,
        life: 8,
        maxLife: 8,
        color: '#FBBF24',
      });
      // Flash lighting
      this.flashLight(world, 12, [255, 220, 150]);
    } else if (classId === 'archer') {
      // Rapid directional arrow
      const arrowSpeed = 1.2;
      projSys.spawnProjectile(
        {
          id: `arrow_${Date.now()}_${Math.random()}`,
          type: 'arrow',
          x: this.x + Math.cos(this.aimAngle) * 1.5,
          y: this.y + Math.sin(this.aimAngle) * 1.5,
          vx: Math.cos(this.aimAngle) * arrowSpeed,
          vy: Math.sin(this.aimAngle) * arrowSpeed,
          angle: this.aimAngle,
          life: 45,
          maxLife: 45,
          radius: 1,
          damage: 28,
          color: '#34D399',
          glyph: '->',
          lightRadius: 6,
          lightColor: [100, 255, 180],
        },
        world
      );
    } else if (classId === 'tank') {
      // Heavy crushing mace slam with shield thrust
      this.slashes.push({
        x: this.x + Math.cos(this.aimAngle) * 1.8,
        y: this.y + Math.sin(this.aimAngle) * 1.8,
        angle: this.aimAngle,
        radius: 2.8,
        life: 10,
        maxLife: 10,
        color: '#F59E0B',
      });
      this.flashLight(world, 14, [255, 180, 50]);
    } else if (classId === 'magician') {
      // Homing arcane orb
      const orbSpeed = 0.8;
      projSys.spawnProjectile(
        {
          id: `orb_${Date.now()}_${Math.random()}`,
          type: 'arcane_orb',
          x: this.x + Math.cos(this.aimAngle) * 1.8,
          y: this.y + Math.sin(this.aimAngle) * 1.8,
          vx: Math.cos(this.aimAngle) * orbSpeed,
          vy: Math.sin(this.aimAngle) * orbSpeed,
          angle: this.aimAngle,
          life: 50,
          maxLife: 50,
          radius: 1.5,
          damage: 35,
          color: '#C084FC',
          glyph: '(*)',
          lightRadius: 8,
          lightColor: [200, 130, 255],
        },
        world
      );
    }
  }

  private executeSkill(
    skillIndex: 0 | 1 | 2,
    world: AsciiMatrixWorld,
    projSys: ProjectileSystem
  ) {
    const skill = this.currentClass.skills[skillIndex];
    if (this.skillCooldowns[skillIndex] > 0 || this.resource < skill.resourceCost) {
      return;
    }

    // Consume resource and set cooldown
    this.resource -= skill.resourceCost;
    this.skillCooldowns[skillIndex] = skill.cooldownFrames;

    const classId = this.currentClass.id;

    if (classId === 'swordsman') {
      if (skillIndex === 0) {
        // Dash Strike: forward lunge + massive slash
        this.x += Math.cos(this.aimAngle) * 6;
        this.slashes.push({
          x: this.x,
          y: this.y,
          angle: this.aimAngle,
          radius: 5.0,
          life: 12,
          maxLife: 12,
          color: '#38BDF8',
        });
        this.flashLight(world, 18, [180, 230, 255]);
      } else if (skillIndex === 1) {
        // Whirlwind: 360 spin
        this.isWhirlwindActive = true;
        this.whirlwindTimer = 45;
        this.flashLight(world, 16, [150, 220, 255]);
      } else if (skillIndex === 2) {
        // Blade Tempest: 3 flying blade waves
        for (let i = -1; i <= 1; i++) {
          const spreadAngle = this.aimAngle + i * 0.25;
          projSys.spawnProjectile(
            {
              id: `wave_${Date.now()}_${i}`,
              type: 'blade_wave',
              x: this.x + Math.cos(spreadAngle) * 2,
              y: this.y + Math.sin(spreadAngle) * 2,
              vx: Math.cos(spreadAngle) * 0.9,
              vy: Math.sin(spreadAngle) * 0.9,
              angle: spreadAngle,
              life: 40,
              maxLife: 40,
              radius: 3,
              damage: 55,
              color: '#38BDF8',
              glyph: ')))',
              lightRadius: 10,
              lightColor: [120, 200, 255],
            },
            world
          );
        }
      }
    } else if (classId === 'archer') {
      if (skillIndex === 0) {
        // Scatter Volley: 5 arrows in fan spread
        for (let i = -2; i <= 2; i++) {
          const spread = this.aimAngle + i * 0.16;
          projSys.spawnProjectile(
            {
              id: `arrow_scatter_${Date.now()}_${i}`,
              type: 'arrow',
              x: this.x + Math.cos(spread) * 1.5,
              y: this.y + Math.sin(spread) * 1.5,
              vx: Math.cos(spread) * 1.3,
              vy: Math.sin(spread) * 1.3,
              angle: spread,
              life: 40,
              maxLife: 40,
              radius: 1,
              damage: 22,
              color: '#34D399',
              glyph: '->',
              lightRadius: 5,
              lightColor: [100, 255, 180],
            },
            world
          );
        }
      } else if (skillIndex === 1) {
        // Evasive Vault: leap backwards
        this.x -= Math.cos(this.aimAngle) * 5;
        this.y -= Math.sin(this.aimAngle) * 5;
        this.flashLight(world, 10, [150, 255, 200]);
      } else if (skillIndex === 2) {
        // Rain of Arrows on target area
        const targetX = this.x + Math.cos(this.aimAngle) * 10;
        const targetY = this.y + Math.sin(this.aimAngle) * 10;
        for (let i = 0; i < 10; i++) {
          setTimeout(() => {
            const rx = targetX + (Math.random() - 0.5) * 6;
            const ry = targetY + (Math.random() - 0.5) * 6;
            projSys.spawnProjectile(
              {
                id: `rain_${Date.now()}_${i}`,
                type: 'arrow',
                x: rx,
                y: ry - 8,
                vx: 0,
                vy: 1.4,
                angle: Math.PI / 2,
                life: 15,
                maxLife: 15,
                radius: 1,
                damage: 35,
                color: '#6EE7B7',
                glyph: '|v',
                lightRadius: 8,
                lightColor: [180, 255, 220],
              },
              world
            );
          }, i * 60);
        }
      }
    } else if (classId === 'tank') {
      if (skillIndex === 0) {
        // Shield Wall: 80% damage reduction & golden aura
        this.isShieldWallActive = true;
        this.shieldWallTimer = 120; // 2 seconds
        this.flashLight(world, 16, [255, 220, 100]);
      } else if (skillIndex === 1) {
        // Ground Tremor: expanding earthquake shockwave
        projSys.spawnProjectile(
          {
            id: `tremor_${Date.now()}`,
            type: 'ground_tremor',
            x: this.x,
            y: this.y,
            vx: 0,
            vy: 0,
            angle: 0,
            life: 25,
            maxLife: 25,
            radius: 2,
            damage: 60,
            color: '#F59E0B',
            glyph: '#',
            lightRadius: 18,
            lightColor: [255, 200, 80],
          },
          world
        );
      } else if (skillIndex === 2) {
        // Fortress Bastion: radial barrier
        this.hp = Math.min(this.currentClass.maxHp, this.hp + 50);
        this.flashLight(world, 24, [255, 240, 150]);
      }
    } else if (classId === 'magician') {
      if (skillIndex === 0) {
        // Flame Pillar: raging fire pillar
        const targetX = this.x + Math.cos(this.aimAngle) * 7;
        const targetY = this.y + Math.sin(this.aimAngle) * 7;
        projSys.spawnProjectile(
          {
            id: `flame_${Date.now()}`,
            type: 'flame_pillar',
            x: targetX,
            y: targetY,
            vx: 0,
            vy: 0,
            angle: 0,
            life: 45,
            maxLife: 45,
            radius: 3.5,
            damage: 80,
            color: '#F97316',
            glyph: '^',
            lightRadius: 20,
            lightColor: [255, 140, 30],
          },
          world
        );
      } else if (skillIndex === 1) {
        // Frost Nova: expanding ice ring
        projSys.spawnProjectile(
          {
            id: `frost_${Date.now()}`,
            type: 'frost_nova',
            x: this.x,
            y: this.y,
            vx: 0,
            vy: 0,
            angle: 0,
            life: 28,
            maxLife: 28,
            radius: 2.0,
            damage: 50,
            color: '#38BDF8',
            glyph: '*',
            lightRadius: 18,
            lightColor: [80, 200, 255],
          },
          world
        );
      } else if (skillIndex === 2) {
        // Blink Teleport
        this.x += Math.cos(this.aimAngle) * 8;
        this.y += Math.sin(this.aimAngle) * 8;
        this.flashLight(world, 18, [200, 130, 255]);
      }
    }
  }

  private flashLight(
    world: AsciiMatrixWorld,
    radius: number,
    color: [number, number, number]
  ) {
    const id = `flash_${Date.now()}_${Math.random()}`;
    world.lighting.addLight({
      id,
      x: this.x,
      y: this.y,
      radius,
      intensity: 0.95,
      color,
      flickerSpeed: 0,
      flickerAmount: 0,
    });
    setTimeout(() => world.lighting.removeLight(id), 120);
  }

  render(
    renderCell: (
      gx: number,
      gy: number,
      char: string,
      fgColor: string
    ) => void
  ) {
    const px = Math.round(this.x);
    const py = Math.round(this.y);

    const cDef = this.currentClass;
    let head = cDef.headGlyph;
    let body = cDef.bodyGlyph;
    let leg = cDef.legGlyph;

    const playerColor = this.isDashing ? '#FFFFFF' : cDef.color;

    // Shield Wall Aura
    if (this.isShieldWallActive) {
      renderCell(px - 3, py - 1, '[', '#FBBF24');
      renderCell(px - 3, py, '[', '#FBBF24');
      renderCell(px - 3, py + 1, '[', '#FBBF24');
      renderCell(px + 3, py - 1, ']', '#FBBF24');
      renderCell(px + 3, py, ']', '#FBBF24');
      renderCell(px + 3, py + 1, ']', '#FBBF24');
    }

    // Head
    for (let c = 0; c < head.length; c++) {
      const char = head[c];
      if (char !== ' ') renderCell(px - 1 + c, py - 1, char, '#FDE047');
    }
    // Body / Armor
    for (let c = 0; c < body.length; c++) {
      const char = body[c];
      if (char !== ' ') renderCell(px - 2 + c, py, char, playerColor);
    }
    // Legs
    for (let c = 0; c < leg.length; c++) {
      const char = leg[c];
      if (char !== ' ') renderCell(px - 2 + c, py + 1, char, '#94A3B8');
    }

    // Render active slash arcs
    for (const slash of this.slashes) {
      const color = slash.color || '#FBBF24';
      for (let p = -3; p <= 3; p++) {
        const offsetAngle = slash.angle + p * 0.22;
        const sx = Math.round(this.x + Math.cos(offsetAngle) * slash.radius);
        const sy = Math.round(this.y + Math.sin(offsetAngle) * (slash.radius * 0.7));

        let arcChar = '/';
        const normAngle = ((offsetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (normAngle < Math.PI * 0.25 || normAngle > Math.PI * 1.75) arcChar = ')';
        else if (normAngle < Math.PI * 0.75) arcChar = '~';
        else if (normAngle < Math.PI * 1.25) arcChar = '(';
        else arcChar = '-';

        renderCell(sx, sy, arcChar, color);
      }
    }
  }
}
