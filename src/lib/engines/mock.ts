// src/lib/engines/mock.ts
import type { SimulationOutput, SpiceEngine } from '../spice-engine';

export class MockSpiceEngine implements SpiceEngine {
  constructor(
    private readonly frequency = 1000,
    private readonly amplitude = 1.0,
    private readonly sampleRate = 44100,
  ) {}

  async init(): Promise<void> {}

  async run(_netlist: string): Promise<SimulationOutput> {
    const n = this.sampleRate;
    const timeValues = new Float64Array(n);
    const voltageValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      timeValues[i] = i / this.sampleRate;
      voltageValues[i] =
        this.amplitude * Math.sin(2 * Math.PI * this.frequency * timeValues[i]);
    }
    return { timeValues, voltageValues };
  }
}
