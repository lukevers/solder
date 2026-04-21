import type { Edge } from '@xyflow/react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AudioSource, SweepResult } from '../lib/simulation-types';
import { DEFAULT_SYMBOL, resolveOpAmpSymbol, SYMBOLS } from '../lib/symbols';
import type { ComponentNode } from '../lib/types';

type SimulationStatus = 'idle' | 'running' | 'error';

type Snapshot = { nodes: Array<ComponentNode>; edges: Array<Edge> };

const MAX_HISTORY = 50;

/**
 * Inject `measured` dimensions onto nodes that lack them so XYFlow can
 * resolve handle positions on the first render (before DOM measurement).
 */
function ensureMeasured(nodes: Array<ComponentNode>): Array<ComponentNode> {
  return nodes.map((n) => {
    if (n.measured?.width && n.measured?.height) {
      return n;
    }

    let w: number | undefined;
    let h: number | undefined;
    const model = (n.data as { model?: string }).model;

    switch (n.type) {
      case 'opamp': {
        const sym = resolveOpAmpSymbol(model ?? 'TL072');
        w = sym.width;
        h = sym.height;
        break;
      }
      case 'diode': {
        const symId =
          (model && DEFAULT_SYMBOL.diode[model]) ??
          Object.values(DEFAULT_SYMBOL.diode)[0];
        const sym = SYMBOLS[symId];
        if (sym) {
          w = sym.width;
          h = sym.height;
        }
        break;
      }
      case 'resistor': {
        w = 80;
        h = 40;
        break;
      }
      case 'capacitor': {
        w = 60;
        h = 40;
        break;
      }
      case 'cap_polar': {
        w = 60;
        h = 40;
        break;
      }
      case 'pot': {
        w = 80;
        h = 60;
        break;
      }
      case 'junction': {
        w = 20;
        h = 20;
        break;
      }
      case 'jack': {
        w = 80;
        h = 60;
        break;
      }
      case 'ground': {
        w = 40;
        h = 36;
        break;
      }
      case 'power': {
        w = 40;
        h = 40;
        break;
      }
      case 'bjt':
      case 'jfet':
      case 'mosfet': {
        w = 60;
        h = 60;
        break;
      }
    }

    if (!w || !h) {
      return n;
    }

    const rot = n.rotation ?? 0;
    const is90or270 = rot === 90 || rot === 270;
    return {
      ...n,
      measured: {
        width: is90or270 ? h : w,
        height: is90or270 ? w : h,
      },
    };
  });
}

export type Tab = {
  id: string;
  name: string;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  past: Array<Snapshot>;
  future: Array<Snapshot>;
  // simulation state (per-tab, not persisted)
  outputBuffer: Float32Array | null;
  simulationStatus: SimulationStatus;
  simulationError: string | null;
  simulationElapsed: number | null;
  simulatedInput: Float32Array | null;
  // sweep state (per-tab, not persisted)
  sweepNodeId: string | null;
  sweepStatus: 'idle' | 'running' | 'done';
  sweepResults: Array<SweepResult>;
  sweepError: string | null;
  sweepPlayingIndex: number | null;
};

function defaultTab(name: string): Tab {
  const id = crypto.randomUUID();
  return {
    id,
    name,
    nodes: [
      {
        id: `${id}-in`,
        type: 'jack',
        position: { x: 100, y: 200 },
        data: { label: 'INPUT', direction: 'in' },
      },
      {
        id: `${id}-gnd-in`,
        type: 'ground',
        position: { x: 140, y: 320 },
        data: { label: 'GND' },
      },
      {
        id: `${id}-out`,
        type: 'jack',
        position: { x: 400, y: 200 },
        data: { label: 'OUTPUT', direction: 'out' },
      },
      {
        id: `${id}-gnd-out`,
        type: 'ground',
        position: { x: 340, y: 320 },
        data: { label: 'GND' },
      },
    ] as Array<ComponentNode>,
    edges: [
      {
        id: `${id}-edge`,
        source: `${id}-in`,
        sourceHandle: 'pos',
        target: `${id}-out`,
        targetHandle: 'pos',
      },
      {
        id: `${id}-edge-in-gnd`,
        source: `${id}-in`,
        sourceHandle: 'neg',
        target: `${id}-gnd-in`,
        targetHandle: 'gnd',
      },
      {
        id: `${id}-edge-out-gnd`,
        source: `${id}-gnd-out`,
        sourceHandle: 'gnd',
        target: `${id}-out`,
        targetHandle: 'neg',
      },
    ] as Array<Edge>,
    selectedNodeId: null,
    past: [],
    future: [],
    ...defaultSimState,
  };
}

