import type { SymbolDef } from '../types';

/**
 * Three-terminal potentiometer.
 *
 *   ccw ──┤pot├── cw
 *           │
 *          wiper
 *
 * 80 × 60 px. CCW on left, CW on right, wiper on
 * bottom. The netlist compiler splits this into two
 * resistors controlled by the pot's position value.
 */
export const SYM_POT: SymbolDef = {
  id: 'pot/standard',
  name: 'Potentiometer',
  width: 80,
  height: 60,
  style: 'pot',
  pins: [
    {
      id: 'ccw',
      number: 1,
      name: 'CCW',
      side: 'left',
      offset: 20,
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'cw',
      number: 3,
      name: 'CW',
      side: 'right',
      offset: 20,
      kind: 'passive',
      connectable: true,
      source: true,
    },
    {
      id: 'wiper',
      number: 2,
      name: 'Wiper',
      side: 'bottom',
      offset: '50%',
      kind: 'output',
      connectable: true,
      source: true,
    },
  ],
};
