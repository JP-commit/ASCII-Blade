/**
 * Job Role (Class) Specifications & Skill Definitions for ASCIIBLADE
 */

export type ClassId = 'swordsman' | 'archer' | 'tank' | 'magician';

export interface SkillDef {
  id: string;
  name: string;
  key: 'Q' | 'E' | 'R';
  cooldownFrames: number; // In 60Hz ticks
  resourceCost: number;
  description: string;
  icon: string;
}

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;
  maxHp: number;
  resourceName: 'STAMINA' | 'FOCUS' | 'RAGE' | 'MANA';
  resourceMax: number;
  resourceRegen: number; // per frame
  moveSpeed: number;
  dashSpeed: number;
  dashCooldown: number;
  color: string;
  headGlyph: string;
  bodyGlyph: string;
  legGlyph: string;
  skills: [SkillDef, SkillDef, SkillDef];
}

export const CLASSES: Record<ClassId, ClassDef> = {
  swordsman: {
    id: 'swordsman',
    name: 'Swordsman',
    title: 'Blade Master',
    maxHp: 150,
    resourceName: 'STAMINA',
    resourceMax: 100,
    resourceRegen: 0.8,
    moveSpeed: 0.38,
    dashSpeed: 1.1,
    dashCooldown: 20,
    color: '#38BDF8', // Cyan / Steel
    headGlyph: '(o)',
    bodyGlyph: '/[#]\\',
    legGlyph: '/ \\',
    skills: [
      {
        id: 'dash_strike',
        name: 'Dash Strike',
        key: 'Q',
        cooldownFrames: 180, // 3s
        resourceCost: 25,
        description: 'Lunges forward with a devastating piercing slash.',
        icon: '>>',
      },
      {
        id: 'whirlwind',
        name: 'Whirlwind',
        key: 'E',
        cooldownFrames: 300, // 5s
        resourceCost: 40,
        description: 'Spins in a 360° circle, shredding nearby targets.',
        icon: '(@)',
      },
      {
        id: 'blade_tempest',
        name: 'Blade Tempest',
        key: 'R',
        cooldownFrames: 480, // 8s
        resourceCost: 50,
        description: 'Unleashes 3 flying energy slash waves in a cone.',
        icon: '///',
      },
    ],
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    title: 'Shadow Ranger',
    maxHp: 110,
    resourceName: 'FOCUS',
    resourceMax: 100,
    resourceRegen: 1.0,
    moveSpeed: 0.42,
    dashSpeed: 1.25,
    dashCooldown: 16,
    color: '#34D399', // Emerald
    headGlyph: '^o^',
    bodyGlyph: '<|#|>',
    legGlyph: ' /| ',
    skills: [
      {
        id: 'scatter_volley',
        name: 'Scatter Volley',
        key: 'Q',
        cooldownFrames: 180,
        resourceCost: 25,
        description: 'Fires 5 arrows in a 60° piercing fan spread.',
        icon: '<>>',
      },
      {
        id: 'evasive_vault',
        name: 'Evasive Vault',
        key: 'E',
        cooldownFrames: 240,
        resourceCost: 30,
        description: 'Flips backwards while laying a cluster of traps.',
        icon: '<--',
      },
      {
        id: 'arrow_rain',
        name: 'Rain of Arrows',
        key: 'R',
        cooldownFrames: 420,
        resourceCost: 50,
        description: 'Calls down a storm of glowing arrows on target area.',
        icon: 'vvv',
      },
    ],
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    title: 'Iron Bulwark',
    maxHp: 220,
    resourceName: 'RAGE',
    resourceMax: 100,
    resourceRegen: 0.4,
    moveSpeed: 0.32,
    dashSpeed: 0.85,
    dashCooldown: 28,
    color: '#F59E0B', // Amber / Gold
    headGlyph: '[O]',
    bodyGlyph: '{[#]}',
    legGlyph: '|=|',
    skills: [
      {
        id: 'shield_wall',
        name: 'Shield Wall',
        key: 'Q',
        cooldownFrames: 180,
        resourceCost: 20,
        description: 'Raises tower shield, absorbing 80% damage and reflecting projectiles.',
        icon: '[|]',
      },
      {
        id: 'ground_tremor',
        name: 'Ground Tremor',
        key: 'E',
        cooldownFrames: 300,
        resourceCost: 35,
        description: 'Leaps and smashes the earth, creating an expanding shockwave.',
        icon: '###',
      },
      {
        id: 'fortress_bastion',
        name: 'Fortress Bastion',
        key: 'R',
        cooldownFrames: 540,
        resourceCost: 50,
        description: 'Emits a blinding golden kinetic barrier and war-cry.',
        icon: '[*]',
      },
    ],
  },
  magician: {
    id: 'magician',
    name: 'Magician',
    title: 'Pyromancer & Elementalist',
    maxHp: 95,
    resourceName: 'MANA',
    resourceMax: 150,
    resourceRegen: 1.2,
    moveSpeed: 0.36,
    dashSpeed: 1.15,
    dashCooldown: 22,
    color: '#C084FC', // Arcane Purple
    headGlyph: '*o*',
    bodyGlyph: '~/|\\~',
    legGlyph: ' / \\ ',
    skills: [
      {
        id: 'flame_pillar',
        name: 'Flame Pillar',
        key: 'Q',
        cooldownFrames: 180,
        resourceCost: 35,
        description: 'Erupts a raging column of fire that burns in an area.',
        icon: '^^^',
      },
      {
        id: 'frost_nova',
        name: 'Frost Nova',
        key: 'E',
        cooldownFrames: 240,
        resourceCost: 40,
        description: 'Blasts a freezing shockwave that freezes nearby enemies.',
        icon: '***',
      },
      {
        id: 'blink_teleport',
        name: 'Blink Teleport',
        key: 'R',
        cooldownFrames: 360,
        resourceCost: 30,
        description: 'Instantly teleports in aim direction with a residual explosion.',
        icon: '<*>',
      },
    ],
  },
};
