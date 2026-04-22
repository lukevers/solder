/**
 * Data payload for a ground node.
 *
 * All ground nodes map to SPICE net 0 regardless of wiring.
 */
export type GroundData = {
  label: string;
  symbol?: string;
};
