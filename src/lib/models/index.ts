/**
 * Worker-safe component-model public API.
 *
 * This barrel intentionally exports only data definitions, symbol metadata,
 * and SPICE model builders that are safe to import from the simulation
 * workers.
 *
 * Do not export React node renderers or registry wiring from this file. The
 * netlist compiler is shared with the worker runtime, and importing UI modules
 * here would drag the Zustand store into the worker bundle.
 */

export type { NodeColor, NodeColorOption } from '../colors';
export type { NodeSize, NodeWidth } from '../sizes';
export { SYM_CAP_POLAR } from './components/cap-polar/symbol';
export { SYM_CAPACITOR } from './components/capacitor/symbol';
export type { CapacitorData } from './components/capacitor/types';
export {
  DIODE_1N34A,
  DIODE_1N270,
  DIODE_1N914,
  DIODE_1N4001,
  DIODE_1N4002,
} from './components/diode/model';
export {
  SYM_DIODE_1N34A,
  SYM_DIODE_1N270,
  SYM_DIODE_1N914,
  SYM_DIODE_1N4001,
  SYM_DIODE_1N4002,
} from './components/diode/symbol';
export type { DiodeData } from './components/diode/types';
export { SYM_GROUND } from './components/ground/symbol';
export type { GroundData } from './components/ground/types';
export {
  SYM_JACK_IN,
  SYM_JACK_OUT,
} from './components/jack/symbol';
export type { JackData } from './components/jack/types';
export type { JunctionData } from './components/junction/types';
export type { LabelData } from './components/label/types';
export {
  LM308_SUBCKT,
  LM741_SUBCKT,
  TL072_SUBCKT,
} from './components/opamp/model';
export {
  SYM_LM308_DIP8,
  SYM_LM741_DIP8,
  SYM_OPAMP_TRIANGLE,
} from './components/opamp/symbol';
export type { OpAmpData } from './components/opamp/types';
export { SYM_POT } from './components/pot/symbol';
export type { PotData, PotTaper } from './components/pot/types';
export { SYM_POWER } from './components/power/symbol';
export type { PowerData } from './components/power/types';
export { SYM_RESISTOR } from './components/resistor/symbol';
export type { ResistorData } from './components/resistor/types';
export {
  BJT_2N3904,
  BJT_2N3906,
  BJT_2N5088,
  BJT_2N5089,
  BJT_AC128,
  BJT_BC108,
  BJT_BC549,
  BJT_MPSA18,
} from './components/transistors/bjt/model';
export {
  SYM_BJT_NPN,
  SYM_BJT_PNP,
} from './components/transistors/bjt/symbol';
export type {
  BJTData,
  BJTModel as BJTModelName,
} from './components/transistors/bjt/types';
export {
  JFET_2N5457,
  JFET_2N5458,
  JFET_2N5460,
  JFET_J113,
  JFET_J201,
  JFET_MPF102,
} from './components/transistors/jfet/model';
export {
  SYM_JFET_N,
  SYM_JFET_P,
} from './components/transistors/jfet/symbol';
export type {
  JFETData,
  JFETModel as JFETModelName,
} from './components/transistors/jfet/types';
export {
  MOSFET_2N7000,
  MOSFET_BS170,
  MOSFET_IRF510,
  MOSFET_IRF9510,
} from './components/transistors/mosfet/model';
export {
  SYM_MOSFET_N,
  SYM_MOSFET_P,
} from './components/transistors/mosfet/symbol';
export type {
  MOSFETData,
  MOSFETModel as MOSFETModelName,
} from './components/transistors/mosfet/types';
export {
  SpiceCompactModel,
  type SpiceParamRecord,
  type SpiceParamValue,
  SpiceSubcircuit,
} from './spice';
export type {
  PinKind,
  PinSide,
  SymbolDef,
  SymbolPin,
  SymbolStyle,
} from './types';
export type { BoxData, BoxVariant } from './ui/box/types';
export type { StickyNoteData } from './ui/stickynote/types';
