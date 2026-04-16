// src/lib/engines/eecircuit.ts
import type { ResultType, Simulation } from 'eecircuit-engine';
import type {
  MultiNodeOutput,
  SimulationOutput,
  SpiceEngine,
} from '../spice-engine';

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

/**
 * Extracts time and ALL voltage traces from an eecircuit-engine ResultType.
 * Used by circuit analysis to probe multiple nodes simultaneously.
 */
export function extractMultiNodeOutput(result: ResultType): MultiNodeOutput {
  if (result.dataType !== 'real') {
    throw new Error('Expected real (transient) simulation result');
  }
  const timeEntry = result.data.find((d) => d.type === 'time');
  if (!timeEntry) throw new Error('Simulation output missing time axis');

  const traces = new Map<string, Float64Array>();
  for (const d of result.data) {
    if (d.type === 'voltage') {
      // d.name is like "v(n1)" — extract the node name
      const match = d.name.match(/^v\((.+)\)$/i);
      const nodeName = match ? match[1] : d.name;
      traces.set(nodeName, new Float64Array(d.values));
    }
  }

  return {
    timeValues: new Float64Array(timeEntry.values),
    traces,
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

  async runAnalysis(netlist: string): Promise<MultiNodeOutput> {
    if (!this.sim)
      throw new Error('EECircuitEngine not initialised — call init() first');
    this.sim.setNetList(netlist);
    const result = await this.sim.runSim();
    return extractMultiNodeOutput(result);
  }
}
