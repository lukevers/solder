/**
 * Data payload for an op-amp node.
 * `model` selects the SPICE subcircuit to use.
 */
export type OpAmpData = {
  label: string;
  model: 'TL072' | 'LM741' | 'LM308';
  symbol?: string;
};
