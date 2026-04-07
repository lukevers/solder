// src/store/index.ts

import type { Edge } from '@xyflow/react';
import { create } from 'zustand';
import type { AudioSource, ComponentNode } from '../lib/types';

type SimulationStatus = 'idle' | 'running' | 'error';

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
	simulationStatus: 'idle' as SimulationStatus,
	outputBuffer: null,
	simulationError: null,
	audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
	volume: 0.7,
	playing: false,
};

export const useStore = create<StoreState>()((set) => ({
	...initialState,

	// circuit
	addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
	setNodes: (nodes) => set({ nodes }),
	setEdges: (edges) => set({ edges }),
	selectNode: (selectedNodeId) => set({ selectedNodeId }),
	updateNodeData: (id, data) =>
		set((s) => ({
			nodes: s.nodes.map((n) =>
				n.id === id ? ({ ...n, data } as ComponentNode) : n,
			),
		})),

	// simulation
	setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
	setOutputBuffer: (outputBuffer) => set({ outputBuffer }),
	setSimulationError: (simulationError) => set({ simulationError }),

	// audio
	setAudioSource: (audioSource) => set({ audioSource }),
	setVolume: (volume) => set({ volume }),
	setPlaying: (playing) => set({ playing }),
}));
