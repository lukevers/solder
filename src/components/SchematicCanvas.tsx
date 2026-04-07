// src/components/SchematicCanvas.tsx
import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes'
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import type { ComponentNode } from '../lib/types'

export function SchematicCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode } = useStore(useShallow((s) => ({
    nodes: s.nodes,
    edges: s.edges,
    setNodes: s.setNodes,
    setEdges: s.setEdges,
    selectNode: s.selectNode,
  })))

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes) as ComponentNode[]),
    [nodes, setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  )

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges(addEdge(connection, edges)),
    [edges, setEdges]
  )

  const onPaneClick = useCallback(() => selectNode(null), [selectNode])

  return (
    <div className="flex-1 bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        fitView
        defaultEdgeOptions={{
          style: { stroke: '#4b5563', strokeWidth: 1.5 },
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.8}
          color="#1f2937"
        />
        <Controls
          style={{ background: '#161b22', border: '1px solid #30363d' }}
        />
      </ReactFlow>
    </div>
  )
}
