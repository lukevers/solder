// src/lib/audio-convert.ts
import type { SimulationOutput } from './spice-engine';

/**
 * Resamples a variable-step ngspice voltage time series to a fixed-rate
 * Float32Array at `sampleRate` Hz, then normalises to [-1, 1].
 */
export function voltageToAudioBuffer(
  output: SimulationOutput,
  sampleRate: number,
): Float32Array {
  const { timeValues, voltageValues } = output;
  if (timeValues.length === 0) return new Float32Array(0);

  const maxTime = timeValues[timeValues.length - 1];
  const n = Math.max(1, Math.round(maxTime * sampleRate));
  const result = new Float32Array(n);

  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    // Advance j so that timeValues[j] <= t < timeValues[j+1]
    while (j < timeValues.length - 2 && timeValues[j + 1] <= t) j++;

    const t0 = timeValues[j];
    const t1 = timeValues[j + 1] ?? t0;
    const v0 = voltageValues[j];
    const v1 = voltageValues[j + 1] ?? v0;

    if (t1 === t0) {
      result[i] = v0;
    } else {
      const alpha = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      result[i] = v0 + alpha * (v1 - v0);
    }
  }

  // Normalise: divide by peak absolute value, floor at 0.01 to avoid ÷0
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(result[i]));
  const scale = 1 / Math.max(peak, 0.01);
  for (let i = 0; i < n; i++) result[i] *= scale;

  return result;
}
