import { SpiceCompactModel, type SpiceParamValue } from '../spice';

/**
 * SPICE `.model` cards for diode parts used by the diode symbol domain.
 *
 * Each exported constant below is a typed model object, not a raw string. The
 * netlist compiler calls `toString()` when it needs the final SPICE
 * definition.
 *
 * @see https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 * @see https://nmg.gitlab.io/ngspice-manual/diodes/diodemodel_d.html
 */

/**
 * SPICE diode parameter tokens expressed as descriptive local constant names.
 *
 * The emitted netlist still uses the original SPICE abbreviations. These
 * constants only make the TypeScript source easier to read and edit.
 */
export const IS_SATURATION_CURRENT = 'IS' as const;
export const RS_SERIES_RESISTANCE = 'RS' as const;
export const N_EMISSION_COEFFICIENT = 'N' as const;
export const CJO_ZERO_BIAS_JUNCTION_CAPACITANCE = 'CJO' as const;
export const M_JUNCTION_GRADING_COEFFICIENT = 'M' as const;
export const TT_TRANSIT_TIME = 'TT' as const;
export const BV_BREAKDOWN_VOLTAGE = 'BV' as const;

/**
 * Parameter bag for the diode compact models in this file.
 *
 * Each property name is keyed by one of the token constants above so the
 * interface stays aligned with the exact SPICE field that will be emitted.
 */
export interface DiodeModelParams {
  /**
   * Saturation current.
   *
   * This sets the small-signal scale current for the diode equation and
   * influences leakage.
   */
  [IS_SATURATION_CURRENT]?: SpiceParamValue;

  /**
   * Series resistance in ohms.
   *
   * Higher values add more ohmic voltage drop at larger forward currents.
   */
  [RS_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Emission coefficient, also called ideality factor.
   *
   * This changes how sharply the forward current rises with voltage.
   */
  [N_EMISSION_COEFFICIENT]?: SpiceParamValue;

  /**
   * Zero-bias junction capacitance.
   *
   * This is the diode capacitance seen around small reverse bias and light
   * forward bias.
   */
  [CJO_ZERO_BIAS_JUNCTION_CAPACITANCE]?: SpiceParamValue;

  /**
   * Junction grading coefficient.
   *
   * This shapes how junction capacitance changes as the diode voltage moves away
   * from zero bias.
   */
  [M_JUNCTION_GRADING_COEFFICIENT]?: SpiceParamValue;

  /**
   * Transit time.
   *
   * This affects stored charge and reverse-recovery behavior.
   */
  [TT_TRANSIT_TIME]?: SpiceParamValue;

  /**
   * Reverse breakdown voltage.
   *
   * When present, this defines the approximate voltage where reverse conduction
   * avalanches.
   */
  [BV_BREAKDOWN_VOLTAGE]?: SpiceParamValue;
}

/**
 * Stable parameter ordering for rendered diode model cards.
 *
 * Keeping this list explicit makes the generated `.model` lines deterministic
 * and diff-friendly.
 */
const DIODE_PARAM_ORDER = [
  IS_SATURATION_CURRENT,
  RS_SERIES_RESISTANCE,
  N_EMISSION_COEFFICIENT,
  CJO_ZERO_BIAS_JUNCTION_CAPACITANCE,
  M_JUNCTION_GRADING_COEFFICIENT,
  TT_TRANSIT_TIME,
  BV_BREAKDOWN_VOLTAGE,
] as const;

/**
 * Typed diode compact-model wrapper.
 *
 * The public `params` field is intentionally mutable so a caller can adjust
 * values and then re-render the card via `toString()` without rebuilding the
 * model from scratch.
 */
export class DiodeModel extends SpiceCompactModel<DiodeModelParams> {
  constructor(name: string, params: DiodeModelParams) {
    super(name, 'D', params, DIODE_PARAM_ORDER);
  }
}

export const DIODE_1N914 = new DiodeModel('1N914', {
  [IS_SATURATION_CURRENT]: '2.52n',
  [RS_SERIES_RESISTANCE]: '.568',
  [N_EMISSION_COEFFICIENT]: '1.752',
  [CJO_ZERO_BIAS_JUNCTION_CAPACITANCE]: '4p',
  [M_JUNCTION_GRADING_COEFFICIENT]: '.4',
  [TT_TRANSIT_TIME]: '20n',
});

export const DIODE_1N4001 = new DiodeModel('1N4001', {
  [IS_SATURATION_CURRENT]: '14.11n',
  [N_EMISSION_COEFFICIENT]: '1.984',
  [RS_SERIES_RESISTANCE]: '33.89m',
  [CJO_ZERO_BIAS_JUNCTION_CAPACITANCE]: '25.89p',
  [M_JUNCTION_GRADING_COEFFICIENT]: '.4',
  [TT_TRANSIT_TIME]: '5.7u',
});

export const DIODE_1N4002 = new DiodeModel('1N4002', {
  [IS_SATURATION_CURRENT]: '14.11n',
  [N_EMISSION_COEFFICIENT]: '1.984',
  [RS_SERIES_RESISTANCE]: '33.89m',
  [CJO_ZERO_BIAS_JUNCTION_CAPACITANCE]: '25.89p',
  [M_JUNCTION_GRADING_COEFFICIENT]: '.4',
  [TT_TRANSIT_TIME]: '5.7u',
  [BV_BREAKDOWN_VOLTAGE]: 100,
});

export const DIODE_1N270 = new DiodeModel('1N270', {
  [IS_SATURATION_CURRENT]: '200n',
  [RS_SERIES_RESISTANCE]: 2,
  [N_EMISSION_COEFFICIENT]: '1.1',
  [CJO_ZERO_BIAS_JUNCTION_CAPACITANCE]: '1p',
  [M_JUNCTION_GRADING_COEFFICIENT]: '.5',
  [TT_TRANSIT_TIME]: '50n',
  [BV_BREAKDOWN_VOLTAGE]: 100,
});
