/**
 * Data payload for an audio jack node.
 *
 * `direction` determines whether it is an input or output jack.
 */
export type JackData = {
  label: string;
  direction: 'in' | 'out';
  symbol?: string;
};
