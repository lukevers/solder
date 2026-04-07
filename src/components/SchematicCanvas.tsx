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
	type OnNodesChange,
	ReactFlow,
} from '@xyflow/react';
import { useCallback, useMemo } from 'react';
import '@xyflow/react/dist/style.css';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';
import { edgeTypes } from './edges';
import { nodeTypes } from './nodes';

export function SchematicCanvas() {
	const { nodes, edges, setNodes, setEdges, selectNode } = useStore(
		useShallow((s) => ({
			nodes: s.nodes,
			edges: s.edges,
			setNodes: s.setNodes,
			setEdges: s.setEdges,
			selectNode: s.selectNode,
		})),
	);

	const onNodesChange: OnNodesChange = useCallback(
		(changes) => setNodes(applyNodeChanges(changes, nodes) as ComponentNode[]),
		[nodes, setNodes],
	);

	const onEdgesChange: OnEdgesChange = useCallback(
		(changes) => setEdges(applyEdgeChanges(changes, edges)),
		[edges, setEdges],
	);

	const onConnect: OnConnect = useCallback(
		(connection) => setEdges(addEdge(connection, edges)),
		[edges, setEdges],
	);

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
				onPaneClick={onPaneClick}
				fitView
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
	);
}
