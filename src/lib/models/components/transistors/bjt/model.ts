import { SpiceCompactModel, type SpiceParamValue } from '../../../spice';

/**
 * SPICE `.model` cards for BJT parts used by the BJT symbol domain.
 *
 * Each exported constant below is a typed model object. The netlist compiler
 * converts it to a SPICE line through `toString()`.
 *
 * @see https://nmg.gitlab.io/ngspice-manual/circuitdescription/modeldevicemodels.html
 * @see https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 */

/**
 * SPICE BJT parameter tokens expressed as descriptive local constant names.
 *
 * The generated model string still uses the short ngspice abbreviations. These
 * constants just make the source easier to read and maintain.
 *
 * @see https://nmg.gitlab.io/ngspice-manual/bjts/bjtmodels_npn_pnp/gummel-poonbjtparameters_incl_modelextensions.html
 */
export const IS_SATURATION_CURRENT = 'IS' as const;
export const ISE_BASE_EMITTER_LEAKAGE_CURRENT = 'ISE' as const;
export const ISC_BASE_COLLECTOR_LEAKAGE_CURRENT = 'ISC' as const;
export const NF_FORWARD_EMISSION_COEFFICIENT = 'NF' as const;
export const NE_LEAKAGE_EMISSION_COEFFICIENT = 'NE' as const;
export const NR_REVERSE_EMISSION_COEFFICIENT = 'NR' as const;
export const NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT = 'NC' as const;
export const BF_FORWARD_BETA = 'BF' as const;
export const BR_REVERSE_BETA = 'BR' as const;
export const IKF_FORWARD_BETA_ROLLOFF_CORNER = 'IKF' as const;
export const IKR_REVERSE_BETA_ROLLOFF_CORNER = 'IKR' as const;
export const VAF_FORWARD_EARLY_VOLTAGE = 'VAF' as const;
export const VAR_REVERSE_EARLY_VOLTAGE = 'VAR' as const;
export const RB_BASE_SERIES_RESISTANCE = 'RB' as const;
export const RC_COLLECTOR_SERIES_RESISTANCE = 'RC' as const;
export const RE_EMITTER_SERIES_RESISTANCE = 'RE' as const;
export const CJE_BASE_EMITTER_JUNCTION_CAPACITANCE = 'CJE' as const;
export const CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE = 'CJC' as const;
export const VJE_BASE_EMITTER_BUILT_IN_POTENTIAL = 'VJE' as const;
export const VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL = 'VJC' as const;
export const MJE_BASE_EMITTER_GRADING_COEFFICIENT = 'MJE' as const;
export const MJC_BASE_COLLECTOR_GRADING_COEFFICIENT = 'MJC' as const;
export const TF_FORWARD_TRANSIT_TIME = 'TF' as const;
export const TR_REVERSE_TRANSIT_TIME = 'TR' as const;
export const FC_FORWARD_BIAS_DEPLETION_COEFFICIENT = 'FC' as const;
export const XTF_EXTRA_FORWARD_TRANSIT_SHAPING = 'XTF' as const;
export const VTF_TRANSIT_SHAPING_VOLTAGE = 'VTF' as const;
export const ITF_TRANSIT_SHAPING_CURRENT = 'ITF' as const;
export const XCJC_BASE_COLLECTOR_CAPACITANCE_PARTITION = 'XCJC' as const;
export const XTB_BETA_TEMPERATURE_EXPONENT = 'XTB' as const;
export const EG_BAND_GAP_ENERGY = 'EG' as const;
export const XTI_SATURATION_CURRENT_TEMPERATURE_EXPONENT = 'XTI' as const;

/**
 * Parameter bag for the BJT compact models in this file.
 *
 * Each computed property name is keyed by one of the token constants above so
 * the TypeScript source maps directly to the emitted SPICE field.
 *
 * @see https://nmg.gitlab.io/ngspice-manual/bjts/bjtmodels_npn_pnp/gummel-poonbjtparameters_incl_modelextensions.html
 */
export interface BJTModelParams {
  /**
   * Transport saturation current for the main transistor conduction path.
   */
  [IS_SATURATION_CURRENT]?: SpiceParamValue;

