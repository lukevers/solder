// src/components/SchematicCanvas.tsx

import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  type OnConnect,
  type OnEdgesChange,
  type OnNodeDrag,
  type OnNodesChange,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { isEdgeDC } from '../lib/types';
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
  return (
    <ReactFlowProvider>
      <SchematicCanvasInner />
    </ReactFlowProvider>
  );
}

function SchematicCanvasInner() {
  const { screenToFlowPosition } = useReactFlow();
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
    handleType: 'source' | 'target';
  } | null>(null);

  const onConnectStart = useCallback(
    (
      _event: MouseEvent | TouchEvent,
      params: {
        nodeId: string | null;
        handleId: string | null;
        handleType: 'source' | 'target' | null;
      },
    ) => {
      setIsConnecting(true);
      if (params.nodeId && params.handleId && params.handleType) {
        connectStartRef.current = {
          nodeId: params.nodeId,
          handleId: params.handleId,
          handleType: params.handleType,
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

      // Create a junction node at the drop point and splice it into the edge
      const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
      // Snap to grid
      const snapped = {
        x: Math.round(flowPos.x / 20) * 20,
        y: Math.round(flowPos.y / 20) * 20,
      };
      // Node is 20x20 (one grid cell); place so its center sits on the snap point
      const junctionPos = { x: snapped.x - 10, y: snapped.y - 10 };

      const junctionId = crypto.randomUUID();
      const junctionNode: ComponentNode = {
        id: junctionId,
        type: 'junction',
        position: junctionPos,
        data: { label: '' },
      };

      pushHistory();

      // Insert junction node
      const newNodes = [...nodes, junctionNode];

      // Pick the best junction handle side based on the other node's position
      const jCx = snapped.x;
      const jCy = snapped.y;
      const pickSide = (nodeId: string, type: 'source' | 'target') => {
        const n = nodes.find((nd) => nd.id === nodeId);
        if (!n) return type === 'source' ? 'sb' : 'tb';
        const dx = n.position.x - jCx;
        const dy = n.position.y - jCy;
        let dir: string;
        if (Math.abs(dx) > Math.abs(dy)) {
          dir = dx > 0 ? 'r' : 'l';
        } else {
          dir = dy > 0 ? 'b' : 't';
        }
        return (type === 'source' ? 's' : 't') + dir;
      };

      // Split the existing edge: source→junction, junction→target
      const remainingEdges = edges.filter((e) => e.id !== edge.id);
      let newEdges = addEdge(
        {
          source: edge.source,
          sourceHandle: edge.sourceHandle ?? null,
          target: junctionId,
          targetHandle: pickSide(edge.source, 'target'),
        },
        remainingEdges,
      );
      newEdges = addEdge(
        {
          source: junctionId,
          sourceHandle: pickSide(edge.target, 'source'),
          target: edge.target,
          targetHandle: edge.targetHandle ?? null,
        },
        newEdges,
      );
      // Connect the dragged handle to the junction, respecting handle type
      if (start.handleType === 'source') {
        newEdges = addEdge(
          {
            source: start.nodeId,
            sourceHandle: start.handleId,
            target: junctionId,
            targetHandle: pickSide(start.nodeId, 'target'),
          },
          newEdges,
        );
      } else {
        newEdges = addEdge(
          {
            source: junctionId,
            sourceHandle: pickSide(start.nodeId, 'source'),
            target: start.nodeId,
            targetHandle: start.handleId,
          },
          newEdges,
        );
      }

      setNodes(newNodes);
      setEdges(newEdges);
    },
    [edges, nodes, setEdges, setNodes, pushHistory, screenToFlowPosition],
  );

  const onNodeDragStart: OnNodeDrag = useCallback(() => {
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
        edgesReconnectable
        proOptions={{ hideAttribution: true }}
        snapToGrid
        snapGrid={[10, 10]}
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
