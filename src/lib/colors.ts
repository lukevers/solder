/**
 * Canonical colour ids shared by decorative annotation nodes.
 *
 * Sticky notes, boxes, and inspector swatches all use these ids. Keeping them
 * here avoids tying the shared palette to any one model directory.
 */
export const NODE_COLORS = [
  'yellow',
  'blue',
  'green',
  'pink',
  'purple',
  'orange',
  'gray',
] as const;

/**
 * Shared annotation colour id used when a node omits an explicit value.
 */
export const DEFAULT_NODE_COLOR = 'yellow';

/**
 * Shared annotation colour id derived from the canonical palette tuple.
 */
export type NodeColor = (typeof NODE_COLORS)[number];

/**
 * Per-colour visual tokens for decorative annotation nodes.
 *
 * Both sticky notes and boxes reuse the same palette, but each consumes a
 * different subset of these tokens.
 */
export const NODE_COLOR_TOKENS = {
  yellow: {
    swatch: '#fde047',
    bg: '#fef08a',
    bgSelected: '#fde047',
    header: '#fde047',
    border: '#fde047',
    borderSelected: '#eab308',
    text: '#713f12',
    boxFill: 'rgba(234,179,8,0.07)',
  },
  blue: {
    swatch: '#93c5fd',
    bg: '#bfdbfe',
    bgSelected: '#93c5fd',
    header: '#93c5fd',
    border: '#93c5fd',
    borderSelected: '#3b82f6',
    text: '#1e3a5f',
    boxFill: 'rgba(59,130,246,0.07)',
  },
  green: {
    swatch: '#86efac',
    bg: '#bbf7d0',
    bgSelected: '#86efac',
    header: '#86efac',
    border: '#86efac',
    borderSelected: '#22c55e',
    text: '#14532d',
    boxFill: 'rgba(34,197,94,0.07)',
  },
  pink: {
    swatch: '#f9a8d4',
    bg: '#fbcfe8',
    bgSelected: '#f9a8d4',
    header: '#f9a8d4',
    border: '#f9a8d4',
    borderSelected: '#ec4899',
    text: '#701a3e',
    boxFill: 'rgba(236,72,153,0.07)',
  },
  purple: {
    swatch: '#c4b5fd',
    bg: '#ddd6fe',
    bgSelected: '#c4b5fd',
    header: '#c4b5fd',
    border: '#c4b5fd',
    borderSelected: '#8b5cf6',
    text: '#3b1f6e',
    boxFill: 'rgba(139,92,246,0.07)',
  },
  orange: {
    swatch: '#fdba74',
    bg: '#fed7aa',
    bgSelected: '#fdba74',
    header: '#fdba74',
    border: '#fdba74',
    borderSelected: '#f97316',
    text: '#6b2f0a',
    boxFill: 'rgba(249,115,22,0.07)',
  },
  gray: {
    swatch: '#9ca3af',
    bg: '#e5e7eb',
    bgSelected: '#d1d5db',
    header: '#d1d5db',
    border: '#d1d5db',
    borderSelected: '#6b7280',
    text: '#1f2937',
    boxFill: 'rgba(107,114,128,0.07)',
  },
} as const;

/**
 * Ordered colour-picker options derived from the shared annotation palette.
 */
export const NODE_COLOR_OPTIONS = NODE_COLORS.map((id) => ({
  id,
  swatch: NODE_COLOR_TOKENS[id].swatch,
}));

/**
 * Shared colour-picker option shape derived from the annotation palette.
 */
export type NodeColorOption = (typeof NODE_COLOR_OPTIONS)[number];
