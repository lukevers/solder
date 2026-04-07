// src/components/Toolbar.tsx

import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const PALETTE: Array<{
	label: string;
	tooltip: string;
	type: ComponentNode['type'];
	defaultData: ComponentNode['data'];
	unique?: boolean;
}> = [
	{
		label: 'IN',
		tooltip: 'Audio Input',
		type: 'audiin',
		defaultData: { label: 'IN' },
		unique: true,
	},
	{
		label: 'OUT',
		tooltip: 'Audio Output',
		type: 'audiout',
		defaultData: { label: 'OUT' },
		unique: true,
	},
	{
		label: 'V+',
		tooltip: 'Power Supply',
		type: 'power',
		defaultData: { label: 'VCC', volts: 9 },
	},
	{
		label: 'GND',
		tooltip: 'Ground',
		type: 'ground',
		defaultData: { label: 'GND' },
	},
	{
		label: 'C',
		tooltip: 'Capacitor',
		type: 'capacitor',
		defaultData: { label: 'C1', farads: 47e-9 },
	},
	{
		label: 'R',
		tooltip: 'Resistor',
		type: 'resistor',
		defaultData: { label: 'R1', ohms: 10000 },
	},
	{
		label: 'POT',
		tooltip: 'Potentiometer',
		type: 'pot',
		defaultData: { label: 'VR1', ohms: 100000, position: 0.5 },
	},
	{
		label: 'D',
		tooltip: 'Diode',
		type: 'diode',
		defaultData: { label: 'D1', model: '1N914' },
	},
	{
		label: 'U',
		tooltip: 'Op-Amp',
		type: 'opamp',
		defaultData: { label: 'U1', model: 'TL072' },
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
	const { addNode, simulationStatus, nodes } = useStore(
		useShallow((s) => ({
			addNode: s.addNode,
			simulationStatus: s.simulationStatus,
			nodes: s.nodes,
		})),
	);

	const hasAudiin = nodes.some((n) => n.type === 'audiin');
	const hasAudiout = nodes.some((n) => n.type === 'audiout');

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
				className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors font-sans ${
					showExamples
						? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
						: 'bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
				}`}
			>
				<svg
					width="12"
					height="12"
					viewBox="0 0 12 12"
					fill="none"
					aria-hidden="true"
				>
					<path
						d="M1 3.5A1.5 1.5 0 012.5 2h2.086a1 1 0 01.707.293L6 3h3.5A1.5 1.5 0 0111 4.5v4A1.5 1.5 0 019.5 10h-7A1.5 1.5 0 011 8.5v-5z"
						fill="currentColor"
						fillOpacity="0.7"
					/>
				</svg>
				Examples
			</button>
			<div className="w-px h-5 bg-gray-700" />
			{PALETTE.map((item) => {
				const disabled =
					item.unique &&
					((item.type === 'audiin' && hasAudiin) ||
						(item.type === 'audiout' && hasAudiout));
				return (
					<div key={item.type} className="relative group">
						<button
							type="button"
							onClick={() => handleAdd(item)}
							disabled={disabled}
							className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
						>
							{item.label}
						</button>
						<div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
							<div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
							{disabled ? `${item.tooltip} already placed` : item.tooltip}
						</div>
					</div>
				);
			})}
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
