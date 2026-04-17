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
 * Also auto-grounds the neg handles of in/out nodes when they are
 * not explicitly wired — without this, the Vin source and Rprobe
 * create floating nets that cause ngspice singular-matrix failures.
 */
export function makeCircuit(
  components: Array<ComponentNode>,
  edges: Array<Edge>,
): { nodes: Array<ComponentNode>; edges: Array<Edge> } {
  const hasIn = components.some(
    (n) => n.type === 'jack' && n.data.direction === 'in',
  );
  const hasOut = components.some(
    (n) => n.type === 'jack' && n.data.direction === 'out',
  );
  const inId = hasIn
    ? components.find((n) => n.type === 'jack' && n.data.direction === 'in')!.id
    : 'in';
  const outId = hasOut
    ? components.find((n) => n.type === 'jack' && n.data.direction === 'out')!
        .id
    : 'out';

  const nodes: Array<ComponentNode> = [
    ...(!hasIn
      ? [
          {
            id: 'in',
            type: 'jack' as const,
            position: { x: 0, y: 0 },
            data: { label: 'INPUT', direction: 'in' as const },
          },
        ]
      : []),
    ...components,
    ...(!hasOut
      ? [
          {
            id: 'out',
            type: 'jack' as const,
            position: { x: 500, y: 0 },
            data: { label: 'OUTPUT', direction: 'out' as const },
          },
        ]
      : []),
  ];

  const extraEdges: Array<Edge> = [];

  // Auto-ground in/out neg handles if not already wired
  const handlesUsed = new Set(
    edges.flatMap((e) => [
      `${e.source}|${e.sourceHandle}`,
      `${e.target}|${e.targetHandle}`,
    ]),
  );

  if (!handlesUsed.has(`${inId}|neg`)) {
    nodes.push({
      id: '__g_in',
      type: 'ground',
      position: { x: 0, y: 100 },
      data: { label: 'GND' },
    });
    extraEdges.push({
      id: '__e_in_gnd',
      source: inId,
      sourceHandle: 'neg',
      target: '__g_in',
      targetHandle: 'gnd',
    });
  }

  if (!handlesUsed.has(`${outId}|neg`)) {
    nodes.push({
      id: '__g_out',
      type: 'ground',
      position: { x: 500, y: 100 },
      data: { label: 'GND' },
    });
    extraEdges.push({
      id: '__e_out_gnd',
      source: outId,
      sourceHandle: 'neg',
      target: '__g_out',
      targetHandle: 'gnd',
    });
  }

  return { nodes, edges: [...edges, ...extraEdges] };
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
