/**
 * Worker-safe symbol metadata registry.
 *
 * This module contains only static symbol definitions and lookup helpers. It
 * must stay free of React node renderers and store imports so it can be shared
 * by workers, store helpers, and renderer code without creating cycles.
 */

import { SYM_CAP_POLAR } from './cap-polar/symbol';
import { SYM_CAPACITOR } from './capacitor/symbol';
import {
  SYM_DIODE_1N34A,
  SYM_DIODE_1N270,
  SYM_DIODE_1N914,
  SYM_DIODE_1N4001,
  SYM_DIODE_1N4002,
} from './diode/symbol';
import { SYM_GROUND } from './ground/symbol';
import { SYM_JACK_IN, SYM_JACK_OUT } from './jack/symbol';
import {
  SYM_LM308_DIP8,
  SYM_LM741_DIP8,
  SYM_OPAMP_TRIANGLE,
} from './opamp/symbol';
import { SYM_POT } from './pot/symbol';
import { SYM_POWER } from './power/symbol';
import { SYM_RESISTOR } from './resistor/symbol';
import { SYM_BJT_NPN, SYM_BJT_PNP } from './transistors/bjt/symbol';
import { SYM_JFET_N, SYM_JFET_P } from './transistors/jfet/symbol';
import { SYM_MOSFET_N, SYM_MOSFET_P } from './transistors/mosfet/symbol';
import type { SymbolDef } from '../types';

/**
 * All known symbols, keyed by their library ID.
 *
 * Store helpers use this to inject `measured` dimensions before XYFlow
 * performs its first DOM measurement pass.
 */
export const SYMBOLS: Record<string, SymbolDef> = {
  [SYM_OPAMP_TRIANGLE.id]: SYM_OPAMP_TRIANGLE,
  [SYM_LM741_DIP8.id]: SYM_LM741_DIP8,
  [SYM_LM308_DIP8.id]: SYM_LM308_DIP8,
  [SYM_RESISTOR.id]: SYM_RESISTOR,
  [SYM_CAPACITOR.id]: SYM_CAPACITOR,
  [SYM_CAP_POLAR.id]: SYM_CAP_POLAR,
  [SYM_POT.id]: SYM_POT,
  [SYM_DIODE_1N914.id]: SYM_DIODE_1N914,
  [SYM_DIODE_1N4001.id]: SYM_DIODE_1N4001,
  [SYM_DIODE_1N4002.id]: SYM_DIODE_1N4002,
  [SYM_DIODE_1N270.id]: SYM_DIODE_1N270,
  [SYM_DIODE_1N34A.id]: SYM_DIODE_1N34A,
  [SYM_BJT_NPN.id]: SYM_BJT_NPN,
  [SYM_BJT_PNP.id]: SYM_BJT_PNP,
  [SYM_JFET_N.id]: SYM_JFET_N,
  [SYM_JFET_P.id]: SYM_JFET_P,
  [SYM_MOSFET_N.id]: SYM_MOSFET_N,
  [SYM_MOSFET_P.id]: SYM_MOSFET_P,
  [SYM_POWER.id]: SYM_POWER,
  [SYM_GROUND.id]: SYM_GROUND,
  [SYM_JACK_IN.id]: SYM_JACK_IN,
  [SYM_JACK_OUT.id]: SYM_JACK_OUT,
};

/**
 * Default symbol ID for each component family.
 *
 * The store uses this when a circuit JSON blob omits `data.symbol`, and the
 * inspector uses it to pick the right initial choice for a model.
 */
export const DEFAULT_SYMBOL = {
  opamp: {
    TL072: SYM_OPAMP_TRIANGLE.id,
    LM741: SYM_LM741_DIP8.id,
    LM308: SYM_LM308_DIP8.id,
  } as Record<string, string>,

  diode: {
    '1N914': SYM_DIODE_1N914.id,
    '1N4001': SYM_DIODE_1N4001.id,
    '1N4002': SYM_DIODE_1N4002.id,
    '1N270': SYM_DIODE_1N270.id,
    '1N34A': SYM_DIODE_1N34A.id,
  } as Record<string, string>,

  bjt: {
    NPN: SYM_BJT_NPN.id,
    PNP: SYM_BJT_PNP.id,
  } as Record<string, string>,

  jfet: {
    N: SYM_JFET_N.id,
    P: SYM_JFET_P.id,
  } as Record<string, string>,

  mosfet: {
    N: SYM_MOSFET_N.id,
    P: SYM_MOSFET_P.id,
  } as Record<string, string>,
} as const;

/**
 * Resolve a concrete symbol for an op-amp node.
 *
 * The fallback chain keeps older saved circuits working even if they omit a
 * symbol ID or point at one that no longer exists.
 */
export function resolveOpAmpSymbol(
  model: string,
  symbolId?: string,
): SymbolDef {
  const defaultId = DEFAULT_SYMBOL.opamp[model] ?? SYM_OPAMP_TRIANGLE.id;
  const id = symbolId ?? defaultId;

  return SYMBOLS[id] ?? SYMBOLS[defaultId] ?? SYM_OPAMP_TRIANGLE;
}
