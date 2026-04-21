// @vitest-environment node
//
// Polarized capacitor tests: verifies that cap_polar compiles to the same
// SPICE element as a regular capacitor and behaves identically in simulation.
//
// Polarized caps are used for coupling (e.g. C4 in the RAT output stage).
// They must produce the same electrical behavior as non-polarized caps —
// only the schematic symbol and handle names (pos/neg) differ.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  NETLIST COMPILATION                                               │
// │                                                                    │
// │  cap_polar should emit the same SPICE element line as a regular    │
// │  capacitor: "C1 n_pos n_neg <value>"                               │
// │  The only difference is the handle names (pos/neg vs a/b).         │
// └────────────────────────────────────────────────────────────────────┘
describe('cap_polar netlist compilation', () => {
  it('emits a SPICE capacitor element with correct value', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'jack',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT', direction: 'in' },
      },
      {
        id: 'cp1',
        type: 'cap_polar',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'out1',
        type: 'jack',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT', direction: 'out' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in1',
        sourceHandle: 'pos',
        target: 'cp1',
        targetHandle: 'pos',
      },
      {
        id: 'e2',
        source: 'cp1',
        sourceHandle: 'neg',
        target: 'out1',
        targetHandle: 'pos',
      },
    ];
    const netlist = compileNetlist(nodes, edges);
    // Should emit "C1 <node> <node> 1u"
    expect(netlist).toMatch(/^C1 \S+ \S+ 1u$/m);
  });

  it('formats picofarad values correctly', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'jack',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT', direction: 'in' },
      },
      {
        id: 'cp1',
        type: 'cap_polar',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 100e-12 },
      },
      {
        id: 'out1',
        type: 'jack',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT', direction: 'out' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toMatch(/^C1 \S+ \S+ 100p$/m);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  LOW-PASS FILTER — cap_polar behaves identically to capacitor      │
// │                                                                    │
// │  Schematic:           R1 = 1kΩ                                     │
// │      INPUT ───┤R1├───┬─── OUTPUT                                   │
// │                      │                                             │
// │                    [C1+] 100nF (cap_polar)                         │
// │                      │                                             │
// │                     GND                                            │
// │                                                                    │
// │  Same RC low-pass as the regular capacitor test, but using         │
// │  cap_polar with pos/neg handles. Output should match.              │
// └────────────────────────────────────────────────────────────────────┘
describe('cap_polar in RC low-pass filter', () => {
  function makeFilter() {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'cp1',
        type: 'cap_polar',
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
        target: 'cp1',
        targetHandle: 'pos',
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
        source: 'cp1',
        sourceHandle: 'neg',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    return makeCircuit(components, edges);
  }

  it('passes low frequencies with minimal attenuation', async () => {
    const { nodes, edges } = makeFilter();
    // 100 Hz — well below cutoff of ~1592 Hz
    const netlist = compileNetlist(nodes, edges, 0.02, 100, 1.0);
    const output = await engine.run(netlist);
    const peakV = peak(output.voltageValues, 0.2);
    expect(peakV).toBeGreaterThan(0.9);
  });

  it('attenuates high frequencies', async () => {
    const { nodes, edges } = makeFilter();
    // 5000 Hz — well above cutoff of ~1592 Hz
    const netlist = compileNetlist(nodes, edges, 0.01, 5000, 1.0);
    const output = await engine.run(netlist);
    const peakV = peak(output.voltageValues, 0.2);
    expect(peakV).toBeLessThan(0.35);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  COUPLING CAP — DC blocking, AC passing                            │
// │                                                                    │
// │  Schematic:                                                        │
// │      VCC (5V) ── R1 (10kΩ) ──┬── C1+ (1µF) ── OUTPUT               │
// │                              │                                     │
// │                             GND                                    │
// │                                                                    │
// │  The polarized coupling cap blocks the 5V DC bias and passes       │
// │  only the AC signal. This is the typical use case for polarized    │
// │  caps in audio circuits (e.g. RAT C4 output coupling).             │
// └────────────────────────────────────────────────────────────────────┘
describe('cap_polar as coupling capacitor', () => {
  it('blocks DC and passes AC', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'vcc',
        type: 'power',
        position: { x: 0, y: 0 },
        data: { label: 'VCC', volts: 5 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
      {
        id: 'cp1',
        type: 'cap_polar',
        position: { x: 200, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'rload',
        type: 'resistor',
        position: { x: 300, y: 0 },
        data: { label: 'R2', ohms: 10000 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 300, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      // VCC → R1
      {
        id: 'e1',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      // R1 → input signal junction
      {
        id: 'e2',
        source: 'in',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'b',
      },
      // Junction → C1 pos
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'cp1',
        targetHandle: 'pos',
      },
      // C1 neg → output + load
      {
        id: 'e4',
        source: 'cp1',
        sourceHandle: 'neg',
        target: 'out',
        targetHandle: 'pos',
      },
      {
        id: 'e5',
        source: 'cp1',
        sourceHandle: 'neg',
        target: 'rload',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'rload',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.02, 1000, 0.5);
    const output = await engine.run(netlist);

    // Output should be AC-only — centered near 0V, not at 5V DC
    const skip = Math.floor(output.voltageValues.length * 0.3);
    const steady = output.voltageValues.slice(skip);
    let sum = 0;
    for (let i = 0; i < steady.length; i++) {
      sum += steady[i];
    }
    const dcOffset = Math.abs(sum / steady.length);

    // DC offset should be small (cap blocks DC)
    expect(dcOffset).toBeLessThan(0.5);
    // AC content should be present
    expect(peak(output.voltageValues, 0.3)).toBeGreaterThan(0.1);
  });
});
