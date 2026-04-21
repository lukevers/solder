export type SimulationOutput = {
  timeValues: Float64Array; // seconds, one entry per ngspice output step
  voltageValues: Float64Array; // volts at the probed output node, same length
};

export type MultiNodeOutput = {
  timeValues: Float64Array;
  traces: Map<string, Float64Array>; // SPICE node name → voltage values
};

export interface SpiceEngine {
  /** Initialise the engine. Safe to call multiple times; no-op after first. */
  init(): Promise<void>;
  /** Run a netlist string and return the output voltage time series. */
  run(netlist: string): Promise<SimulationOutput>;
}
