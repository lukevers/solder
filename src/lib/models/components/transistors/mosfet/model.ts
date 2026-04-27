import { SpiceCompactModel, type SpiceParamValue } from '../../../spice';

/**
 * SPICE `.model` cards for MOSFET parts used by the MOSFET symbol domain.
 * the MOSFET symbol domain.
 *
 * Each exported constant below is a typed model object that renders itself with
 * `toString()`.
 *
 * @see https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 * @see https://nmg.gitlab.io/ngspice-manual/mosfets/mosfetmodels_nmos_pmos.html
 */

/**
 * SPICE MOSFET parameter tokens expressed as descriptive local constant names.
 *
 * The emitted model line still uses the native ngspice abbreviations. These
 * constants are for source readability only.
 */
export const VTO_THRESHOLD_VOLTAGE = 'VTO' as const;
export const KP_TRANSCONDUCTANCE_PARAMETER = 'KP' as const;
export const LAMBDA_CHANNEL_LENGTH_MODULATION = 'LAMBDA' as const;
export const RD_DRAIN_SERIES_RESISTANCE = 'RD' as const;
export const RS_SOURCE_SERIES_RESISTANCE = 'RS' as const;
export const CGS_GATE_SOURCE_CAPACITANCE = 'CGS' as const;
export const CGD_GATE_DRAIN_CAPACITANCE = 'CGD' as const;
export const CBD_DRAIN_BODY_DEPLETION_CAPACITANCE = 'CBD' as const;
export const IS_BODY_DIODE_SATURATION_CURRENT = 'IS' as const;

/**
 * Parameter bag for the MOSFET compact models in this file.
 *
 * Computed property names keep the documented source fields aligned with the
 * rendered SPICE token names.
 */
export interface MOSFETModelParams {
  /**
   * Threshold voltage.
   *
   * This is the approximate gate bias where the channel begins to turn on.
   */
  [VTO_THRESHOLD_VOLTAGE]?: SpiceParamValue;

  /**
   * Transconductance parameter.
   *
   * This is one of the main knobs controlling how strong the channel current is.
   */
  [KP_TRANSCONDUCTANCE_PARAMETER]?: SpiceParamValue;

  /**
   * Channel-length modulation term.
   *
   * Higher values reduce output resistance in the saturation region.
   */
  [LAMBDA_CHANNEL_LENGTH_MODULATION]?: SpiceParamValue;

