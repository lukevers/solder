/**
 * Data payload for a capacitor node (non-polarised).
 * Also used for polarised capacitors (cap_polar).
 * `farads` is the capacitance value in farads.
 */
export type CapacitorData = {
  label: string;
  farads: number;
  symbol?: string;
};
