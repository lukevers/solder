import { describe, expect, it } from 'vitest';
import { MockSpiceEngine } from '../lib/engines/mock';

describe('MockSpiceEngine', () => {
  it('init() resolves without error', async () => {
    const engine = new MockSpiceEngine();
    await expect(engine.init()).resolves.toBeUndefined();
  });

  it('init() is idempotent — safe to call twice', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    await expect(engine.init()).resolves.toBeUndefined();
  });

  it('run() returns SimulationOutput with correct shape', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    const output = await engine.run('* dummy netlist\n.end');
    expect(output).toHaveProperty('timeValues');
    expect(output).toHaveProperty('voltageValues');
    expect(output.timeValues).toBeInstanceOf(Float64Array);
    expect(output.voltageValues).toBeInstanceOf(Float64Array);
  });

  it('run() returns same number of time and voltage points', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    const output = await engine.run('');
    expect(output.timeValues.length).toBe(output.voltageValues.length);
  });

  it('run() returns timeValues starting at 0', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    const output = await engine.run('');
    expect(output.timeValues[0]).toBe(0);
  });

  it('run() returns sampleRate points for 1 second by default', async () => {
    const sampleRate = 44100;
    const engine = new MockSpiceEngine(1000, 1.0, sampleRate);
    await engine.init();
    const output = await engine.run('');
    expect(output.timeValues.length).toBe(sampleRate);
  });
});
