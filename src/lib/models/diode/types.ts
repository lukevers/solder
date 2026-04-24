/**
 * Data payload for a diode node.
 * `model` selects the SPICE .model statement.
 */
export type DiodeData = {
  label: string;
  model: '1N914' | '1N4001' | '1N4002' | '1N270' | '1N34A';
  symbol?: string;
};
