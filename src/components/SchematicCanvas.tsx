// src/components/SchematicCanvas.tsx

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  type NodeDragHandler,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  ReactFlow,
} from '@xyflow/react';
import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';

export function SchematicCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode, pushHistory } =
    useStore(
      useShallow((s) => ({
        nodes: s.nodes,
        edges: s.edges,
        setNodes: s.setNodes,
        setEdges: s.setEdges,
        selectNode: s.selectNode,
        pushHistory: s.pushHistory,
      })),
    );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) =>
      setNodes(applyNodeChanges(changes, nodes) as Array<ComponentNode>),
    [nodes, setNodes],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (changes.some((c) => c.type === 'remove')) pushHistory();
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges, pushHistory],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      pushHistory();
      setEdges(addEdge(connection, edges));
    },
    [edges, setEdges, pushHistory],
  );

  const onNodeDragStart: NodeDragHandler = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const onPaneClick = useCallback(() => selectNode(null), [selectNode]);

  const signalEdges = useMemo(
    () =>
      edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        const isDC =
          src?.type === 'power' ||
          src?.type === 'ground' ||
          tgt?.type === 'power' ||
          tgt?.type === 'ground';
        return {
          ...edge,
          type: 'signal',
          data: { ...edge.data, signalType: isDC ? 'dc' : 'ac' },
        };
      }),
    [edges, nodes],
  );

  return (
    <div className="flex-1 bg-gray-950">
      <ReactFlow
        connectionMode={ConnectionMode.Loose}
        nodes={nodes}
        edges={signalEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onPaneClick={onPaneClick}
        snapToGrid
        snapGrid={[20, 20]}
        fitView
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={20}
          offset={10}
          lineWidth={0.5}
          color="#1f2937"
        />
        <Controls />
      </ReactFlow>
    </div>
  );
}
