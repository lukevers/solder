// SPICE model library — public API.
//
// Re-exports all subcircuit definitions and .model
// statements so consumers can import from a single
// path (e.g. `from './spice-models'`).

export { LM308_SUBCKT, LM741_SUBCKT, TL072_SUBCKT } from './opamp';

export {
  BJT_2N3904,
  BJT_2N3906,
  BJT_2N5088,
  BJT_2N5089,
  BJT_AC128,
  BJT_BC108,
  BJT_BC549,
  BJT_MPSA18,
  JFET_2N5457,
  JFET_2N5458,
  JFET_2N5460,
  JFET_J113,
  JFET_J201,
  JFET_MPF102,
  MOSFET_2N7000,
  MOSFET_BS170,
  MOSFET_IRF510,
  MOSFET_IRF9510,
} from './transistors';
