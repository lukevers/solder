// src/store/index.ts

import type { Edge } from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AudioSource, ComponentNode } from '../lib/types';

type SimulationStatus = 'idle' | 'running' | 'error';

type Snapshot = { nodes: Array<ComponentNode>; edges: Array<Edge> };

const MAX_HISTORY = 50;

export type Tab = {
  id: string;
  name: string;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  past: Array<Snapshot>;
  future: Array<Snapshot>;
};

function defaultTab(name: string): Tab {
  const id = crypto.randomUUID();
  return {
    id,
    name,
    nodes: [
      {
        id: `${id}-in`,
        type: 'audiin',
        position: { x: 100, y: 200 },
        data: { label: 'INPUT' },
      },
      {
        id: `${id}-out`,
        type: 'audiout',
        position: { x: 400, y: 200 },
        data: { label: 'OUTPUT' },
      },
    ] as Array<ComponentNode>,
    edges: [
      {
        id: `${id}-edge`,
        source: `${id}-in`,
        sourceHandle: 'out',
        target: `${id}-out`,
        targetHandle: 'in',
      },
    ] as Array<Edge>,
    selectedNodeId: null,
    past: [],
    future: [],
  };
}

function nextTabName(tabs: Array<Tab>): string {
  let max = 0;
  for (const t of tabs) {
    const m = t.name.match(/^Circuit (\d+)$/);
    if (m) max = Math.max(max, Number.parseInt(m[1], 10));
  }
  return `Circuit ${max + 1}`;
}

function flushActive(s: StoreState): Array<Tab> {
  return s.tabs.map((t) =>
    t.id === s.activeTabId
      ? {
          ...t,
          nodes: s.nodes,
          edges: s.edges,
          selectedNodeId: s.selectedNodeId,
          past: s.past,
          future: s.future,
        }
      : t,
  );
}

type StoreState = {
  // tab slice
  tabs: Array<Tab>;
  activeTabId: string;
  addTab: () => void;
  switchTab: (id: string) => void;
  closeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;

  // circuit slice
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  addNode: (node: ComponentNode) => void;
  setNodes: (nodes: Array<ComponentNode>) => void;
  setEdges: (edges: Array<Edge>) => void;
  selectNode: (id: string | null) => void;
  updateNodeData: (id: string, data: ComponentNode['data']) => void;
  loadCircuit: (nodes: Array<ComponentNode>, edges: Array<Edge>) => void;

  // history slice
  past: Array<Snapshot>;
  future: Array<Snapshot>;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // simulation slice
  simulationStatus: SimulationStatus;
  outputBuffer: Float32Array | null;
  simulationError: string | null;
  simulationDuration: number;
  simulationElapsed: number | null; // seconds the last simulation took
  inputFrequency: number;
  inputAmplitude: number;
  setSimulationStatus: (status: SimulationStatus) => void;
  setOutputBuffer: (buf: Float32Array, elapsed?: number) => void;
  clearOutputBuffer: () => void;
  setSimulationError: (msg: string) => void;

  // audio slice
  audioSource: AudioSource;
  volume: number;
  playing: boolean;
  setAudioSource: (source: AudioSource) => void;
  setVolume: (v: number) => void;
  setPlaying: (playing: boolean) => void;
};

const firstTab = defaultTab('Circuit 1');

