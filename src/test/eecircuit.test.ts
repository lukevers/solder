import type { ResultType } from 'eecircuit-engine';
import { describe, expect, it } from 'vitest';
import {
  EECircuitEngine,
  extractSimulationOutput,
} from '../lib/engines/eecircuit';

function makeRealResult(
  overrides: Partial<Extract<ResultType, { dataType: 'real' }>> = {},
): Extract<ResultType, { dataType: 'real' }> {
  return {
    header: '',
    numVariables: 2,
    variableNames: ['time', 'v(n1)'],
    numPoints: 3,
    dataType: 'real',
    data: [
      { name: 'time', type: 'time', values: [0, 1e-5, 2e-5] },
      { name: 'v(n1)', type: 'voltage', values: [0, 0.5, 1.0] },
    ],
    ...overrides,
  };
}

describe('extractSimulationOutput', () => {
  it('extracts time and voltage from a real ResultType', () => {
    const output = extractSimulationOutput(makeRealResult());
    expect(output.timeValues).toEqual(new Float64Array([0, 1e-5, 2e-5]));
    expect(output.voltageValues).toEqual(new Float64Array([0, 0.5, 1.0]));
  });

  it('returns Float64Arrays', () => {
    const output = extractSimulationOutput(makeRealResult());
    expect(output.timeValues).toBeInstanceOf(Float64Array);
    expect(output.voltageValues).toBeInstanceOf(Float64Array);
  });

  it('throws when result has no time entry', () => {
    const result = makeRealResult({
      data: [{ name: 'v(n1)', type: 'voltage', values: [0, 0.5] }],
    });
    expect(() => extractSimulationOutput(result)).toThrow('missing time axis');
  });

  it('throws when result has no voltage entry', () => {
    const result = makeRealResult({
      data: [{ name: 'time', type: 'time', values: [0, 1e-5] }],
    });
    expect(() => extractSimulationOutput(result)).toThrow(
      'missing voltage data',
    );
  });

  it('throws on complex (AC) result', () => {
    const result: ResultType = {
      header: '',
      numVariables: 2,
      variableNames: ['frequency', 'v(n1)'],
      numPoints: 3,
      dataType: 'complex',
      data: [
        { name: 'frequency', type: 'frequency', values: [{ real: 0, img: 0 }] },
        { name: 'v(n1)', type: 'voltage', values: [{ real: 0, img: 0 }] },
      ],
    };
    expect(() => extractSimulationOutput(result)).toThrow('Expected real');
  });
});

describe('EECircuitEngine', () => {
  it('run() without init() rejects with not-initialised error', async () => {
    const engine = new EECircuitEngine();
    await expect(engine.run('* test')).rejects.toThrow('not initialised');
  });
});
