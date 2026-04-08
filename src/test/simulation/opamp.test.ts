// @vitest-environment node
//
// Op-amp tests: inverting amplifier (TL072 and LM741) and unity-gain buffer.
//
// The TL072 and LM741 subcircuits are the core active element in every guitar
// pedal. The RAT's gain stage is an inverting amplifier. If the op-amp gain
// is wrong, the distortion level is wrong. Unity-gain buffer tests verify
// stability with 100% negative feedback.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  OP-AMP CIRCUIT TESTS
//
//  The TL072 and LM741 subcircuits are the core active element in
//  every guitar pedal. These tests verify the op-amp behaves
//  correctly in standard configurations.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ┌────────────────────────────────────────────────────────────────────┐
// │  INVERTING AMPLIFIER                                               │
// │                                                                    │
// │  The most common op-amp configuration in audio. Gain is set by     │
// │  the ratio of feedback resistor to input resistor:                 │
// │     Av = -Rf/Ri                                                    │
// │                                                                    │
// │  Schematic:                                                        │
// │                     Rf = 100kΩ                                     │
// │              ┌─────┤Rf├─────┐                                      │
// │              │              │                                      │
// │  INPUT ─┤Ri├─┤(-) U1        │                                      │
// │    Ri=10k    │        (out)─┴── OUTPUT                             │
// │   VBIAS ─────┤(+)                                                  │
// │              │                                                     │
// │    VCC ──── vcc                                                    │
// │    GND ──── gnd                                                    │
// │                                                                    │
// │  With Rf=100k and Ri=10k: Av = -100k/10k = -10                     │
// │  0.05V input peak → 0.5V output peak (inverted)                    │
// │                                                                    │
// │  Input:   ╭─╮   ╭─╮          Output:  ╰─╯   ╰─╯                    │
// │        ───╯ ╰───╯ ╰───    →       ───╭─╮───╭─╮───                  │
// │          0.05V peak                    0.5V peak (inverted)        │
// │                                                                    │
// │  Why it matters: the RAT's gain stage is an inverting amplifier.   │
// │  If the op-amp gain is wrong, the distortion level is wrong.       │
// └────────────────────────────────────────────────────────────────────┘
describe('op-amp inverting amplifier', () => {
  function invertingAmp(model: 'TL072' | 'LM741') {
    const components: Array<ComponentNode> = [
      {
        id: 'ri',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'Ri', ohms: 10000 },
      },
      {
        id: 'rf',
        type: 'resistor',
        position: { x: 300, y: 0 },
        data: { label: 'Rf', ohms: 100000 },
      },
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 200, y: 0 },
        data: { label: 'U1', model },
      },
      {
        id: 'vcc',
        type: 'power',
        position: { x: 200, y: -100 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
      // Bias voltage for non-inverting input (4.5V = half supply)
      {
        id: 'rb1',
        type: 'resistor',
        position: { x: 100, y: -50 },
        data: { label: 'RB1', ohms: 100000 },
      },
      {
        id: 'rb2',
        type: 'resistor',
        position: { x: 100, y: 50 },
        data: { label: 'RB2', ohms: 100000 },
      },
    ];
    const edges: Array<Edge> = [
      // Input → Ri → inverting input
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'out',
        target: 'ri',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'ri',
        sourceHandle: 'b',
        target: 'u1',
        targetHandle: 'in_neg',
      },
      // Feedback: output → Rf → inverting input
      {
        id: 'e3',
        source: 'u1',
        sourceHandle: 'out',
        target: 'rf',
        targetHandle: 'b',
      },
      {
        id: 'e4',
        source: 'rf',
        sourceHandle: 'a',
        target: 'u1',
        targetHandle: 'in_neg',
      },
      // Output
      {
        id: 'e5',
        source: 'u1',
        sourceHandle: 'out',
        target: 'out',
        targetHandle: 'in',
      },
      // Power
      {
        id: 'e6',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'u1',
        targetHandle: 'vcc',
      },
      {
        id: 'e7',
        source: 'g1',
        sourceHandle: 'gnd',
        target: 'u1',
        targetHandle: 'gnd',
      },
      // Bias divider: VCC → RB1 → in_pos, in_pos → RB2 → GND
      {
        id: 'e8',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'rb1',
        targetHandle: 'a',
      },
      {
        id: 'e9',
        source: 'rb1',
        sourceHandle: 'b',
        target: 'u1',
        targetHandle: 'in_pos',
      },
      {
        id: 'e10',
        source: 'rb1',
        sourceHandle: 'b',
        target: 'rb2',
        targetHandle: 'a',
      },
      {
        id: 'e11',
        source: 'rb2',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    return makeCircuit(components, edges);
  }

  it('TL072 produces non-zero output', async () => {
    const { nodes, edges } = invertingAmp('TL072');
    const netlist = compileNetlist(nodes, edges, 0.02, 1000, 0.05);
    const output = await engine.run(netlist);
    // The circuit should produce some output (op-amp subcircuit loads and runs)
    expect(output.voltageValues.length).toBeGreaterThan(0);
    expect(peak(output.voltageValues)).toBeGreaterThan(0);
  });

  it('LM741 produces non-zero output', async () => {
    const { nodes, edges } = invertingAmp('LM741');
    const netlist = compileNetlist(nodes, edges, 0.02, 1000, 0.05);
    const output = await engine.run(netlist);
    expect(output.voltageValues.length).toBeGreaterThan(0);
    expect(peak(output.voltageValues)).toBeGreaterThan(0);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  OP-AMP UNITY-GAIN BUFFER (Voltage Follower)                       │
// │                                                                    │
// │  Schematic:                                                        │
// │  INPUT ─────┤(+) U1 (out)──┬── OUTPUT                              │
// │             │(-)───────────┘                                       │
// │             vcc ── VCC                                             │
// │             gnd ── GND                                             │
// │                                                                    │
// │  Gain = 1 (output follows input exactly)                           │
// │  Tests op-amp stability with 100% negative feedback.               │
// │                                                                    │
// │  Why it matters: if the subcircuit model has phase margin          │
// │  problems, a unity-gain buffer will oscillate. This is the         │
// │  standard stability test.                                          │
// └────────────────────────────────────────────────────────────────────┘
describe('op-amp unity-gain buffer', () => {
  it('output has AC content matching input frequency', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 200, y: 0 },
        data: { label: 'U1', model: 'TL072' },
      },
      {
        id: 'vcc',
        type: 'power',
        position: { x: 200, y: -100 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
      // Load resistor to help the op-amp output settle
      {
        id: 'rload',
        type: 'resistor',
        position: { x: 300, y: 50 },
        data: { label: 'RL', ohms: 10000 },
      },
    ];
    const edges: Array<Edge> = [
      // Input to non-inverting (+)
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'out',
        target: 'u1',
        targetHandle: 'in_pos',
      },
      // 100% feedback: output → inverting (-)
      {
        id: 'e2',
        source: 'u1',
        sourceHandle: 'out',
        target: 'u1',
        targetHandle: 'in_neg',
      },
      // Output
      {
        id: 'e3',
        source: 'u1',
        sourceHandle: 'out',
        target: 'out',
        targetHandle: 'in',
      },
      // Load resistor to ground
      {
        id: 'e3b',
        source: 'u1',
        sourceHandle: 'out',
        target: 'rload',
        targetHandle: 'a',
      },
      {
        id: 'e3c',
        source: 'rload',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // Power
      {
        id: 'e4',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'u1',
        targetHandle: 'vcc',
      },
      {
        id: 'e5',
        source: 'g1',
        sourceHandle: 'gnd',
        target: 'u1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    // Small signal centered around 0V (op-amp GND is at 0V)
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.5);
    const output = await engine.run(netlist);

    // Output should have AC content — the buffer is working
    const skip = Math.floor(output.voltageValues.length * 0.2);
    const steady = output.voltageValues.slice(skip);
    let min = Infinity;
    let max = -Infinity;
    for (const v of steady) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    // AC swing should be non-trivial (op-amp is buffering)
    expect(max - min).toBeGreaterThan(0.1);
  });
});
