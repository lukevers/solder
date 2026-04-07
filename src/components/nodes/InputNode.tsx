// src/components/nodes/InputNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { InputData } from '../../lib/types';
import { useStore } from '../../store';

export function InputNode({ id, data, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);
	const d = data as InputData;

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 60, height: 40 }}
		>
			<svg width="60" height="40" viewBox="0 0 60 40">
				<rect
					x="2"
					y="4"
					width="56"
					height="32"
					rx="4"
					fill="#1f2937"
					stroke={selected ? '#60a5fa' : '#3b82f6'}
					strokeWidth="1.5"
				/>
				<text
					x="30"
					y="24"
					textAnchor="middle"
					fill="#3b82f6"
					fontSize="10"
					fontFamily="monospace"
					fontWeight="bold"
				>
					{d.label}
				</text>
			</svg>
			<Handle
				type="source"
				position={Position.Right}
				id="out"
				style={{ background: '#3b82f6' }}
			/>
		</div>
	);
}
