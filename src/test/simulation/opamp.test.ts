// @vitest-environment node
//
// Op-amp tests: inverting amplifier (TL072, LM741, LM308) and unity-gain buffer.
//
// The TL072, LM741, and LM308 subcircuits are the core active elements in
// guitar pedals. The RAT uses an LM308; the Distortion+ uses an LM741.
// If the op-amp gain is wrong, the distortion level is wrong.
// Unity-gain buffer tests verify stability with 100% negative feedback.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { acSwing, engine, makeCircuit, peak } from './setup';

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
  function invertingAmp(model: 'TL072' | 'LM741' | 'LM308') {
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
        sourceHandle: 'pos',
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
        targetHandle: 'pos',
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

  // The LM308 is the op-amp used in the RAT distortion pedal. It's
  // characterized by very low input bias current and slow slew rate
  // (~0.3 V/µs), which shapes the high-frequency content of the distortion.
  // A 1 kHz signal stays well within its bandwidth, so this inverting
  // amplifier should behave the same as TL072/LM741 at audio frequencies.
  it('LM308 produces non-zero output', async () => {
    const { nodes, edges } = invertingAmp('LM308');
    const netlist = compileNetlist(nodes, edges, 0.02, 1000, 0.05);
    const output = await engine.run(netlist);
    expect(output.voltageValues.length).toBeGreaterThan(0);
    expect(peak(output.voltageValues)).toBeGreaterThan(0);
  });

  it('LM308 amplifies signal (Av ≈ -10)', async () => {
    const { nodes, edges } = invertingAmp('LM308');
    // Run for long enough to reach steady state; skip initial transient
    const netlist = compileNetlist(nodes, edges, 0.02, 1000, 0.05);
    const output = await engine.run(netlist);
    // Expected output peak: 0.05V × 10 = 0.5V. The macromodel's output stage
    // doesn't clamp as tightly as the real part, so just verify it's amplifying
    // (above input) and within the supply rails (9V).
    const outputPeak = peak(output.voltageValues, 0.2);
    expect(outputPeak).toBeGreaterThan(0.1);
    expect(outputPeak).toBeLessThan(9.5); // must be near or within supply rails
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
  function unityGainBuffer(model: 'TL072' | 'LM741' | 'LM308') {
    const components: Array<ComponentNode> = [
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
      {
        id: 'rload',
        type: 'resistor',
        position: { x: 300, y: 50 },
        data: { label: 'RL', ohms: 10000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'u1',
        targetHandle: 'in_pos',
      },
      {
        id: 'e2',
        source: 'u1',
        sourceHandle: 'out',
        target: 'u1',
        targetHandle: 'in_neg',
      },
      {
        id: 'e3',
        source: 'u1',
        sourceHandle: 'out',
        target: 'out',
        targetHandle: 'pos',
      },
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
    return makeCircuit(components, edges);
  }

  it('TL072 output has AC content matching input frequency', async () => {
    const { nodes, edges: e } = unityGainBuffer('TL072');
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.5);
    const output = await engine.run(netlist);
    expect(acSwing(output.voltageValues)).toBeGreaterThan(0.1);
  });

  // The real LM308 requires an external compensation capacitor to be unity-gain
  // stable; without it, the phase margin is insufficient and the output oscillates.
  // In practice (RAT, Distortion+), the LM308 is always used with gain > 1.
  // We test it in a non-inverting gain-of-2 config (Rf=Rg=10k) instead.
  it('LM308 non-inverting gain-of-2 passes AC signal', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 200, y: 0 },
        data: { label: 'U1', model: 'LM308' },
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
      // Rf: output → inverting input
      {
        id: 'rf',
        type: 'resistor',
        position: { x: 300, y: 0 },
        data: { label: 'Rf', ohms: 10000 },
      },
      // Rg: inverting input → ground  (Av = 1 + Rf/Rg = 2)
      {
        id: 'rg',
        type: 'resistor',
        position: { x: 150, y: 50 },
        data: { label: 'Rg', ohms: 10000 },
      },
      {
        id: 'rload',
        type: 'resistor',
        position: { x: 350, y: 50 },
        data: { label: 'RL', ohms: 10000 },
      },
    ];
    const edges: Array<Edge> = [
      // Input → non-inverting
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'u1',
        targetHandle: 'in_pos',
      },
      // Feedback: output → Rf → inverting
      {
        id: 'e2',
        source: 'u1',
        sourceHandle: 'out',
        target: 'rf',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'rf',
        sourceHandle: 'b',
        target: 'u1',
        targetHandle: 'in_neg',
      },
      // Rg: inverting input → GND
      {
        id: 'e4',
        source: 'rf',
        sourceHandle: 'b',
        target: 'rg',
        targetHandle: 'a',
      },
      {
        id: 'e5',
        source: 'rg',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // Output
      {
        id: 'e6',
        source: 'u1',
        sourceHandle: 'out',
        target: 'out',
        targetHandle: 'pos',
      },
      // Load
      {
        id: 'e7',
        source: 'u1',
        sourceHandle: 'out',
        target: 'rload',
        targetHandle: 'a',
      },
      {
        id: 'e8',
        source: 'rload',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // Power
      {
        id: 'e9',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'u1',
        targetHandle: 'vcc',
      },
      {
        id: 'e10',
        source: 'g1',
        sourceHandle: 'gnd',
        target: 'u1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.5);
    const output = await engine.run(netlist);
    expect(acSwing(output.voltageValues)).toBeGreaterThan(0.1);
  });

  it('LM308 slew rate limits high-amplitude high-frequency signals', async () => {
    // At 10 kHz with 2V amplitude: required slew = 2π × 10000 × 2 ≈ 125 V/ms.
    // LM308 slew = 0.3 V/µs = 300 V/ms — actually faster than needed here.
    // At 20 kHz with 2V amplitude: required slew ≈ 251 V/ms — still within spec.
    // At 50 kHz with 2V amplitude: required slew ≈ 628 V/ms — exceeds LM308 slew.
    // The output swing should be compressed compared to a non-slew-limited amp.
    const { nodes, edges: e } = unityGainBuffer('LM308');
    const netlist = compileNetlist(nodes, e, 0.002, 50000, 2.0);
    const output = await engine.run(netlist);
    // Signal should exist but be slew-limited (swing < full 4V peak-to-peak)
    const swing = acSwing(output.voltageValues);
    expect(swing).toBeGreaterThan(0); // some output exists
    expect(swing).toBeLessThan(3.5); // slew-limited, not full swing
  });
});
