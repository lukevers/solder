/**
 * Available BJT transistor models.
 * Each maps to a .model statement in
 * spice-models/transistors.ts.
 */
export type BJTModel =
  | '2N3904'
  | '2N3906'
  | 'AC128'
  | '2N5088'
  | '2N5089'
  | 'BC108'
  | 'BC549'
  | 'MPSA18';

/**
 * Data payload for a BJT transistor node.
 * `polarity` determines NPN vs PNP schematic
 * symbol and SPICE model type.
 */
export type BJTData = {
  label: string;
  polarity: 'NPN' | 'PNP';
  model: BJTModel;
  symbol?: string;
};
