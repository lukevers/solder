import type { SymbolDef } from '../../types';

/**
 * Polarised (electrolytic) capacitor.
 *
 *   pos ──┤ )── neg
 *
 * 60 × 40 px. Flat plate on left (`+`), curved on right (`−`). Polarity
 * matters for simulation.
 */
export const SYM_CAP_POLAR: SymbolDef = {
  id: 'capacitor/polar',
  name: 'Capacitor (polarised)',
  width: 60,
  height: 40,
  style: 'cap-polar',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: '+',
      side: 'left',
      offset: '50%',
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'neg',
      number: 2,
      name: '−',
      side: 'right',
      offset: '50%',
      kind: 'passive',
      connectable: true,
      source: true,
    },
  ],
};
