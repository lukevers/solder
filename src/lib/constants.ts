/**
 * Standard audio sample rate used throughout the app.
 *
 * Used by Web Audio API playback, waveform display rendering, and
 * audio-convert.ts when resampling SPICE output to audio.
 */
export const SAMPLE_RATE = 44100;

/**
 * Shared user-facing labels for the stock IO and ground nodes.
 *
 * These strings appear in starter circuits, toolbar defaults, and many test
 * helpers. Keeping them centralized avoids small spelling or casing drifts
 * between features.
 */
export const CIRCUIT_LABEL = {
  input: 'INPUT',
  output: 'OUTPUT',
  ground: 'GND',
  power: 'VCC',
} as const;

/**
 * Bundled sample names that ship with the app.
 *
 * The first entry is the default sample selected on startup and after local
 * sample removal falls back to a built-in choice.
 */
export const BUNDLED_SAMPLE_NAME = {
  guitar: 'guitar',
  bass: 'bass',
} as const;

/**
 * Ordered list of bundled samples shown in the audio controls UI.
 *
 * The tuple reuses the named constants above so the render order and the
 * default-value strings cannot silently diverge.
 */
export const BUNDLED_SAMPLE_NAMES = [
  BUNDLED_SAMPLE_NAME.guitar,
  BUNDLED_SAMPLE_NAME.bass,
] as const;

/**
 * Default bundled sample used for a fresh store and local-sample fallback.
 */
export const DEFAULT_BUNDLED_SAMPLE_NAME = BUNDLED_SAMPLE_NAME.guitar;
