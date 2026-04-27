import { SpiceCompactModel, type SpiceParamValue } from '../../../spice';

/**
 * SPICE `.model` cards for JFET parts used by the JFET symbol domain.
 *
 * Each exported constant below is a typed model object that can later be
 * re-rendered through `toString()`.
 *
 * @see https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 * @see https://nmg.gitlab.io/ngspice-manual/jfets/junctionfield-effecttransistors_jfets.html
 */

/**
 * SPICE JFET parameter tokens expressed as descriptive local constant names.
 *
 * The serialized model still uses the ngspice abbreviations. These constants
 * only improve the readability of the TypeScript source.
 */
export const VTO_PINCH_OFF_VOLTAGE = 'VTO' as const;
export const BETA_TRANSCONDUCTANCE_SCALE_FACTOR = 'BETA' as const;
export const LAMBDA_CHANNEL_LENGTH_MODULATION = 'LAMBDA' as const;
export const RD_DRAIN_SERIES_RESISTANCE = 'RD' as const;
export const RS_SOURCE_SERIES_RESISTANCE = 'RS' as const;
export const CGS_GATE_SOURCE_CAPACITANCE = 'CGS' as const;
export const CGD_GATE_DRAIN_CAPACITANCE = 'CGD' as const;
export const IS_GATE_JUNCTION_SATURATION_CURRENT = 'IS' as const;

/**
 * Parameter bag for the JFET compact models in this file.
 *
 * The computed property names tie each field to the exact SPICE token emitted by
 * `toString()`.
 */
export interface JFETModelParams {
  /**
   * Pinch-off or threshold-style voltage.
   *
   * This sets where the gate starts to shut down the channel current.
   */
  [VTO_PINCH_OFF_VOLTAGE]?: SpiceParamValue;

  /**
   * Transconductance scale factor.
   *
   * Larger values generally indicate a stronger
   * device for a given bias condition.
   */
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]?: SpiceParamValue;

  /**
   * Channel-length modulation term.
   *
   * This controls how much drain current continues to rise after pinch-off.
   */
  [LAMBDA_CHANNEL_LENGTH_MODULATION]?: SpiceParamValue;

  /**
   * Drain series resistance.
   *
   * This adds ohmic loss in series with the drain terminal.
   */
  [RD_DRAIN_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Source series resistance.
   *
   * This adds ohmic loss in series with the source terminal.
   */
  [RS_SOURCE_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Gate-source capacitance.
   *
   * This contributes to input loading and high-frequency rolloff.
   */
  [CGS_GATE_SOURCE_CAPACITANCE]?: SpiceParamValue;

  /**
   * Gate-drain capacitance.
   *
   * This is the capacitance most closely tied to Miller-effect bandwidth loss.
   */
  [CGD_GATE_DRAIN_CAPACITANCE]?: SpiceParamValue;

  /**
   * Gate-junction saturation current.
   *
   * This shapes reverse leakage through the JFET gate junctions.
   */
  [IS_GATE_JUNCTION_SATURATION_CURRENT]?: SpiceParamValue;
}

/**
 * Stable parameter ordering for rendered JFET model cards.
 *
 * Keeping the order explicit makes generated output consistent across edits and
 * test runs.
 */
const JFET_PARAM_ORDER = [
  VTO_PINCH_OFF_VOLTAGE,
  BETA_TRANSCONDUCTANCE_SCALE_FACTOR,
  LAMBDA_CHANNEL_LENGTH_MODULATION,
  RD_DRAIN_SERIES_RESISTANCE,
  RS_SOURCE_SERIES_RESISTANCE,
  CGS_GATE_SOURCE_CAPACITANCE,
  CGD_GATE_DRAIN_CAPACITANCE,
  IS_GATE_JUNCTION_SATURATION_CURRENT,
] as const;

/**
 * Typed JFET compact-model wrapper.
 *
 * Instances stay mutable through their `params` object so future UI-driven
 * tweaking can reuse the same serialization path.
 */
export class JFETModel extends SpiceCompactModel<JFETModelParams> {
  constructor(name: string, polarity: 'NJF' | 'PJF', params: JFETModelParams) {
    super(name, polarity, params, JFET_PARAM_ORDER);
  }
}

export const JFET_2N5457 = new JFETModel('2N5457', 'NJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '-1.8',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '1.813m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '5.548m',
  [RD_DRAIN_SERIES_RESISTANCE]: 1,
  [RS_SOURCE_SERIES_RESISTANCE]: 1,
  [CGS_GATE_SOURCE_CAPACITANCE]: '4.208p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '4.208p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '205.8f',
});

export const JFET_2N5458 = new JFETModel('2N5458', 'NJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '-3.5',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '2.235m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '5.548m',
  [RD_DRAIN_SERIES_RESISTANCE]: 1,
  [RS_SOURCE_SERIES_RESISTANCE]: 1,
  [CGS_GATE_SOURCE_CAPACITANCE]: '4.5p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '4.5p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '205.8f',
});

export const JFET_J201 = new JFETModel('J201', 'NJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '-0.7',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '1.4m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '2.25m',
  [RD_DRAIN_SERIES_RESISTANCE]: 1,
  [RS_SOURCE_SERIES_RESISTANCE]: 1,
  [CGS_GATE_SOURCE_CAPACITANCE]: '2.5p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '2.5p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '100f',
});

export const JFET_J113 = new JFETModel('J113', 'NJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '-1.29',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '9.26m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '30.4m',
  [RD_DRAIN_SERIES_RESISTANCE]: '1.3',
  [RS_SOURCE_SERIES_RESISTANCE]: '1.3',
  [CGS_GATE_SOURCE_CAPACITANCE]: '10.5p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '12p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '987f',
});

export const JFET_MPF102 = new JFETModel('MPF102', 'NJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '-3.5',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '4m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '2m',
  [RD_DRAIN_SERIES_RESISTANCE]: 1,
  [RS_SOURCE_SERIES_RESISTANCE]: 1,
  [CGS_GATE_SOURCE_CAPACITANCE]: '4p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '3p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '100f',
});

export const JFET_2N5460 = new JFETModel('2N5460', 'PJF', {
  [VTO_PINCH_OFF_VOLTAGE]: '1.5',
  [BETA_TRANSCONDUCTANCE_SCALE_FACTOR]: '1.25m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '6m',
  [RD_DRAIN_SERIES_RESISTANCE]: 1,
  [RS_SOURCE_SERIES_RESISTANCE]: 1,
  [CGS_GATE_SOURCE_CAPACITANCE]: '5p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '5p',
  [IS_GATE_JUNCTION_SATURATION_CURRENT]: '50f',
});
