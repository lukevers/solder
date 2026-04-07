// src/components/Inspector.tsx

import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode, DiodeData, PotData } from '../lib/types';
import { useStore } from '../store';

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="mb-3">
			<div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
				{label}
			</div>
			{children}
		</div>
	);
}

function ResistorInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'resistor' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, ohms } = node.data;

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, { label: e.target.value, ohms })
					}
				/>
			</Field>
			<Field label="Resistance (Ω)">
				<input
					type="number"
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={ohms}
					min={1}
					onChange={(e) =>
						updateNodeData(node.id, { label, ohms: Number(e.target.value) })
					}
				/>
			</Field>
		</>
	);
}

function CapacitorInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'capacitor' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, farads } = node.data;

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, { label: e.target.value, farads })
					}
				/>
			</Field>
			<Field label="Capacitance (F)">
				<input
					type="number"
					step="1e-9"
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={farads}
					min={1e-12}
					onChange={(e) =>
						updateNodeData(node.id, { label, farads: Number(e.target.value) })
					}
				/>
			</Field>
		</>
	);
}

function OpAmpInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'opamp' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, model } = node.data;

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, { label: e.target.value, model })
					}
				/>
			</Field>
			<Field label="Model">
				<select
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={model}
					onChange={(e) =>
						updateNodeData(node.id, {
							label,
							model: e.target.value as 'TL072' | 'LM741',
						})
					}
				>
					<option value="TL072">TL072</option>
					<option value="LM741">LM741</option>
				</select>
			</Field>
		</>
	);
}

function PowerInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'power' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, volts } = node.data;

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, { label: e.target.value, volts })
					}
				/>
			</Field>
			<Field label="Voltage (V)">
				<input
					type="number"
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={volts}
					onChange={(e) =>
						updateNodeData(node.id, { label, volts: Number(e.target.value) })
					}
				/>
			</Field>
		</>
	);
}

function DiodeInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'diode' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, model } = node.data;

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, { label: e.target.value, model })
					}
				/>
			</Field>
			<Field label="Model">
				<select
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={model}
					onChange={(e) =>
						updateNodeData(node.id, {
							label,
							model: e.target.value as DiodeData['model'],
						})
					}
				>
					<option value="1N914">1N914</option>
					<option value="1N4001">1N4001</option>
				</select>
			</Field>
		</>
	);
}

function PotInspector({
	node,
}: {
	node: Extract<ComponentNode, { type: 'pot' }>;
}) {
	const updateNodeData = useStore((s) => s.updateNodeData);
	const { label, ohms, position } = node.data;
	const pct = Math.round(position * 100);

	return (
		<>
			<Field label="Label">
				<input
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={label}
					onChange={(e) =>
						updateNodeData(node.id, {
							label: e.target.value,
							ohms,
							position,
						} as PotData)
					}
				/>
			</Field>
			<Field label="Resistance (Ω)">
				<input
					type="number"
					className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
					value={ohms}
					min={1}
					onChange={(e) =>
						updateNodeData(node.id, {
							label,
							ohms: Number(e.target.value),
							position,
						} as PotData)
					}
				/>
			</Field>
			<Field label={`Position — ${pct}%`}>
				<input
					type="range"
					className="w-full accent-purple-400"
					min={0}
					max={1}
					step={0.01}
					value={position}
					onChange={(e) =>
						updateNodeData(node.id, {
							label,
							ohms,
							position: Number(e.target.value),
						} as PotData)
					}
				/>
			</Field>
		</>
	);
}

export function Inspector() {
	const { nodes, selectedNodeId } = useStore(
		useShallow((s) => ({
			nodes: s.nodes,
			selectedNodeId: s.selectedNodeId,
		})),
	);

	const selected = nodes.find((n) => n.id === selectedNodeId);

	if (!selected) {
		return (
			<div className="p-3 text-gray-600 text-xs">
				Click a component to inspect
			</div>
		);
	}

	return (
		<div className="p-3">
			<div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
				Inspector · {selected.type}
			</div>
			{selected.type === 'resistor' && <ResistorInspector node={selected} />}
			{selected.type === 'capacitor' && <CapacitorInspector node={selected} />}
			{selected.type === 'opamp' && <OpAmpInspector node={selected} />}
			{selected.type === 'power' && <PowerInspector node={selected} />}
			{selected.type === 'diode' && <DiodeInspector node={selected} />}
			{selected.type === 'pot' && <PotInspector node={selected} />}
		</div>
	);
}
