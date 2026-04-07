// src/components/Toolbar.tsx

import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const PALETTE: Array<{
	label: string;
	type: ComponentNode['type'];
	defaultData: ComponentNode['data'];
}> = [
	{ label: 'R', type: 'resistor', defaultData: { label: 'R1', ohms: 10000 } },
	{
		label: 'C',
		type: 'capacitor',
		defaultData: { label: 'C1', farads: 47e-9 },
	},
	{ label: 'U', type: 'opamp', defaultData: { label: 'U1', model: 'TL072' } },
	{ label: 'V+', type: 'power', defaultData: { label: 'VCC', volts: 9 } },
	{ label: 'GND', type: 'ground', defaultData: { label: 'GND' } },
	{ label: 'IN', type: 'audiin', defaultData: { label: 'IN' } },
	{ label: 'OUT', type: 'audiout', defaultData: { label: 'OUT' } },
	{ label: 'D', type: 'diode', defaultData: { label: 'D1', model: '1N914' } },
	{
		label: 'POT',
		type: 'pot',
		defaultData: { label: 'VR1', ohms: 100000, position: 0.5 },
	},
];

type ToolbarProps = {
	onSimulate: () => void;
	onToggleExamples: () => void;
	showExamples: boolean;
};

export function Toolbar({
	onSimulate,
	onToggleExamples,
	showExamples,
}: ToolbarProps) {
	const { addNode, simulationStatus } = useStore(
		useShallow((s) => ({
			addNode: s.addNode,
			simulationStatus: s.simulationStatus,
		})),
	);

	function handleAdd(item: (typeof PALETTE)[number]) {
		const offset = Math.random() * 100;
		addNode({
			id: crypto.randomUUID(),
			type: item.type,
			position: { x: 200 + offset, y: 150 + offset },
			data: item.defaultData,
		} as ComponentNode);
	}

	return (
		<div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
			<span className="text-blue-400 font-bold text-sm mr-2">⚡ solder</span>
			<div className="w-px h-5 bg-gray-700" />
			<button
				type="button"
				onClick={onToggleExamples}
				className={`border text-xs px-2 py-1 rounded font-mono transition-colors ${
					showExamples
						? 'bg-blue-900 border-blue-700 text-blue-200'
						: 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
				}`}
			>
				Examples
			</button>
			<div className="w-px h-5 bg-gray-700" />
			{PALETTE.map((item) => (
				<button
					type="button"
					key={item.type}
					onClick={() => handleAdd(item)}
					className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
				>
					{item.label}
				</button>
			))}
			<div className="flex-1" />
			<button
				type="button"
				onClick={onSimulate}
				disabled={simulationStatus === 'running'}
				className="bg-green-800 hover:bg-green-700 disabled:opacity-50 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
			>
				{simulationStatus === 'running' ? '⏳ Simulating…' : '▶ Simulate'}
			</button>
		</div>
	);
}
