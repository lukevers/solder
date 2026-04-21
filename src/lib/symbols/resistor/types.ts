/**
 * Data payload for a resistor node.
 * `ohms` is the resistance value in ohms.
 */
export type ResistorData = {
  label: string;
  ohms: number;
  symbol?: string;
};
