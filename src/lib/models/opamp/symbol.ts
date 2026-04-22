/**
 * Op-amp schematic symbols.
 *
 * Each constant defines a complete SymbolDef for
 * one package or body variant, such as the generic
 * triangle symbol or a DIP-8 package.
 */

import type { SymbolDef } from '../types';

/**
 * Standard triangular op-amp symbol.
 *
 * Pin layout (80 × 80 px):
 *
 *             ┌─── vcc (top, centre)
 *             │
 *   in_pos ──►│╲
 *             │  ╲
 *             │   ╲──── out (right, centre)
 *             │   ╱
 *   in_neg ──►│╱
 *             │
 *             └─── gnd (bottom, centre)
 *
 * Used by TL072 and as the default fallback for
 * any op-amp model without a specific DIP symbol.
 */
export const SYM_OPAMP_TRIANGLE: SymbolDef = {
  id: 'opamp/triangle',
  name: 'Op-amp (triangle)',
  description: 'Standard schematic triangle. Power pins on top/bottom edges.',
  width: 80,
  height: 80,
  style: 'opamp-triangle',
  pins: [
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 20,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 60,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'top',
      offset: '50%',
      kind: 'power',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'bottom',
      offset: '50%',
      kind: 'power',
      connectable: true,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: '50%',
      kind: 'output',
      connectable: true,
      source: true,
    },
  ],
};

/**
 * LM741 in a DIP-8 package.
 *
 * General-purpose single op-amp. Pins 1 (Null−),
 * 5 (Null+), and 8 (NC) are decorative and not
 * connectable.
 *
 * DIP-8 pinout:
 *
 *   1 Null−  ┌──U──┐  8 NC
 *   2 IN−    │     │  7 V+
 *   3 IN+    │     │  6 OUT
 *   4 V−     └─────┘  5 Null+
 */
export const SYM_LM741_DIP8: SymbolDef = {
  id: 'opamp/lm741-dip8',
  name: 'LM741 (DIP-8)',
  description: 'General-purpose single op-amp. Pins 1, 5, 8 are decorative.',
  width: 96,
  height: 80,
  style: 'dip',
  pins: [
    {
      id: 'null_neg',
      number: 1,
      name: 'Null−',
      side: 'left',
      offset: 10,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 30,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 50,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'left',
      offset: 70,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'null_pos',
      number: 5,
      name: 'Null+',
      side: 'right',
      offset: 70,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: 50,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'right',
      offset: 30,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'nc8',
      number: 8,
      name: 'NC',
      side: 'right',
      offset: 10,
      kind: 'nc',
      connectable: false,
    },
  ],
};

/**
 * LM308 in a DIP-8 package.
 *
 * Precision slow op-amp. Pins 1 (Null−) and
 * 8 (Comp) are connectable — wire a 47 pF cap
 * between them for the classic RAT frequency-
 * compensation network.
 *
 * DIP-8 pinout:
 *
 *   1 Null−  ┌──U──┐  8 Comp
 *   2 IN−    │     │  7 V+
 *   3 IN+    │     │  6 OUT
 *   4 V−     └─────┘  5 Null+
 */
export const SYM_LM308_DIP8: SymbolDef = {
  id: 'opamp/lm308-dip8',
  name: 'LM308 (DIP-8)',
  description:
    'Precision slow op-amp. Pins 1 & 8 are connectable: wire a 47 pF cap between them for the classic RAT frequency-compensation network.',
  width: 96,
  height: 80,
  style: 'dip',
  pins: [
    {
      id: 'null_neg',
      number: 1,
      name: 'Null−',
      side: 'left',
      offset: 10,
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 30,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 50,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'left',
      offset: 70,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'null_pos',
      number: 5,
      name: 'Null+',
      side: 'right',
      offset: 70,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: 50,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'right',
      offset: 30,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'comp',
      number: 8,
      name: 'Comp',
      side: 'right',
      offset: 10,
      kind: 'passive',
      connectable: true,
    },
  ],
};
