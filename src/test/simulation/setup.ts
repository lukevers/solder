// src/test/simulation/setup.ts
//
// Shared setup for all simulation integration tests.
//
// These tests run real SPICE simulations via the eecircuit-engine WASM binary
// in a Node.js environment (not jsdom). Each test file builds a circuit from
// ComponentNodes + Edges, compiles it to a SPICE netlist, runs the simulation
// via ngspice WASM, and checks the output voltages against expected behavior.
//
// The full pipeline under test:
//
//   ComponentNodes + Edges
//        │  compileNetlist()     — src/lib/netlist.ts
//        ▼
//   SPICE netlist string
//        │  engine.run()         — eecircuit-engine (ngspice WASM)
//        ▼
//   { timeValues, voltageValues }
//        │  voltageToAudioBuffer() — src/lib/audio-convert.ts
//        ▼
//   Float32Array @ 44100 Hz

import type { Edge } from '@xyflow/react';
import { EECircuitEngine } from '../../lib/engines/eecircuit';
import type { ComponentNode } from '../../lib/types';

// Shared engine instance — initialized once in beforeAll
export const engine = new EECircuitEngine();

/**
 * Wraps a list of components + edges into a complete circuit by
 * auto-adding INPUT and OUTPUT nodes if not already present.
 * This lets each test focus on the circuit-under-test without
 * repeating the boilerplate audiin/audiout nodes.
 */
export function makeCircuit(
  components: Array<ComponentNode>,
  edges: Array<Edge>,
): { nodes: Array<ComponentNode>; edges: Array<Edge> } {
  const hasIn = components.some((n) => n.type === 'audiin');
  const hasOut = components.some((n) => n.type === 'audiout');
  const nodes = [
    ...(!hasIn
      ? [
          {
            id: 'in',
            type: 'audiin' as const,
            position: { x: 0, y: 0 },
            data: { label: 'INPUT' },
          },
        ]
      : []),
    ...components,
    ...(!hasOut
      ? [
          {
            id: 'out',
            type: 'audiout' as const,
            position: { x: 500, y: 0 },
            data: { label: 'OUTPUT' },
          },
        ]
      : []),
  ];
  return { nodes, edges };
}

/**
 * Peak absolute value of a numeric array.
 * @param skipFraction - skip this fraction of initial samples (transient settling)
 */
export function peak(values: ArrayLike<number>, skipFraction = 0): number {
  const start = Math.floor(values.length * skipFraction);
  let max = 0;
  for (let i = start; i < values.length; i++) {
    const a = Math.abs(values[i]);
    if (a > max) max = a;
  }
  return max;
}

/**
 * Sample N evenly-spaced voltage values, rounded to `decimals` places.
 * Used for deterministic snapshot tests that lock exact WASM output.
 */
export function snapshot(
  values: Float64Array,
  n: number,
  decimals = 6,
): Array<number> {
  const result: Array<number> = [];
  const step = Math.max(1, Math.floor(values.length / n));
  for (let i = 0; i < values.length && result.length < n; i += step) {
    result.push(Number.parseFloat(values[i].toFixed(decimals)));
  }
  return result;
}

/**
 * Measure the AC swing (max - min) in the steady-state portion of a signal.
 * @param skipFraction - fraction of samples to skip at the start
 */
export function acSwing(values: ArrayLike<number>, skipFraction = 0.2): number {
  const start = Math.floor(values.length * skipFraction);
  let min = Infinity;
  let max = -Infinity;
  for (let i = start; i < values.length; i++) {
    if (values[i] < min) min = values[i];
    if (values[i] > max) max = values[i];
  }
  return max - min;
}
