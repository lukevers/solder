/**
 * Supported text density presets for decorative note nodes.
 *
 * The renderer and inspector both derive their available size ids from this
 * tuple so the UI stays aligned.
 */
export const NODE_SIZES = ['xs', 'sm', 'md'] as const;

/**
 * Default note size used when no explicit preset is stored.
 */
export const DEFAULT_NODE_SIZE = 'sm';

/**
 * Shared note-size id derived from the canonical size tuple.
 */
export type NodeSize = (typeof NODE_SIZES)[number];

/**
 * Available width presets for decorative note nodes.
 */
export const NODE_WIDTHS = ['slim', 'normal'] as const;

/**
 * Default note width used when no explicit preset is stored.
 */
export const DEFAULT_NODE_WIDTH = 'normal';

/**
 * Shared note-width id derived from the canonical width tuple.
 */
export type NodeWidth = (typeof NODE_WIDTHS)[number];
