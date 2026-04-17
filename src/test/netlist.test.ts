// src/test/netlist.test.ts

import type { Edge } from '@xyflow/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  applyTaper,
  buildPortGroups,
  compileNetlist,
  formatCapacitance,
  formatResistance,
} from '../lib/netlist';
import type { CircuitState, ComponentNode } from '../lib/types';

describe('types', () => {
  it('ComponentNode discriminated union compiles', () => {
    const r: ComponentNode = {
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    };
    expectTypeOf(r.type).toExtend<ComponentNode['type']>();
  });

  it('CircuitState contains nodes and edges', () => {
    expectTypeOf<CircuitState>().toHaveProperty('nodes');
    expectTypeOf<CircuitState>().toHaveProperty('edges');
  });
});

describe('buildPortGroups', () => {
  it('assigns ground node port to "0"', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'gnd1',
        type: 'ground',
        position: { x: 0, y: 0 },
        data: { label: 'GND' },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    expect(groups.get('gnd1|gnd')).toBe('0');
  });

  it('connects two ports sharing an edge into the same group', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in1',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('in1|pos')).toBe(groups.get('r1|a'));
  });

  it('ground propagates through connected edges', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'gnd1',
        type: 'ground',
        position: { x: 0, y: 0 },
        data: { label: 'GND' },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 47e-9 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'gnd1',
        sourceHandle: 'gnd',
        target: 'c1',
        targetHandle: 'b',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('c1|b')).toBe('0');
  });

  it('isolated port gets its own node ID', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 0, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    // Both terminals get node IDs (may be different)
    expect(groups.has('r1|a')).toBe(true);
    expect(groups.has('r1|b')).toBe(true);
  });
});

describe('compileNetlist', () => {
  // Minimal circuit: IN → R1 → OUT, with C1 to GND
  function makeRCCircuit() {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 200, y: 0 },
        data: { label: 'C1', farads: 47e-9 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 300, y: 0 },
        data: { label: 'OUTPUT' },
      },
      {
        id: 'gnd1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in1',
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
        target: 'out1',
        targetHandle: 'pos',
      },
      {
        id: 'e4',
        source: 'c1',
        sourceHandle: 'b',
        target: 'gnd1',
        targetHandle: 'gnd',
      },
    ];
    return { nodes, edges };
  }

  it('emits a SIN Vin source line', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/^Vin \S+ \S+ SIN\(/m);
  });

  it('uses the supplied frequency in the SIN source', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 1.0, 440, 1.0);
    expect(netlist).toContain('SIN(0 1 440)');
  });

  it('uses the supplied amplitude in the SIN source', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 1.0, 1000, 0.5);
    expect(netlist).toContain('SIN(0 0.5 1000)');
  });

  it('emits R1 with correct resistance in kΩ notation', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/R1 \S+ \S+ 10k/m);
  });

  it('emits C1 with correct capacitance in nF notation', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/C1 \S+ 0 47n/m);
  });

  it('emits .tran with step 1/SPICE_SAMPLE_RATE and supplied duration', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 2.0);
    expect(netlist).toMatch(/\.tran 1\.000000e-4 2\.000000e\+0/m);
  });

  it('emits .save V() for output node (not .probe)', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/^\.save V\(\S+\)/m);
    expect(netlist).not.toMatch(/\.probe/);
  });

  it('contains .end', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist.trim()).toMatch(/\.end$/);
  });

  it('inlines TL072_SUBCKT when a TL072 op-amp is present', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 100, y: 0 },
        data: { label: 'U1', model: 'TL072' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.SUBCKT TL072');
    expect(netlist).not.toContain('.include TL072.lib');
  });

  it('inlines LM741_SUBCKT when a LM741 op-amp is present', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 100, y: 0 },
        data: { label: 'U1', model: 'LM741' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.SUBCKT LM741');
    expect(netlist).not.toContain('.include LM741.lib');
  });

  it('throws when circuit has no AudioIn node', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 0, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    expect(() => compileNetlist(nodes, [])).toThrow('no input node');
  });

  it('throws when circuit has no AudioOut node', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
    ];
    expect(() => compileNetlist(nodes, [])).toThrow('no output node');
  });

  it('emits diode model and element line', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'd1',
        type: 'diode',
        position: { x: 100, y: 0 },
        data: { label: 'D1', model: '1N914' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 1N914 D(');
    expect(netlist).toMatch(/^D1 /m);
  });

  it('emits R-prefixed pot split-resistors', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pot1',
        type: 'pot',
        position: { x: 100, y: 0 },
        data: { label: 'DIST', ohms: 500000, position: 0.5, taper: 'linear' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    const rdistLines = netlist.split('\n').filter((l) => l.startsWith('RDIST'));
    expect(rdistLines).toHaveLength(2);
  });

  it('emits VVCC line for a power node', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pwr1',
        type: 'power',
        position: { x: 100, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toMatch(/^VVCC \S+ 0 DC 9$/m);
  });

  it('deduplicates power nodes with same label', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pwr1',
        type: 'power',
        position: { x: 100, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'pwr2',
        type: 'power',
        position: { x: 200, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 300, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    const vccLines = netlist.split('\n').filter((l) => l.startsWith('VVCC'));
    expect(vccLines).toHaveLength(1);
  });

  it('always includes Rprobe line', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 100, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toMatch(/^Rprobe \S+ \S+ 1000Meg$/m);
  });

  it('label nodes produce no SPICE component line', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'lbl1',
        type: 'label',
        position: { x: 100, y: 0 },
        data: { label: 'NET1' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    // The label name should not appear as a SPICE element line
    expect(netlist).not.toMatch(/^NET1 /m);
  });
});

