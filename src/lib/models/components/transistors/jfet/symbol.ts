import type { SymbolDef, SymbolPin } from '../../../types';

/**
 * Shared pin layout for JFET (junction field-effect transistor) variants.
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
 * N-channel JFET symbol.
 *
 * Commonly used in guitar pedal input buffers (e.g. J201, 2N5457).
 */
export const SYM_JFET_N: SymbolDef = {
  id: 'jfet/n',
  name: 'N-channel JFET',
  width: 60,
  height: 60,
  style: 'jfet',
  pins: _fetPins,
};

/**
 * P-channel JFET symbol.
 *
 * Less common in effects; used in some boutique designs and current sources.
 */
export const SYM_JFET_P: SymbolDef = {
  id: 'jfet/p',
  name: 'P-channel JFET',
  width: 60,
  height: 60,
  style: 'jfet',
  pins: _fetPins,
};
