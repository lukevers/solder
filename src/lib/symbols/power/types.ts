/**
 * Data payload for a power rail node.
 * `volts` is the DC supply voltage.
 */
export type PowerData = {
  label: string;
  volts: number;
  symbol?: string;
};
