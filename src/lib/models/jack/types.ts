/**
 * Runtime values used for audio jack direction.
 *
 * Keeping the strings in one object avoids repeating `"in"` / `"out"` across
 * the editor, netlist compiler, and tests.
 */
export const JACK_DIRECTION = {
  in: 'in',
  out: 'out',
} as const;

/**
 * Stable union of supported jack directions.
 *
 * Using the constant object above keeps the runtime values and the TypeScript
 * type aligned.
 */
export type JackDirection =
  (typeof JACK_DIRECTION)[keyof typeof JACK_DIRECTION];

/**
 * Data payload for an audio jack node.
 *
 * `direction` determines whether it is an input or output jack.
 */
export type JackData = {
  label: string;
  direction: JackDirection;
  symbol?: string;
};
