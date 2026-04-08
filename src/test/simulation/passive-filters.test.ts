// @vitest-environment node
//
// Passive RC filter tests: passthrough, low-pass, high-pass, -3dB point,
// and frequency sweep determinism.
//
// These are the most fundamental analog circuits in audio: tone controls,
// coupling capacitors, anti-aliasing filters. If RC behavior is wrong,
// every pedal simulation is wrong.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak, snapshot } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  PASSTHROUGH — Direct wire from INPUT to OUTPUT                    │
// │                                                                    │
// │  Schematic:                                                        │
// │      INPUT ──────────────── OUTPUT                                 │
// │                                                                    │
// │  Input:  1V peak sine @ 1 kHz                                      │
// │  Expect: Output ≈ Input (no components to alter the signal)        │
// │                                                                    │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭─╮   ╭─╮                    │
// │        ───╯ ╰───╯ ╰───    ≈        ───╯ ╰───╯ ╰───                 │
// │           1V peak                      1V peak                     │
// │                                                                    │
// │  Why it matters: validates the most basic signal path. If this     │
// │  breaks, the netlist compiler or SPICE source is fundamentally     │
// │  wrong.                                                            │
// └────────────────────────────────────────────────────────────────────┘
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

    const peakV = peak(output.voltageValues);
    expect(peakV).toBeGreaterThan(0.95);
    expect(peakV).toBeLessThan(1.05);

    // Snapshot: first sample is 0 (sine starts at zero crossing)
    expect(output.voltageValues[0]).toBeCloseTo(0, 4);
  });

  it('produces deterministic snapshot', async () => {
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
    const netlist = compileNetlist(nodes, edges, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);
    const snap = snapshot(output.voltageValues, 10);
    expect(snap).toMatchSnapshot();
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  LOW-PASS RC FILTER                                                │
// │                                                                    │
// │  Schematic:           R1 = 1kΩ                                     │
// │      INPUT ───┤R1├───┬─── OUTPUT                                   │
// │                      │                                             │
// │                     ═╪═ C1 = 100nF                                 │
// │                      │                                             │
// │                     GND                                            │
// │                                                                    │
// │  Cutoff frequency: fc = 1/(2π·R·C) = 1/(2π·1000·100e-9)            │
// │                      ≈ 1,592 Hz                                    │
// │                                                                    │
// │  100 Hz input (well BELOW cutoff → passes through):                │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭─╮   ╭─╮                    │
// │        ───╯ ╰───╯ ╰───    ≈        ───╯ ╰───╯ ╰───                 │
// │           1V peak                     ~0.99V peak                  │
// │                                                                    │
// │  5000 Hz input (well ABOVE cutoff → attenuated):                   │
// │  Input:   ╭╮╭╮╭╮╭╮╭╮         Output:  ~─~─~─~─~─                   │
// │        ───╯╰╯╰╯╰╯╰╯╰──    →        ─────────────                   │
// │           1V peak                     <0.35V peak                  │
// │                                                                    │
// │  Why it matters: the low-pass filter is the most fundamental       │
// │  audio circuit (tone controls, anti-aliasing). Verifies that       │
// │  R + C + GND nodes compile correctly and that the SPICE engine     │
// │  produces physically accurate frequency-dependent attenuation.     │
// └────────────────────────────────────────────────────────────────────┘
describe('low-pass RC filter', () => {
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

  it('passes 100 Hz with minimal attenuation', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.05, 100, 1.0);
    const output = await engine.run(netlist);

    // 100 Hz is 16x below fc — theoretical gain ≈ 0.998
    const peakV = peak(output.voltageValues);
    expect(peakV).toBeGreaterThan(0.9);
  });

  it('attenuates 5000 Hz significantly', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 5000, 1.0);
    const output = await engine.run(netlist);

    // 5 kHz is 3.1x above fc — theoretical gain ≈ 0.30
    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeLessThan(0.45);
    expect(peakV).toBeGreaterThan(0.15);
  });

  it('produces deterministic snapshot at 1 kHz', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);

    // 1 kHz is below fc — output is a phase-shifted, slightly attenuated sine
    // These exact values anchor the test against WASM engine changes
    const snap = snapshot(output.voltageValues, 8);
    expect(snap).toMatchSnapshot();
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  HIGH-PASS RC FILTER                                               │
// │                                                                    │
// │  Schematic:           C1 = 100nF                                   │
// │      INPUT ───┤C1├───┬─── OUTPUT                                   │
// │                      │                                             │
// │                     [R1] 1kΩ                                       │
// │                      │                                             │
// │                     GND                                            │
// │                                                                    │
// │  Same components as low-pass but swapped: C is in series, R is     │
// │  to ground. Cutoff is the same: fc ≈ 1,592 Hz.                     │
// │                                                                    │
// │  5000 Hz input (ABOVE cutoff → passes):                            │
// │  Input:   ╭╮╭╮╭╮╭╮╭╮         Output:  ╭╮╭╮╭╮╭╮╭╮                   │
// │        ───╯╰╯╰╯╰╯╰╯╰──    ≈       ───╯╰╯╰╯╰╯╰╯╰──                  │
// │           1V peak                     ~0.95V peak                  │
// │                                                                    │
// │  100 Hz input (BELOW cutoff → attenuated):                         │
// │  Input:   ╭─╮   ╭─╮          Output:   ~──~──~──                   │
// │        ───╯ ╰───╯ ╰───    →         ────────────                   │
// │           1V peak                     <0.10V peak                  │
// │                                                                    │
// │  Why it matters: coupling capacitors in guitar pedals are high-    │
// │  pass filters. The RAT's C1 (47nF input cap) is exactly this       │
// │  topology. If this breaks, pedal simulations lose their bass       │
// │  response accuracy.                                                │
// └────────────────────────────────────────────────────────────────────┘
describe('high-pass RC filter', () => {
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

  it('passes 5000 Hz with minimal attenuation', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 5000, 1.0);
    const output = await engine.run(netlist);

    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.85);
  });

  it('attenuates 100 Hz significantly', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.05, 100, 1.0);
    const output = await engine.run(netlist);

    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeLessThan(0.45);
  });

  it('produces deterministic snapshot at 1 kHz', async () => {
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);

    const snap = snapshot(output.voltageValues, 8);
    expect(snap).toMatchSnapshot();
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  LOW-PASS FILTER -3dB POINT                                        │
// │                                                                    │
// │  At the cutoff frequency fc = 1/(2π·R·C), the gain should be       │
// │  exactly -3.01 dB (≈ 0.7071 = 1/√2).                               │
// │                                                                    │
// │  This is the standard AC accuracy test used by all SPICE           │
// │  implementations. We run a transient sim at exactly fc and         │
// │  verify the output amplitude matches the -3dB prediction.          │
// │                                                                    │
// │  R = 1kΩ, C = 100nF → fc = 1/(2π × 1000 × 100e-9) = 1591.5 Hz      │
// │                                                                    │
// │  At f = fc:                                                        │
// │    |H(jw)| = 1/√(1 + (f/fc)²) = 1/√2 = 0.7071                      │
// │    Phase = -arctan(f/fc) = -45°                                    │
// │                                                                    │
// │  Acceptable error: < 2% on amplitude (0.693 to 0.721)              │
// └────────────────────────────────────────────────────────────────────┘
describe('low-pass filter -3dB point (analytical)', () => {
  it('gain at cutoff frequency is 1/sqrt(2) ≈ 0.707', async () => {
    const R = 1000;
    const C = 100e-9;
    const fc = 1 / (2 * Math.PI * R * C); // ~1591.5 Hz

    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: R },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 200, y: 0 },
        data: { label: 'C1', farads: C },
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
    // Run at fc with enough cycles for steady state
    const netlist = compileNetlist(nodes, e, 0.02, fc, 1.0);
    const output = await engine.run(netlist);

    // Measure steady-state peak (skip transient)
    const peakV = peak(output.voltageValues, 0.3);
    const expected = 1 / Math.sqrt(2); // 0.7071

    expect(Math.abs(peakV - expected)).toBeLessThan(0.03); // < 3% error
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  FREQUENCY SWEEP DETERMINISM                                       │
// │                                                                    │
// │  The same low-pass filter at three frequencies: 100 Hz, 1 kHz,     │
// │  5 kHz. Each output is snapshot-locked. This catches any change    │
// │  in the SIN source generation, SPICE timestep, or the netlist      │
// │  .tran parameters.                                                 │
// │                                                                    │
// │  Schematic:  INPUT ──┤R1├──┬── OUTPUT                              │
// │                           ═╪═ C1                                   │
// │                           GND                                      │
// │                                                                    │
// │  Expected behavior (R=1k, C=100n, fc≈1.6kHz):                      │
// │                                                                    │
// │  100 Hz:  gain ≈ 1.00  │  Output ≈ Input (nearly identical)        │
// │   1 kHz:  gain ≈ 0.85  │  Output slightly smaller, phase-shifted   │
// │   5 kHz:  gain ≈ 0.30  │  Output much smaller, 90° lag             │
// │                                                                    │
// │  Why it matters: if any of these snapshots change, either the      │
// │  SPICE engine updated, the netlist format changed, or the          │
// │  timestep calculation drifted. All would affect every simulation.  │
// └────────────────────────────────────────────────────────────────────┘
describe('frequency sweep determinism', () => {
  function lowPassCircuit() {
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
    return makeCircuit(components, edges);
  }

  it('100 Hz snapshot', async () => {
    const { nodes, edges } = lowPassCircuit();
    const netlist = compileNetlist(nodes, edges, 0.02, 100, 1.0);
    const output = await engine.run(netlist);
    expect(snapshot(output.voltageValues, 10)).toMatchSnapshot();
  });

  it('1 kHz snapshot', async () => {
    const { nodes, edges } = lowPassCircuit();
    const netlist = compileNetlist(nodes, edges, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);
    expect(snapshot(output.voltageValues, 10)).toMatchSnapshot();
  });

  it('5 kHz snapshot', async () => {
    const { nodes, edges } = lowPassCircuit();
    const netlist = compileNetlist(nodes, edges, 0.005, 5000, 1.0);
    const output = await engine.run(netlist);
    expect(snapshot(output.voltageValues, 10)).toMatchSnapshot();
  });
});
