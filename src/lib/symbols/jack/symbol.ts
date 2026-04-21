import type { SymbolDef } from '../types';

/**
 * Audio input jack (mono).
 *
 * Signal enters the circuit through this jack.
 * The netlist compiler creates a voltage source
 * (Vin) between pos and neg.
 *
 *   ┌──────┐
 *   │ IN   ├── pos (signal)
 *   │      ├── neg (ground)
 *   └──────┘
 */
export const SYM_JACK_IN: SymbolDef = {
  id: 'jack/in',
  name: 'Audio In',
  width: 80,
  height: 60,
  style: 'jack',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: 'Sig',
      side: 'right',
      offset: 20,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'neg',
      number: 2,
      name: 'GND',
      side: 'right',
      offset: 44,
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};

/**
 * Audio output jack (mono).
 *
 * Signal leaves the circuit through this jack.
 * The netlist compiler measures voltage between
 * pos and neg to produce the output buffer.
 *
 *                  ┌──────┐
 *   pos (signal) ──┤      │
 *   neg (ground) ──┤ OUT  │
 *                  └──────┘
 */
export const SYM_JACK_OUT: SymbolDef = {
  id: 'jack/out',
  name: 'Audio Out',
  width: 80,
  height: 60,
  style: 'jack',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: 'Sig',
      side: 'left',
      offset: 20,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'neg',
      number: 2,
      name: 'GND',
      side: 'left',
      offset: 44,
      kind: 'power',
      connectable: true,
    },
  ],
};
