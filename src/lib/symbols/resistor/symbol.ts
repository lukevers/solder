import type { SymbolDef } from '../types';

/**
 * Standard two-terminal resistor.
 *
 *   a ──┤/\/\/├── b
 *
 * 80 × 40 px. Pins on left (a) and right (b).
 */
export const SYM_RESISTOR: SymbolDef = {
  id: 'resistor/standard',
  name: 'Resistor',
  width: 80,
  height: 40,
  style: 'resistor',
  pins: [
    {
      id: 'a',
      number: 1,
      name: 'A',
      side: 'left',
      offset: '50%',
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'b',
      number: 2,
      name: 'B',
      side: 'right',
      offset: '50%',
      kind: 'passive',
      connectable: true,
      source: true,
    },
  ],
};
