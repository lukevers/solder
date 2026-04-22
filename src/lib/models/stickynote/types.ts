/**
 * Available colours for sticky notes and boxes.
 */
export type StickyNoteColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'orange'
  | 'gray';

/**
 * Font size preset for sticky notes.
 */
export type StickyNoteSize = 'xs' | 'sm' | 'md';

/**
 * Width preset for sticky notes.
 */
export type StickyNoteWidth = 'slim' | 'normal';

/**
 * Data payload for a sticky note node.
 * Decorative only — not included in simulation.
 */
export type StickyNoteData = {
  label: string;
  text: string;
  color?: StickyNoteColor;
  size?: StickyNoteSize;
  width?: StickyNoteWidth;
};
