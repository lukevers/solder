/**
 * Available MOSFET transistor models.
 */
export type MOSFETModel = 'BS170' | 'IRF510' | 'IRF9510' | '2N7000';

/**
 * Data payload for a MOSFET transistor node.
 * `polarity` determines N-channel vs P-channel.
 */
export type MOSFETData = {
  label: string;
  polarity: 'N' | 'P';
  model: MOSFETModel;
  symbol?: string;
};