const initialState = {
  // tab slice
  tabs: [firstTab] as Array<Tab>,
  activeTabId: firstTab.id,

  // circuit slice (seeded from first tab)
  nodes: firstTab.nodes,
  edges: firstTab.edges,
  selectedNodeId: null as string | null,
  past: [] as Array<Snapshot>,
  future: [] as Array<Snapshot>,

  // simulation slice
  simulationStatus: 'idle' as SimulationStatus,
  outputBuffer: null as Float32Array | null,
  simulationError: null as string | null,
  simulationDuration: 0.1,
  simulationElapsed: null as number | null,
  inputFrequency: 1000,
  inputAmplitude: 1.0,

  // audio slice
  audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
  volume: 0.7,
  playing: false,
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // tabs
      addTab: () =>
        set((s) => {
          const flushed = flushActive(s);
          const newTab = defaultTab(nextTabName(flushed));
          return {
            tabs: [...flushed, newTab],
            activeTabId: newTab.id,
            nodes: newTab.nodes,
            edges: newTab.edges,
            selectedNodeId: null,
            past: [],
            future: [],
          };
        }),
      switchTab: (id) =>
        set((s) => {
          if (s.activeTabId === id) return {};
          const flushed = flushActive(s);
          const target = flushed.find((t) => t.id === id)!;
          return {
            tabs: flushed,
            activeTabId: id,
            nodes: target.nodes,
            edges: target.edges,
            selectedNodeId: target.selectedNodeId,
            past: target.past,
            future: target.future,
          };
        }),
      closeTab: (id) =>
        set((s) => {
          const flushed = flushActive(s);
          const remaining = flushed.filter((t) => t.id !== id);
          if (remaining.length === 0) {
            const newTab = defaultTab('Circuit 1');
            return {
              tabs: [newTab],
              activeTabId: newTab.id,
              nodes: newTab.nodes,
              edges: newTab.edges,
              selectedNodeId: null,
              past: [],
              future: [],
            };
          }
          if (s.activeTabId === id) {
            const closedIdx = flushed.findIndex((t) => t.id === id);
            const next = remaining[Math.min(closedIdx, remaining.length - 1)];
            return {
              tabs: remaining,
              activeTabId: next.id,
              nodes: next.nodes,
              edges: next.edges,
              selectedNodeId: next.selectedNodeId,
              past: next.past,
              future: next.future,
            };
          }
          return { tabs: remaining };
        }),
      renameTab: (id, name) =>
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, name } : t)),
        })),

      // circuit
      addNode: (node) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          nodes: [...s.nodes, node],
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle' as const,
        })),
      setNodes: (nodes) =>
        set((s) => {
          const oldIds = new Set(s.nodes.map((n) => n.id));
          const topologyChanged =
            nodes.some((n) => !oldIds.has(n.id)) ||
            nodes.length !== s.nodes.length;
          return {
            nodes,
            ...(topologyChanged
              ? {
                  outputBuffer: null,
                  simulationElapsed: null,
                  simulationStatus: 'idle' as const,
                }
              : {}),
          };
        }),
      setEdges: (edges) =>
        set({
          edges,
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle' as const,
        }),
      selectNode: (selectedNodeId) => set({ selectedNodeId }),
      updateNodeData: (id, data) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          nodes: s.nodes.map((n) =>
            n.id === id ? ({ ...n, data } as ComponentNode) : n,
          ),
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle' as const,
        })),
      loadCircuit: (nodes, edges) =>
        set((s) => {
          const updatedTabs = s.tabs.map((t) =>
            t.id === s.activeTabId
              ? {
                  ...t,
                  nodes,
                  edges,
                  selectedNodeId: null,
                  past: [],
                  future: [],
                }
              : t,
          );
          return {
            nodes,
            edges,
            selectedNodeId: null,
            past: [],
            future: [],
            tabs: updatedTabs,
            outputBuffer: null,
            simulationElapsed: null,
            simulationStatus: 'idle' as const,
          };
        }),

      // history
      pushHistory: () =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
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
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle',
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
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle',
        });
      },

      // simulation
      setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
      setOutputBuffer: (outputBuffer, elapsed) =>
        set({
          outputBuffer,
          ...(elapsed != null ? { simulationElapsed: elapsed } : {}),
        }),
      clearOutputBuffer: () =>
        set({
          outputBuffer: null,
          simulationElapsed: null,
          simulationStatus: 'idle',
        }),
      setSimulationError: (simulationError) => set({ simulationError }),

      // audio
      setAudioSource: (audioSource) => set({ audioSource }),
      setVolume: (volume) => set({ volume }),
      setPlaying: (playing) => set({ playing }),
    }),
    {
      name: 'solder-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const active = state.tabs.find((t) => t.id === state.activeTabId);
        if (!active) return;
        state.nodes = active.nodes;
        state.edges = active.edges;
        state.selectedNodeId = active.selectedNodeId;
        state.past = active.past;
        state.future = active.future;
      },
    },
  ),
);
