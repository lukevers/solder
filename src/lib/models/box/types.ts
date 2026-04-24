import type { NodeColor } from '../../colors';
import type { BOX_VARIANTS } from './constants';

/**
 * Visual style variant for box nodes.
 */
export type BoxVariant = (typeof BOX_VARIANTS)[number];

/**
 * Data payload for a decorative box node.
 *
 * Used to visually group parts of a circuit.
 */
export type BoxData = {
  label: string;
  color?: NodeColor;
  variant?: BoxVariant;
};