describe('formatResistance', () => {
  it('formats 100 as "100"', () => {
    expect(formatResistance(100)).toBe('100');
  });

  it('formats 4700 as "4.7k"', () => {
    expect(formatResistance(4700)).toBe('4.7k');
  });

  it('formats 1000000 as "1Meg"', () => {
    expect(formatResistance(1000000)).toBe('1Meg');
  });

  it('formats 2200000 as "2.2Meg"', () => {
    expect(formatResistance(2200000)).toBe('2.2Meg');
  });
});

describe('formatCapacitance', () => {
  it('formats 100e-12 as "100p"', () => {
    expect(formatCapacitance(100e-12)).toBe('100p');
  });

  it('formats 47e-9 as "47n"', () => {
    expect(formatCapacitance(47e-9)).toBe('47n');
  });

  it('formats 1e-6 as "1u"', () => {
    expect(formatCapacitance(1e-6)).toBe('1u');
  });

  it('formats 10e-3 as "10m"', () => {
    expect(formatCapacitance(10e-3)).toBe('10m');
  });
});

describe('buildPortGroups with label nodes', () => {
  it('two label nodes with same name share the same SPICE net', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'lbl1',
        type: 'label',
        position: { x: 0, y: 0 },
        data: { label: 'NET1' },
      },
      {
        id: 'lbl2',
        type: 'label',
        position: { x: 100, y: 0 },
        data: { label: 'NET1' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 300, y: 0 },
        data: { label: 'R2', ohms: 2000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'r1',
        sourceHandle: 'b',
        target: 'lbl1',
        targetHandle: 'net',
      },
      {
        id: 'e2',
        source: 'r2',
        sourceHandle: 'a',
        target: 'lbl2',
        targetHandle: 'net',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('lbl1|net')).toBe(groups.get('lbl2|net'));
    // R1.b and R2.a should share the same net through the labels
    expect(groups.get('r1|b')).toBe(groups.get('r2|a'));
  });
});

describe('buildPortGroups with power nodes', () => {
  it('two power nodes with same label share the same SPICE net', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'pwr1',
        type: 'power',
        position: { x: 0, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'pwr2',
        type: 'power',
        position: { x: 100, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 200, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 300, y: 0 },
        data: { label: 'R2', ohms: 2000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'pwr1',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'pwr2',
        sourceHandle: 'pos',
        target: 'r2',
        targetHandle: 'a',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('pwr1|pos')).toBe(groups.get('pwr2|pos'));
    // R1.a and R2.a should share the same net through the power nodes
    expect(groups.get('r1|a')).toBe(groups.get('r2|a'));
  });
});

describe('compileNetlist with PWL input buffer', () => {
  it('emits PWL source instead of SIN when inputBuffer is provided', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 100, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const buf = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5]);
    const netlist = compileNetlist(nodes, [], 0.01, 1000, 1.0, buf, 44100);
    expect(netlist).toContain('PWL(');
    expect(netlist).not.toContain('SIN(');
  });

  it('PWL source downsamples to SPICE_SAMPLE_RATE', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 100, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    // 441 samples at 44100 Hz = 0.01s → at 10kHz SPICE rate = ~100 points + 1
    const buf = new Float32Array(441);
    buf[0] = 1.0;
    const netlist = compileNetlist(nodes, [], 0.01, 1000, 1.0, buf, 44100);
    const pwlMatch = netlist.match(/PWL\(([^)]+)\)/);
    expect(pwlMatch).not.toBeNull();
    // First time-voltage pair should start at t=0
    expect(pwlMatch![1]).toMatch(/^0\.0000e\+0/);
  });
});

