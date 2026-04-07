// src/components/nodes/DiodeNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { DiodeData } from '../../lib/types';
import { useStore } from '../../store';

export function DiodeNode({ id, data, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);
	const d = data as DiodeData;
	const stroke = selected ? '#60a5fa' : '#e5e7eb';

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 60, height: 36 }}
		>
			<Handle
				type="target"
				position={Position.Left}
				id="a"
				style={{ background: '#4b5563' }}
			/>
			<svg width="60" height="36" viewBox="0 0 60 36">
				<line
					x1="0"
					y1="18"
					x2="16"
					y2="18"
					stroke={stroke}
					strokeWidth="1.5"
				/>
				<polygon
					points="16,8 16,28 36,18"
					fill={selected ? '#1e3a5f' : '#1f2937'}
					stroke={stroke}
					strokeWidth="1.5"
				/>
				<line x1="36" y1="8" x2="36" y2="28" stroke={stroke} strokeWidth="2" />
				<line
					x1="36"
					y1="18"
					x2="60"
					y2="18"
					stroke={stroke}
					strokeWidth="1.5"
				/>
				<text
					x="28"
					y="8"
					textAnchor="middle"
					fill="#7ee787"
					fontSize="7"
					fontFamily="monospace"
				>
					{d.label}
				</text>
				<text
					x="28"
					y="34"
					textAnchor="middle"
					fill="#6b7280"
					fontSize="6"
					fontFamily="monospace"
				>
					{d.model}
				</text>
			</svg>
			<Handle
				type="source"
				position={Position.Right}
				id="k"
				style={{ background: '#4b5563' }}
			/>
		</div>
	);
}
