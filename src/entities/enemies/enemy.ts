import { AsciiMatrixWorld } from '../../renderer/ascii-matrix';
import { PlayerController } from '../player-controller';
import { ProjectileSystem } from '../projectiles';

export type EnemyType =
  | 'skeleton_infantry'
  | 'skeleton_archer'
  | 'shadow_stalker'
  | 'armored_brute'
  | 'cultist_necromancer'
  | 'tower_warden';

export type AIState =
  | 'idle'
  | 'chase'
  | 'kite'
  | 'windup'
  | 'attack'
  | 'stagger'
  | 'dead';

export class Enemy {
  id: string;
  type: EnemyType;
  name: string;
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;

  state: AIState = 'idle';
  stateTimer: number = 0;
  attackCooldown: number = 0;

  // Telegraph warning indicator
  isTelegraphing: boolean = false;
  telegraphTimer: number = 0;
  telegraphDuration: number = 24; // ~400ms warning

  isBoss: boolean = false;
  bossPhase: number = 1;

  isHurt: boolean = false;
  hurtTimer: number = 0;

  constructor(
    type: EnemyType,
    x: number,
    y: number
  ) {
    this.id = `enemy_${Date.now()}_${Math.random()}`;
    this.type = type;
    this.x = x;
    this.y = y;

    if (type === 'skeleton_infantry') {
      this.name = 'Skeleton Infantry';
      this.maxHp = 60;
      this.speed = 0.22;
      this.damage = 14;
    } else if (type === 'skeleton_archer') {
      this.name = 'Skeleton Archer';
      this.maxHp = 45;
      this.speed = 0.24;
      this.damage = 18;
    } else if (type === 'shadow_stalker') {
      this.name = 'Shadow Stalker';
      this.maxHp = 50;
      this.speed = 0.36;
      this.damage = 22;
    } else if (type === 'armored_brute') {
      this.name = 'Armored Brute';
      this.maxHp = 180;
      this.speed = 0.16;
      this.damage = 35;
      this.telegraphDuration = 36;
    } else if (type === 'cultist_necromancer') {
      this.name = 'Cultist Necromancer';
      this.maxHp = 80;
      this.speed = 0.20;
      this.damage = 20;
    } else {
      // Tower Warden (Mini-Boss)
      this.name = 'The Tower Warden';
      this.isBoss = true;
      this.maxHp = 650;
      this.speed = 0.25;
      this.damage = 32;
      this.telegraphDuration = 30;
    }

    this.hp = this.maxHp;
  }

  takeDamage(amount: number, knockbackX = 0, knockbackY = 0): boolean {
    if (this.state === 'dead') return false;

    this.hp -= amount;
    this.isHurt = true;
    this.hurtTimer = 6;

    // Apply knockback (Brutes and Boss have hyper armor)
    if (this.type !== 'armored_brute' && !this.isBoss) {
      this.x += knockbackX;
      this.y += knockbackY;
      this.state = 'stagger';
      this.stateTimer = 8;
    }

    // Boss Phase 2 Transition
    if (this.isBoss && this.bossPhase === 1 && this.hp <= this.maxHp * 0.5) {
      this.bossPhase = 2;
      this.speed = 0.32;
      this.damage = 44;
    }

    if (this.hp <= 0) {
      this.state = 'dead';
      this.stateTimer = 30; // Decay timer
      return true; // Died
    }

    return false;
  }

  update(
    player: PlayerController,
    world: AsciiMatrixWorld,
    projSys: ProjectileSystem,
    spawnMinion?: (type: EnemyType, x: number, y: number) => void
  ) {
    if (this.state === 'dead') return;

    if (this.hurtTimer > 0) this.hurtTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx);

