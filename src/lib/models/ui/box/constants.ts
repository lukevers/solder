/**
 * Supported schematic-box outline styles.
 *
 * The inspector and renderer both derive their options from this tuple so box
 * variant ids stay consistent across the UI.
 */
export const BOX_VARIANTS = ['outline', 'filled', 'dashed'] as const;

/**
 * Default visual style for schematic boxes.
 */
export const DEFAULT_BOX_VARIANT = 'outline';
