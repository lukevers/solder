/**
 * Worker-safe component-model public API.
 *
 * This barrel intentionally exports only data
 * definitions, symbol metadata, and SPICE model
 * builders that are safe to import from the
 * simulation workers.
 *
 * Do not export React node renderers or registry
 * wiring from this file. The netlist compiler is
 * shared with the worker runtime, and importing
 * UI modules here would drag the Zustand store
 * into the worker bundle.
 */

export {
  BJT_2N3904,
  BJT_2N3906,
  BJT_2N5088,
  BJT_2N5089,
  BJT_AC128,
  BJT_BC108,
  BJT_BC549,
  BJT_MPSA18,
} from './bjt/model';
export { SYM_BJT_NPN, SYM_BJT_PNP } from './bjt/symbol';
export type { BJTData, BJTModel as BJTModelName } from './bjt/types';

export type { BoxData, BoxVariant } from './box/types';

export { SYM_CAP_POLAR } from './cap-polar/symbol';
export { SYM_CAPACITOR } from './capacitor/symbol';
export type { CapacitorData } from './capacitor/types';
export {
  DIODE_1N270,
  DIODE_1N914,
  DIODE_1N4001,
  DIODE_1N4002,
} from './diode/model';
export {
  SYM_DIODE_1N270,
  SYM_DIODE_1N914,
  SYM_DIODE_1N4001,
  SYM_DIODE_1N4002,
} from './diode/symbol';
export type { DiodeData } from './diode/types';
export { SYM_GROUND } from './ground/symbol';
export type { GroundData } from './ground/types';
export { SYM_JACK_IN, SYM_JACK_OUT } from './jack/symbol';
export type { JackData } from './jack/types';
export {
  JFET_2N5457,
  JFET_2N5458,
  JFET_2N5460,
  JFET_J113,
  JFET_J201,
  JFET_MPF102,
} from './jfet/model';
export { SYM_JFET_N, SYM_JFET_P } from './jfet/symbol';
export type { JFETData, JFETModel as JFETModelName } from './jfet/types';

export type { JunctionData } from './junction/types';

export type { LabelData } from './label/types';
export {
  MOSFET_2N7000,
  MOSFET_BS170,
  MOSFET_IRF510,
  MOSFET_IRF9510,
} from './mosfet/model';
export { SYM_MOSFET_N, SYM_MOSFET_P } from './mosfet/symbol';
export type {
  MOSFETData,
  MOSFETModel as MOSFETModelName,
} from './mosfet/types';
export { LM308_SUBCKT, LM741_SUBCKT, TL072_SUBCKT } from './opamp/model';
export {
  SYM_LM308_DIP8,
  SYM_LM741_DIP8,
  SYM_OPAMP_TRIANGLE,
} from './opamp/symbol';
export type { OpAmpData } from './opamp/types';
export { SYM_POT } from './pot/symbol';
export type { PotData, PotTaper } from './pot/types';
export { SYM_POWER } from './power/symbol';
export type { PowerData } from './power/types';
export { SYM_RESISTOR } from './resistor/symbol';
export type { ResistorData } from './resistor/types';

export {
  SpiceCompactModel,
  type SpiceParamRecord,
  type SpiceParamValue,
  SpiceSubcircuit,
} from './spice';

export type {
  StickyNoteColor,
  StickyNoteData,
  StickyNoteSize,
  StickyNoteWidth,
} from './stickynote/types';

export type {
  PinKind,
  PinSide,
  SymbolDef,
  SymbolPin,
  SymbolStyle,
} from './types';
