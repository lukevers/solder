/**
 * Available JFET transistor models.
 *
 * Each maps to a `.model` statement in this domain's `model.ts`.
 */
export type JFETModel =
  | '2N5457'
  | '2N5458'
  | 'J201'
  | 'J113'
  | 'MPF102'
  | '2N5460';

/**
 * Data payload for a JFET transistor node.
 *
 * `polarity` determines N-channel vs P-channel.
 */
export type JFETData = {
  label: string;
  polarity: 'N' | 'P';
  model: JFETModel;
  symbol?: string;
};
