// @vitest-environment node
//
// Integration tests that run real SPICE simulations via the eecircuit-engine
// WASM binary. These validate that netlist compilation produces correct output
// and that the simulation results are physically plausible and consistent.

import type { Edge } from '@xyflow/react';
import { describe, expect, it, beforeAll } from 'vitest';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { compileNetlist } from '../lib/netlist';
import type { ComponentNode } from '../lib/types';

const engine = new EECircuitEngine();

beforeAll(async () => {
  await engine.init();
}, 15000);

// ─── Helpers ────────────────────────────────────────────────────────

function makeCircuit(
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

/** RMS of a number array */
function rms(values: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < values.length; i++) sum += values[i] * values[i];
  return Math.sqrt(sum / values.length);
}

/** Peak absolute value */
function peak(values: ArrayLike<number>): number {
  let max = 0;
  for (let i = 0; i < values.length; i++) {
    const a = Math.abs(values[i]);
    if (a > max) max = a;
  }
  return max;
}

// ─── Tests ──────────────────────────────────────────────────────────

describe('passthrough (wire only)', () => {
  it('output matches input for a direct wire', async () => {
    const { nodes, edges } = makeCircuit(
      [],
      [
        {
          id: 'e1',
          source: 'in',
          sourceHandle: 'out',
          target: 'out',
          targetHandle: 'in',
        },
      ],
    );
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    // With a direct wire, output voltage should closely match the SIN input
    const peakV = peak(output.voltageValues);
    expect(peakV).toBeGreaterThan(0.9);
    expect(peakV).toBeLessThan(1.1);
  });
});

describe('low-pass RC filter', () => {
  // R=1k, C=100n → cutoff ~1.6 kHz
  const components: Array<ComponentNode> = [
    {
      id: 'r1',
      type: 'resistor',
      position: { x: 100, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    },
    {
      id: 'c1',
      type: 'capacitor',
      position: { x: 200, y: 0 },
      data: { label: 'C1', farads: 100e-9 },
    },
    {
      id: 'g1',
      type: 'ground',
      position: { x: 200, y: 100 },
      data: { label: 'GND' },
    },
  ];
  const edges: Array<Edge> = [
    {
      id: 'e1',
      source: 'in',
      sourceHandle: 'out',
      target: 'r1',
      targetHandle: 'a',
    },
    {
      id: 'e2',
      source: 'r1',
      sourceHandle: 'b',
      target: 'c1',
      targetHandle: 'a',
    },
    {
      id: 'e3',
      source: 'r1',
      sourceHandle: 'b',
      target: 'out',
      targetHandle: 'in',
    },
    {
      id: 'e4',
      source: 'c1',
      sourceHandle: 'b',
      target: 'g1',
      targetHandle: 'gnd',
    },
  ];

  it('passes low frequency (100 Hz) with minimal attenuation', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.05, 100, 1.0);
    const output = await engine.run(netlist);
    // 100 Hz is well below 1.6 kHz cutoff — should pass through ~fully
    const peakV = peak(output.voltageValues);
    expect(peakV).toBeGreaterThan(0.85);
  });

  it('attenuates high frequency (5000 Hz)', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 5000, 1.0);
    const output = await engine.run(netlist);
    // 5 kHz is well above 1.6 kHz cutoff — should be significantly attenuated
    // Skip initial transient (first 10% of samples)
    const skip = Math.floor(output.voltageValues.length * 0.1);
    const steady = output.voltageValues.slice(skip);
    const peakV = peak(steady);
    expect(peakV).toBeLessThan(0.5);
  });
});

describe('high-pass RC filter', () => {
  // C=100n, R=1k → cutoff ~1.6 kHz
  const components: Array<ComponentNode> = [
    {
      id: 'c1',
      type: 'capacitor',
      position: { x: 100, y: 0 },
      data: { label: 'C1', farads: 100e-9 },
    },
    {
      id: 'r1',
      type: 'resistor',
      position: { x: 200, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    },
    {
      id: 'g1',
      type: 'ground',
      position: { x: 200, y: 100 },
      data: { label: 'GND' },
    },
  ];
  const edges: Array<Edge> = [
    {
      id: 'e1',
      source: 'in',
      sourceHandle: 'out',
      target: 'c1',
      targetHandle: 'a',
    },
    {
      id: 'e2',
      source: 'c1',
      sourceHandle: 'b',
      target: 'r1',
      targetHandle: 'a',
    },
    {
      id: 'e3',
      source: 'c1',
      sourceHandle: 'b',
      target: 'out',
      targetHandle: 'in',
    },
    {
      id: 'e4',
      source: 'r1',
      sourceHandle: 'b',
      target: 'g1',
      targetHandle: 'gnd',
    },
  ];

  it('passes high frequency (5000 Hz) with minimal attenuation', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 5000, 1.0);
    const output = await engine.run(netlist);
    const skip = Math.floor(output.voltageValues.length * 0.1);
    const steady = output.voltageValues.slice(skip);
    const peakV = peak(steady);
    expect(peakV).toBeGreaterThan(0.85);
  });

  it('attenuates low frequency (100 Hz)', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.05, 100, 1.0);
    const output = await engine.run(netlist);
    const skip = Math.floor(output.voltageValues.length * 0.1);
    const steady = output.voltageValues.slice(skip);
    const peakV = peak(steady);
    expect(peakV).toBeLessThan(0.5);
  });
});

describe('voltage divider', () => {
  it('two equal resistors halve the voltage', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R2', ohms: 10000 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'r2',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out',
        targetHandle: 'in',
      },
      {
        id: 'e4',
        source: 'r2',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    const skip = Math.floor(output.voltageValues.length * 0.1);
    const steady = output.voltageValues.slice(skip);
    const peakV = peak(steady);
    // Should be ~0.5 (half of 1.0V input)
    expect(peakV).toBeGreaterThan(0.45);
    expect(peakV).toBeLessThan(0.55);
  });
});

describe('simulation determinism', () => {
  it('same circuit produces identical results on repeated runs', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 200, y: 0 },
        data: { label: 'C1', farads: 100e-9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out',
        targetHandle: 'in',
      },
      {
        id: 'e4',
        source: 'c1',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 1.0);

    const run1 = await engine.run(netlist);
    const run2 = await engine.run(netlist);

    expect(run1.voltageValues.length).toBe(run2.voltageValues.length);
    for (let i = 0; i < run1.voltageValues.length; i++) {
      expect(run1.voltageValues[i]).toBe(run2.voltageValues[i]);
    }
  });
});

describe('voltageToAudioBuffer integration', () => {
  it('full pipeline: compile → simulate → convert to audio buffer', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out',
        targetHandle: 'in',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    const audio = voltageToAudioBuffer(output, 44100);

    expect(audio).toBeInstanceOf(Float32Array);
    expect(audio.length).toBeGreaterThan(0);
    // Audio buffer should contain non-zero values
    expect(peak(audio)).toBeGreaterThan(0);
  });
});
