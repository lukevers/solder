// src/components/ExamplesPanel.tsx

import { EXAMPLES } from '../lib/examples/rat';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const GRID = 20;

function snapNodes(nodes: ComponentNode[]): ComponentNode[] {
	return nodes.map((n) => ({
		...n,
		position: {
			x: Math.round(n.position.x / GRID) * GRID,
			y: Math.round(n.position.y / GRID) * GRID,
		},
	}));
}

export function ExamplesPanel() {
	const loadCircuit = useStore((s) => s.loadCircuit);

	return (
		<div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
			<div className="px-3 py-2 border-b border-gray-800">
				<span className="text-xs text-gray-500 uppercase tracking-wider">
					Examples
				</span>
			</div>
			<div className="flex flex-col gap-2 p-3">
				{EXAMPLES.map((ex) => (
					<div
						key={ex.id}
						className="bg-gray-950 border border-gray-800 rounded p-3"
					>
						<div className="text-sm text-gray-200 font-mono font-bold mb-1">
							{ex.name}
						</div>
						<div className="flex flex-wrap gap-1 mb-2">
							{ex.tags.map((tag) => (
								<span
									key={tag}
									className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono"
								>
									{tag}
								</span>
							))}
						</div>
						<div className="text-xs text-gray-500 mb-3 leading-relaxed">
							{ex.description}
						</div>
						<button
							type="button"
							onClick={() => loadCircuit(snapNodes(ex.nodes), ex.edges)}
							className="w-full bg-blue-900 hover:bg-blue-800 border border-blue-700 text-blue-200 text-xs px-2 py-1.5 rounded font-mono transition-colors"
						>
							Load circuit
						</button>
					</div>
				))}
			</div>
		</div>
	);
}
