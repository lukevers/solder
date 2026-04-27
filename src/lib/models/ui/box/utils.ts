import type { NodeColor } from '../../../colors';
import { NODE_COLOR_TOKENS } from '../../../colors';
import type { BoxVariant } from './types';

/**
 * Box border and fill colours derived from the shared annotation palette.
 *
 * Boxes reuse the sticky-note colour set so both decorative node types present
 * the same named colours throughout the editor.
 */
export const COLOR_MAP: Record<NodeColor, { border: string; fill: string }> = {
  yellow: {
    border: NODE_COLOR_TOKENS.yellow.borderSelected,
    fill: NODE_COLOR_TOKENS.yellow.boxFill,
  },
  blue: {
    border: NODE_COLOR_TOKENS.blue.borderSelected,
    fill: NODE_COLOR_TOKENS.blue.boxFill,
  },
  green: {
    border: NODE_COLOR_TOKENS.green.borderSelected,
    fill: NODE_COLOR_TOKENS.green.boxFill,
  },
  pink: {
    border: NODE_COLOR_TOKENS.pink.borderSelected,
    fill: NODE_COLOR_TOKENS.pink.boxFill,
  },
  purple: {
    border: NODE_COLOR_TOKENS.purple.borderSelected,
    fill: NODE_COLOR_TOKENS.purple.boxFill,
  },
  orange: {
    border: NODE_COLOR_TOKENS.orange.borderSelected,
    fill: NODE_COLOR_TOKENS.orange.boxFill,
  },
  gray: {
    border: NODE_COLOR_TOKENS.gray.borderSelected,
    fill: NODE_COLOR_TOKENS.gray.boxFill,
  },
};

/**
 * Return the SVG dash pattern for the requested box outline style.
 *
 * Only the dashed variant needs an explicit stroke pattern; the other variants
 * render as solid outlines.
 */
export function dashArray(variant: BoxVariant): string | undefined {
  return variant === 'dashed' ? '8 4' : undefined;
}