    // AI State Machine
    if (this.state === 'stagger') {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        this.state = 'chase';
      }
      return;
    }

    if (this.state === 'windup') {
      this.telegraphTimer--;
      if (this.telegraphTimer <= 0) {
        this.executeAttack(player, projSys, angleToPlayer, spawnMinion);
      }
      return;
    }

    // Standard Behaviors
    if (this.type === 'skeleton_infantry') {
      // Melee Chase & Strike
      if (dist < 2.5 && this.attackCooldown === 0) {
        this.startTelegraph();
      } else {
        this.moveTowards(player.x, player.y, world);
      }
    } else if (this.type === 'skeleton_archer') {
      // Ranged Kiter
      if (dist < 5.0) {
        // Kite backwards
        this.moveTowards(this.x - dx, this.y - dy, world);
      } else if (dist < 12.0 && this.attackCooldown === 0) {
        this.startTelegraph();
      } else {
        this.moveTowards(player.x, player.y, world);
      }
    } else if (this.type === 'shadow_stalker') {
      // Circling Flanker & Leaping Pounce
      if (dist < 7.0 && this.attackCooldown === 0) {
        this.startTelegraph();
      } else {
        // Flank
        const flankAngle = angleToPlayer + Math.PI * 0.35;
        const targetX = player.x + Math.cos(flankAngle) * 4;
        const targetY = player.y + Math.sin(flankAngle) * 4;
        this.moveTowards(targetX, targetY, world);
      }
    } else if (this.type === 'armored_brute') {
      // Heavy slow walk & crushing overhead club smash
      if (dist < 3.5 && this.attackCooldown === 0) {
        this.startTelegraph();
      } else {
        this.moveTowards(player.x, player.y, world);
      }
    } else if (this.type === 'cultist_necromancer') {
      // Ranged dark caster & summoner
      if (dist < 6.0) {
        this.moveTowards(this.x - dx, this.y - dy, world);
      } else if (this.attackCooldown === 0) {
        this.startTelegraph();
      }
    } else if (this.isBoss) {
      // The Tower Warden Boss Behavior
      if (dist < 4.0 && this.attackCooldown === 0) {
        this.startTelegraph();
      } else if (dist >= 4.0 && dist <= 14.0 && this.attackCooldown === 0 && Math.random() < 0.4) {
        // Shield charge or Leap
        this.startTelegraph();
      } else {
        this.moveTowards(player.x, player.y, world);
      }
    }
  }

  private startTelegraph() {
    this.state = 'windup';
    this.isTelegraphing = true;
    this.telegraphTimer = this.telegraphDuration;
  }

  private executeAttack(
    player: PlayerController,
    projSys: ProjectileSystem,
    angle: number,
    spawnMinion?: (type: EnemyType, x: number, y: number) => void
  ) {
    this.state = 'chase';
    this.isTelegraphing = false;
    this.attackCooldown = 50 + Math.floor(Math.random() * 30);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (this.type === 'skeleton_infantry') {
      if (dist < 3.0) {
        this.dealDamageToPlayer(player, this.damage);
      }
    } else if (this.type === 'skeleton_archer') {
      // Fire bone arrow projectile
      projSys.spawnProjectile(
        {
          id: `enemy_arrow_${Date.now()}`,
          type: 'arrow',
          x: this.x + Math.cos(angle) * 1.5,
          y: this.y + Math.sin(angle) * 1.5,
          vx: Math.cos(angle) * 0.9,
          vy: Math.sin(angle) * 0.9,
          angle,
          life: 40,
          maxLife: 40,
          radius: 1,
          damage: this.damage,
          color: '#E2E8F0',
          glyph: '->',
        },
        null as unknown as AsciiMatrixWorld // No world light needed for basic arrow
      );
    } else if (this.type === 'shadow_stalker') {
      // Leaping Pounce
      this.x += Math.cos(angle) * 4.5;
      this.y += Math.sin(angle) * 4.5;
      if (Math.hypot(player.x - this.x, player.y - this.y) < 2.5) {
        this.dealDamageToPlayer(player, this.damage);
      }
    } else if (this.type === 'armored_brute') {
      // Heavy club smash with AoE shockwave
      if (dist < 4.0) {
        this.dealDamageToPlayer(player, this.damage);
      }
    } else if (this.type === 'cultist_necromancer') {
      // Summon skeleton minion or cast dark orb
      if (Math.random() < 0.5 && spawnMinion) {
        spawnMinion('skeleton_infantry', this.x + 2, this.y);
      } else {
        projSys.spawnProjectile(
          {
            id: `dark_orb_${Date.now()}`,
            type: 'arcane_orb',
            x: this.x + Math.cos(angle) * 1.5,
            y: this.y + Math.sin(angle) * 1.5,
            vx: Math.cos(angle) * 0.65,
            vy: Math.sin(angle) * 0.65,
            angle,
            life: 45,
            maxLife: 45,
            radius: 1.5,
            damage: this.damage,
            color: '#A855F7',
            glyph: '(@)',
          },
          null as unknown as AsciiMatrixWorld
        );
      }
    } else if (this.isBoss) {
      // Tower Warden Boss Cleave / Ground Shockwave
      if (dist < 4.5) {
        this.dealDamageToPlayer(player, this.damage);
      }
      if (this.bossPhase === 2) {
        // Phase 2: Unleash dark fire ground shockwave
        projSys.spawnProjectile(
          {
            id: `boss_shock_${Date.now()}`,
            type: 'ground_tremor',
            x: this.x,
            y: this.y,
            vx: 0,
            vy: 0,
            angle: 0,
            life: 25,
            maxLife: 25,
            radius: 2,
            damage: 28,
            color: '#DC2626',
            glyph: '!',
          },
          null as unknown as AsciiMatrixWorld
        );
      }
    }
  }

  private dealDamageToPlayer(player: PlayerController, rawDamage: number) {
    let finalDmg = rawDamage;
    if (player.isShieldWallActive) {
      finalDmg = Math.round(rawDamage * 0.2); // 80% damage reduction
    }
    player.hp = Math.max(0, player.hp - finalDmg);
  }

  private moveTowards(targetX: number, targetY: number, world: AsciiMatrixWorld) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.1) return;

    const nx = (dx / dist) * this.speed;
    const ny = (dy / dist) * this.speed;

    const nextX = this.x + nx;
    const nextY = this.y + ny;

    if (!world.getTile(Math.floor(nextX), Math.floor(this.y)).isSolid) {
      this.x = nextX;
    }
    if (!world.getTile(Math.floor(this.x), Math.floor(nextY)).isSolid) {
      this.y = nextY;
    }
  }

  render(
    renderCell: (gx: number, gy: number, char: string, fgColor: string) => void
  ) {
    if (this.state === 'dead') return;

    const ex = Math.round(this.x);
    const ey = Math.round(this.y);

    let fg = '#E2E8F0'; // Default bone
    if (this.isHurt) fg = '#FFFFFF';
    else if (this.type === 'shadow_stalker') fg = '#F43F5E';
    else if (this.type === 'armored_brute') fg = '#94A3B8';
    else if (this.type === 'cultist_necromancer') fg = '#C084FC';
    else if (this.isBoss) fg = this.bossPhase === 2 ? '#EF4444' : '#F59E0B';

    // Telegraph mark `!` above enemy head
    if (this.isTelegraphing) {
      renderCell(ex, ey - 2, '!', '#EF4444');
      renderCell(ex - 1, ey - 2, '(', '#EF4444');
      renderCell(ex + 1, ey - 2, ')', '#EF4444');
    }

    if (this.type === 'skeleton_infantry') {
      renderCell(ex, ey - 1, 'o', '#F1F5F9');
      renderCell(ex - 1, ey, '/', fg);
      renderCell(ex, ey, '#', fg);
      renderCell(ex + 1, ey, '\\', fg);
      renderCell(ex, ey + 1, '^', fg);
    } else if (this.type === 'skeleton_archer') {
      renderCell(ex, ey - 1, 'o', '#F1F5F9');
      renderCell(ex - 1, ey, '(', fg);
      renderCell(ex, ey, '|', fg);
      renderCell(ex + 1, ey, '>', '#22C55E');
      renderCell(ex, ey + 1, '^', fg);
    } else if (this.type === 'shadow_stalker') {
      renderCell(ex - 1, ey, '>', '#E11D48');
      renderCell(ex, ey, '=', '#881337');
      renderCell(ex + 1, ey, '<', '#E11D48');
      renderCell(ex, ey + 1, 'm', '#881337');
    } else if (this.type === 'armored_brute') {
      // 2x2 Heavy
      renderCell(ex - 1, ey - 1, '[', fg);
      renderCell(ex, ey - 1, '#', '#F87171');
      renderCell(ex + 1, ey - 1, ']', fg);
      renderCell(ex - 1, ey, '{', fg);
      renderCell(ex, ey, 'B', fg);
      renderCell(ex + 1, ey, '}', fg);
      renderCell(ex - 1, ey + 1, '|', fg);
      renderCell(ex + 1, ey + 1, '|', fg);
    } else if (this.type === 'cultist_necromancer') {
      renderCell(ex, ey - 1, '*', '#A855F7');
      renderCell(ex - 1, ey, '<', fg);
      renderCell(ex, ey, '#', fg);
      renderCell(ex + 1, ey, '$', '#EAB308');
      renderCell(ex, ey + 1, 'v', fg);
    } else if (this.isBoss) {
      // The Tower Warden (Large imposing silhouette)
      renderCell(ex - 2, ey - 2, '<', fg);
      renderCell(ex - 1, ey - 2, '[', fg);
      renderCell(ex, ey - 2, 'W', '#EF4444');
      renderCell(ex + 1, ey - 2, ']', fg);
      renderCell(ex + 2, ey - 2, '>', fg);

      renderCell(ex - 2, ey - 1, '{', fg);
      renderCell(ex - 1, ey - 1, '#', fg);
      renderCell(ex, ey - 1, '8', '#EF4444');
      renderCell(ex + 1, ey - 1, '#', fg);
      renderCell(ex + 2, ey - 1, '}', fg);

      renderCell(ex - 1, ey, '|', fg);
      renderCell(ex, ey, 'H', fg);
      renderCell(ex + 1, ey, '|', fg);

      renderCell(ex - 1, ey + 1, '/', fg);
      renderCell(ex + 1, ey + 1, '\\', fg);
    }
  }
}
