// src/lib/engines/mock.ts
import type { SimulationOutput, SpiceEngine } from '../spice-engine';

export class MockSpiceEngine implements SpiceEngine {
  private frequency: number;
  private amplitude: number;
  private sampleRate: number;

  constructor(frequency = 1000, amplitude = 1.0, sampleRate = 44100) {
    this.frequency = frequency;
    this.amplitude = amplitude;
    this.sampleRate = sampleRate;
  }

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
