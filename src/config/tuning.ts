/**
 * Central Game Tuning Configuration for ASCIIBLADE
 * All gameplay, balance, physics, and feel values are centralized here.
 */

export const TUNING = {
  // Engine & Display
  GRID_COLS: 160,
  GRID_ROWS: 45,
  CELL_WIDTH: 10,
  CELL_HEIGHT: 18,
  TARGET_FPS: 60,
  TIME_STEP_MS: 1000 / 60, // 16.666 ms fixed timestep

  // Physics
  GRAVITY: 0.38,
  TERMINAL_VELOCITY: 6.0,
  FRICTION: 0.78,
  AIR_RESISTANCE: 0.92,

  // Input Buffering
  INPUT_BUFFER_FRAMES: 10, // Frames an input remains queued

  // Player Base Physics & Movement
  PLAYER: {
    MOVE_SPEED: 0.65,
    ACCELERATION: 0.22,
    JUMP_FORCE: -3.8,
    AIR_JUMP_FORCE: -3.2,
    DODGE_SPEED: 1.5,
    DODGE_DURATION_FRAMES: 16,
    DODGE_IFRAMES: 12,
    DODGE_COOLDOWN_FRAMES: 22,
    PARRY_WINDOW_FRAMES: 6, // Active parry frames on block start
    BLOCK_DAMAGE_REDUCTION: 0.70, // 70% damage reduction on standard block
    INTERACT_RADIUS: 4.0,
  },

  // Game Feel (Hit-stop, Shake, Freeze)
  FEEL: {
    LIGHT_HIT_STOP_FRAMES: 3,
    HEAVY_HIT_STOP_FRAMES: 5,
    PARRY_HIT_STOP_FRAMES: 7,
    LIGHT_SCREEN_SHAKE: 1.2,
    HEAVY_SCREEN_SHAKE: 2.8,
    CRIT_SCREEN_SHAKE: 4.0,
    SHAKE_DECAY: 0.85,
    HIT_FLASH_FRAMES: 2,
    COMBO_DECAY_FRAMES: 150, // 2.5 seconds to maintain combo
    FLOATING_TEXT_DURATION_FRAMES: 36,
  },

  // Combat Multipliers
  COMBAT: {
    COMBO_STAGE_1_DAMAGE_MULT: 1.0,
    COMBO_STAGE_2_DAMAGE_MULT: 1.25,
    COMBO_STAGE_3_FINISHER_MULT: 1.75,
    HEAVY_CHARGE_MIN_FRAMES: 20,
    HEAVY_CHARGE_MAX_FRAMES: 60,
    HEAVY_DAMAGE_MIN_MULT: 1.8,
    HEAVY_DAMAGE_MAX_MULT: 3.2,
    BACKSTAB_DAMAGE_MULT: 2.0,
    CRITICAL_BASE_MULT: 2.0,
    KNOCKBACK_LIGHT: 0.8,
    KNOCKBACK_HEAVY: 2.4,
    KNOCKBACK_FINISHER: 2.0,
  },

  // Class Stats & Special Meters
  CLASSES: {
    knight: {
      name: 'Knight',
      maxHp: 120,
      staminaMax: 100,
      staminaRegen: 1.2,
      blockCost: 15,
      favoriteWeapon: 'sword',
      bonusDamagePercent: 15,
      description: 'Sword and shield guardian. Can block and parry attacks.',
    },
    rogue: {
      name: 'Rogue',
      maxHp: 85,
      energyMax: 100,
      energyRegen: 2.5,
      dodgeCost: 20,
      favoriteWeapon: 'dagger',
      bonusDamagePercent: 20,
      description: 'Agile assassin. Dash-through, poison, and massive backstab crits.',
    },
    berserker: {
      name: 'Berserker',
      maxHp: 150,
      rageMax: 100,
      rageDecayRate: 0.4,
      ragePerHitTaken: 12,
      ragePerHitDealt: 8,
      favoriteWeapon: 'greataxe',
      bonusDamagePercent: 15,
      description: 'Unstoppable brawler. Takes and deals damage to fuel devastating rage.',
    },
    pyromancer: {
      name: 'Pyromancer',
      maxHp: 80,
      manaMax: 100,
      manaRegen: 1.0,
      spellCost: 25,
      favoriteWeapon: 'staff',
      bonusDamagePercent: 20,
      description: 'Arcane elementalist. Casts scorching fireballs and flame pillars.',
    },
  },

  // Loot & Economy
  DROPS: {
    GOLD_DROP_CHANCE: 0.65,
    POTION_DROP_CHANCE: 0.12,
    WEAPON_DROP_CHANCE: 0.18,
    RELIC_DROP_CHANCE: 0.08,
    RARITY_WEIGHTS: {
      common: 60,
      rare: 28,
      epic: 10,
      legendary: 2,
    },
  },

  // Dungeon Generation
  DUNGEON: {
    MIN_ROOMS_PER_FLOOR: 8,
    MAX_ROOMS_PER_FLOOR: 14,
    ROOM_WIDTH_CELLS: 40,
    ROOM_HEIGHT_CELLS: 25,
    WAVE_BUDGET_BASE: 100,
    WAVE_BUDGET_PER_FLOOR: 35,
  },

  // Audio Tuning
  AUDIO: {
    DEFAULT_MASTER_VOLUME: 0.7,
    DEFAULT_MUSIC_VOLUME: 0.5,
    DEFAULT_SFX_VOLUME: 0.8,
  },
} as const;

export type TuningType = typeof TUNING;
