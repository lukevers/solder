// src/store/index.ts
import { create } from 'zustand'
import type { Edge } from '@xyflow/react'
import type { ComponentNode, AudioSource } from '../lib/types'

type SimulationStatus = 'idle' | 'running' | 'error'

type StoreState = {
  // circuit slice
  nodes: ComponentNode[]
  edges: Edge[]
  selectedNodeId: string | null
  addNode: (node: ComponentNode) => void
  setNodes: (nodes: ComponentNode[]) => void
  setEdges: (edges: Edge[]) => void
  selectNode: (id: string | null) => void
  updateNodeData: (id: string, data: ComponentNode['data']) => void

  // simulation slice
  simulationStatus: SimulationStatus
  outputBuffer: Float32Array | null
  simulationError: string | null
  setSimulationStatus: (status: SimulationStatus) => void
  setOutputBuffer: (buf: Float32Array) => void
  setSimulationError: (msg: string) => void

  // audio slice
  audioSource: AudioSource
  volume: number
  playing: boolean
  setAudioSource: (source: AudioSource) => void
  setVolume: (v: number) => void
  setPlaying: (playing: boolean) => void
}

const initialState = {
  nodes: [] as ComponentNode[],
  edges: [] as Edge[],
  selectedNodeId: null,
  simulationStatus: 'idle' as SimulationStatus,
  outputBuffer: null,
  simulationError: null,
  audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
  volume: 0.7,
  playing: false,
}

export const useStore = create<StoreState>()((set) => ({
  ...initialState,

  // circuit
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data } as ComponentNode : n)),
    })),

  // simulation
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setOutputBuffer: (outputBuffer) => set({ outputBuffer }),
  setSimulationError: (simulationError) => set({ simulationError }),

  // audio
  setAudioSource: (audioSource) => set({ audioSource }),
  setVolume: (volume) => set({ volume }),
  setPlaying: (playing) => set({ playing }),
}))

// Patch setState so that a full replacement (replace=true) always re-attaches actions.
// This is needed because tests use setState({...dataOnly...}, true) which would otherwise
// wipe all action functions from the store.
const originalSetState = useStore.setState.bind(useStore)
useStore.setState = ((partial: unknown, replace?: boolean) => {
  if (replace) {
    const actions = {
      addNode: (node: ComponentNode) => useStore.setState((s) => ({ nodes: [...s.nodes, node] })),
      setNodes: (nodes: ComponentNode[]) => useStore.setState({ nodes }),
      setEdges: (edges: Edge[]) => useStore.setState({ edges }),
      selectNode: (selectedNodeId: string | null) => useStore.setState({ selectedNodeId }),
      updateNodeData: (id: string, data: ComponentNode['data']) =>
        useStore.setState((s) => ({
          nodes: s.nodes.map((n) => (n.id === id ? { ...n, data } as ComponentNode : n)),
        })),
      setSimulationStatus: (simulationStatus: SimulationStatus) => useStore.setState({ simulationStatus }),
      setOutputBuffer: (outputBuffer: Float32Array) => useStore.setState({ outputBuffer }),
      setSimulationError: (simulationError: string) => useStore.setState({ simulationError }),
      setAudioSource: (audioSource: AudioSource) => useStore.setState({ audioSource }),
      setVolume: (volume: number) => useStore.setState({ volume }),
      setPlaying: (playing: boolean) => useStore.setState({ playing }),
    }
    // Merge actions back into the replacement state
    originalSetState({ ...(partial as object), ...actions }, true)
  } else {
    originalSetState(partial as Parameters<typeof originalSetState>[0], replace)
  }
}) as typeof useStore.setState
