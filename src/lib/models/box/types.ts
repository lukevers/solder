import type { StickyNoteColor } from '../stickynote/types';

/**
 * Visual style variant for box nodes.
 */
export type BoxVariant = 'outline' | 'filled' | 'dashed';

/**
 * Data payload for a decorative box node.
 *
 * Used to visually group parts of a circuit.
 */
export type BoxData = {
  label: string;
  color?: StickyNoteColor;
  variant?: BoxVariant;
};
