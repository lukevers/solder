/**
 * Taper curve for a potentiometer.
 *
 *   linear  — resistance scales linearly with
 *             wiper position
 *   log     — logarithmic (audio) taper
 *   antilog — reverse logarithmic taper
 */
export type PotTaper = 'linear' | 'log' | 'antilog';

/**
 * Data payload for a potentiometer node.
 *
 * `position` ranges from 0 (fully CCW) to 1
 * (fully CW). The netlist compiler splits this
 * into two resistors based on position and taper.
 */
export type PotData = {
  label: string;
  ohms: number;
  position: number;
  taper?: PotTaper;
  symbol?: string;
};
