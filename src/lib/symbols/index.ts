// Symbol library — public API.
//
// Re-exports all symbol types, definitions, node
// renderers, the registry (SYMBOLS), default
// mappings, resolution helpers, and the XYFlow
// nodeTypes map.

// ── Shared types ────────────────────────────────────────

export type {
  PinKind,
  PinSide,
  SymbolDef,
  SymbolPin,
  SymbolStyle,
} from './types';

// ── Shared node rendering utilities ─────────────────────

export {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from './node-shell';

// ── Per-domain re-exports ───────────────────────────────

export type { BJTData, BJTModel } from './bjt';
export { BJTNode, SYM_BJT_NPN, SYM_BJT_PNP } from './bjt';
export type { BoxData, BoxVariant } from './box';
export { BoxNode } from './box';

export { CapPolarNode, SYM_CAP_POLAR } from './cap-polar';
export type { CapacitorData } from './capacitor';
export { CapacitorNode, SYM_CAPACITOR } from './capacitor';
export type { DiodeData } from './diode';
export {
  DiodeNode,
  SYM_DIODE_1N270,
  SYM_DIODE_1N914,
  SYM_DIODE_1N4001,
  SYM_DIODE_1N4002,
} from './diode';
export type { GroundData } from './ground';
export { GroundNode, SYM_GROUND } from './ground';
export type { JackData } from './jack';
export { JackNode, SYM_JACK_IN, SYM_JACK_OUT } from './jack';
export type { JFETData, JFETModel } from './jfet';
export { JFETNode, SYM_JFET_N, SYM_JFET_P } from './jfet';
export type { JunctionData } from './junction';
export { JunctionNode } from './junction';
export type { LabelData } from './label';
export { LabelNode } from './label';
export type { MOSFETData, MOSFETModel } from './mosfet';
export { MOSFETNode, SYM_MOSFET_N, SYM_MOSFET_P } from './mosfet';
export type { OpAmpData } from './opamp';
export {
  OpAmpNode,
  SYM_LM308_DIP8,
  SYM_LM741_DIP8,
  SYM_OPAMP_TRIANGLE,
} from './opamp';
export type { PotData, PotTaper } from './pot';
export { PotNode, SYM_POT } from './pot';
export type { PowerData } from './power';
export { PowerNode, SYM_POWER } from './power';
export type { ResistorData } from './resistor';
export { ResistorNode, SYM_RESISTOR } from './resistor';
export type {
  StickyNoteColor,
  StickyNoteData,
  StickyNoteSize,
  StickyNoteWidth,
} from './stickynote';
export { STICKY_COLORS, StickyNoteNode } from './stickynote';

// ── Imports for registry assembly ───────────────────────

import { BJTNode, SYM_BJT_NPN, SYM_BJT_PNP } from './bjt';
import { BoxNode } from './box';
import { CapPolarNode, SYM_CAP_POLAR } from './cap-polar';
import { CapacitorNode, SYM_CAPACITOR } from './capacitor';
import {
  DiodeNode,
  SYM_DIODE_1N270,
  SYM_DIODE_1N914,
  SYM_DIODE_1N4001,
  SYM_DIODE_1N4002,
} from './diode';
import { GroundNode, SYM_GROUND } from './ground';
import { JackNode, SYM_JACK_IN, SYM_JACK_OUT } from './jack';
import { JFETNode, SYM_JFET_N, SYM_JFET_P } from './jfet';
import { JunctionNode } from './junction';
import { LabelNode } from './label';
import { MOSFETNode, SYM_MOSFET_N, SYM_MOSFET_P } from './mosfet';
import {
  OpAmpNode,
  SYM_LM308_DIP8,
  SYM_LM741_DIP8,
  SYM_OPAMP_TRIANGLE,
} from './opamp';
import { PotNode, SYM_POT } from './pot';
import { PowerNode, SYM_POWER } from './power';
import { ResistorNode, SYM_RESISTOR } from './resistor';
import { StickyNoteNode } from './stickynote';
import type { SymbolDef } from './types';

// ── Library registry ────────────────────────────────────

/**
 * All known symbols, keyed by their library ID.
 *
 * Used by the store's `ensureMeasured()` to look up
 * bounding-box dimensions, and by the inspector to
 * list available symbol variants for a component.
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

// ── Default symbol resolution ───────────────────────────

/**
 * Default symbol ID for each component type + model.
 *
 * Used when a node's `data.symbol` field is absent.
 * The store's `ensureMeasured()` and the inspector
 * both consult this table to resolve the right
 * symbol for a given component model.
 *
 *   component type → model name → symbol ID
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
 * Resolve a SymbolDef for an op-amp node.
 *
 * Falls back through:
 *   data.symbol → model default → triangle
 *
 * This ensures every op-amp always has a valid
 * symbol, even if the stored symbol ID no longer
 * exists in the library (e.g. after a symbol was
 * renamed or removed).
 */
export function resolveOpAmpSymbol(
  model: string,
  symbolId?: string,
): SymbolDef {
  const defaultId = DEFAULT_SYMBOL.opamp[model] ?? SYM_OPAMP_TRIANGLE.id;
  const id = symbolId ?? defaultId;

  return SYMBOLS[id] ?? SYMBOLS[defaultId] ?? SYM_OPAMP_TRIANGLE;
}

// ── XYFlow node types map ───────────────────────────────

/**
 * Maps each circuit node type string to its React
 * component. Passed directly to XYFlow's
 * `<ReactFlow nodeTypes={nodeTypes} />`.
 */
export const nodeTypes = {
  bjt: BJTNode,
  jfet: JFETNode,
  mosfet: MOSFETNode,
  resistor: ResistorNode,
  capacitor: CapacitorNode,
  cap_polar: CapPolarNode,
  opamp: OpAmpNode,
  power: PowerNode,
  ground: GroundNode,
  jack: JackNode,
  junction: JunctionNode,
  diode: DiodeNode,
  pot: PotNode,
  label: LabelNode,
  stickynote: StickyNoteNode,
  box: BoxNode,
};
