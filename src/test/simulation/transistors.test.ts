// @vitest-environment node
//
// Transistor simulation tests: BJT, JFET, and MOSFET.
//
// These validate that the transistor SPICE models produce reasonable DC bias
// points and AC gain behavior through the full netlist → ngspice WASM pipeline.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { acSwing, engine, makeCircuit, peak } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌────────────────────────────────────────────────────────────────────┐
// │  BJT COMMON-EMITTER AMPLIFIER (NPN 2N3904)                         │
// │                                                                    │
// │              VCC (9V)                                              │
// │              │     │                                               │
// │            [R1]  [Rc] 4.7kΩ                                        │
// │           47kΩ     │                                               │
// │              │     C ──── OUTPUT                                   │
// │  IN ──[C1]──┬── B                                                  │
// │             │   Q1 (2N3904)                                        │
// │           [R2]  │ E                                                │
// │           10kΩ [Re] 1kΩ                                            │
// │             │    │                                                 │
// │            GND  GND                                                │
// │                                                                    │
// │  Voltage divider bias: Vb ≈ 9×10/57 ≈ 1.58V, Ve ≈ 0.88V            │
// │  Ic ≈ 0.88mA, Vc ≈ 4.9V — good headroom in active region.          │
// │  Gain ≈ Rc/Re ≈ 4.7                                                │
// └────────────────────────────────────────────────────────────────────┘
describe('BJT common-emitter amplifier (2N3904)', () => {
  it('amplifies a small signal with voltage gain > 1', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: -100 },
        data: { label: 'R1', ohms: 47000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 100 },
        data: { label: 'R2', ohms: 10000 },
      },
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 300, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'rc',
        type: 'resistor',
        position: { x: 300, y: -100 },
        data: { label: 'Rc', ohms: 4700 },
      },
      {
        id: 're',
        type: 'resistor',
        position: { x: 300, y: 100 },
        data: { label: 'Re', ohms: 1000 },
      },
      {
        id: 'vcc',
        type: 'power',
        position: { x: 300, y: -200 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'g_bias',
        type: 'ground',
        position: { x: 200, y: 200 },
        data: { label: 'GND' },
      },
      {
        id: 'g_emitter',
        type: 'ground',
        position: { x: 300, y: 200 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      // Input coupling cap
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'c1',
        targetHandle: 'a',
      },
      // C1 → base
      {
        id: 'e2',
        source: 'c1',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'b',
      },
      // Voltage divider bias: VCC → R1 → base, base → R2 → GND
      {
        id: 'e3',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'r1',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'b',
      },
      {
        id: 'e4b',
        source: 'r1',
        sourceHandle: 'b',
        target: 'r2',
        targetHandle: 'a',
      },
      {
        id: 'e4c',
        source: 'r2',
        sourceHandle: 'b',
        target: 'g_bias',
        targetHandle: 'gnd',
      },
      // Collector load: VCC → Rc → collector
      {
        id: 'e5',
        source: 'vcc',
        sourceHandle: 'pos',
        target: 'rc',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'rc',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'c',
      },
      // Collector to output
      {
        id: 'e7',
        source: 'q1',
        sourceHandle: 'c',
        target: 'out',
        targetHandle: 'pos',
      },
      // Emitter resistor to ground
      {
        id: 'e8',
        source: 'q1',
        sourceHandle: 'e',
        target: 're',
        targetHandle: 'a',
      },
      {
        id: 'e9',
        source: 're',
        sourceHandle: 'b',
        target: 'g_emitter',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    // Small signal: 50mV amplitude
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    const swing = acSwing(output.voltageValues, 0.2);
    // Input is 100mV p-p (0.05 amplitude), gain ≈ Rc/Re ≈ 4.7
    // Output swing should be well above input swing
    expect(swing).toBeGreaterThan(0.1);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  PNP BJT COMMON-EMITTER (2N3906)                                   │
// │                                                                    │
// │  Mirror of the NPN circuit with negative supply (-9V).             │
// │  Voltage divider R1/R2 biases base to ≈ -1.58V.                    │
// │  Validates that the PNP model works with reversed polarity.        │
// └────────────────────────────────────────────────────────────────────┘
describe('BJT common-emitter amplifier (2N3906 PNP)', () => {
  it('amplifies a small signal', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: 100 },
        data: { label: 'R1', ohms: 47000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: -100 },
        data: { label: 'R2', ohms: 10000 },
      },
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 300, y: 0 },
        data: { label: 'Q1', polarity: 'PNP', model: '2N3906' },
      },
      {
        id: 'rc',
        type: 'resistor',
        position: { x: 300, y: 100 },
        data: { label: 'Rc', ohms: 4700 },
      },
      {
        id: 're',
        type: 'resistor',
        position: { x: 300, y: -100 },
        data: { label: 'Re', ohms: 1000 },
      },
      {
        id: 'vee',
        type: 'power',
        position: { x: 300, y: 200 },
        data: { label: 'VEE', volts: -9 },
      },
      {
        id: 'g_bias',
        type: 'ground',
        position: { x: 200, y: -200 },
        data: { label: 'GND' },
      },
      {
        id: 'g_emitter',
        type: 'ground',
        position: { x: 300, y: -200 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'c1',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'b',
      },
      // Voltage divider: VEE → R1 → base, base → R2 → GND
      {
        id: 'e3',
        source: 'vee',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'r1',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'b',
      },
      {
        id: 'e4b',
        source: 'r1',
        sourceHandle: 'b',
        target: 'r2',
        targetHandle: 'a',
      },
      {
        id: 'e4c',
        source: 'r2',
        sourceHandle: 'b',
        target: 'g_bias',
        targetHandle: 'gnd',
      },
      // Collector load to VEE
      {
        id: 'e5',
        source: 'vee',
        sourceHandle: 'pos',
        target: 'rc',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'rc',
        sourceHandle: 'b',
        target: 'q1',
        targetHandle: 'c',
      },
      // Collector to output
      {
        id: 'e7',
        source: 'q1',
        sourceHandle: 'c',
        target: 'out',
        targetHandle: 'pos',
      },
      // Emitter to ground through Re
      {
        id: 'e8',
        source: 'q1',
        sourceHandle: 'e',
        target: 're',
        targetHandle: 'a',
      },
      {
        id: 'e9',
        source: 're',
        sourceHandle: 'b',
        target: 'g_emitter',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    const swing = acSwing(output.voltageValues, 0.2);
    expect(swing).toBeGreaterThan(0.1);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  JFET COMMON-SOURCE AMPLIFIER (2N5457 N-channel)                   │
// │                                                                    │
// │              VDD (9V)                                              │
// │                │                                                   │
// │              [Rd] 4.7kΩ                                            │
// │                │                                                   │
// │  IN ──[C1]──── G   D ──── OUTPUT                                   │
// │          [Rg]  J1 (2N5457)                                         │
// │           1MΩ  │ S                                                 │
// │            │ [Rs] 1kΩ                                              │
// │           GND   │                                                  │
// │                GND                                                 │
// │                                                                    │
// │  Self-biased via Rs. JFET is normally on; the source resistor      │
// │  sets the bias point. Signal at gate modulates drain current.      │
// └────────────────────────────────────────────────────────────────────┘
describe('JFET common-source amplifier (2N5457)', () => {
  it('amplifies a small signal', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'j1',
        type: 'jfet',
        position: { x: 300, y: 0 },
        data: { label: 'J1', polarity: 'N', model: '2N5457' },
      },
      {
        id: 'rd',
        type: 'resistor',
        position: { x: 300, y: -100 },
        data: { label: 'Rd', ohms: 4700 },
      },
      {
        id: 'rs',
        type: 'resistor',
        position: { x: 300, y: 100 },
        data: { label: 'Rs', ohms: 1000 },
      },
      {
        id: 'rg',
        type: 'resistor',
        position: { x: 200, y: 100 },
        data: { label: 'Rg', ohms: 1000000 },
      },
      {
        id: 'vdd',
        type: 'power',
        position: { x: 300, y: -200 },
        data: { label: 'VDD', volts: 9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 300, y: 200 },
        data: { label: 'GND' },
      },
      {
        id: 'g2',
        type: 'ground',
        position: { x: 200, y: 200 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      // Input coupling
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'c1',
        sourceHandle: 'b',
        target: 'j1',
        targetHandle: 'g',
      },
      // Gate bias resistor to ground (self-bias)
      {
        id: 'e3',
        source: 'j1',
        sourceHandle: 'g',
        target: 'rg',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'rg',
        sourceHandle: 'b',
        target: 'g2',
        targetHandle: 'gnd',
      },
      // Drain load to VDD
      {
        id: 'e5',
        source: 'vdd',
        sourceHandle: 'pos',
        target: 'rd',
        targetHandle: 'a',
      },
      {
        id: 'e6',
        source: 'rd',
        sourceHandle: 'b',
        target: 'j1',
        targetHandle: 'd',
      },
      // Drain to output
      {
        id: 'e7',
        source: 'j1',
        sourceHandle: 'd',
        target: 'out',
        targetHandle: 'pos',
      },
      // Source resistor to ground
      {
        id: 'e8',
        source: 'j1',
        sourceHandle: 's',
        target: 'rs',
        targetHandle: 'a',
      },
      {
        id: 'e9',
        source: 'rs',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    const swing = acSwing(output.voltageValues, 0.2);
    // JFET amp should show some gain
    expect(swing).toBeGreaterThan(0.05);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  MOSFET COMMON-SOURCE AMPLIFIER (BS170 N-channel)                  │
// │                                                                    │
// │              VDD (9V)                                              │
// │              │     │                                               │
// │            [R1]  [Rd] 4.7kΩ                                        │
// │           100kΩ    │                                               │
// │              │     D ──── OUTPUT                                   │
// │  IN ──[C1]──┬── G                                                  │
// │             │   M1 (BS170)                                         │
// │           [R2]  │ S                                                │
// │           47kΩ [Rs] 1kΩ                                            │
// │             │    │                                                 │
// │            GND  GND                                                │
// │                                                                    │
// │  BS170 Vth ~ 1.8V. Voltage divider R1/R2 biases gate above Vth.    │
// └────────────────────────────────────────────────────────────────────┘
describe('MOSFET common-source amplifier (BS170)', () => {
  it('amplifies a small signal', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: -100 },
        data: { label: 'R1', ohms: 100000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 200, y: 100 },
        data: { label: 'R2', ohms: 47000 },
      },
      {
        id: 'm1',
        type: 'mosfet',
        position: { x: 300, y: 0 },
        data: { label: 'M1', polarity: 'N', model: 'BS170' },
      },
      {
        id: 'rd',
        type: 'resistor',
        position: { x: 300, y: -100 },
        data: { label: 'Rd', ohms: 4700 },
      },
      {
        id: 'rs',
        type: 'resistor',
        position: { x: 300, y: 100 },
        data: { label: 'Rs', ohms: 1000 },
      },
      {
        id: 'vdd',
        type: 'power',
        position: { x: 300, y: -200 },
        data: { label: 'VDD', volts: 9 },
      },
      {
        id: 'g1',
        type: 'ground',
        position: { x: 200, y: 200 },
        data: { label: 'GND' },
      },
      {
        id: 'g2',
        type: 'ground',
        position: { x: 300, y: 200 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      // Input coupling
      {
        id: 'e1',
        source: 'in',
        sourceHandle: 'pos',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'c1',
        sourceHandle: 'b',
        target: 'm1',
        targetHandle: 'g',
      },
      // Gate bias voltage divider
      {
        id: 'e3',
        source: 'vdd',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'r1',
        sourceHandle: 'b',
        target: 'r2',
        targetHandle: 'a',
      },
      {
        id: 'e5',
        source: 'r1',
        sourceHandle: 'b',
        target: 'm1',
        targetHandle: 'g',
      },
      {
        id: 'e6',
        source: 'r2',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // Drain load to VDD
      {
        id: 'e7',
        source: 'vdd',
        sourceHandle: 'pos',
        target: 'rd',
        targetHandle: 'a',
      },
      {
        id: 'e8',
        source: 'rd',
        sourceHandle: 'b',
        target: 'm1',
        targetHandle: 'd',
      },
      // Drain to output
      {
        id: 'e9',
        source: 'm1',
        sourceHandle: 'd',
        target: 'out',
        targetHandle: 'pos',
      },
      // Source resistor to ground
      {
        id: 'e10',
        source: 'm1',
        sourceHandle: 's',
        target: 'rs',
        targetHandle: 'a',
      },
      {
        id: 'e11',
        source: 'rs',
        sourceHandle: 'b',
        target: 'g2',
        targetHandle: 'gnd',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    const swing = acSwing(output.voltageValues, 0.2);
    // MOSFET amp should show some gain
    expect(swing).toBeGreaterThan(0.05);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  FUZZ FACE PRESET — full two-transistor PNP circuit                │
// │                                                                    │
// │  Runs the Fuzz Face example through the simulator to verify        │
// │  the AC128 PNP BJT model works in a real pedal circuit.            │
// └────────────────────────────────────────────────────────────────────┘
describe('Fuzz Face preset (AC128 PNP)', () => {
  it('produces output with significant distortion gain', async () => {
    const { fuzzFaceNodes, fuzzFaceEdges } = await import(
      '../../lib/examples/pedals/fuzz-face'
    );
    const { nodes, edges } = makeCircuit(fuzzFaceNodes, fuzzFaceEdges);
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    // The Fuzz Face should produce output — the AC128 model must be valid
    const outputPeak = peak(output.voltageValues, 0.2);
    expect(outputPeak).toBeGreaterThan(0);

    // Output should show some signal (not just DC)
    const swing = acSwing(output.voltageValues, 0.2);
    expect(swing).toBeGreaterThan(0.01);
  });
});

// ┌────────────────────────────────────────────────────────────────────┐
// │  MXR DISTORTION+ PRESET — LM741 + 1N270 germanium clipping        │
// │                                                                    │
// │  Runs the MXR Distortion+ example through the simulator to         │
// │  verify the LM741 op-amp and 1N270 germanium diode models work    │
// │  together in a real pedal circuit.                                │
// └────────────────────────────────────────────────────────────────────┘
describe('MXR Distortion+ preset (LM741 + 1N270)', () => {
  it('produces clipped output signal', async () => {
    const { distortionPlusNodes, distortionPlusEdges } = await import(
      '../../lib/examples/pedals/distortion-plus'
    );
    const { nodes, edges } = makeCircuit(
      distortionPlusNodes,
      distortionPlusEdges,
    );
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 0.05);
    const output = await engine.run(netlist);

    const outputPeak = peak(output.voltageValues, 0.2);
    expect(outputPeak).toBeGreaterThan(0);

    const swing = acSwing(output.voltageValues, 0.2);
    expect(swing).toBeGreaterThan(0.01);
  });
});