describe('compileNetlist with connected circuit', () => {
  it('wired components share SPICE nodes', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in1',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out1',
        targetHandle: 'pos',
      },
    ];
    const netlist = compileNetlist(nodes, edges);
    // R1 should have two shared SPICE nodes (not UNCONNECTED)
    const r1Line = netlist.split('\n').find((l) => l.startsWith('R1 '));
    expect(r1Line).toBeDefined();
    expect(r1Line).not.toContain('UNCONNECTED');
  });

  it('unwired ports get separate SPICE nodes', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    // No edges — R1's ports are isolated, should get unique node IDs
    const groups = buildPortGroups(nodes, []);
    const r1a = groups.get('r1|a');
    const r1b = groups.get('r1|b');
    expect(r1a).toBeDefined();
    expect(r1b).toBeDefined();
    expect(r1a).not.toBe(r1b);
  });
});

describe('compileNetlist op-amp models', () => {
  it('inlines LM741 subcircuit when used', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'u1',
        type: 'opamp',
        position: { x: 100, y: 0 },
        data: { label: 'U1', model: 'LM741' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.SUBCKT LM741');
    expect(netlist).not.toContain('.SUBCKT TL072');
    expect(netlist).toMatch(/^XU1 /m);
  });

  it('does not inline unused op-amp models', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).not.toContain('.SUBCKT');
  });
});

describe('compileNetlist potentiometer edge cases', () => {
  it('position=0 clamps lower resistor to 1 ohm', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pot1',
        type: 'pot',
        position: { x: 100, y: 0 },
        data: { label: 'VR1', ohms: 100000, position: 0 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    // position=0: rHigh = ohms * 0 → clamped to 1, rLow = ohms * 1 = 100000
    const lines = netlist.split('\n').filter((l) => l.startsWith('RVR1'));
    expect(lines).toHaveLength(2);
    // One should be 100k, the other should be 1 (clamped)
    expect(lines.some((l) => l.includes('100k'))).toBe(true);
    expect(lines.some((l) => l.endsWith(' 1'))).toBe(true);
  });

  it('position=1 clamps upper resistor to 1 ohm', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pot1',
        type: 'pot',
        position: { x: 100, y: 0 },
        data: { label: 'VR1', ohms: 100000, position: 1 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    const lines = netlist.split('\n').filter((l) => l.startsWith('RVR1'));
    expect(lines).toHaveLength(2);
    expect(lines.some((l) => l.includes('100k'))).toBe(true);
    expect(lines.some((l) => l.endsWith(' 1'))).toBe(true);
  });
});

describe('buildPortGroups multiple grounds share net 0', () => {
  it('two disconnected ground nodes both map to net 0', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'g1',
        type: 'ground',
        position: { x: 0, y: 0 },
        data: { label: 'GND' },
      },
      {
        id: 'g2',
        type: 'ground',
        position: { x: 100, y: 0 },
        data: { label: 'GND' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 50, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'g1',
        sourceHandle: 'gnd',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'g2',
        sourceHandle: 'gnd',
        target: 'r1',
        targetHandle: 'b',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('g1|gnd')).toBe('0');
    expect(groups.get('g2|gnd')).toBe('0');
    // Both sides of R1 should be on net 0
    expect(groups.get('r1|a')).toBe('0');
    expect(groups.get('r1|b')).toBe('0');
  });

  it('unwired ground node still maps to net 0', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'g1',
        type: 'ground',
        position: { x: 0, y: 0 },
        data: { label: 'GND' },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    expect(groups.get('g1|gnd')).toBe('0');
  });
});

