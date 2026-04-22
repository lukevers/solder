import type { SymbolDef, SymbolPin } from '../types';

/**
 * Shared pin layout for all diode variants.
 *
 *   a (anode) ──▷|── k (cathode)
 *
 * Anode on the left, cathode on the right.
 */
const _diodePins: Array<SymbolPin> = [
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
    id: 'k',
    number: 2,
    name: 'K',
    side: 'right',
    offset: '50%',
    kind: 'passive',
    connectable: true,
    source: true,
  },
];

/**
 * 1N914 — small-signal silicon switching diode.
 * Fast switching, low capacitance. Common in
 * soft-clipping circuits (e.g. Tube Screamer).
 */
export const SYM_DIODE_1N914: SymbolDef = {
  id: 'diode/1n914',
  name: '1N914',
  description: 'Small-signal switching diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

/**
 * 1N4001 — general-purpose silicon rectifier.
 * 50V reverse voltage. Used for power supply
 * protection and hard-clipping stages.
 */
export const SYM_DIODE_1N4001: SymbolDef = {
  id: 'diode/1n4001',
  name: '1N4001',
  description: 'General-purpose rectifier diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

/**
 * 1N4002 — 100V silicon rectifier.
 * Higher reverse voltage rating than the 1N4001.
 */
export const SYM_DIODE_1N4002: SymbolDef = {
  id: 'diode/1n4002',
  name: '1N4002',
  description: '100V rectifier diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

/**
 * 1N270 — germanium point-contact diode.
 * Lower forward voltage (~0.3V vs ~0.7V silicon).
 * Produces the softer, asymmetric clipping heard
 * in vintage fuzz and overdrive pedals.
 */
export const SYM_DIODE_1N270: SymbolDef = {
  id: 'diode/1n270',
  name: '1N270',
  description: 'Germanium point-contact diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};