  /**
   * Drain series resistance.
   *
   * This adds ohmic loss between the external drain pin and the intrinsic device.
   */
  [RD_DRAIN_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Source series resistance.
   *
   * This adds ohmic loss between the external source pin and the intrinsic device.
   */
  [RS_SOURCE_SERIES_RESISTANCE]?: SpiceParamValue;

  /**
   * Gate-source capacitance.
   *
   * Some MOS model families accept this directly, while others require
   * overlap-capacitance terms or geometry-based derivation instead.
   */
  [CGS_GATE_SOURCE_CAPACITANCE]?: SpiceParamValue;

  /**
   * Gate-drain capacitance.
   *
   * As with `CGS`, ngspice support depends on the underlying MOS model family
   * and level.
   */
  [CGD_GATE_DRAIN_CAPACITANCE]?: SpiceParamValue;

  /**
   * Drain-body depletion capacitance.
   *
   * This affects reverse-biased junction storage on the drain side of the MOSFET.
   */
  [CBD_DRAIN_BODY_DEPLETION_CAPACITANCE]?: SpiceParamValue;

  /**
   * Body-diode saturation current.
   *
   * This sets the leakage scale current for the MOSFET's intrinsic body diode.
   */
  [IS_BODY_DIODE_SATURATION_CURRENT]?: SpiceParamValue;
}

/**
 * Stable parameter ordering for rendered MOSFET model cards.
 *
 * Keeping the ordering explicit makes the emitted SPICE deterministic and easier
 * to compare in tests and diffs.
 */
const MOSFET_PARAM_ORDER = [
  VTO_THRESHOLD_VOLTAGE,
  KP_TRANSCONDUCTANCE_PARAMETER,
  LAMBDA_CHANNEL_LENGTH_MODULATION,
  RD_DRAIN_SERIES_RESISTANCE,
  RS_SOURCE_SERIES_RESISTANCE,
  CGS_GATE_SOURCE_CAPACITANCE,
  CGD_GATE_DRAIN_CAPACITANCE,
  CBD_DRAIN_BODY_DEPLETION_CAPACITANCE,
  IS_BODY_DIODE_SATURATION_CURRENT,
] as const;

/**
 * Typed MOSFET compact-model wrapper.
 *
 * The instance keeps a mutable `params` bag so the same object can be adjusted
 * and re-serialized later without rebuilding the model.
 */
export class MOSFETModel extends SpiceCompactModel<MOSFETModelParams> {
  constructor(
    name: string,
    polarity: 'NMOS' | 'PMOS',
    params: MOSFETModelParams,
  ) {
    super(name, polarity, params, MOSFET_PARAM_ORDER);
  }
}

/**
 * BS170 small-signal NMOS model.
 *
 * `CGS` and `CGD` looked plausible here, but ngspice in eecircuit-engine rejected
 * them as invalid model defaults for the MOS model we use.
 */
export const MOSFET_BS170 = new MOSFETModel('BS170', 'NMOS', {
  [VTO_THRESHOLD_VOLTAGE]: '1.83',
  [KP_TRANSCONDUCTANCE_PARAMETER]: '320m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '37.5m',
  [RD_DRAIN_SERIES_RESISTANCE]: '1.2',
  [RS_SOURCE_SERIES_RESISTANCE]: '1.2',
  [CBD_DRAIN_BODY_DEPLETION_CAPACITANCE]: '35p',
  [IS_BODY_DIODE_SATURATION_CURRENT]: '1f',
});

export const MOSFET_IRF510 = new MOSFETModel('IRF510', 'NMOS', {
  [VTO_THRESHOLD_VOLTAGE]: '3.697',
  [KP_TRANSCONDUCTANCE_PARAMETER]: '3.592',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: 0,
  [RD_DRAIN_SERIES_RESISTANCE]: '0.5',
  [RS_SOURCE_SERIES_RESISTANCE]: '0.5',
  [CGS_GATE_SOURCE_CAPACITANCE]: '430p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '100p',
  [CBD_DRAIN_BODY_DEPLETION_CAPACITANCE]: '570p',
  [IS_BODY_DIODE_SATURATION_CURRENT]: '1f',
});

export const MOSFET_IRF9510 = new MOSFETModel('IRF9510', 'PMOS', {
  [VTO_THRESHOLD_VOLTAGE]: '-3.7',
  [KP_TRANSCONDUCTANCE_PARAMETER]: '2.5',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: 0,
  [RD_DRAIN_SERIES_RESISTANCE]: '0.7',
  [RS_SOURCE_SERIES_RESISTANCE]: '0.7',
  [CGS_GATE_SOURCE_CAPACITANCE]: '350p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '90p',
  [CBD_DRAIN_BODY_DEPLETION_CAPACITANCE]: '480p',
  [IS_BODY_DIODE_SATURATION_CURRENT]: '1f',
});

export const MOSFET_2N7000 = new MOSFETModel('2N7000', 'NMOS', {
  [VTO_THRESHOLD_VOLTAGE]: '2.1',
  [KP_TRANSCONDUCTANCE_PARAMETER]: '190m',
  [LAMBDA_CHANNEL_LENGTH_MODULATION]: '5m',
  [RD_DRAIN_SERIES_RESISTANCE]: '1.5',
  [RS_SOURCE_SERIES_RESISTANCE]: '1.5',
  [CGS_GATE_SOURCE_CAPACITANCE]: '25p',
  [CGD_GATE_DRAIN_CAPACITANCE]: '5p',
  [CBD_DRAIN_BODY_DEPLETION_CAPACITANCE]: '30p',
  [IS_BODY_DIODE_SATURATION_CURRENT]: '1f',
});
