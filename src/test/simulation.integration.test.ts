// @vitest-environment node
//
// Integration tests that run real SPICE simulations via the eecircuit-engine
// WASM binary. Each test builds a circuit from ComponentNodes + Edges,
// compiles it to a SPICE netlist, runs the simulation, and checks that the
// output voltages match expected physical behavior.
//
// These tests catch regressions in the full pipeline:
//   UI graph → compileNetlist() → ngspice WASM → extractSimulationOutput()

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { compileNetlist } from '../lib/netlist';
import type { ComponentNode } from '../lib/types';

const engine = new EECircuitEngine();

beforeAll(async () => {
  await engine.init();
}, 15000);

// ─── Helpers ────────────────────────────────────────────────────────

function makeCircuit(
  components: Array<ComponentNode>,
  edges: Array<Edge>,
): { nodes: Array<ComponentNode>; edges: Array<Edge> } {
  const hasIn = components.some((n) => n.type === 'audiin');
  const hasOut = components.some((n) => n.type === 'audiout');
  const nodes = [
    ...(!hasIn
      ? [
          {
            id: 'in',
            type: 'audiin' as const,
            position: { x: 0, y: 0 },
            data: { label: 'INPUT' },
          },
        ]
      : []),
    ...components,
    ...(!hasOut
      ? [
          {
            id: 'out',
            type: 'audiout' as const,
            position: { x: 500, y: 0 },
            data: { label: 'OUTPUT' },
          },
        ]
      : []),
  ];
  return { nodes, edges };
}

/** Peak absolute value, optionally skipping initial transient */
function peak(values: ArrayLike<number>, skipFraction = 0): number {
  const start = Math.floor(values.length * skipFraction);
  let max = 0;
  for (let i = start; i < values.length; i++) {
    const a = Math.abs(values[i]);
    if (a > max) max = a;
  }
  return max;
}

/** Snapshot first N voltage values rounded to a fixed precision */
function snapshot(
  values: Float64Array,
  n: number,
  decimals = 6,
): Array<number> {
  const result: Array<number> = [];
  const step = Math.max(1, Math.floor(values.length / n));
  for (let i = 0; i < values.length && result.length < n; i += step) {
    result.push(Number.parseFloat(values[i].toFixed(decimals)));
  }
  return result;
}

// ─── Tests ──────────────────────────────────────────────────────────

