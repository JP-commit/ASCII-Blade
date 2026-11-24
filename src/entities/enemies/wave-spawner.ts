import { AsciiMatrixWorld } from '../../renderer/ascii-matrix';
import { Enemy, EnemyType } from './enemy';

export interface WaveConfig {
  number: number;
  name: string;
  spawns: { type: EnemyType; count: number }[];
}

export class WaveSpawner {
  currentWave: number = 1;
  enemies: Enemy[] = [];
  waveActive: boolean = false;
  waveCooldownTimer: number = 60; // 1 second delay between waves
  isVictory: boolean = false;

  private waves: WaveConfig[] = [
    {
      number: 1,
      name: 'Wave 1: The Undead Swarm',
      spawns: [
        { type: 'skeleton_infantry', count: 4 },
        { type: 'shadow_stalker', count: 2 },
      ],
    },
    {
      number: 2,
      name: 'Wave 2: Ranged Infiltration',
      spawns: [
        { type: 'skeleton_infantry', count: 3 },
        { type: 'skeleton_archer', count: 3 },
        { type: 'armored_brute', count: 1 },
      ],
    },
    {
      number: 3,
      name: 'Wave 3: Necrotic Incursion',
      spawns: [
        { type: 'cultist_necromancer', count: 2 },
        { type: 'skeleton_infantry', count: 4 },
        { type: 'armored_brute', count: 2 },
      ],
    },
    {
      number: 4,
      name: 'Wave 4: THE TOWER WARDEN',
      spawns: [
        { type: 'tower_warden', count: 1 },
        { type: 'skeleton_archer', count: 2 },
      ],
    },
  ];

  startWave(waveNum: number, world: AsciiMatrixWorld) {
    const config = this.waves.find((w) => w.number === waveNum);
    if (!config) {
      this.isVictory = true;
      return;
    }

    this.currentWave = waveNum;
    this.waveActive = true;
    this.enemies = [];

    const centerX = Math.floor(world.width / 2);
    const centerY = Math.floor(world.height / 2);

    for (const group of config.spawns) {
      for (let i = 0; i < group.count; i++) {
        // Spawn along tower perimeter
        const angle = Math.random() * Math.PI * 2;
        const radius = group.type === 'tower_warden' ? 12 : 18 + Math.random() * 4;
        const spawnX = centerX + Math.cos(angle) * radius;
        const spawnY = centerY + Math.sin(angle) * (radius * 0.7);

        this.enemies.push(new Enemy(group.type, spawnX, spawnY));
      }
    }
  }

  spawnMinion(type: EnemyType, x: number, y: number) {
    this.enemies.push(new Enemy(type, x, y));
  }

  update(world: AsciiMatrixWorld) {
    if (this.isVictory) return;

    // Filter dead enemies
    const aliveCount = this.enemies.filter((e) => e.state !== 'dead').length;

    if (this.waveActive && aliveCount === 0) {
      this.waveActive = false;
      this.waveCooldownTimer = 180; // 3 second delay before next wave
    }

    if (!this.waveActive) {
      this.waveCooldownTimer--;
      if (this.waveCooldownTimer <= 0) {
        if (this.currentWave < this.waves.length) {
          this.startWave(this.currentWave + 1, world);
        } else {
          this.isVictory = true;
        }
      }
    }
  }

  getCurrentWaveName(): string {
    const config = this.waves.find((w) => w.number === this.currentWave);
    return config ? config.name : 'All Waves Cleared!';
  }

  getBoss(): Enemy | undefined {
    return this.enemies.find((e) => e.isBoss && e.state !== 'dead');
  }
}
