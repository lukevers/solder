/**
 * Supported text density presets for decorative nodes.
 *
 * The renderer and inspector both derive their available size ids from this
 * tuple so the UI stays aligned.
 */
export const NODE_SIZES = ['xs', 'sm', 'md'] as const;

/**
 * Default node size used when no explicit preset is stored.
 */
export const DEFAULT_NODE_SIZE = 'sm';

/**
 * Shared node-size id derived from the canonical size tuple.
 */
export type NodeSize = (typeof NODE_SIZES)[number];

/**
 * Available width presets for decorative nodes.
 */
export const NODE_WIDTHS = ['slim', 'normal'] as const;

/**
 * Default node width used when no explicit preset is stored.
 */
export const DEFAULT_NODE_WIDTH = 'normal';

/**
 * Shared node-width id derived from the canonical width tuple.
 */
export type NodeWidth = (typeof NODE_WIDTHS)[number];
