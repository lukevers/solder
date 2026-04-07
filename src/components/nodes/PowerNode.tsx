// src/components/nodes/PowerNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { PowerData } from '../../lib/types';
import { useStore } from '../../store';

export function PowerNode({ id, data, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);
	const d = data as PowerData;

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 48, height: 40 }}
		>
			<svg width="48" height="40" viewBox="0 0 48 40">
				<circle
					cx="24"
					cy="20"
					r="14"
					fill="#1f2937"
					stroke={selected ? '#60a5fa' : '#facc15'}
					strokeWidth="1.5"
				/>
				<text
					x="24"
					y="16"
					textAnchor="middle"
					fill="#facc15"
					fontSize="8"
					fontFamily="monospace"
				>
					{d.label}
				</text>
				<text
					x="24"
					y="27"
					textAnchor="middle"
					fill="#facc15"
					fontSize="9"
					fontFamily="monospace"
					fontWeight="bold"
				>
					{d.volts}V
				</text>
			</svg>
			<Handle
				type="source"
				position={Position.Bottom}
				id="pos"
				style={{ background: '#4b5563' }}
			/>
		</div>
	);
}