describe('compileNetlist 1N4001 diode model', () => {
  it('emits 1N4001 model line', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'd1',
        type: 'diode',
        position: { x: 100, y: 0 },
        data: { label: 'D1', model: '1N4001' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 1N4001 D(');
    expect(netlist).not.toContain('.model 1N914');
  });
});

describe('buildPortGroups edge cases', () => {
  it('edges with missing handles are skipped', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 0, y: 0 },
        data: { label: 'R1', ohms: 1000 },
      },
      {
        id: 'r2',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R2', ohms: 1000 },
      },
    ];
    // Edge with null handles — should not crash or connect the ports
    const edges: Array<Edge> = [
      {
        id: 'bad',
        source: 'r1',
        sourceHandle: null,
        target: 'r2',
        targetHandle: null,
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    // R1 and R2 ports should still be on separate nets
    expect(groups.get('r1|a')).not.toBe(groups.get('r2|a'));
  });
});

describe('compileNetlist with capacitance formatting', () => {
  it('emits correctly formatted capacitor values', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 100, y: 0 },
        data: { label: 'C1', farads: 47e-9 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toMatch(/^C1 \S+ \S+ 47n$/m);
  });
});

describe('applyTaper', () => {
  it('linear taper returns position unchanged', () => {
    expect(applyTaper(0, 'linear')).toBe(0);
    expect(applyTaper(0.25, 'linear')).toBe(0.25);
    expect(applyTaper(0.5, 'linear')).toBe(0.5);
    expect(applyTaper(0.75, 'linear')).toBe(0.75);
    expect(applyTaper(1, 'linear')).toBe(1);
  });

  it('log taper: endpoints are 0 and 1', () => {
    expect(applyTaper(0, 'log')).toBe(0);
    expect(applyTaper(1, 'log')).toBe(1);
  });

  it('log taper: midpoint is well below 0.5', () => {
    const mid = applyTaper(0.5, 'log');
    expect(mid).toBeCloseTo(0.125, 5);
  });

  it('log taper: curve is monotonically increasing', () => {
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const val = applyTaper(i / 10, 'log');
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });

  it('antilog taper: endpoints are 0 and 1', () => {
    expect(applyTaper(0, 'antilog')).toBe(0);
    expect(applyTaper(1, 'antilog')).toBe(1);
  });

  it('antilog taper: midpoint is well above 0.5', () => {
    const mid = applyTaper(0.5, 'antilog');
    expect(mid).toBeCloseTo(0.875, 5);
  });

  it('antilog taper: curve is monotonically increasing', () => {
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const val = applyTaper(i / 10, 'antilog');
      expect(val).toBeGreaterThan(prev);
      prev = val;
    }
  });

  it('log and antilog are symmetric around 0.5', () => {
    for (const pos of [0.1, 0.2, 0.3, 0.4, 0.5]) {
      const logVal = applyTaper(pos, 'log');
      const antiVal = applyTaper(1 - pos, 'antilog');
      expect(logVal).toBeCloseTo(1 - antiVal, 10);
    }
  });

  it('defaults to linear when taper is undefined', () => {
    expect(applyTaper(0.5)).toBe(0.5);
    expect(applyTaper(0.3)).toBe(0.3);
  });
});

describe('compileNetlist pot taper', () => {
  const makePotCircuit = (position: number, taper: 'linear' | 'log' | 'antilog') => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'pot1',
        type: 'pot',
        position: { x: 100, y: 0 },
        data: { label: 'VR1', ohms: 100000, position, taper },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    return compileNetlist(nodes, []);
  };

  const extractResistances = (netlist: string) => {
    const lines = netlist.split('\n').filter((l) => l.startsWith('RVR1'));
    return lines.map((l) => l.split(' ').pop()!);
  };

  it('linear taper at 0.5 produces equal split', () => {
    const values = extractResistances(makePotCircuit(0.5, 'linear'));
    expect(values).toHaveLength(2);
    expect(values[0]).toBe(values[1]);
  });

  it('log taper at 0.5 produces unequal split biased toward low side', () => {
    const netlist = makePotCircuit(0.5, 'log');
    const lines = netlist.split('\n').filter((l) => l.startsWith('RVR1'));
    // log at 0.5 → effective = 0.125
    // rLow = 100k * (1 - 0.125) = 87500, rHigh = 100k * 0.125 = 12500
    expect(lines).toHaveLength(2);
    // The two resistances should be very different
    expect(lines[0]).not.toBe(lines[1]);
  });

  it('antilog taper at 0.5 produces unequal split biased toward high side', () => {
    const netlist = makePotCircuit(0.5, 'antilog');
    const lines = netlist.split('\n').filter((l) => l.startsWith('RVR1'));
    // antilog at 0.5 → effective = 0.875
    // rLow = 100k * (1 - 0.875) = 12500, rHigh = 100k * 0.875 = 87500
    expect(lines).toHaveLength(2);
    expect(lines[0]).not.toBe(lines[1]);
  });

  it('log and antilog at 0.5 produce mirrored splits', () => {
    const logValues = extractResistances(makePotCircuit(0.5, 'log'));
    const antiValues = extractResistances(makePotCircuit(0.5, 'antilog'));
    // log: [rLow=87.5k, rHigh=12.5k], antilog: [rLow=12.5k, rHigh=87.5k]
    expect(logValues[0]).toBe(antiValues[1]);
    expect(logValues[1]).toBe(antiValues[0]);
  });

  it('all tapers produce same result at position=0', () => {
    const lin = extractResistances(makePotCircuit(0, 'linear'));
    const log = extractResistances(makePotCircuit(0, 'log'));
    const anti = extractResistances(makePotCircuit(0, 'antilog'));
    expect(lin).toEqual(log);
    expect(lin).toEqual(anti);
  });

  it('all tapers produce same result at position=1', () => {
    const lin = extractResistances(makePotCircuit(1, 'linear'));
    const log = extractResistances(makePotCircuit(1, 'log'));
    const anti = extractResistances(makePotCircuit(1, 'antilog'));
    expect(lin).toEqual(log);
    expect(lin).toEqual(anti);
  });
});

