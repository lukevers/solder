// src/lib/examples/rat.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export type ExampleCircuit = {
	id: string;
	name: string;
	description: string;
	tags: string[];
	nodes: ComponentNode[];
	edges: Edge[];
};

const ratNodes: ComponentNode[] = [
	{
		id: 'rat-in',
		type: 'audiin',
		position: { x: 30, y: 290 },
		data: { label: 'IN' },
	},
	{
		id: 'rat-c1',
		type: 'capacitor',
		position: { x: 155, y: 290 },
		data: { label: 'C1', farads: 47e-9 },
	},
	{
		id: 'rat-r1',
		type: 'resistor',
		position: { x: 285, y: 290 },
		data: { label: 'R1', ohms: 47 },
	},
	{
		id: 'rat-r2',
		type: 'resistor',
		position: { x: 415, y: 290 },
		data: { label: 'R2', ohms: 100 },
	},
	{
		id: 'rat-u1',
		type: 'opamp',
		position: { x: 590, y: 250 },
		data: { label: 'U1', model: 'TL072' },
	},
	{
		id: 'rat-vcc',
		type: 'power',
		position: { x: 505, y: 30 },
		data: { label: 'VCC', volts: 9 },
	},
	{
		id: 'rat-rbias1',
		type: 'resistor',
		position: { x: 415, y: 115 },
		data: { label: 'R3', ohms: 47000 },
	},
	{
		id: 'rat-rbias2',
		type: 'resistor',
		position: { x: 550, y: 115 },
		data: { label: 'R4', ohms: 47000 },
	},
	{
		id: 'rat-gnd_b',
		type: 'ground',
		position: { x: 565, y: 215 },
		data: { label: 'GND' },
	},
	{
		id: 'rat-gnd_u',
		type: 'ground',
		position: { x: 660, y: 405 },
		data: { label: 'GND' },
	},
	{
		id: 'rat-rfb',
		type: 'resistor',
		position: { x: 730, y: 130 },
		data: { label: 'R5', ohms: 2200 },
	},
	{
		id: 'rat-rdist',
		type: 'pot',
		position: { x: 865, y: 130 },
		data: { label: 'DIST', ohms: 500000, position: 0.5 },
	},
	{
		id: 'rat-cfb',
		type: 'capacitor',
		position: { x: 800, y: 40 },
		data: { label: 'C2', farads: 100e-12 },
	},
	{
		id: 'rat-d1',
		type: 'diode',
		position: { x: 665, y: 370 },
		data: { label: 'D1', model: '1N914' },
	},
	{
		id: 'rat-d2',
		type: 'diode',
		position: { x: 665, y: 450 },
		data: { label: 'D2', model: '1N914' },
	},
	{
		id: 'rat-rtone',
		type: 'resistor',
		position: { x: 960, y: 290 },
		data: { label: 'R6', ohms: 10000 },
	},
	{
		id: 'rat-ctone',
		type: 'capacitor',
		position: { x: 960, y: 380 },
		data: { label: 'C3', farads: 100e-9 },
	},
	{
		id: 'rat-gnd_t',
		type: 'ground',
		position: { x: 960, y: 478 },
		data: { label: 'GND' },
	},
	{
		id: 'rat-cout',
		type: 'capacitor',
		position: { x: 1090, y: 290 },
		data: { label: 'C4', farads: 100e-9 },
	},
	{
		id: 'rat-vol',
		type: 'pot',
		position: { x: 1215, y: 290 },
		data: { label: 'VOL', ohms: 100000, position: 0.8 },
	},
	{
		id: 'rat-gnd_v',
		type: 'ground',
		position: { x: 1215, y: 408 },
		data: { label: 'GND' },
	},
	{
		id: 'rat-out',
		type: 'audiout',
		position: { x: 1370, y: 290 },
		data: { label: 'OUT' },
	},
];

