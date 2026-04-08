// @vitest-environment node
//
// Diode tests: half-wave rectifier, forward voltage drop, and anti-parallel
// symmetry.
//
// The 1N914 diode is central to the RAT distortion pedal's hard clipping
// network. If diode models are wrong, the distortion character is completely
// different. These tests validate forward voltage drop, half-wave rectification,
// and symmetric clipping behavior.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak, snapshot } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  DIODE CLIPPING — Half-wave rectifier                              │
// │                                                                    │
// │  Schematic:           D1 (1N914)                                   │
// │      INPUT ───┤D1├───┬─── OUTPUT                                   │
// │                      │                                             │
// │                     [R1] 10kΩ                                      │
// │                      │                                             │
// │                     GND                                            │
// │                                                                    │
// │  The diode only conducts when the input is positive (minus the     │
// │  ~0.6V forward voltage drop). Negative half-cycles are blocked.    │
// │                                                                    │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭╮    ╭╮                     │
// │        ───╯ ╰───╯ ╰───    →       ────╯╰────╯╰────                 │
// │           1V peak             positive half only, ~0.4V peak       │
// │                               (1V - 0.6V diode drop)               │
// │                                                                    │
// │  Why it matters: the RAT distortion pedal uses 1N914 diodes for    │
// │  hard clipping. If diode models are wrong, the distortion          │
// │  character is completely different.                                │
// └────────────────────────────────────────────────────────────────────┘
describe('diode clipping (half-wave rectifier)', () => {
  it('clips negative half-cycles, passes positive with diode drop', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'd1',
        type: 'diode',
        position: { x: 100, y: 0 },
        data: { label: 'D1', model: '1N914' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R1', ohms: 10000 },
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
        target: 'd1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'd1',
        sourceHandle: 'k',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'd1',
        sourceHandle: 'k',
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
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);

    // Positive peak should be around 0.3-0.5V (1V minus diode drop)
    const positivePeak = peak(output.voltageValues, 0.1);
    expect(positivePeak).toBeGreaterThan(0.2);
    expect(positivePeak).toBeLessThan(0.6);

    // Negative values should be near zero (diode blocks)
    const skip = Math.floor(output.voltageValues.length * 0.1);
    let minVal = 0;
    for (let i = skip; i < output.voltageValues.length; i++) {
      if (output.voltageValues[i] < minVal) minVal = output.voltageValues[i];
    }
    // Small negative leakage is OK but should be close to 0
    expect(minVal).toBeGreaterThan(-0.05);
  });

  it('produces deterministic snapshot', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'd1',
        type: 'diode',
        position: { x: 100, y: 0 },
        data: { label: 'D1', model: '1N914' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R1', ohms: 10000 },
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
        target: 'd1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'd1',
        sourceHandle: 'k',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'd1',
        sourceHandle: 'k',
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
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.005, 1000, 1.0);
    const output = await engine.run(netlist);
    const snap = snapshot(output.voltageValues, 10);
    expect(snap).toMatchSnapshot();
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  DIODE FORWARD VOLTAGE DROP                                        │
// │                                                                    │
// │  A silicon diode (1N914) has a forward voltage of ~0.6-0.7V at     │
// │  typical operating currents. This validates the diode model        │
// │  parameters (Is, N, Rs) in the .model card.                        │
// │                                                                    │
// │  Schematic:  1V DC ──┤D1├──┤R1 (1kΩ)├── GND                        │
// │                            │                                       │
// │                           Vout                                     │
// │                                                                    │
// │  With 1V supply and ~0.65V diode drop:                             │
// │    I = (1V - 0.65V) / 1kΩ = 0.35 mA                                │
// │    Vout = I × R1 = 0.35V  (voltage across R, after diode)          │
// │                                                                    │
// │  Why it matters: the 1N914 diode model is used in the RAT          │
// │  distortion pedal. If the forward voltage is wrong, the            │
// │  clipping threshold changes and the distortion sounds different.   │
// └────────────────────────────────────────────────────────────────────┘
describe('diode forward voltage drop', () => {
  it('1N914 forward drop is between 0.45V and 0.75V', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'vcc',
        type: 'power',
        position: { x: 50, y: 0 },
        data: { label: 'VCC', volts: 1 },
      },
      {
        id: 'd1',
        type: 'diode',
        position: { x: 100, y: 0 },
        data: { label: 'D1', model: '1N914' },
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
        position: { x: 300, y: 0 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'd1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'd1',
        sourceHandle: 'k',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'd1',
        sourceHandle: 'k',
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
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.001, 1000, 0.0);
    const output = await engine.run(netlist);

    // Vout = voltage across R1 = V_supply - V_diode
    const vOut = output.voltageValues[output.voltageValues.length - 1];
    const vDiode = 1.0 - vOut;

    // 1N914 forward voltage at ~0.3-0.5mA — the exact value depends
    // on the model parameters (Is=2.52n, N=1.752, Rs=0.568)
    expect(vDiode).toBeGreaterThan(0.45);
    expect(vDiode).toBeLessThan(0.75);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  ANTI-PARALLEL DIODE SYMMETRY                                      │
// │                                                                    │
// │  Two 1N914 diodes in anti-parallel (like the RAT's clipping        │
// │  network) should clip symmetrically — positive and negative        │
// │  peaks at the same threshold.                                      │
// │                                                                    │
// │  Schematic:    R1 = 1kΩ        ┌──|>|──┐                           │
// │      INPUT ──┤R1├──┬── OUTPUT   │  D1   │                          │
// │                    ├───────────┤       ├──── GND                   │
// │                    │           │  D2   │                           │
// │                    └──|<|──┘                                       │
// │                                                                    │
// │  Input: 5V peak sine → both peaks clip to ~0.6V                    │
// │                                                                    │
// │  Output:   ╭──╮    ╭──╮       (flat-topped, symmetric)             │
// │         ───╯  ╰────╯  ╰───                                         │
// │            ~0.6V  ~-0.6V                                           │
// │                                                                    │
// │  Why it matters: asymmetric clipping in the RAT means one          │
// │  diode model is wrong. This is the most common simulation          │
// │  artifact in distortion pedals.                                    │
// └────────────────────────────────────────────────────────────────────┘
describe('anti-parallel diode symmetry', () => {
  it('positive and negative clipping thresholds match', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'd1',
        type: 'diode',
        position: { x: 200, y: 0 },
        data: { label: 'D1', model: '1N914' },
      },
      {
        id: 'd2',
        type: 'diode',
        position: { x: 200, y: 80 },
        data: { label: 'D2', model: '1N914' },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 300, y: 0 },
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
        target: 'out',
        targetHandle: 'in',
      },
      // D1: anode at output, cathode at ground (clips positive)
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'd1',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'd1',
        sourceHandle: 'k',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // D2: cathode at output, anode at ground (clips negative)
      {
        id: 'e5',
        source: 'g1',
        sourceHandle: 'gnd',
        target: 'd2',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'd2',
        sourceHandle: 'k',
        target: 'r1',
        targetHandle: 'b',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    // 5V amplitude to drive well into clipping
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 5.0);
    const output = await engine.run(netlist);

    const skip = Math.floor(output.voltageValues.length * 0.1);
    const steady = output.voltageValues.slice(skip);

    let posMax = 0;
    let negMin = 0;
    for (let i = 0; i < steady.length; i++) {
      if (steady[i] > posMax) posMax = steady[i];
      if (steady[i] < negMin) negMin = steady[i];
    }

    // Both diodes are identical → symmetric clipping
    // Positive and negative thresholds should be within 5% of each other
    const asymmetry = Math.abs(posMax - Math.abs(negMin)) / posMax;
    expect(asymmetry).toBeLessThan(0.05);

    // Clipping should be at roughly 0.6V (diode forward voltage)
    expect(posMax).toBeGreaterThan(0.5);
    expect(posMax).toBeLessThan(0.8);
  });
});
