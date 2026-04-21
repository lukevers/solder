import type { SymbolDef, SymbolPin } from '../types';

/**
 * Shared pin layout for BJT (bipolar junction
 * transistor) variants.
 *
 *           ┌── c (collector)
 *   b ──────┤
 *           └── e (emitter)
 *
 * Base on the left, collector and emitter on
 * the right (top and bottom respectively).
 */
const _bjtPins: Array<SymbolPin> = [
  {
    id: 'b',
    number: 1,
    name: 'B',
    side: 'left',
    offset: '50%',
    kind: 'input',
    connectable: true,
  },
  {
    id: 'c',
    number: 2,
    name: 'C',
    side: 'right',
    offset: 10,
    kind: 'output',
    connectable: true,
    source: true,
  },
  {
    id: 'e',
    number: 3,
    name: 'E',
    side: 'right',
    offset: 50,
    kind: 'output',
    connectable: true,
    source: true,
  },
];

/**
 * NPN bipolar junction transistor symbol.
 * Arrow on emitter points outward.
 */
export const SYM_BJT_NPN: SymbolDef = {
  id: 'bjt/npn',
  name: 'NPN BJT',
  width: 60,
  height: 60,
  style: 'bjt',
  pins: _bjtPins,
};

/**
 * PNP bipolar junction transistor symbol.
 * Arrow on emitter points inward.
 */
export const SYM_BJT_PNP: SymbolDef = {
  id: 'bjt/pnp',
  name: 'PNP BJT',
  width: 60,
  height: 60,
  style: 'bjt',
  pins: _bjtPins,
};
