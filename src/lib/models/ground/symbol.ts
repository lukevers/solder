import { CIRCUIT_LABEL } from '../../constants';
import type { SymbolDef } from '../types';

/**
 * Ground symbol.
 *
 * Acts as a global net label — all ground nodes map to SPICE net 0 regardless
 * of wiring. Place a GND symbol anywhere and wire it locally — no need to draw
 * a long wire back to a single ground.
 *
 *        gnd
 *         │
 *        ═══
 *         ═
 */
export const SYM_GROUND: SymbolDef = {
  id: 'ground/standard',
  name: 'Ground',
  width: 40,
  height: 36,
  style: 'ground',
  pins: [
    {
      id: 'gnd',
      number: 1,
      name: CIRCUIT_LABEL.ground,
      side: 'top',
      offset: '50%',
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};