const ratEdges: Edge[] = [
	{
		id: 'rat-e1',
		source: 'rat-in',
		sourceHandle: 'out',
		target: 'rat-c1',
		targetHandle: 'a',
	},
	{
		id: 'rat-e2',
		source: 'rat-c1',
		sourceHandle: 'b',
		target: 'rat-r1',
		targetHandle: 'a',
	},
	{
		id: 'rat-e3',
		source: 'rat-r1',
		sourceHandle: 'b',
		target: 'rat-r2',
		targetHandle: 'a',
	},
	{
		id: 'rat-e4',
		source: 'rat-r2',
		sourceHandle: 'b',
		target: 'rat-u1',
		targetHandle: 'in_neg',
	},
	{
		id: 'rat-e5',
		source: 'rat-vcc',
		sourceHandle: 'pos',
		target: 'rat-u1',
		targetHandle: 'vcc',
	},
	{
		id: 'rat-e6',
		source: 'rat-vcc',
		sourceHandle: 'pos',
		target: 'rat-rbias1',
		targetHandle: 'a',
	},
	{
		id: 'rat-e7',
		source: 'rat-rbias1',
		sourceHandle: 'b',
		target: 'rat-rbias2',
		targetHandle: 'a',
	},
	{
		id: 'rat-e8',
		source: 'rat-rbias1',
		sourceHandle: 'b',
		target: 'rat-u1',
		targetHandle: 'in_pos',
	},
	{
		id: 'rat-e9',
		source: 'rat-rbias2',
		sourceHandle: 'b',
		target: 'rat-gnd_b',
		targetHandle: 'gnd',
	},
	{
		id: 'rat-e10',
		source: 'rat-gnd_u',
		sourceHandle: 'gnd',
		target: 'rat-u1',
		targetHandle: 'gnd',
	},
	{
		id: 'rat-e11',
		source: 'rat-u1',
		sourceHandle: 'out',
		target: 'rat-rfb',
		targetHandle: 'a',
	},
	{
		id: 'rat-e12',
		source: 'rat-rfb',
		sourceHandle: 'b',
		target: 'rat-rdist',
		targetHandle: 'ccw',
	},
	{
		id: 'rat-e13',
		source: 'rat-rdist',
		sourceHandle: 'wiper',
		target: 'rat-u1',
		targetHandle: 'in_neg',
	},
	{
		id: 'rat-e13b',
		source: 'rat-rdist',
		sourceHandle: 'cw',
		target: 'rat-u1',
		targetHandle: 'in_neg',
	},
	{
		id: 'rat-e14',
		source: 'rat-u1',
		sourceHandle: 'out',
		target: 'rat-cfb',
		targetHandle: 'a',
	},
	{
		id: 'rat-e15',
		source: 'rat-cfb',
		sourceHandle: 'b',
		target: 'rat-u1',
		targetHandle: 'in_neg',
	},
	{
		id: 'rat-e16',
		source: 'rat-r2',
		sourceHandle: 'b',
		target: 'rat-d1',
		targetHandle: 'a',
	},
	{
		id: 'rat-e17',
		source: 'rat-d1',
		sourceHandle: 'k',
		target: 'rat-rfb',
		targetHandle: 'a',
	},
	{
		id: 'rat-e18',
		source: 'rat-u1',
		sourceHandle: 'out',
		target: 'rat-d2',
		targetHandle: 'a',
	},
	{
		id: 'rat-e19',
		source: 'rat-d2',
		sourceHandle: 'k',
		target: 'rat-u1',
		targetHandle: 'in_neg',
	},
	{
		id: 'rat-e20',
		source: 'rat-u1',
		sourceHandle: 'out',
		target: 'rat-rtone',
		targetHandle: 'a',
	},
	{
		id: 'rat-e21',
		source: 'rat-rtone',
		sourceHandle: 'b',
		target: 'rat-ctone',
		targetHandle: 'a',
	},
	{
		id: 'rat-e22',
		source: 'rat-ctone',
		sourceHandle: 'b',
		target: 'rat-gnd_t',
		targetHandle: 'gnd',
	},
	{
		id: 'rat-e23',
		source: 'rat-rtone',
		sourceHandle: 'b',
		target: 'rat-cout',
		targetHandle: 'a',
	},
	{
		id: 'rat-e24',
		source: 'rat-cout',
		sourceHandle: 'b',
		target: 'rat-vol',
		targetHandle: 'ccw',
	},
	{
		id: 'rat-e25',
		source: 'rat-vol',
		sourceHandle: 'wiper',
		target: 'rat-out',
		targetHandle: 'in',
	},
	{
		id: 'rat-e26',
		source: 'rat-vol',
		sourceHandle: 'cw',
		target: 'rat-gnd_v',
		targetHandle: 'gnd',
	},
];

export const EXAMPLES: ExampleCircuit[] = [
	{
		id: 'procorat',
		name: 'ProCo RAT',
		description:
			'Classic distortion pedal. LM308 inverting gain stage with 1N914 hard clipping in feedback, RC tone control.',
		tags: ['distortion', 'fuzz', 'guitar'],
		nodes: ratNodes,
		edges: ratEdges,
	},
];
