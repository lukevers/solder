// src/store/index.ts

import type { Edge } from '@xyflow/react';
import { create } from 'zustand';
import type { AudioSource, ComponentNode } from '../lib/types';

type SimulationStatus = 'idle' | 'running' | 'error';

type Snapshot = { nodes: ComponentNode[]; edges: Edge[] };

const MAX_HISTORY = 50;

type StoreState = {
	// circuit slice
	nodes: ComponentNode[];
	edges: Edge[];
	selectedNodeId: string | null;
	addNode: (node: ComponentNode) => void;
	setNodes: (nodes: ComponentNode[]) => void;
	setEdges: (edges: Edge[]) => void;
	selectNode: (id: string | null) => void;
	updateNodeData: (id: string, data: ComponentNode['data']) => void;
	loadCircuit: (nodes: ComponentNode[], edges: Edge[]) => void;

	// history slice
	past: Snapshot[];
	future: Snapshot[];
	pushHistory: () => void;
	undo: () => void;
	redo: () => void;

	// simulation slice
	simulationStatus: SimulationStatus;
	outputBuffer: Float32Array | null;
	simulationError: string | null;
	setSimulationStatus: (status: SimulationStatus) => void;
	setOutputBuffer: (buf: Float32Array) => void;
	setSimulationError: (msg: string) => void;

	// audio slice
	audioSource: AudioSource;
	volume: number;
	playing: boolean;
	setAudioSource: (source: AudioSource) => void;
	setVolume: (v: number) => void;
	setPlaying: (playing: boolean) => void;
};

const initialState = {
	nodes: [
		{
			id: 'default-in',
			type: 'audiin',
			position: { x: 100, y: 200 },
			data: { label: 'IN' },
		},
		{
			id: 'default-out',
			type: 'audiout',
			position: { x: 400, y: 200 },
			data: { label: 'OUT' },
		},
	] as ComponentNode[],
	edges: [
		{
			id: 'default-edge',
			source: 'default-in',
			sourceHandle: 'out',
			target: 'default-out',
			targetHandle: 'in',
		},
	] as Edge[],
	selectedNodeId: null,
	past: [] as Snapshot[],
	future: [] as Snapshot[],
	simulationStatus: 'idle' as SimulationStatus,
	outputBuffer: null,
	simulationError: null,
	audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
	volume: 0.7,
	playing: false,
};

export const useStore = create<StoreState>()((set, get) => ({
	...initialState,

	// circuit
	addNode: (node) =>
		set((s) => ({
			past: [...s.past.slice(-MAX_HISTORY), { nodes: s.nodes, edges: s.edges }],
			future: [],
			nodes: [...s.nodes, node],
		})),
	setNodes: (nodes) => set({ nodes }),
	setEdges: (edges) => set({ edges }),
	selectNode: (selectedNodeId) => set({ selectedNodeId }),
	updateNodeData: (id, data) =>
		set((s) => ({
			past: [...s.past.slice(-MAX_HISTORY), { nodes: s.nodes, edges: s.edges }],
			future: [],
			nodes: s.nodes.map((n) =>
				n.id === id ? ({ ...n, data } as ComponentNode) : n,
			),
		})),
	loadCircuit: (nodes, edges) =>
		set((s) => ({
			past: [...s.past.slice(-MAX_HISTORY), { nodes: s.nodes, edges: s.edges }],
			future: [],
			nodes,
			edges,
			selectedNodeId: null,
		})),

	// history
	pushHistory: () =>
		set((s) => ({
			past: [...s.past.slice(-MAX_HISTORY), { nodes: s.nodes, edges: s.edges }],
			future: [],
		})),
	undo: () => {
		const { past, nodes, edges, future } = get();
		if (past.length === 0) return;
		const prev = past[past.length - 1];
		set({
			past: past.slice(0, -1),
			future: [{ nodes, edges }, ...future],
			nodes: prev.nodes,
			edges: prev.edges,
			selectedNodeId: null,
		});
	},
	redo: () => {
		const { past, nodes, edges, future } = get();
		if (future.length === 0) return;
		const next = future[0];
		set({
			past: [...past, { nodes, edges }],
			future: future.slice(1),
			nodes: next.nodes,
			edges: next.edges,
			selectedNodeId: null,
		});
	},

	// simulation
	setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
	setOutputBuffer: (outputBuffer) => set({ outputBuffer }),
	setSimulationError: (simulationError) => set({ simulationError }),

	// audio
	setAudioSource: (audioSource) => set({ audioSource }),
	setVolume: (volume) => set({ volume }),
	setPlaying: (playing) => set({ playing }),
}));