  /**
   * Base-emitter leakage or recombination current used to shape low-current
   * behavior.
   */
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]?: SpiceParamValue;

  /**
   * Base-collector leakage or recombination current.
   */
  [ISC_BASE_COLLECTOR_LEAKAGE_CURRENT]?: SpiceParamValue;

  /**
   * Forward emission coefficient for the main transport current.
   */
  [NF_FORWARD_EMISSION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Forward leakage-path emission coefficient
   */
  [NE_LEAKAGE_EMISSION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Reverse emission coefficient for the main transport path.
   */
  [NR_REVERSE_EMISSION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Reverse leakage-path emission coefficient on the base-collector side.
   */
  [NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Forward beta, also called normal hFE.
   *
   * This is the primary current-gain value in normal active operation.
   */
  [BF_FORWARD_BETA]?: SpiceParamValue;

  /**
   * Reverse beta when the transistor is operated in the reverse direction.
   */
  [BR_REVERSE_BETA]?: SpiceParamValue;

  /**
   * Forward high-current beta-rolloff corner.
   *
   * Above this region, the transistor's effective beta begins to fall off.
   */
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]?: SpiceParamValue;

  /**
   * Reverse high-current beta-rolloff corner.
   *
   * This is the reverse-operation counterpart to `IKF`.
   */
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]?: SpiceParamValue;

  /**
   * Forward Early voltage.
   *
   * This helps set the transistor's output resistance in forward operation.
   */
  [VAF_FORWARD_EARLY_VOLTAGE]?: SpiceParamValue;

  /**
   * Reverse Early voltage.
   *
   * This is the reverse-operation counterpart to `VAF`.
   */
  [VAR_REVERSE_EARLY_VOLTAGE]?: SpiceParamValue;

  /**
   * Base series resistance.
   *
   * This adds ohmic resistance in series with the external base terminal.
   */
  [RB_BASE_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Collector series resistance.
   *
   * This adds ohmic resistance in series with the external collector terminal.
   */
  [RC_COLLECTOR_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Emitter series resistance.
   *
   * This adds ohmic resistance in series with the external emitter terminal.
   */
  [RE_EMITTER_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Base-emitter junction capacitance.
   */
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]?: SpiceParamValue;

  /**
   * Base-collector junction capacitance.
   */
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]?: SpiceParamValue;

  /**
   * Built-in potential for the base-emitter junction.
   */
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]?: SpiceParamValue;

  /**
   * Built-in potential for the base-collector junction.
   */
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]?: SpiceParamValue;

  /**
   * Grading coefficient for the base-emitter junction capacitance curve.
   */
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]?: SpiceParamValue;

  /**
   * Grading coefficient for the base-collector junction capacitance curve.
   */
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]?: SpiceParamValue;

  /**
   * Forward transit time.
   *
   * This shapes stored charge and high-frequency behavior in forward operation.
   */
  [TF_FORWARD_TRANSIT_TIME]?: SpiceParamValue;

  /**
   * Reverse transit time.
   *
   * This is the reverse-operation counterpart used for stored-charge behavior.
   */
  [TR_REVERSE_TRANSIT_TIME]?: SpiceParamValue;

  /**
   * Forward-bias depletion-capacitance coefficient.
   */
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Extra forward-transit shaping factor.
   *
   * Some BJT cards use this to tune high-current or high-frequency transit
   * behavior more closely.
   */
  [XTF_EXTRA_FORWARD_TRANSIT_SHAPING]?: SpiceParamValue;

  /**
   * Transit-time shaping voltage.
   *
   * This works with `XTF` and `ITF` to modulate the transit-time correction.
   */
  [VTF_TRANSIT_SHAPING_VOLTAGE]?: SpiceParamValue;

  /**
   * Transit-time shaping current.
   *
   * This works with `XTF` and `VTF` to modulate the transit-time correction.
   */
  [ITF_TRANSIT_SHAPING_CURRENT]?: SpiceParamValue;

  /**
   * Base-collector capacitance partition or excess-phase shaping term.
   */
  [XCJC_BASE_COLLECTOR_CAPACITANCE_PARTITION]?: SpiceParamValue;

  /**
   * Beta temperature exponent.
   *
   * This controls how transistor gain changes with temperature.
   */
  [XTB_BETA_TEMPERATURE_EXPONENT]?: SpiceParamValue;

  /**
   * Semiconductor band-gap energy used in the temperature equations.
   */
  [EG_BAND_GAP_ENERGY]?: SpiceParamValue;

  /**
   * Saturation-current temperature exponent.
   *
   * This controls how strongly saturation current scales with temperature.
   */
  [XTI_SATURATION_CURRENT_TEMPERATURE_EXPONENT]?: SpiceParamValue;
}

/**
 * Stable parameter ordering for rendered BJT model cards.
 *
 * Keeping the order explicit makes the serialized `.model` lines deterministic
 * for tests and diffs, and makes the generated code easier to read and maintain.
 *
 * @see https://nmg.gitlab.io/ngspice-manual/bjts/bjtmodels_npn_pnp/gummel-poonbjtparameters_incl_modelextensions.html
 */
