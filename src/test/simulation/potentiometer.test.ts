// @vitest-environment node
//
// Potentiometer position tests.
//
// Every pedal has pots (Volume, Gain, Tone). A pot is modeled as two resistors
// whose ratio changes with position. If position doesn't affect simulation,
// controls are broken. These tests verify that the pot's `position` parameter
// actually propagates through the netlist compiler to the SPICE simulation.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌──────────────────────────────────────────────────────────────────┐
// │  POTENTIOMETER POSITION                                          │
// │                                                                  │
// │  A pot is modeled as two resistors. Changing position should     │
// │  change the output. This verifies that the pot's `position`     │
// │  parameter actually affects the simulation.                      │
// │                                                                  │
// │  Schematic (pot as volume control):                              │
// │      INPUT ──┤Pot CCW├──┤Wiper├── OUTPUT                        │
// │                         │                                       │
// │                        [CW]                                      │
// │                         │                                       │
// │                        GND                                       │
// │                                                                  │
// │  Position = 0.0 → Wiper at CCW end → OUTPUT = INPUT             │
// │  Position = 0.5 → Wiper at midpoint → OUTPUT = 0.5 × INPUT     │
// │  Position = 1.0 → Wiper at CW end → OUTPUT ≈ 0 (all to GND)   │
// │                                                                  │
// │  Why it matters: every pedal has pots (Volume, Gain, Tone). If  │
// │  position doesn't affect simulation, controls are broken.       │
// └──────────────────────────────────────────────────────────────────┘
describe('potentiometer position', () => {
  function potCircuit(position: number) {
    const components: Array<ComponentNode> = [
      {
        id: 'pot',
        type: 'pot',
        position: { x: 100, y: 0 },
        data: { label: 'VOL', ohms: 100000, position },
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
        target: 'pot',
        targetHandle: 'ccw',
      },
      {
        id: 'e2',
        source: 'pot',
        sourceHandle: 'wiper',
        target: 'out',
        targetHandle: 'in',
      },
      {
        id: 'e3',
        source: 'pot',
        sourceHandle: 'cw',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    return makeCircuit(components, edges);
  }

  it('position 0.5 gives roughly half the signal', async () => {
    const { nodes, edges } = potCircuit(0.5);
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.4);
    expect(peakV).toBeLessThan(0.6);
  });

  it('different positions produce different output levels', async () => {
    const { nodes: n1, edges: e1 } = potCircuit(0.2);
    const out1 = await engine.run(compileNetlist(n1, e1, 0.01, 1000, 1.0));
    const peak1 = peak(out1.voltageValues, 0.1);

    const { nodes: n2, edges: e2 } = potCircuit(0.8);
    const out2 = await engine.run(compileNetlist(n2, e2, 0.01, 1000, 1.0));
    const peak2 = peak(out2.voltageValues, 0.1);

    // The two positions should produce meaningfully different outputs
    const ratio = Math.max(peak1, peak2) / Math.min(peak1, peak2);
    expect(ratio).toBeGreaterThan(1.5);
  });
});