function nextTabName(tabs: Array<Tab>): string {
  let max = 0;
  for (const t of tabs) {
    const m = t.name.match(/^Circuit (\d+)$/);
    if (m) {
      max = Math.max(max, Number.parseInt(m[1], 10));
    }
  }
  return `Circuit ${max + 1}`;
}

const defaultSimState = {
  outputBuffer: null as Float32Array | null,
  simulationStatus: 'idle' as SimulationStatus,
  simulationError: null as string | null,
  simulationElapsed: null as number | null,
  simulatedInput: null as Float32Array | null,
  sweepNodeId: null as string | null,
  sweepStatus: 'idle' as 'idle' | 'running' | 'done',
  sweepResults: [] as Array<SweepResult>,
  sweepError: null as string | null,
  sweepPlayingIndex: null as number | null,
};

const clearSim = { ...defaultSimState };

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
          outputBuffer: s.outputBuffer,
          simulationStatus: s.simulationStatus,
          simulationError: s.simulationError,
          simulationElapsed: s.simulationElapsed,
          simulatedInput: s.simulatedInput,
          sweepNodeId: s.sweepNodeId,
          sweepStatus: s.sweepStatus,
          sweepResults: s.sweepResults,
          sweepError: s.sweepError,
          sweepPlayingIndex: s.sweepPlayingIndex,
        }
      : t,
  );
}

function simStateFromTab(tab: Tab) {
  return {
    outputBuffer: tab.outputBuffer,
    simulationStatus: tab.simulationStatus,
    simulationError: tab.simulationError,
    simulationElapsed: tab.simulationElapsed,
    simulatedInput: tab.simulatedInput,
    sweepNodeId: tab.sweepNodeId,
    sweepStatus: tab.sweepStatus,
    sweepResults: tab.sweepResults,
    sweepError: tab.sweepError,
    sweepPlayingIndex: tab.sweepPlayingIndex,
  };
}

