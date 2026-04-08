// @vitest-environment node
//
// Simulation determinism, amplitude linearity, and long transient stability.
//
// Determinism is critical because the waveform display shows exact voltage
// values and users compare before/after. Any non-determinism would make the
// tool unreliable. Amplitude linearity ensures passive circuits scale
// proportionally. Long transient stability catches numerical error accumulation
// over multi-second audio simulations.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌──────────────────────────────────────────────────────────────────┐
// │  SIMULATION DETERMINISM                                          │
// │                                                                  │
// │  The same netlist must produce bit-identical results every time. │
// │  This is critical because the waveform display shows exact       │
// │  voltage values and users compare before/after. Any              │
// │  non-determinism would make the tool unreliable.                 │
// │                                                                  │
// │  We run the same low-pass filter twice and compare every sample. │
// └──────────────────────────────────────────────────────────────────┘
describe('simulation determinism', () => {
  it('same circuit produces bit-identical results on repeated runs', async () => {
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  AMPLITUDE LINEARITY                                             │
// │                                                                  │
// │  Same circuit, different input amplitudes. A passive linear      │
// │  circuit (resistors, capacitors) should scale proportionally:    │
// │  doubling the input doubles the output.                          │
// │                                                                  │
// │  Schematic (same low-pass):                                      │
// │      INPUT ───┤R1├───┬─── OUTPUT                                 │
// │                      │                                           │
// │                     ═╪═ C1                                       │
// │                      │                                           │
// │                     GND                                          │
// │                                                                  │
// │  Run 1: Vin = 0.5V peak → Vout = X                               │
// │  Run 2: Vin = 1.0V peak → Vout = 2X (should be exactly 2x)       │
// │                                                                  │
// │  Why it matters: if the SPICE engine introduces nonlinearity in  │
// │  a linear circuit, every simulation is wrong. This also catches  │
// │  normalization bugs in the amplitude parameter.                  │
// └──────────────────────────────────────────────────────────────────┘
describe('amplitude linearity', () => {
  it('doubling input amplitude doubles output (linear circuit)', async () => {
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

    const net1 = compileNetlist(nodes, e, 0.01, 1000, 0.5);
    const out1 = await engine.run(net1);
    const peak1 = peak(out1.voltageValues, 0.1);

    const net2 = compileNetlist(nodes, e, 0.01, 1000, 1.0);
    const out2 = await engine.run(net2);
    const peak2 = peak(out2.voltageValues, 0.1);

    // Ratio should be very close to 2.0
    const ratio = peak2 / peak1;
    expect(ratio).toBeGreaterThan(1.95);
    expect(ratio).toBeLessThan(2.05);
  });
});

// ┌──────────────────────────────────────────────────────────────────┐
// │  LONG TRANSIENT STABILITY                                        │
// │                                                                  │
// │  A common SPICE pitfall: numerical error accumulates over long   │
// │  simulations. Audio simulations can be several seconds long      │
// │  (the guitar sample is ~2 seconds). This test verifies that the  │
// │  simulation doesn't drift.                                       │
// │                                                                  │
// │  We run a 0.5-second passthrough simulation and compare the      │
// │  first and last cycles of the sine wave — they should be         │
// │  identical.                                                      │
// │                                                                  │
// │  First cycle:   ╭─╮          Last cycle:    ╭─╮                  │
// │              ───╯ ╰───    ≈              ───╯ ╰───               │
// │               (identical)                (should match)          │
// │                                                                  │
// │  Acceptable error: < 0.1% drift over 0.5 seconds.              │
// └──────────────────────────────────────────────────────────────────┘
describe('long transient stability', () => {
  it('no amplitude drift over 0.5 seconds', async () => {
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
    const netlist = compileNetlist(nodes, edges, 0.5, 1000, 1.0);
    const output = await engine.run(netlist);

    const len = output.voltageValues.length;
    // Peak of first 10% of samples
    const earlyPeak = peak(
      output.voltageValues.slice(0, Math.floor(len * 0.1)),
    );
    // Peak of last 10% of samples
    const latePeak = peak(output.voltageValues.slice(Math.floor(len * 0.9)));

    // Should be within 0.1% of each other
    const drift = Math.abs(earlyPeak - latePeak) / earlyPeak;
    expect(drift).toBeLessThan(0.001);
  });
});