// ┌──────────────────────────────────────────────────────────────────┐
// │  PASSTHROUGH — Direct wire from INPUT to OUTPUT                  │
// │                                                                  │
// │  Schematic:                                                      │
// │      INPUT ──────────────── OUTPUT                               │
// │                                                                  │
// │  Input:  1V peak sine @ 1 kHz                                    │
// │  Expect: Output ≈ Input (no components to alter the signal)      │
// │                                                                  │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭─╮   ╭─╮                  │
// │        ───╯ ╰───╯ ╰───    ≈        ───╯ ╰───╯ ╰───               │
// │           1V peak                      1V peak                   │
// │                                                                  │
// │  Why it matters: validates the most basic signal path. If this   │
// │  breaks, the netlist compiler or SPICE source is fundamentally   │
// │  wrong.                                                          │
// └──────────────────────────────────────────────────────────────────┘
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  LOW-PASS RC FILTER                                              │
// │                                                                  │
// │  Schematic:           R1 = 1kΩ                                   │
// │      INPUT ───┤R1├───┬─── OUTPUT                                 │
// │                      │                                           │
// │                     ═╪═ C1 = 100nF                               │
// │                      │                                           │
// │                     GND                                          │
// │                                                                  │
// │  Cutoff frequency: fc = 1/(2π·R·C) = 1/(2π·1000·100e-9)          │
// │                      ≈ 1,592 Hz                                  │
// │                                                                  │
// │  100 Hz input (well BELOW cutoff → passes through):              │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭─╮   ╭─╮                  │
// │        ───╯ ╰───╯ ╰───    ≈        ───╯ ╰───╯ ╰───               │
// │           1V peak                     ~0.99V peak                │
// │                                                                  │
// │  5000 Hz input (well ABOVE cutoff → attenuated):                 │
// │  Input:   ╭╮╭╮╭╮╭╮╭╮         Output:  ~─~─~─~─~─                 │
// │        ───╯╰╯╰╯╰╯╰╯╰──    →        ─────────────                 │
// │           1V peak                     <0.35V peak                │
// │                                                                  │
// │  Why it matters: the low-pass filter is the most fundamental     │
// │  audio circuit (tone controls, anti-aliasing). Verifies that     │
// │  R + C + GND nodes compile correctly and that the SPICE engine   │
// │  produces physically accurate frequency-dependent attenuation.   │
// └──────────────────────────────────────────────────────────────────┘
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  HIGH-PASS RC FILTER                                             │
// │                                                                  │
// │  Schematic:           C1 = 100nF                                 │
// │      INPUT ───┤C1├───┬─── OUTPUT                                 │
// │                      │                                           │
// │                     [R1] 1kΩ                                     │
// │                      │                                           │
// │                     GND                                          │
// │                                                                  │
// │  Same components as low-pass but swapped: C is in series, R is   │
// │  to ground. Cutoff is the same: fc ≈ 1,592 Hz.                   │
// │                                                                  │
// │  5000 Hz input (ABOVE cutoff → passes):                          │
// │  Input:   ╭╮╭╮╭╮╭╮╭╮         Output:  ╭╮╭╮╭╮╭╮╭╮                 │
// │        ───╯╰╯╰╯╰╯╰╯╰──    ≈       ───╯╰╯╰╯╰╯╰╯╰──                │
// │           1V peak                     ~0.95V peak                │
// │                                                                  │
// │  100 Hz input (BELOW cutoff → attenuated):                       │
// │  Input:   ╭─╮   ╭─╮          Output:   ~──~──~──                 │
// │        ───╯ ╰───╯ ╰───    →         ────────────                 │
// │           1V peak                     <0.10V peak                │
// │                                                                  │
// │  Why it matters: coupling capacitors in guitar pedals are high-  │
// │  pass filters. The RAT's C1 (47nF input cap) is exactly this     │
// │  topology. If this breaks, pedal simulations lose their bass     │
// │  response accuracy.                                              │
// └──────────────────────────────────────────────────────────────────┘
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  VOLTAGE DIVIDER — Two equal resistors                           │
// │                                                                  │
// │  Schematic:           R1 = 10kΩ                                  │
// │      INPUT ───┤R1├───┬─── OUTPUT                                 │
// │                      │                                           │
// │                     [R2] 10kΩ                                    │
// │                      │                                           │
// │                     GND                                          │
// │                                                                  │
// │  Vout = Vin × R2/(R1+R2) = Vin × 10k/(10k+10k) = Vin × 0.5       │
// │                                                                  │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭╮  ╭╮                     │
// │        ───╯ ╰───╯ ╰───    →       ────╯╰──╯╰────                 │
// │           1V peak                     0.5V peak                  │
// │                                                                  │
// │  Why it matters: the voltage divider is how potentiometers work  │
// │  (volume knob = voltage divider). Getting the ratio wrong would  │
// │  make every pot-based control inaccurate.                        │
// └──────────────────────────────────────────────────────────────────┘
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
        sourceHandle: 'out',
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
        targetHandle: 'in',
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
        sourceHandle: 'out',
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
        targetHandle: 'in',
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
        sourceHandle: 'out',
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
        targetHandle: 'in',
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  DIODE CLIPPING — Half-wave rectifier                            │
// │                                                                  │
// │  Schematic:           D1 (1N914)                                 │
// │      INPUT ───┤D1├───┬─── OUTPUT                                 │
// │                      │                                           │
// │                     [R1] 10kΩ                                    │
// │                      │                                           │
// │                     GND                                          │
// │                                                                  │
// │  The diode only conducts when the input is positive (minus the   │
// │  ~0.6V forward voltage drop). Negative half-cycles are blocked.  │
// │                                                                  │
// │  Input:   ╭─╮   ╭─╮          Output:  ╭╮    ╭╮                   │
// │        ───╯ ╰───╯ ╰───    →       ────╯╰────╯╰────               │
// │           1V peak             positive half only, ~0.4V peak     │
// │                               (1V - 0.6V diode drop)             │
// │                                                                  │
// │  Why it matters: the RAT distortion pedal uses 1N914 diodes for  │
// │  hard clipping. If diode models are wrong, the distortion        │
// │  character is completely different.                              │
// └──────────────────────────────────────────────────────────────────┘
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  KiCad-STYLE POWER PINS — Multiple VCC symbols share one net     │
// │                                                                  │
// │  Schematic:                                                      │
// │      VCC ─┤R1├─┬─ OUTPUT       VCC ─┤R2├─ (floating)             │
// │                │                                                 │
// │               GND                                                │
// │                                                                  │
// │  Both VCC symbols are on the same net (9V DC). R2 is connected   │
// │  to the same power rail without a wire between the two VCC       │
// │  symbols. The netlist compiler merges them via virtual           │
// │  adjacency.                                                      │
// │                                                                  │
// │  Output should see the 9V DC from VCC through R1, divided by     │
// │  R1/(R1+Rprobe). Since Rprobe is 1000MΩ, the output is ~9V.      │
// │                                                                  │
// │  Why it matters: users place VCC symbols locally instead of      │
// │  drawing long wires. If the power pin merging breaks, separate   │
// │  VCC symbols become isolated — circuits silently fail.           │
// └──────────────────────────────────────────────────────────────────┘
describe('KiCad-style power pins', () => {
  it('two VCC symbols share the same net', async () => {
    const components: Array<ComponentNode> = [
      {
        id: 'vcc1',
        type: 'power',
        position: { x: 50, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'vcc2',
        type: 'power',
        position: { x: 300, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 350, y: 0 },
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
        source: 'vcc1',
        sourceHandle: 'pos',
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
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'g1',
        targetHandle: 'gnd',
      },
      // R2 is connected to VCC2 — a separate symbol but same net
      {
        id: 'e4',
        source: 'vcc2',
        sourceHandle: 'pos',
        target: 'r2',
        targetHandle: 'a',
      },
    ];
    const { nodes, edges: e } = makeCircuit(components, edges);
    const netlist = compileNetlist(nodes, e, 0.001, 1000, 0.0);

    // Should only have one VVCC line (deduplicated)
    const vccLines = netlist.split('\n').filter((l) => l.startsWith('VVCC'));
    expect(vccLines).toHaveLength(1);
  });
});

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
// │  FULL PIPELINE — compile → simulate → voltageToAudioBuffer       │
// │                                                                  │
// │  Tests the complete data flow that happens when a user clicks    │
// │  "Simulate" in the app:                                          │
// │                                                                  │
// │    ComponentNodes + Edges                                        │
// │         │  compileNetlist()                                      │
// │         ▼                                                        │
// │    SPICE netlist string                                          │
// │         │  engine.run()                                          │
// │         ▼                                                        │
// │    { timeValues, voltageValues }  (variable-step Float64)        │
// │         │  voltageToAudioBuffer()                                │
// │         ▼                                                        │
// │    Float32Array @ 44100 Hz  (ready for Web Audio playback)       │
// │                                                                  │
// │  Why it matters: each step could silently corrupt the data       │
// │  (wrong sample rate, bad interpolation, normalization to zero).  │
// │  This end-to-end test catches integration bugs between layers.   │
// └──────────────────────────────────────────────────────────────────┘
describe('full pipeline: compile → simulate → audio buffer', () => {
  it('produces a valid, non-silent Float32Array at 44100 Hz', async () => {
    const { nodes, edges } = makeCircuit(
      [
        {
          id: 'r1',
          type: 'resistor',
          position: { x: 100, y: 0 },
          data: { label: 'R1', ohms: 1000 },
        },
      ],
      [
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
      ],
    );
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    const audio = voltageToAudioBuffer(output, 44100);

    expect(audio).toBeInstanceOf(Float32Array);
    // 0.01s at 44100 Hz = 441 samples
    expect(audio.length).toBe(441);
    // Should be normalized: peak ≈ 1.0
    expect(peak(audio)).toBeCloseTo(1.0, 1);
    // Should contain both positive and negative values (it's a sine)
    expect(Math.min(...audio)).toBeLessThan(-0.5);
    expect(Math.max(...audio)).toBeGreaterThan(0.5);
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
// │  FREQUENCY SWEEP DETERMINISM                                     │
// │                                                                  │
// │  The same low-pass filter at three frequencies: 100 Hz, 1 kHz,   │
// │  5 kHz. Each output is snapshot-locked. This catches any change  │
// │  in the SIN source generation, SPICE timestep, or the netlist    │
// │  .tran parameters.                                               │
// │                                                                  │
// │  Schematic:  INPUT ──┤R1├──┬── OUTPUT                            │
// │                            ═╪═ C1                                │
// │                            GND                                   │
// │                                                                  │
// │  Expected behavior (R=1k, C=100n, fc≈1.6kHz):                    │
// │                                                                  │
// │  100 Hz:  gain ≈ 1.00  │  Output ≈ Input (nearly identical)      │
// │   1 kHz:  gain ≈ 0.85  │  Output slightly smaller, phase-shifted │
// │   5 kHz:  gain ≈ 0.30  │  Output much smaller, 90° lag           │
// │                                                                  │
// │  Why it matters: if any of these snapshots change, either the    │
// │  SPICE engine updated, the netlist format changed, or the        │
// │  timestep calculation drifted. All would affect every simulation.│
// └──────────────────────────────────────────────────────────────────┘
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

// ┌──────────────────────────────────────────────────────────────────┐
// │  PWL SOURCE DETERMINISM                                          │
// │                                                                  │
// │  Instead of a SIN test tone, feed a real audio buffer (a short   │
// │  synthetic waveform) through the netlist as a PWL voltage source │
// │  and snapshot the output. This tests the entire PWL code path:   │
// │                                                                  │
// │    Float32Array (44100 Hz)                                       │
// │         │  buildPwlSource() — downsamples to 10 kHz              │
// │         ▼                                                        │
// │    PWL(0 0.0 0.0001 0.5 0.0002 1.0 ...)                          │
// │         │  ngspice transient analysis                            │
// │         ▼                                                        │
// │    variable-step output                                          │
// │                                                                  │
// │  Why it matters: this is the path used when simulating with a    │
// │  real guitar sample. If PWL downsampling or formatting changes,  │
// │  the snapshot breaks.                                            │
// └──────────────────────────────────────────────────────────────────┘
describe('PWL source determinism', () => {
  it('synthetic buffer through passthrough produces deterministic output', async () => {
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
    // Create a short 1kHz sine at 44100 Hz, 0.005s = 220.5 samples
    const sampleRate = 44100;
    const duration = 0.005;
    const numSamples = Math.round(sampleRate * duration);
    const buf = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buf[i] = Math.sin(2 * Math.PI * 1000 * (i / sampleRate));
    }

    const netlist = compileNetlist(
      nodes,
      edges,
      duration,
      1000,
      1.0,
      buf,
      sampleRate,
    );
    const output = await engine.run(netlist);

    expect(output.voltageValues.length).toBeGreaterThan(0);
    expect(snapshot(output.voltageValues, 10)).toMatchSnapshot();
  });
});

// ┌──────────────────────────────────────────────────────────────────┐
// │  COMPONENT VALUE SENSITIVITY                                     │
// │                                                                  │
// │  Same topology, different resistor values → different output.    │
// │  Verifies that component value changes actually propagate to     │
// │  the simulation (not silently ignored or cached).                │
// │                                                                  │
// │  Schematic:  INPUT ──┤R1├──┬── OUTPUT                            │
// │                            ═╪═ C1 (100nF)                        │
// │                            GND                                   │
// │                                                                  │
// │  R1 = 100Ω  → fc ≈ 16 kHz  (5 kHz passes easily)                 │
// │  R1 = 10kΩ  → fc ≈ 160 Hz  (5 kHz heavily attenuated)            │
// │                                                                  │
// │  Why it matters: if the netlist compiler ignores a resistor      │
// │  value change (e.g., uses a cached netlist), both runs would     │
// │  produce the same output. This test ensures they don't.          │
// └──────────────────────────────────────────────────────────────────┘
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
