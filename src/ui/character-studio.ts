import { ArmorMaterial, CharacterModel, MATERIALS } from '../entities/character-model';

export class CharacterStudio {
  model: CharacterModel;
  isOpen: boolean = false;

  selectedTab: string = 'Look';
  activeCategory: string = 'Chest';

  readonly runes: string[] = ['+', '^', '*', 'z', '~', '>', '/', 'x', 'v', '°', '§', '†'];
  readonly materialKeys: ArmorMaterial[] = [
    'steel',
    'moonsteel',
    'gold',
    'bronze',
    'bloodiron',
    'emberstone',
    'nightglass',
  ];

  constructor(model: CharacterModel) {
    this.model = model;
  }

  toggle() {
    this.isOpen = !this.isOpen;
  }

  setMaterial(mat: ArmorMaterial) {
    this.model.material = mat;
  }

  toggleSword() {
    this.model.hasFlamingSword = !this.model.hasFlamingSword;
  }

  toggleHalo() {
    this.model.hasHaloCrown = !this.model.hasHaloCrown;
  }

  render(
    viewCols: number,
    viewRows: number,
    renderCell: (x: number, y: number, char: string, fgColor: string, bgColor?: string) => void
  ) {
    if (!this.isOpen) return;

    // Draw Dark Semi-Transparent Studio Modal Backdrop
    const padX = 12;
    const padY = 3;
    const modalW = viewCols - padX * 2;
    const modalH = viewRows - padY * 2;

    // Background fill
    for (let r = 0; r < modalH; r++) {
      for (let c = 0; c < modalW; c++) {
        renderCell(padX + c, padY + r, ' ', '#1E293B', '#090D16');
      }
    }

    // Outer Border
    const borderCol = '#475569';
    for (let c = 0; c < modalW; c++) {
      renderCell(padX + c, padY, '=', borderCol, '#090D16');
      renderCell(padX + c, padY + modalH - 1, '=', borderCol, '#090D16');
    }
    for (let r = 0; r < modalH; r++) {
      renderCell(padX, padY + r, '|', borderCol, '#090D16');
      renderCell(padX + modalW - 1, padY + r, '|', borderCol, '#090D16');
    }

    // Top Header: CRAFT · Look
    const title = ' CRAFT · Look ';
    for (let i = 0; i < title.length; i++) {
      renderCell(padX + 2 + i, padY, title[i], '#F59E0B', '#090D16');
    }
    const closeBtn = '[ close: ESC / C ]';
    for (let i = 0; i < closeBtn.length; i++) {
      renderCell(padX + modalW - closeBtn.length - 2 + i, padY, closeBtn[i], '#94A3B8', '#090D16');
    }

    // Equipment Slots Sub-bar
    const tabs = ['Weapon', 'Helm', 'Shoulders', 'Chest', 'Gloves', 'Legs', 'Boots', 'Look'];
    let tabX = padX + 2;
    for (const t of tabs) {
      const isSel = t === this.selectedTab;
      const tabStr = `[${t}]`;
      const color = isSel ? '#38BDF8' : '#64748B';
      for (let i = 0; i < tabStr.length; i++) {
        renderCell(tabX + i, padY + 2, tabStr[i], color, '#090D16');
      }
      tabX += tabStr.length + 1;
    }

    // Runes Rack
    const runeLabel = 'Runes - socketed (click or key 1-7):';
    for (let i = 0; i < runeLabel.length; i++) {
      renderCell(padX + 2 + i, padY + 4, runeLabel[i], '#94A3B8', '#090D16');
    }
    let runeX = padX + runeLabel.length + 3;
    for (const r of this.runes) {
      renderCell(runeX, padY + 4, r, '#FDE047', '#1E293B');
      runeX += 2;
    }

    // Materials Bar
    const matLabel = 'Material of all the armour:';
    for (let i = 0; i < matLabel.length; i++) {
      renderCell(padX + 2 + i, padY + 6, matLabel[i], '#94A3B8', '#090D16');
    }

    let mX = padX + 2;
    for (const mKey of this.materialKeys) {
      const mat = MATERIALS[mKey];
      const isCur = this.model.material === mKey;
      const mStr = isCur ? `>* ${mat.name} *<` : `[ ${mat.name} ]`;
      const mCol = isCur ? '#F59E0B' : mat.metalColor;

      for (let i = 0; i < mStr.length; i++) {
        renderCell(mX + i, padY + 8, mStr[i], mCol, '#090D16');
      }
      mX += mStr.length + 1;
    }

    // Divider Line
    for (let c = 1; c < modalW - 1; c++) {
      renderCell(padX + c, padY + 10, '-', '#334155', '#090D16');
    }

    // Right Side: Enchantment & Stat Box
    const boxX = padX + modalW - 28;
    const boxY = padY + 12;
    const enchantLines = [
      '+------------------------+',
      '| Enchant slots:         |',
      `| Metal: ${MATERIALS[this.model.material].name.padEnd(16, ' ')}|`,
      '| Runes: 3 / 3 active    |',
      '| Blade: Flame Aura [ON] |',
      '| Halo : Sun Crown  [ON] |',
      '+------------------------+',
      '| +60% Phys Damage       |',
      '| +40% Fire Light Radiance|',
      '+------------------------+',
    ];
    for (let row = 0; row < enchantLines.length; row++) {
      const line = enchantLines[row];
      for (let col = 0; col < line.length; col++) {
        renderCell(boxX + col, boxY + row, line[col], '#94A3B8', '#090D16');
      }
    }

    // Controls Instruction
    const instruct = '[ 1-7 ]: Switch Material | [ F ]: Toggle Flaming Sword | [ H ]: Toggle Halo Crown';
    for (let i = 0; i < instruct.length; i++) {
      renderCell(padX + 2 + i, padY + modalH - 2, instruct[i], '#38BDF8', '#090D16');
    }

    // Render the Proportional 28-row ASCII Character in the Center of the Studio
    const charOriginX = padX + Math.floor((modalW - 28) / 2);
    const charOriginY = padY + 24;

    this.model.render(charOriginX, charOriginY, (x, y, char, fgColor) => {
      renderCell(x, y, char, fgColor, '#090D16');
    });
  }
}
