// src/lib/engines/eecircuit.ts
import type { ResultType, Simulation } from 'eecircuit-engine';
import type { SimulationOutput, SpiceEngine } from '../spice-engine';

/**
 * Extracts time and voltage arrays from an eecircuit-engine ResultType.
 * Exported for unit testing without loading the WASM binary.
 */
export function extractSimulationOutput(result: ResultType): SimulationOutput {
  if (result.dataType !== 'real') {
    throw new Error('Expected real (transient) simulation result');
  }
  const timeEntry = result.data.find((d) => d.type === 'time');
  const voltageEntry = result.data.find((d) => d.type === 'voltage');
  if (!timeEntry) throw new Error('Simulation output missing time axis');
  if (!voltageEntry) throw new Error('Simulation output missing voltage data');
  return {
    timeValues: new Float64Array(timeEntry.values),
    voltageValues: new Float64Array(voltageEntry.values),
  };
}

export class EECircuitEngine implements SpiceEngine {
  private sim: Simulation | null = null;

  async init(): Promise<void> {
    if (this.sim) return;
    const { Simulation } = await import('eecircuit-engine');
    this.sim = new Simulation();
    await this.sim.start();
  }

  async run(netlist: string): Promise<SimulationOutput> {
    if (!this.sim)
      throw new Error('EECircuitEngine not initialised — call init() first');
    this.sim.setNetList(netlist);
    const result = await this.sim.runSim();
    return extractSimulationOutput(result);
  }
}