// ── Transistor tests ──

/** Minimal circuit with a single transistor wired between IN and OUT */
function makeTransistorCircuit(
  transistor: ComponentNode,
): { nodes: Array<ComponentNode>; edges: Array<Edge> } {
  const nodes: Array<ComponentNode> = [
    {
      id: 'in1',
      type: 'audiin',
      position: { x: 0, y: 0 },
      data: { label: 'INPUT' },
    },
    transistor,
    {
      id: 'out1',
      type: 'audiout',
      position: { x: 200, y: 0 },
      data: { label: 'OUTPUT' },
    },
  ];
  return { nodes, edges: [] };
}

describe('compileNetlist BJT', () => {
  it('emits Q-prefixed element with collector, base, emitter order', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'q1',
      type: 'bjt',
      position: { x: 100, y: 0 },
      data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
    });
    const netlist = compileNetlist(nodes, []);
    // Format: QQ1 <collector> <base> <emitter> 2N3904
    expect(netlist).toMatch(/^QQ1 \S+ \S+ \S+ 2N3904$/m);
  });

  it('inlines 2N3904 NPN model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'q1',
      type: 'bjt',
      position: { x: 100, y: 0 },
      data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 2N3904 NPN(');
  });

  it('inlines 2N3906 PNP model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'q1',
      type: 'bjt',
      position: { x: 100, y: 0 },
      data: { label: 'Q1', polarity: 'PNP', model: '2N3906' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 2N3906 PNP(');
    expect(netlist).not.toContain('.model 2N3904');
  });

  it('inlines AC128 PNP germanium model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'q1',
      type: 'bjt',
      position: { x: 100, y: 0 },
      data: { label: 'Q1', polarity: 'PNP', model: 'AC128' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model AC128 PNP(');
  });

  it('deduplicates model when multiple BJTs share same model', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 100, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'q2',
        type: 'bjt',
        position: { x: 150, y: 0 },
        data: { label: 'Q2', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    const modelLines = netlist
      .split('\n')
      .filter((l) => l.startsWith('.model 2N3904'));
    expect(modelLines).toHaveLength(1);
    // Both element lines emitted
    expect(netlist).toMatch(/^QQ1 /m);
    expect(netlist).toMatch(/^QQ2 /m);
  });

  it('inlines multiple different BJT models', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'INPUT' },
      },
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 100, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'q2',
        type: 'bjt',
        position: { x: 150, y: 0 },
        data: { label: 'Q2', polarity: 'PNP', model: 'AC128' },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 200, y: 0 },
        data: { label: 'OUTPUT' },
      },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 2N3904 NPN(');
    expect(netlist).toContain('.model AC128 PNP(');
  });
});

