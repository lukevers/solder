// src/test/netlist.test.ts

import type { Edge } from '@xyflow/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
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
    expectTypeOf(r.type).toEqualTypeOf<ComponentNode['type']>();
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
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
    ];
    const groups = buildPortGroups(nodes, edges);
    expect(groups.get('in1|out')).toBe(groups.get('r1|a'));
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
        target: 'out1',
        targetHandle: 'in',
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
    expect(netlist).toMatch(/^Vin \S+ 0 SIN\(/m);
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
        data: { label: 'DIST', ohms: 500000, position: 0.5 },
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
    expect(netlist).toMatch(/^Rprobe \S+ 0 1000Meg$/m);
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
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out1',
        targetHandle: 'in',
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
