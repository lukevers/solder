import type { ResultType, Simulation } from 'eecircuit-engine';
import type {
  MultiNodeOutput,
  SimulationOutput,
  SpiceEngine,
} from './spice-engine';

/** Maximum time (ms) a single simulation is allowed to run before we abort. */
const SIM_TIMEOUT_MS = 60_000;

/** Maximum number of data points allowed in a single SPICE output vector. */
const MAX_SPICE_POINTS = 5_000_000;

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
  if (!timeEntry) {
    throw new Error('Simulation output missing time axis');
  }
  if (!voltageEntry) {
    throw new Error('Simulation output missing voltage data');
  }
  if (timeEntry.values.length > MAX_SPICE_POINTS) {
    throw new Error(
      `Simulation produced ${timeEntry.values.length.toLocaleString()} data points (limit ${MAX_SPICE_POINTS.toLocaleString()}). The circuit may be unstable or too complex.`,
    );
  }
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
  if (!timeEntry) {
    throw new Error('Simulation output missing time axis');
  }
  if (timeEntry.values.length > MAX_SPICE_POINTS) {
    throw new Error(
      `Simulation produced ${timeEntry.values.length.toLocaleString()} data points (limit ${MAX_SPICE_POINTS.toLocaleString()}). The circuit may be unstable or too complex.`,
    );
  }

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
    if (this.sim) {
      return;
    }
    const { Simulation } = await import('eecircuit-engine');
    this.sim = new Simulation();
    await this.sim.start();
  }

  async run(netlist: string): Promise<SimulationOutput> {
    if (!this.sim) {
      throw new Error('EECircuitEngine not initialised — call init() first');
    }
    this.sim.setNetList(netlist);
    const result = await this.runWithTimeout();
    return extractSimulationOutput(result);
  }

  async runAnalysis(netlist: string): Promise<MultiNodeOutput> {
    if (!this.sim) {
      throw new Error('EECircuitEngine not initialised — call init() first');
    }
    this.sim.setNetList(netlist);
    const result = await this.runWithTimeout();
    return extractMultiNodeOutput(result);
  }

  private runWithTimeout(): Promise<ResultType> {
    return new Promise<ResultType>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(
            new Error(
              `Simulation timed out after ${SIM_TIMEOUT_MS / 1000}s. The circuit may have convergence issues or be too complex.`,
            ),
          ),
        SIM_TIMEOUT_MS,
      );
      this.sim!.runSim().then(
        (r) => {
          clearTimeout(timer);
          resolve(r);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        },
      );
    });
  }
}