describe('compileNetlist JFET', () => {
  it('emits J-prefixed element with drain, gate, source order', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'j1',
      type: 'jfet',
      position: { x: 100, y: 0 },
      data: { label: 'J1', polarity: 'N', model: '2N5457' },
    });
    const netlist = compileNetlist(nodes, []);
    // Format: JJ1 <drain> <gate> <source> 2N5457
    expect(netlist).toMatch(/^JJ1 \S+ \S+ \S+ 2N5457$/m);
  });

  it('inlines 2N5457 N-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'j1',
      type: 'jfet',
      position: { x: 100, y: 0 },
      data: { label: 'J1', polarity: 'N', model: '2N5457' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 2N5457 NJF(');
  });

  it('inlines J201 N-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'j1',
      type: 'jfet',
      position: { x: 100, y: 0 },
      data: { label: 'J1', polarity: 'N', model: 'J201' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model J201 NJF(');
    expect(netlist).not.toContain('.model 2N5457');
  });

  it('inlines 2N5460 P-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'j1',
      type: 'jfet',
      position: { x: 100, y: 0 },
      data: { label: 'J1', polarity: 'P', model: '2N5460' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model 2N5460 PJF(');
  });
});

describe('compileNetlist MOSFET', () => {
  it('emits M-prefixed element with drain, gate, source, bulk order', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'm1',
      type: 'mosfet',
      position: { x: 100, y: 0 },
      data: { label: 'M1', polarity: 'N', model: 'BS170' },
    });
    const netlist = compileNetlist(nodes, []);
    // Format: MM1 <drain> <gate> <source> <source> BS170
    // The 4th node (bulk) should equal the 3rd (source tied to bulk)
    expect(netlist).toMatch(/^MM1 \S+ \S+ (\S+) \1 BS170$/m);
  });

  it('inlines BS170 N-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'm1',
      type: 'mosfet',
      position: { x: 100, y: 0 },
      data: { label: 'M1', polarity: 'N', model: 'BS170' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model BS170 NMOS(');
  });

  it('inlines IRF510 N-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'm1',
      type: 'mosfet',
      position: { x: 100, y: 0 },
      data: { label: 'M1', polarity: 'N', model: 'IRF510' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model IRF510 NMOS(');
    expect(netlist).not.toContain('.model BS170');
  });

  it('inlines IRF9510 P-channel model when present', () => {
    const { nodes } = makeTransistorCircuit({
      id: 'm1',
      type: 'mosfet',
      position: { x: 100, y: 0 },
      data: { label: 'M1', polarity: 'P', model: 'IRF9510' },
    });
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.model IRF9510 PMOS(');
  });
});

describe('buildPortGroups with transistors', () => {
  it('BJT base, collector, emitter get separate nets when unwired', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 0, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    expect(groups.has('q1|b')).toBe(true);
    expect(groups.has('q1|c')).toBe(true);
    expect(groups.has('q1|e')).toBe(true);
    // All three should be on different nets
    const nets = new Set([
      groups.get('q1|b'),
      groups.get('q1|c'),
      groups.get('q1|e'),
    ]);
    expect(nets.size).toBe(3);
  });

  it('JFET gate, drain, source get separate nets when unwired', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'j1',
        type: 'jfet',
        position: { x: 0, y: 0 },
        data: { label: 'J1', polarity: 'N', model: '2N5457' },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    expect(groups.has('j1|g')).toBe(true);
    expect(groups.has('j1|d')).toBe(true);
    expect(groups.has('j1|s')).toBe(true);
    const nets = new Set([
      groups.get('j1|g'),
      groups.get('j1|d'),
      groups.get('j1|s'),
    ]);
    expect(nets.size).toBe(3);
  });

  it('MOSFET gate, drain, source get separate nets when unwired', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'm1',
        type: 'mosfet',
        position: { x: 0, y: 0 },
        data: { label: 'M1', polarity: 'N', model: 'BS170' },
      },
    ];
    const groups = buildPortGroups(nodes, []);
    expect(groups.has('m1|g')).toBe(true);
    expect(groups.has('m1|d')).toBe(true);
    expect(groups.has('m1|s')).toBe(true);
    const nets = new Set([
      groups.get('m1|g'),
      groups.get('m1|d'),
      groups.get('m1|s'),
    ]);
    expect(nets.size).toBe(3);
  });

  it('BJT emitter wired to ground maps to net 0', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 0, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'gnd1',
        type: 'ground',
        position: { x: 0, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'q1',
        sourceHandle: 'e',
        target: 'gnd1',
        targetHandle: 'gnd',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('q1|e')).toBe('0');
  });

  it('BJT collector wired to resistor shares net', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'q1',
        type: 'bjt',
        position: { x: 0, y: 0 },
        data: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'q1',
        sourceHandle: 'c',
        target: 'r1',
        targetHandle: 'a',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('q1|c')).toBe(groups.get('r1|a'));
  });
});