const BJT_PARAM_ORDER = [
  IS_SATURATION_CURRENT,
  ISE_BASE_EMITTER_LEAKAGE_CURRENT,
  ISC_BASE_COLLECTOR_LEAKAGE_CURRENT,
  NF_FORWARD_EMISSION_COEFFICIENT,
  NE_LEAKAGE_EMISSION_COEFFICIENT,
  NR_REVERSE_EMISSION_COEFFICIENT,
  NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT,
  BF_FORWARD_BETA,
  BR_REVERSE_BETA,
  IKF_FORWARD_BETA_ROLLOFF_CORNER,
  IKR_REVERSE_BETA_ROLLOFF_CORNER,
  VAF_FORWARD_EARLY_VOLTAGE,
  VAR_REVERSE_EARLY_VOLTAGE,
  RB_BASE_SERIES_RESISTANCE,
  RC_COLLECTOR_SERIES_RESISTANCE,
  RE_EMITTER_SERIES_RESISTANCE,
  CJE_BASE_EMITTER_JUNCTION_CAPACITANCE,
  CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE,
  VJE_BASE_EMITTER_BUILT_IN_POTENTIAL,
  VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL,
  MJE_BASE_EMITTER_GRADING_COEFFICIENT,
  MJC_BASE_COLLECTOR_GRADING_COEFFICIENT,
  TF_FORWARD_TRANSIT_TIME,
  TR_REVERSE_TRANSIT_TIME,
  FC_FORWARD_BIAS_DEPLETION_COEFFICIENT,
  XTF_EXTRA_FORWARD_TRANSIT_SHAPING,
  VTF_TRANSIT_SHAPING_VOLTAGE,
  ITF_TRANSIT_SHAPING_CURRENT,
  XCJC_BASE_COLLECTOR_CAPACITANCE_PARTITION,
  XTB_BETA_TEMPERATURE_EXPONENT,
  EG_BAND_GAP_ENERGY,
  XTI_SATURATION_CURRENT_TEMPERATURE_EXPONENT,
] as const;

/**
 * Typed BJT compact-model wrapper.
 *
 * Instances intentionally expose a mutable `params` bag so callers can tweak a
 * model and re-render it through the same serialization path.
 */
export class BJTModel extends SpiceCompactModel<BJTModelParams> {
  constructor(name: string, polarity: 'NPN' | 'PNP', params: BJTModelParams) {
    super(name, polarity, params, BJT_PARAM_ORDER);
  }
}

/**
 * 2N5088 NPN bipolar transistor.
 *
 * @see ./datasheets/2N5088_2N5089.pdf
 */
export const BJT_2N5088 = new BJTModel('2N5088', 'NPN', {
  [IS_SATURATION_CURRENT]: '5.911f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '5.911f',
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [BF_FORWARD_BETA]: 1122,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.394',
  [BR_REVERSE_BETA]: '1.271',
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '14.92m',
  [VAF_FORWARD_EARLY_VOLTAGE]: '62.37',
  [VAR_REVERSE_EARLY_VOLTAGE]: '21.5',
  [RC_COLLECTOR_SERIES_RESISTANCE]: '1.61',
  [RE_EMITTER_SERIES_RESISTANCE]: '0.15',
  [RB_BASE_SERIES_RESISTANCE]: 10,
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '4.973p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '4.017p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '0.65',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.65',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.4146',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.3174',
  [TF_FORWARD_TRANSIT_TIME]: '821.7p',
  [TR_REVERSE_TRANSIT_TIME]: '4.673n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '0.5',
});

/**
 * 2N5089 NPN bipolar transistor.
 *
 * @see ./datasheets/2N5088_2N5089.pdf
 */
export const BJT_2N5089 = new BJTModel('2N5089', 'NPN', {
  [IS_SATURATION_CURRENT]: '5.911f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '5.911f',
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [BF_FORWARD_BETA]: 1434,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.421',
  [BR_REVERSE_BETA]: '1.262',
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '15.4m',
  [VAF_FORWARD_EARLY_VOLTAGE]: '62.37',
  [VAR_REVERSE_EARLY_VOLTAGE]: '21.5',
  [RC_COLLECTOR_SERIES_RESISTANCE]: '1.61',
  [RE_EMITTER_SERIES_RESISTANCE]: '0.15',
  [RB_BASE_SERIES_RESISTANCE]: 10,
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '4.973p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '4.017p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '0.75',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.75',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.4146',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.3174',
  [TF_FORWARD_TRANSIT_TIME]: '822.3p',
  [TR_REVERSE_TRANSIT_TIME]: '4.671n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '0.5',
});

