// src/lib/netlist.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from './types';

/** All port handles for each component type */
const COMPONENT_HANDLES: Record<ComponentNode['type'], string[]> = {
	resistor: ['a', 'b'],
	capacitor: ['a', 'b'],
	opamp: ['in_pos', 'in_neg', 'out', 'vcc', 'gnd'],
	power: ['pos'],
	ground: ['gnd'],
	audiin: ['out'],
	audiout: ['in'],
};

/** Port identifier: "${nodeId}|${handleId}" */
type Port = string;

function allPorts(nodes: ComponentNode[]): Port[] {
	return nodes.flatMap((n) =>
		COMPONENT_HANDLES[n.type].map((h) => `${n.id}|${h}`),
	);
}

function buildAdjacency(edges: Edge[]): Map<Port, Set<Port>> {
	const adj = new Map<Port, Set<Port>>();
	const add = (p: Port) => {
		if (!adj.has(p)) adj.set(p, new Set());
	};
	for (const e of edges) {
		if (!e.sourceHandle || !e.targetHandle) continue;
		const src: Port = `${e.source}|${e.sourceHandle}`;
		const tgt: Port = `${e.target}|${e.targetHandle}`;
		add(src);
		add(tgt);
		adj.get(src)!.add(tgt);
		adj.get(tgt)!.add(src);
	}
	return adj;
}

function bfs(
	start: Port,
	nodeId: string,
	adj: Map<Port, Set<Port>>,
	visited: Set<Port>,
	portToNode: Map<Port, string>,
) {
	const queue = [start];
	visited.add(start);
	portToNode.set(start, nodeId);
	while (queue.length) {
		const cur = queue.shift()!;
		for (const neighbor of adj.get(cur) ?? []) {
			if (!visited.has(neighbor)) {
				visited.add(neighbor);
				portToNode.set(neighbor, nodeId);
				queue.push(neighbor);
			}
		}
	}
}

/**
 * Assigns each port a SPICE node ID string.
 * Ground ports → "0". Others → "n1", "n2", ...
 */
export function buildPortGroups(
	nodes: ComponentNode[],
	edges: Edge[],
): Map<Port, string> {
	const adj = buildAdjacency(edges);
	const portToNode = new Map<Port, string>();
	const visited = new Set<Port>();

	// Seed all known ports into adjacency (so isolated ports are included)
	for (const p of allPorts(nodes)) {
		if (!adj.has(p)) adj.set(p, new Set());
	}

	// Ground-connected ports first → node "0"
	const groundPorts = nodes
		.filter((n) => n.type === 'ground')
		.map((n) => `${n.id}|gnd`);

	for (const gp of groundPorts) {
		if (!visited.has(gp)) {
			bfs(gp, '0', adj, visited, portToNode);
		}
	}

	// Remaining groups
	let counter = 1;
	for (const [port] of adj) {
		if (!visited.has(port)) {
			bfs(port, `n${counter++}`, adj, visited, portToNode);
		}
	}

	return portToNode;
}

/** Format ohms as SPICE: 10000 → "10k", 1000000 → "1Meg", etc. */
function formatResistance(ohms: number): string {
	if (ohms >= 1e6) return `${parseFloat((ohms / 1e6).toPrecision(10))}Meg`;
	if (ohms >= 1e3) return `${parseFloat((ohms / 1e3).toPrecision(10))}k`;
	return `${ohms}`;
}

/** Format farads as SPICE: 47e-9 → "47n", 100e-12 → "100p", etc. */
function formatCapacitance(farads: number): string {
	if (farads >= 1e-3) return `${parseFloat((farads * 1e3).toPrecision(10))}m`;
	if (farads >= 1e-6) return `${parseFloat((farads * 1e6).toPrecision(10))}u`;
	if (farads >= 1e-9) return `${parseFloat((farads * 1e9).toPrecision(10))}n`;
	return `${parseFloat((farads * 1e12).toPrecision(10))}p`;
}

