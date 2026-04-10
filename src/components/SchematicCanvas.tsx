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
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { type ComponentNode, isEdgeDC } from '../lib/types';
import { useStore } from '../store';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';

/** Triggers fitView when tabs switch, close, or a circuit/example is loaded */
function FitViewOnChange() {
  const { fitView } = useReactFlow();
  const viewResetKey = useStore((s) => s.viewResetKey);

  useEffect(() => {
    // Reference key so the linter sees it as used; the real purpose is
    // to re-trigger this effect whenever the key increments.
    void viewResetKey;
    // Delay so React Flow can process the new nodes before we fit
    const id = setTimeout(() => fitView({ padding: 0.15 }), 50);
    return () => clearTimeout(id);
  }, [viewResetKey, fitView]);

  return null;
}

export function SchematicCanvas() {
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectNode,
    selectEdge,
    pushHistory,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      setNodes: s.setNodes,
      setEdges: s.setEdges,
      selectNode: s.selectNode,
      selectEdge: s.selectEdge,
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

  // Track connection start for drop-on-edge support
  const connectStartRef = useRef<{
    nodeId: string;
    handleId: string;
  } | null>(null);

  const onConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: { nodeId: string | null; handleId: string | null },
    ) => {
      setIsConnecting(true);
      if (params.nodeId && params.handleId) {
        connectStartRef.current = {
          nodeId: params.nodeId,
          handleId: params.handleId,
        };
      }
    },
    [],
  );

  const onConnectEnd = useCallback(
    (event: MouseEvent | TouchEvent) => {
      setIsConnecting(false);
      const start = connectStartRef.current;
      connectStartRef.current = null;
      if (!start) return;

      const clientX =
        'changedTouches' in event
          ? event.changedTouches[0].clientX
          : event.clientX;
      const clientY =
        'changedTouches' in event
          ? event.changedTouches[0].clientY
          : event.clientY;

      // Find edge element under pointer (skip the connection line being drawn)
      const elements = document.elementsFromPoint(clientX, clientY);
      let edgeEl: Element | null = null;
      for (const el of elements) {
        if (el.closest('.react-flow__connection')) continue;
        const found = el.closest('.react-flow__edge');
        if (found) {
          edgeEl = found;
          break;
        }
      }
      if (!edgeEl) return;

      const pathWithId = edgeEl.querySelector('path[id]');
      if (!pathWithId) return;
      const edgeId = pathWithId.id;

      const edge = edges.find((e) => e.id === edgeId);
      if (!edge) return;

      // Don't connect to an edge that already involves this node
      if (edge.source === start.nodeId || edge.target === start.nodeId) return;

      pushHistory();
      setEdges(
        addEdge(
          {
            source: start.nodeId,
            sourceHandle: start.handleId,
            target: edge.source,
            targetHandle: edge.sourceHandle ?? null,
          },
          edges,
        ),
      );
    },
    [edges, setEdges, pushHistory],
  );

  const onNodeDragStart: NodeDragHandler = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: { id: string }) => {
      selectEdge(edge.id);
    },
    [selectEdge],
  );

  const [isInteractive, setIsInteractive] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const signalEdges = useMemo(
    () =>
      edges.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        const isDC = isEdgeDC(src?.type, tgt?.type);
        return {
          ...edge,
          type: 'signal',
          data: {
            ...edge.data,
            signalType: isDC ? 'dc' : 'ac',
            sourceLabel: src?.data.label ?? src?.type ?? '?',
            sourceHandle: edge.sourceHandle ?? '',
            targetLabel: tgt?.data.label ?? tgt?.type ?? '?',
            targetHandle: edge.targetHandle ?? '',
            connecting: isConnecting,
          },
        };
      }),
    [edges, nodes, isConnecting],
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
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeDragStart={onNodeDragStart}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        nodesDraggable={isInteractive}
        nodesConnectable={isInteractive}
        elementsSelectable={isInteractive}
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
        <Controls onInteractiveChange={setIsInteractive} />
        <FitViewOnChange />
      </ReactFlow>
    </div>
  );
}