/**
 * BC108 NPN bipolar transistor.
 *
 * @see ./datasheets/BC107_BC108.pdf
 */
export const BJT_BC108 = new BJTModel('BC108', 'NPN', {
  [IS_SATURATION_CURRENT]: '1.8f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '50f',
  [NF_FORWARD_EMISSION_COEFFICIENT]: '0.9955',
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.46',
  [BF_FORWARD_BETA]: 400,
  [BR_REVERSE_BETA]: '35.5',
  [NR_REVERSE_EMISSION_COEFFICIENT]: '1.005',
  [NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT]: '1.27',
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '0.14',
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]: '0.03',
  [VAF_FORWARD_EARLY_VOLTAGE]: 80,
  [RB_BASE_SERIES_RESISTANCE]: '0.56',
  [RE_EMITTER_SERIES_RESISTANCE]: '0.6',
  [RC_COLLECTOR_SERIES_RESISTANCE]: '0.25',
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '13p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '4p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '0.65',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.54',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.55',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.33',
  [TF_FORWARD_TRANSIT_TIME]: '640p',
  [TR_REVERSE_TRANSIT_TIME]: '50.7n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '0.5',
});

/**
 * BC549 NPN bipolar transistor.
 *
 * @see ./datasheets/BC546_BC547_BC548_BC549_BC550.pdf
 */
export const BJT_BC549 = new BJTModel('BC549', 'NPN', {
  [IS_SATURATION_CURRENT]: '10f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '36f',
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.5',
  [BF_FORWARD_BETA]: 420,
  [BR_REVERSE_BETA]: 5,
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '0.1',
  [VAF_FORWARD_EARLY_VOLTAGE]: 50,
  [RB_BASE_SERIES_RESISTANCE]: 120,
  [RE_EMITTER_SERIES_RESISTANCE]: '0.5',
  [RC_COLLECTOR_SERIES_RESISTANCE]: '0.5',
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '10.85p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '4.75p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '0.65',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.65',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.36',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.36',
  [TF_FORWARD_TRANSIT_TIME]: '410p',
  [TR_REVERSE_TRANSIT_TIME]: '10n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '0.5',
});

/**
 * MPSA18 NPN bipolar transistor.
 *
 * @see ./datasheets/MPSA18.pdf
 */
export const BJT_MPSA18 = new BJTModel('MPSA18', 'NPN', {
  [IS_SATURATION_CURRENT]: '20.3f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '1.41p',
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: 2,
  [BF_FORWARD_BETA]: 1430,
  [BR_REVERSE_BETA]: 4,
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '0.12',
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]: '0.18',
  [VAF_FORWARD_EARLY_VOLTAGE]: 120,
  [VAR_REVERSE_EARLY_VOLTAGE]: 26,
  [RC_COLLECTOR_SERIES_RESISTANCE]: '0.186',
  [RE_EMITTER_SERIES_RESISTANCE]: '0.465',
  [RB_BASE_SERIES_RESISTANCE]: '1.86',
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '7.87p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '5.2p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '1.1',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.3',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.5',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.3',
  [TF_FORWARD_TRANSIT_TIME]: '353p',
  [TR_REVERSE_TRANSIT_TIME]: '245n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '0.5',
});

/**
 * 2N3904 NPN bipolar transistor.
 *
 * @see ./datasheets/2N3903_2N3904.pdf
 */
export const BJT_2N3904 = new BJTModel('2N3904', 'NPN', {
  [IS_SATURATION_CURRENT]: '6.734f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '6.734f',
  [ISC_BASE_COLLECTOR_LEAKAGE_CURRENT]: 0,
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.259',
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT]: 2,
  [BF_FORWARD_BETA]: '416.4',
  [BR_REVERSE_BETA]: '.7389',
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '66.78m',
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]: 0,
  [VAF_FORWARD_EARLY_VOLTAGE]: '74.03',
  [VAR_REVERSE_EARLY_VOLTAGE]: 28,
  [RB_BASE_SERIES_RESISTANCE]: 10,
  [RC_COLLECTOR_SERIES_RESISTANCE]: '.4295',
  [RE_EMITTER_SERIES_RESISTANCE]: '.2267',
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '3.638p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '4.082p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '.75',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '.75',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '.3085',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '.2196',
  [TF_FORWARD_TRANSIT_TIME]: '301.2p',
  [TR_REVERSE_TRANSIT_TIME]: '239.5p',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '.5',
  [XTF_EXTRA_FORWARD_TRANSIT_SHAPING]: 2,
  [VTF_TRANSIT_SHAPING_VOLTAGE]: 4,
  [ITF_TRANSIT_SHAPING_CURRENT]: '.4',
  [XCJC_BASE_COLLECTOR_CAPACITANCE_PARTITION]: 1,
});

