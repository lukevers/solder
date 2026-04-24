import type { SymbolDef } from '../types';

/**
 * Power rail flag (VCC / +V).
 *
 * Acts as a global net label — all power nodes
 * with the same label share the same SPICE net.
 * Only one voltage source is emitted regardless
 * of how many power symbols are placed.
 *
 *       ▲
 *       │
 *      pos
 */
export const SYM_POWER: SymbolDef = {
  id: 'power/vcc',
  name: 'Power (VCC)',
  width: 40,
  height: 48,
  style: 'power-flag',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: '+',
      side: 'bottom',
      offset: '50%',
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};
