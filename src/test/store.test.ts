// src/test/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store'

// Reset store between tests by replacing state wholesale (true = replace, not merge)
beforeEach(() => {
  useStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    simulationStatus: 'idle',
    outputBuffer: null,
    simulationError: null,
    audioSource: { type: 'sample', name: 'guitar' },
    volume: 0.7,
    playing: false,
  }, true)
})

describe('circuitSlice', () => {
  it('starts with empty nodes and edges', () => {
    const { nodes, edges } = useStore.getState()
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('addNode appends a node', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 100, y: 100 },
      data: { label: 'R1', ohms: 10000 },
    })
    expect(useStore.getState().nodes).toHaveLength(1)
    expect(useStore.getState().nodes[0].id).toBe('r1')
  })

  it('selectNode updates selectedNodeId', () => {
    useStore.getState().selectNode('r1')
    expect(useStore.getState().selectedNodeId).toBe('r1')
  })

  it('updateNodeData changes a node value', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    })
    useStore.getState().updateNodeData('r1', { label: 'R1', ohms: 47000 })
    const node = useStore.getState().nodes.find(n => n.id === 'r1')!
    expect(node.data).toEqual({ label: 'R1', ohms: 47000 })
  })
})

describe('simulationSlice', () => {
  it('starts idle with no output', () => {
    const { simulationStatus, outputBuffer } = useStore.getState()
    expect(simulationStatus).toBe('idle')
    expect(outputBuffer).toBeNull()
  })

  it('setSimulationStatus updates status', () => {
    useStore.getState().setSimulationStatus('running')
    expect(useStore.getState().simulationStatus).toBe('running')
  })

  it('setOutputBuffer stores buffer', () => {
    const buf = new Float32Array([0.1, 0.2, 0.3])
    useStore.getState().setOutputBuffer(buf)
    expect(useStore.getState().outputBuffer).toBe(buf)
  })
})

describe('audioSlice', () => {
  it('starts with guitar sample, not playing', () => {
    const { audioSource, volume, playing } = useStore.getState()
    expect(audioSource).toEqual({ type: 'sample', name: 'guitar' })
    expect(volume).toBe(0.7)
    expect(playing).toBe(false)
  })

  it('setAudioSource updates source', () => {
    useStore.getState().setAudioSource({ type: 'live' })
    expect(useStore.getState().audioSource).toEqual({ type: 'live' })
  })
})
