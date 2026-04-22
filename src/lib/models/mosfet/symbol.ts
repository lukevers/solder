import type { SymbolDef, SymbolPin } from '../types';

/**
 * Shared pin layout for MOSFET (metal-oxide semiconductor field-effect
 * transistor) variants.
 *
 *           ┌── d (drain)
 *   g ──────┤
 *           └── s (source)
 *
 * Gate on the left, drain and source on the right (top and bottom
 * respectively).
 */
const _fetPins: Array<SymbolPin> = [
  {
    id: 'g',
    number: 1,
    name: 'G',
    side: 'left',
    offset: '50%',
    kind: 'input',
    connectable: true,
  },
  {
    id: 'd',
    number: 2,
    name: 'D',
    side: 'right',
    offset: 10,
    kind: 'output',
    connectable: true,
    source: true,
  },
  {
    id: 's',
    number: 3,
    name: 'S',
    side: 'right',
    offset: 50,
    kind: 'output',
    connectable: true,
    source: true,
  },
];

/**
 * N-channel MOSFET symbol.
 *
 * Used in switching and some distortion circuits (e.g. BS170).
 */
export const SYM_MOSFET_N: SymbolDef = {
  id: 'mosfet/n',
  name: 'N-channel MOSFET',
  width: 60,
  height: 60,
  style: 'mosfet',
  pins: _fetPins,
};

/**
 * P-channel MOSFET symbol.
 *
 * Used for high-side switching and complementary output stages (e.g. IRF9510).
 */
export const SYM_MOSFET_P: SymbolDef = {
  id: 'mosfet/p',
  name: 'P-channel MOSFET',
  width: 60,
  height: 60,
  style: 'mosfet',
  pins: _fetPins,
};
