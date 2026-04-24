import type { NodeColor } from '../../colors';
import type { NodeSize, NodeWidth } from '../../sizes';

/**
 * Data payload for a sticky note node.
 * Decorative only — not included in simulation.
 */
export type StickyNoteData = {
  label: string;
  text: string;
  color?: NodeColor;
  size?: NodeSize;
  width?: NodeWidth;
};
