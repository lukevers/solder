import type { Edge } from '@xyflow/react';
import type { StateCreator } from 'zustand';
import type { ExampleCategory, ExampleCircuit } from '../examples';
import type {
  AudioSource,
  LocalSample,
  SweepResult,
} from '../lib/simulation-types';
import type { ComponentNode } from '../lib/types';

export type SimulationStatus = 'idle' | 'running' | 'error';

export type Snapshot = {
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

/**
 * Provenance metadata for a tab's current circuit contents.
 *
 * Example tabs carry the originating example id plus a fingerprint of the
 * untouched example payload. That lets the store decide whether a later
 * example click should replace the active tab or open a new one.
 */
export type TabOrigin =
  | { kind: 'custom' }
  | {
      kind: 'starter';
      defaultName: string;
      fingerprint: string;
    }
  | {
      kind: 'example';
      exampleId: string;
      exampleName: string;
      fingerprint: string;
    };

export type Tab = {
  id: string;
  name: string;
  origin: TabOrigin;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  selectedNodeId: string | null;
  past: Array<Snapshot>;
  future: Array<Snapshot>;
  outputBuffer: Float32Array | null;
  simulationStatus: SimulationStatus;
  simulationError: string | null;
  simulationElapsed: number | null;
  simulatedInput: Float32Array | null;
  sweepNodeId: string | null;
  sweepStatus: 'idle' | 'running' | 'done';
  sweepResults: Array<SweepResult>;
  sweepError: string | null;
  sweepPlayingIndex: number | null;
};

export type StoreState = {
  tabs: Array<Tab>;
  activeTabId: string;
  addTab: () => void;
  openExample: (example: ExampleCircuit) => void;
  switchTab: (id: string) => void;
  closeTab: (id: string) => void;
  renameTab: (id: string, name: string) => void;
  examplesActiveCategory: ExampleCategory;
  setExamplesActiveCategory: (category: ExampleCategory) => void;
  viewResetKey: number;
  viewport: { x: number; y: number; zoom: number };
  setViewport: (vp: { x: number; y: number; zoom: number }) => void;
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
  past: Array<Snapshot>;
  future: Array<Snapshot>;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  simulationStatus: SimulationStatus;
  outputBuffer: Float32Array | null;
  simulationError: string | null;
  simulationDuration: number;
  simulationElapsed: number | null;
  simulatedInput: Float32Array | null;
  inputFrequency: number;
  inputAmplitude: number;
  setSimulationStatus: (status: SimulationStatus) => void;
  setOutputBuffer: (buf: Float32Array, elapsed?: number) => void;
  clearOutputBuffer: () => void;
  setSimulationError: (msg: string) => void;
  setSimulatedInput: (buf: Float32Array | null) => void;
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
  audioSource: AudioSource;
  localSamples: Array<LocalSample>;
  volume: number;
  playing: boolean;
  setAudioSource: (source: AudioSource) => void;
  setLocalSamples: (samples: Array<LocalSample>) => void;
  addLocalSample: (sample: LocalSample) => void;
  removeLocalSample: (id: string) => void;
  setVolume: (v: number) => void;
  setPlaying: (playing: boolean) => void;
};

export type TabRuntimeState = Pick<
  Tab,
  | 'outputBuffer'
  | 'simulationStatus'
  | 'simulationError'
  | 'simulationElapsed'
  | 'simulatedInput'
  | 'sweepNodeId'
  | 'sweepStatus'
  | 'sweepResults'
  | 'sweepError'
  | 'sweepPlayingIndex'
>;

export type PersistedTab = Omit<Tab, keyof TabRuntimeState>;

export type PersistedStoreState = {
  tabs: Array<PersistedTab>;
  activeTabId: string;
  examplesActiveCategory: ExampleCategory;
  audioSource: AudioSource;
};

export type StoreSlice<T> = StateCreator<StoreState, [], [], T>;
