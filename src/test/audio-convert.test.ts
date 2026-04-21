import { describe, expect, it } from 'vitest';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import type { SimulationOutput } from '../lib/spice-engine';

describe('voltageToAudioBuffer', () => {
  it('returns a Float32Array', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 1]),
      voltageValues: new Float64Array([0, 1]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result).toBeInstanceOf(Float32Array);
  });

  it('resamples to sampleRate * duration samples', () => {
    // 0.5 s at 44100 Hz = 22050 samples
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.5]),
      voltageValues: new Float64Array([0, 1]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.length).toBe(Math.round(0.5 * 44100));
  });

  it('normalises peak absolute value to 1.0', () => {
    const n = 200;
    const timeValues = new Float64Array(n);
    const voltageValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      timeValues[i] = i / n;
      voltageValues[i] = 2 * Math.sin(2 * Math.PI * (i / n));
    }
    const result = voltageToAudioBuffer({ timeValues, voltageValues }, n);
    const peak = Math.max(...Array.from(result).map(Math.abs));
    expect(peak).toBeCloseTo(1.0, 2);
  });

  it('does not divide by zero on silent output', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.001]),
      voltageValues: new Float64Array([0, 0]),
    };
    expect(() => voltageToAudioBuffer(output, 44100)).not.toThrow();
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('returns empty array for empty input', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array(0),
      voltageValues: new Float64Array(0),
    };
    expect(voltageToAudioBuffer(output, 44100).length).toBe(0);
  });

  it('handles variable-step time axis (non-uniform spacing)', () => {
    // Coarse at start, fine at end — should still produce uniform output
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.1, 0.11, 0.12, 0.2]),
      voltageValues: new Float64Array([0, 1, 1, 1, 0]),
    };
    expect(() => voltageToAudioBuffer(output, 100)).not.toThrow();
    expect(voltageToAudioBuffer(output, 100).length).toBe(20);
  });

  it('handles duplicate timestamps (t1 === t0)', () => {
    // Two points at the same time — the t1===t0 branch in audio-convert
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0, 0.001]),
      voltageValues: new Float64Array([0.5, 0.5, 1.0]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('single data point produces a 1-sample buffer', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array([0]),
      voltageValues: new Float64Array([0.5]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.length).toBe(1);
  });
});
