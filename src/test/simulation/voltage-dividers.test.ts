// @vitest-environment node
//
// Voltage divider tests: AC divider ratios, DC accuracy with power supplies,
// and component value sensitivity.
//
// Voltage dividers are how potentiometers work (volume knob = voltage divider).
// Getting the ratio wrong would make every pot-based control inaccurate.
// Component value sensitivity ensures that changes to resistor values actually
// propagate through to the simulation output.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak, snapshot } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  VOLTAGE DIVIDER — Two equal resistors                             │
// │                                                                    │
// │  Schematic:           R1 = 10kΩ                                    │
// │      INPUT ───┤R1├───┬─── OUTPUT                                   │
// │                      │                                             │
// │                     [R2] 10kΩ                                      │
// │                      │                                             │
// │                     GND                                            │
// │                                                                    │
// │  Vout = Vin × R2/(R1+R2) = Vin × 10k/(10k+10k) = Vin × 0.5         │
// │                                                                    │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭╮  ╭╮                       │
// │        ───╯ ╰───╯ ╰───    →       ────╯╰──╯╰────                   │
// │           1V peak                     0.5V peak                    │
// │                                                                    │
// │  Why it matters: the voltage divider is how potentiometers work    │
// │  (volume knob = voltage divider). Getting the ratio wrong would    │
// │  make every pot-based control inaccurate.                          │
// └────────────────────────────────────────────────────────────────────┘
describe('voltage divider', () => {
  it('two equal 10k resistors halve the voltage', async () => {
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
        sourceHandle: 'pos',
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
        targetHandle: 'pos',
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

    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.48);
    expect(peakV).toBeLessThan(0.52);
  });

  it('3:1 ratio (R1=30k, R2=10k) gives 0.25 of input', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 30000 },
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
        sourceHandle: 'pos',
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
        targetHandle: 'pos',
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

    // Vout = 10k/(30k+10k) = 0.25
    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.23);
    expect(peakV).toBeLessThan(0.27);
  });

  it('produces deterministic snapshot', async () => {
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
        sourceHandle: 'pos',
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
        targetHandle: 'pos',
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
    const netlist = compileNetlist(nodes, e, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);

    const snap = snapshot(output.voltageValues, 8);
    expect(snap).toMatchSnapshot();
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  VOLTAGE DIVIDER DC ACCURACY                                       │
// │                                                                    │
// │  The simplest possible DC test: two resistors dividing a           │
// │  voltage. SPICE should get this exact to floating-point            │
// │  precision. Any error here means the solver is fundamentally       │
// │  broken.                                                           │
// │                                                                    │
// │  Schematic:  9V DC ──┤R1 (9kΩ)├──┬── Vout                          │
// │                                  │                                 │
// │                                 [R2] 1kΩ                           │
// │                                  │                                 │
// │                                 GND                                │
// │                                                                    │
// │  Vout = 9V × R2/(R1+R2) = 9 × 1k/(9k+1k) = 0.9V                    │
// │                                                                    │
// │  Acceptable error: < 0.01%                                         │
// └────────────────────────────────────────────────────────────────────┘
describe('voltage divider DC accuracy', () => {
  it('9V through 9k/1k divider gives exactly 0.9V', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'vcc',
        type: 'power',
        position: { x: 50, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 9000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R2', ohms: 1000 },
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
        source: 'vcc',
        sourceHandle: 'pos',
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
        targetHandle: 'pos',
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
    // Use 0V amplitude sine so only DC is present
    const netlist = compileNetlist(nodes, e, 0.001, 1000, 0.0);
    const output = await engine.run(netlist);

    // All samples should be ~0.9V (DC steady state)
    const lastV = output.voltageValues[output.voltageValues.length - 1];
    expect(Math.abs(lastV - 0.9)).toBeLessThan(0.001); // < 0.1% error
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  COMPONENT VALUE SENSITIVITY                                       │
// │                                                                    │
// │  Same topology, different resistor values → different output.      │
// │  Verifies that component value changes actually propagate to       │
// │  the simulation (not silently ignored or cached).                  │
// │                                                                    │
// │  Schematic:  INPUT ──┤R1├──┬── OUTPUT                              │
// │                           ═╪═ C1 (100nF)                           │
// │                           GND                                      │
// │                                                                    │
// │  R1 = 100Ω  → fc ≈ 16 kHz  (5 kHz passes easily)                   │
// │  R1 = 10kΩ  → fc ≈ 160 Hz  (5 kHz heavily attenuated)              │
// │                                                                    │
// │  Why it matters: if the netlist compiler ignores a resistor        │
// │  value change (e.g., uses a cached netlist), both runs would       │
// │  produce the same output. This test ensures they don't.            │
// └────────────────────────────────────────────────────────────────────┘
describe('component value sensitivity', () => {
  it('changing R in low-pass filter changes the output', async () => {
    function buildLowPass(ohms: number) {
      const components: Array<ComponentNode> = [
        {
          id: 'r1',
          type: 'resistor',
          position: { x: 100, y: 0 },
          data: { label: 'R1', ohms },
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
          sourceHandle: 'pos',
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
          targetHandle: 'pos',
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

    // R=100Ω → fc=16kHz → 5kHz passes easily
    const { nodes: n1, edges: e1 } = buildLowPass(100);
    const out1 = await engine.run(compileNetlist(n1, e1, 0.005, 5000, 1.0));
    const peak1 = peak(out1.voltageValues, 0.1);

    // R=10kΩ → fc=160Hz → 5kHz is heavily attenuated
    const { nodes: n2, edges: e2 } = buildLowPass(10000);
    const out2 = await engine.run(compileNetlist(n2, e2, 0.005, 5000, 1.0));
    const peak2 = peak(out2.voltageValues, 0.1);

    // R=100Ω should pass much more signal than R=10kΩ
    expect(peak1).toBeGreaterThan(peak2 * 3);
  });
});