/**
 * 2N3906 PNP bipolar transistor.
 *
 * @see ./datasheets/2N3906.pdf
 */
export const BJT_2N3906 = new BJTModel('2N3906', 'PNP', {
  [IS_SATURATION_CURRENT]: '1.41f',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: 0,
  [ISC_BASE_COLLECTOR_LEAKAGE_CURRENT]: 0,
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.5',
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT]: 2,
  [BF_FORWARD_BETA]: '180.7',
  [BR_REVERSE_BETA]: '4.977',
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '80m',
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]: 0,
  [VAF_FORWARD_EARLY_VOLTAGE]: '18.7',
  [VAR_REVERSE_EARLY_VOLTAGE]: 32,
  [RB_BASE_SERIES_RESISTANCE]: 10,
  [RC_COLLECTOR_SERIES_RESISTANCE]: '1.5',
  [RE_EMITTER_SERIES_RESISTANCE]: '.6',
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '7.19p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '9.53p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '.75',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '.75',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '.3',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '.33',
  [TF_FORWARD_TRANSIT_TIME]: '569.1p',
  [TR_REVERSE_TRANSIT_TIME]: '22.09n',
  [FC_FORWARD_BIAS_DEPLETION_COEFFICIENT]: '.5',
  [XTF_EXTRA_FORWARD_TRANSIT_SHAPING]: 10,
  [VTF_TRANSIT_SHAPING_VOLTAGE]: 4,
  [ITF_TRANSIT_SHAPING_CURRENT]: '.6',
  [XCJC_BASE_COLLECTOR_CAPACITANCE_PARTITION]: '.5',
});

/**
 * AC128 PNP germanium transistor.
 *
 * @see ./datasheets/AC128.pdf
 */
export const BJT_AC128 = new BJTModel('AC128', 'PNP', {
  [IS_SATURATION_CURRENT]: '100n',
  [ISE_BASE_EMITTER_LEAKAGE_CURRENT]: '0.44n',
  [ISC_BASE_COLLECTOR_LEAKAGE_CURRENT]: '120n',
  [NF_FORWARD_EMISSION_COEFFICIENT]: 1,
  [NE_LEAKAGE_EMISSION_COEFFICIENT]: '1.2',
  [NR_REVERSE_EMISSION_COEFFICIENT]: 1,
  [NC_REVERSE_LEAKAGE_EMISSION_COEFFICIENT]: '1.2',
  [BF_FORWARD_BETA]: 100,
  [BR_REVERSE_BETA]: 20,
  [IKF_FORWARD_BETA_ROLLOFF_CORNER]: '10m',
  [IKR_REVERSE_BETA_ROLLOFF_CORNER]: '1.2m',
  [VAF_FORWARD_EARLY_VOLTAGE]: 100,
  [VAR_REVERSE_EARLY_VOLTAGE]: 20,
  [RB_BASE_SERIES_RESISTANCE]: 170,
  [RC_COLLECTOR_SERIES_RESISTANCE]: 60,
  [RE_EMITTER_SERIES_RESISTANCE]: 20,
  [CJE_BASE_EMITTER_JUNCTION_CAPACITANCE]: '6p',
  [CJC_BASE_COLLECTOR_JUNCTION_CAPACITANCE]: '3.75p',
  [VJE_BASE_EMITTER_BUILT_IN_POTENTIAL]: '0.4',
  [VJC_BASE_COLLECTOR_BUILT_IN_POTENTIAL]: '0.6',
  [MJE_BASE_EMITTER_GRADING_COEFFICIENT]: '0.4',
  [MJC_BASE_COLLECTOR_GRADING_COEFFICIENT]: '0.33',
  [TF_FORWARD_TRANSIT_TIME]: '0.15u',
  [TR_REVERSE_TRANSIT_TIME]: '2.86u',
  [XTB_BETA_TEMPERATURE_EXPONENT]: 1,
  [EG_BAND_GAP_ENERGY]: '0.67',
  [XTI_SATURATION_CURRENT_TEMPERATURE_EXPONENT]: 4,
});