/**
 * Converts an audio input buffer to a SPICE PWL source string.
 * PWL(t0 v0 t1 v1 ...) where tn = n / sampleRate seconds
 */
function bufferToPWL(buf: Float32Array, sampleRate: number): string {
	const pairs: string[] = [];
	for (let i = 0; i < buf.length; i++) {
		const t = (i / sampleRate).toExponential(6);
		const v = buf[i].toFixed(6);
		pairs.push(`${t} ${v}`);
	}
	return `PWL(${pairs.join(' ')})`;
}

/**
 * Compiles a react-flow circuit graph into a SPICE netlist string.
 * @param nodes  - ComponentNode array from the circuit store
 * @param edges  - Edge array from the circuit store
 * @param inputBuffer - Float32Array of audio input samples
 * @param sampleRate  - Audio sample rate in Hz (typically 44100)
 */
export function compileNetlist(
	nodes: ComponentNode[],
	edges: Edge[],
	inputBuffer: Float32Array,
	sampleRate: number,
): string {
	const portToNode = buildPortGroups(nodes, edges);

	const getNode = (nodeId: string, handle: string): string =>
		portToNode.get(`${nodeId}|${handle}`) ?? 'UNCONNECTED';

	const lines: string[] = ['* solder — auto-generated netlist'];

	// Op-amp model includes — only include models actually present in the circuit
	const usedModels = new Set(
		nodes.filter((n) => n.type === 'opamp').map((n) => n.data.model),
	);
	if (usedModels.has('TL072')) lines.push('.include TL072.lib');
	if (usedModels.has('LM741')) lines.push('.include LM741.lib');

	// Find input and output nodes
	const inputNode = nodes.find((n) => n.type === 'audiin');
	const outputNode = nodes.find((n) => n.type === 'audiout');

	if (!inputNode) throw new Error('Circuit has no input node');
	if (!outputNode) throw new Error('Circuit has no output node');

	const inputSpiceNode = getNode(inputNode.id, 'out');
	const outputSpiceNode = getNode(outputNode.id, 'in');

	// Vin: audio source as PWL
	lines.push(`Vin ${inputSpiceNode} 0 ${bufferToPWL(inputBuffer, sampleRate)}`);

	// Emit each component
	for (const node of nodes) {
		if (node.type === 'resistor') {
			const na = getNode(node.id, 'a');
			const nb = getNode(node.id, 'b');
			lines.push(
				`${node.data.label} ${na} ${nb} ${formatResistance(node.data.ohms)}`,
			);
		} else if (node.type === 'capacitor') {
			const na = getNode(node.id, 'a');
			const nb = getNode(node.id, 'b');
			lines.push(
				`${node.data.label} ${na} ${nb} ${formatCapacitance(node.data.farads)}`,
			);
		} else if (node.type === 'opamp') {
			const inPos = getNode(node.id, 'in_pos');
			const inNeg = getNode(node.id, 'in_neg');
			const out = getNode(node.id, 'out');
			const vcc = getNode(node.id, 'vcc');
			const gnd = getNode(node.id, 'gnd');
			lines.push(
				`X${node.data.label} ${inPos} ${inNeg} ${vcc} ${gnd} ${out} ${node.data.model}`,
			);
		} else if (node.type === 'power') {
			const pos = getNode(node.id, 'pos');
			lines.push(`V${node.data.label} ${pos} 0 DC ${node.data.volts}`);
		}
		// ground, input, output nodes: no SPICE line needed
	}

	// Transient analysis: step = 1/sampleRate, stop = bufferSize/sampleRate
	const step = (1 / sampleRate).toExponential(6);
	const stop = (inputBuffer.length / sampleRate).toExponential(6);
	lines.push(`.tran ${step} ${stop}`);

	lines.push(`.probe V(${outputSpiceNode})`);
	lines.push('.end');

	return lines.join('\n');
}
