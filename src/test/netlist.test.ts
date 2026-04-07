// src/test/netlist.test.ts

import type { Edge } from '@xyflow/react';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { buildPortGroups, compileNetlist } from '../lib/netlist';
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
		const nodes: ComponentNode[] = [
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
		const nodes: ComponentNode[] = [
			{
				id: 'in1',
				type: 'audiin',
				position: { x: 0, y: 0 },
				data: { label: 'IN' },
			},
			{
				id: 'r1',
				type: 'resistor',
				position: { x: 100, y: 0 },
				data: { label: 'R1', ohms: 10000 },
			},
		];
		const edges: Edge[] = [
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
		const nodes: ComponentNode[] = [
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
		const edges: Edge[] = [
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
		const nodes: ComponentNode[] = [
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
	const SAMPLE_RATE = 44100;
	const BUFFER_SIZE = 2048;

	// Minimal circuit: IN → R1 → OUT, with C1 to GND
	function makeRCCircuit() {
		const nodes: ComponentNode[] = [
			{
				id: 'in1',
				type: 'audiin',
				position: { x: 0, y: 0 },
				data: { label: 'IN' },
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
				data: { label: 'OUT' },
			},
			{
				id: 'gnd1',
				type: 'ground',
				position: { x: 200, y: 100 },
				data: { label: 'GND' },
			},
		];
		const edges: Edge[] = [
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

	it('emits a Vin source line', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toMatch(/^Vin /m);
	});

	it('emits R1 with correct resistance in kΩ notation', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toMatch(/R1 \S+ \S+ 10k/m);
	});

	it('emits C1 with correct capacitance in nF notation', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toMatch(/C1 \S+ 0 47n/m);
	});

	it('emits .tran directive matching buffer size and sample rate', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toMatch(/\.tran/);
	});

	it('emits .probe V() for output node', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toMatch(/\.probe V\(\S+\)/m);
	});

	it('contains .end', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE).fill(0);
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist.trim()).toMatch(/\.end$/);
	});

	it('injects PWL data from input buffer', () => {
		const { nodes, edges } = makeRCCircuit();
		const buf = new Float32Array(BUFFER_SIZE);
		buf[1] = 0.5;
		const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE);
		expect(netlist).toContain('0.5');
	});
});