type StoreState = {
  // tab slice
  tabs: Array<Tab>;
  activeTabId: string;
  addTab: () => void;
  switchTab: (id: string) => void;
  closeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;

  /** Incremented on tab switch, close, or loadCircuit to trigger fitView */
  viewResetKey: number;

  /** Current ReactFlow viewport — updated by SchematicCanvas onMove. Not persisted. */
  viewport: { x: number; y: number; zoom: number };
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;

  // circuit slice
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  addNode: (node: ComponentNode) => void;
  deleteNode: (id: string) => void;
  deleteEdge: (id: string) => void;
  setNodes: (nodes: Array<ComponentNode>) => void;
  setEdges: (edges: Array<Edge>) => void;
  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  updateNodeData: (id: string, data: ComponentNode['data']) => void;
  rotateNode: (id: string, rotation: number) => void;
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
  simulatedInput: Float32Array | null;
  inputFrequency: number;
  inputAmplitude: number;
  setSimulationStatus: (status: SimulationStatus) => void;
  setOutputBuffer: (buf: Float32Array, elapsed?: number) => void;
  clearOutputBuffer: () => void;
  setSimulationError: (msg: string) => void;
  setSimulatedInput: (buf: Float32Array | null) => void;

  // sweep slice
  sweepNodeId: string | null;
  sweepStatus: 'idle' | 'running' | 'done';
  sweepResults: Array<SweepResult>;
  sweepError: string | null;
  sweepPlayingIndex: number | null;
  requestSweep: (nodeId: string) => void;
  addSweepResult: (result: SweepResult) => void;
  completeSweep: () => void;
  failSweep: (error: string) => void;
  clearSweep: () => void;
  setSweepPlayingIndex: (index: number | null) => void;

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
  viewResetKey: 0,

  viewport: { x: 0, y: 0, zoom: 1 },

  // circuit slice (seeded from first tab)
  nodes: firstTab.nodes,
  edges: firstTab.edges,
  selectedNodeId: null as string | null,
  selectedEdgeId: null as string | null,
  past: [] as Array<Snapshot>,
  future: [] as Array<Snapshot>,

  // simulation slice
  simulationStatus: 'idle' as SimulationStatus,
  outputBuffer: null as Float32Array | null,
  simulationError: null as string | null,
  simulationDuration: 0.1,
  simulationElapsed: null as number | null,
  simulatedInput: null as Float32Array | null,
  inputFrequency: 1000,
  inputAmplitude: 1.0,

  // sweep slice
  sweepNodeId: null as string | null,
  sweepStatus: 'idle' as 'idle' | 'running' | 'done',
  sweepResults: [] as Array<SweepResult>,
  sweepError: null as string | null,
  sweepPlayingIndex: null as number | null,

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
            viewResetKey: s.viewResetKey + 1,
            nodes: newTab.nodes,
            edges: newTab.edges,
            selectedNodeId: null,
            past: [],
            future: [],
            ...clearSim,
          };
        }),
      switchTab: (id) =>
        set((s) => {
          if (s.activeTabId === id) {
            return {};
          }
          const flushed = flushActive(s);
          const target = flushed.find((t) => t.id === id)!;
          return {
            tabs: flushed,
            activeTabId: id,
            viewResetKey: s.viewResetKey + 1,
            nodes: target.nodes,
            edges: target.edges,
            selectedNodeId: target.selectedNodeId,
            past: target.past,
            future: target.future,
            ...simStateFromTab(target),
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
              viewResetKey: s.viewResetKey + 1,
              nodes: newTab.nodes,
              edges: newTab.edges,
              selectedNodeId: null,
              past: [],
              future: [],
              ...defaultSimState,
            };
          }
          if (s.activeTabId === id) {
            const closedIdx = flushed.findIndex((t) => t.id === id);
            const next = remaining[Math.min(closedIdx, remaining.length - 1)];
            return {
              tabs: remaining,
              activeTabId: next.id,
              viewResetKey: s.viewResetKey + 1,
              nodes: next.nodes,
              edges: next.edges,
              selectedNodeId: next.selectedNodeId,
              past: next.past,
              future: next.future,
              ...simStateFromTab(next),
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
          ...clearSim,
        })),
      deleteNode: (id) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          nodes: s.nodes.filter((n) => n.id !== id),
          edges: s.edges.filter((e) => e.source !== id && e.target !== id),
          selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
          ...clearSim,
        })),
      deleteEdge: (id) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          edges: s.edges.filter((e) => e.id !== id),
          selectedEdgeId: null,
          ...clearSim,
        })),
      setNodes: (nodes) =>
        set((s) => {
          const oldIds = new Set(s.nodes.map((n) => n.id));
          const topologyChanged =
            nodes.some((n) => !oldIds.has(n.id)) ||
            nodes.length !== s.nodes.length;
          return {
            nodes,
            ...(topologyChanged ? clearSim : {}),
          };
        }),
      setEdges: (edges) =>
        set((s) => {
          const prevIds = new Set(s.edges.map((e) => e.id));
          const nextIds = new Set(edges.map((e) => e.id));
          const topologyChanged =
            prevIds.size !== nextIds.size ||
            [...nextIds].some((id) => !prevIds.has(id)) ||
            edges.some((e) => {
              const prev = s.edges.find((pe) => pe.id === e.id);
              return (
                prev &&
                (prev.source !== e.source ||
                  prev.target !== e.target ||
                  prev.sourceHandle !== e.sourceHandle ||
                  prev.targetHandle !== e.targetHandle)
              );
            });
          return {
            edges,
            ...(topologyChanged ? clearSim : {}),
          };
        }),
      selectNode: (selectedNodeId) =>
        set({ selectedNodeId, selectedEdgeId: null }),
      selectEdge: (selectedEdgeId) =>
        set({ selectedEdgeId, selectedNodeId: null }),
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
          ...clearSim,
        })),
      rotateNode: (id, rotation) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          nodes: s.nodes.map((n) =>
            n.id === id ? ({ ...n, rotation } as ComponentNode) : n,
          ),
        })),
      loadCircuit: (nodes, edges) =>
        set((s) => {
          const measured = ensureMeasured(nodes);
          const updatedTabs = s.tabs.map((t) =>
            t.id === s.activeTabId
              ? {
                  ...t,
                  nodes: measured,
                  edges,
                  selectedNodeId: null,
                  past: [],
                  future: [],
                }
              : t,
          );
          return {
            nodes: measured,
            edges,
            selectedNodeId: null,
            past: [],
            future: [],
            tabs: updatedTabs,
            viewResetKey: s.viewResetKey + 1,
            ...clearSim,
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
        if (past.length === 0) {
          return;
        }
        const prev = past[past.length - 1];
        set({
          past: past.slice(0, -1),
          future: [{ nodes, edges }, ...future],
          nodes: prev.nodes,
          edges: prev.edges,
          selectedNodeId: null,
          ...clearSim,
        });
      },
      redo: () => {
        const { past, nodes, edges, future } = get();
        if (future.length === 0) {
          return;
        }
        const next = future[0];
        set({
          past: [...past, { nodes, edges }],
          future: future.slice(1),
          nodes: next.nodes,
          edges: next.edges,
          selectedNodeId: null,
          ...clearSim,
        });
      },

      // simulation
      setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
      setOutputBuffer: (outputBuffer, elapsed) =>
        set({
          outputBuffer,
          ...(elapsed != null ? { simulationElapsed: elapsed } : {}),
        }),
      clearOutputBuffer: () => set(clearSim),
      setSimulationError: (simulationError) => set({ simulationError }),
      setSimulatedInput: (simulatedInput) => set({ simulatedInput }),

      // sweep
      requestSweep: (nodeId) =>
        set({
          sweepNodeId: nodeId,
          sweepStatus: 'running',
          sweepResults: [],
          sweepError: null,
          sweepPlayingIndex: null,
        }),
      addSweepResult: (result) =>
        set((s) => ({
          sweepResults: [...s.sweepResults, result].sort(
            (a, b) => a.position - b.position,
          ),
        })),
      completeSweep: () => set({ sweepStatus: 'done' }),
      failSweep: (error) => set({ sweepStatus: 'idle', sweepError: error }),
      clearSweep: () =>
        set({
          sweepNodeId: null,
          sweepStatus: 'idle',
          sweepResults: [],
          sweepError: null,
          sweepPlayingIndex: null,
        }),
      setSweepPlayingIndex: (sweepPlayingIndex) => set({ sweepPlayingIndex }),

      setViewport: (viewport) => set({ viewport }),

      // audio
      setAudioSource: (audioSource) => set({ audioSource }),
      setVolume: (volume) => set({ volume }),
      setPlaying: (playing) => set({ playing }),
    }),
    {
      name: 'solder-tabs',
      partialize: (state) => ({
        tabs: flushActive(state).map(
          ({
            outputBuffer: _ob,
            simulationStatus: _ss,
            simulationError: _se,
            simulationElapsed: _sel,
            simulatedInput: _si,
            sweepNodeId: _sn,
            sweepStatus: _sst,
            sweepResults: _sr,
            sweepError: _swe,
            sweepPlayingIndex: _sp,
            ...rest
          }) => rest,
        ),
        activeTabId: state.activeTabId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }
        state.tabs = state.tabs.map((t) => ({
          ...defaultSimState,
          ...t,
        }));
        const active = state.tabs.find((t) => t.id === state.activeTabId);
        if (!active) {
          return;
        }
        state.nodes = active.nodes;
        state.edges = active.edges;
        state.selectedNodeId = active.selectedNodeId;
        state.past = active.past;
        state.future = active.future;
      },
    },
  ),
);
