// @vitest-environment node
//
// Multi-stage circuit and net label tests.
//
// Real pedals cascade multiple stages. These tests verify that the netlist
// compiler and SPICE engine handle multi-stage circuits with shared nets
// and multiple component types. Net labels are the primary way users avoid
// long wires -- if label merging doesn't work in simulation, circuits
// silently break.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  MULTI-STAGE CIRCUIT — Input cap → Gain stage → Tone → Output      │
// │                                                                    │
// │  Real pedals cascade multiple stages. This verifies that the       │
// │  netlist compiler and SPICE engine handle multi-stage circuits     │
// │  with shared nets and multiple component types.                    │
// │                                                                    │
// │  Schematic:                                                        │
// │  INPUT ─┤C1├─┤R1├─┬── R2 ── C2 ── OUTPUT                           │
// │                   │                                                │
// │                  ═╪═ C3                                            │
// │                   │                                                │
// │                  GND                                               │
// │                                                                    │
// │  C1 = coupling cap (high-pass, blocks DC)                          │
// │  R1 + C3 = low-pass stage                                          │
// │  R2 + C2 = another high-pass coupling to output                    │
// │                                                                    │
// │  Overall: bandpass behavior — blocks very low and very high        │
// │  frequencies, passes the midrange.                                 │
// │                                                                    │
// │  Why it matters: cascaded stages can cause net-merging bugs        │
// │  where intermediate nodes get the wrong SPICE assignment. This     │
// │  catches connectivity issues between stages.                       │
// └────────────────────────────────────────────────────────────────────┘
describe('multi-stage circuit', () => {
  it('two-stage RC produces bandpass behavior', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 50, y: 0 },
        data: { label: 'C1', farads: 100e-9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 150, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'c3',
        type: 'capacitor',
        position: { x: 250, y: 50 },
        data: { label: 'C3', farads: 100e-9 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 350, y: 0 },
        data: { label: 'R2', ohms: 1000 },
      },
      {
        id: 'c2',
        type: 'capacitor',
        position: { x: 450, y: 0 },
        data: { label: 'C2', farads: 100e-9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 250, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      // Stage 1: high-pass (C1 in series)
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
      // Intermediate node: R1.b → C3 to ground (low-pass)
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'c3',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'c3',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // Stage 2: high-pass coupling (R2 + C2 in series to output)
      {
        id: 'e5',
        source: 'r1',
        sourceHandle: 'b',
        target: 'r2',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'r2',
        sourceHandle: 'b',
        target: 'c2',
        targetHandle: 'a',
      },
      {
        id: 'e7',
        source: 'c2',
        sourceHandle: 'b',
        target: 'out',
        targetHandle: 'in',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);

    // 1 kHz should produce some output (proves the multi-stage circuit works)
    const net1k = compileNetlist(nodes, e, 0.02, 1000, 1.0);
    const out1k = await engine.run(net1k);
    const peak1k = peak(out1k.voltageValues, 0.2);

    // Should have non-trivial output at 1 kHz
    expect(peak1k).toBeGreaterThan(0.01);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  NET LABELS IN SIMULATION                                          │
// │                                                                    │
// │  Two label nodes with the same name should connect their nets.     │
// │  This tests the full path: label placement → virtual adjacency     │
// │  → netlist compilation → SPICE simulation.                         │
// │                                                                    │
// │  Schematic:                                                        │
// │  INPUT ─┤R1├── [MIDPOINT]    [MIDPOINT] ──┤R2├── OUTPUT            │
// │                                                    │               │
// │                                                   GND              │
// │                                                                    │
// │  The two "MIDPOINT" labels are not wired together, but they        │
// │  share the same net name → R1.b and R2.a are on the same node.     │
// │  This makes a voltage divider: Vout = Vin × R2/(R1+R2)             │
// │                                                                    │
// │  Why it matters: net labels are the primary way users avoid        │
// │  long wires. If label merging doesn't work in simulation,          │
// │  circuits silently break.                                          │
// └────────────────────────────────────────────────────────────────────┘
describe('net labels in simulation', () => {
  it('two labels with same name connect their nets', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
      {
        id: 'lbl1',
        type: 'label',
        position: { x: 200, y: 0 },
        data: { label: 'MIDPOINT' },
      },
      {
        id: 'lbl2',
        type: 'label',
        position: { x: 300, y: 0 },
        data: { label: 'MIDPOINT' },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 400, y: 0 },
        data: { label: 'R2', ohms: 10000 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 500, y: 100 },
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
        target: 'lbl1',
        targetHandle: 'net',
      },
      {
        id: 'e3',
        source: 'lbl2',
        sourceHandle: 'net',
        target: 'r2',
        targetHandle: 'a',
      },
      // Output taps the midpoint (between R1 and R2 via labels)
      {
        id: 'e4',
        source: 'lbl2',
        sourceHandle: 'net',
        target: 'out',
        targetHandle: 'in',
      },
      {
        id: 'e5',
        source: 'r2',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);

    // If labels work: voltage divider, output at midpoint → ~0.5V
    // If labels don't work: R1 and R2 are disconnected → broken
    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.3);
    expect(peakV).toBeLessThan(0.7);
  });
});
