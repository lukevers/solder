import type { SymbolDef } from '../types';

/**
 * Standard non-polarised capacitor.
 *
 *   a ──┤ ├── b
 *
 * 60 × 40 px. Pins on left (a) and right (b).
 */
export const SYM_CAPACITOR: SymbolDef = {
  id: 'capacitor/standard',
  name: 'Capacitor',
  width: 60,
  height: 40,
  style: 'capacitor',
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
