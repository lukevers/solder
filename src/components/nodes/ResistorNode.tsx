// src/components/nodes/ResistorNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { ResistorData } from '../../lib/types';
import { useStore } from '../../store';

export function ResistorNode({ id, data, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);
	const d = data as ResistorData;

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 80, height: 40 }}
		>
			<Handle
				type="target"
				position={Position.Left}
				id="a"
				style={{ background: '#4b5563' }}
			/>
			<svg width="80" height="40" viewBox="0 0 80 40">
				<line
					x1="0"
					y1="20"
					x2="14"
					y2="20"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="1.5"
				/>
				<polyline
					points="14,20 18,10 24,30 30,10 36,30 42,10 48,30 54,20 66,20"
					fill="none"
					stroke={selected ? '#60a5fa' : '#e5e7eb'}
					strokeWidth="1.5"
				/>
				<line
					x1="66"
					y1="20"
					x2="80"
					y2="20"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="1.5"
				/>
				<text
					x="40"
					y="8"
					textAnchor="middle"
					fill="#7ee787"
					fontSize="8"
					fontFamily="monospace"
				>
					{d.label}
				</text>
				<text
					x="40"
					y="38"
					textAnchor="middle"
					fill="#6b7280"
					fontSize="7"
					fontFamily="monospace"
				>
					{d.ohms >= 1000 ? `${d.ohms / 1000}kΩ` : `${d.ohms}Ω`}
				</text>
			</svg>
			<Handle
				type="source"
				position={Position.Right}
				id="b"
				style={{ background: '#4b5563' }}
			/>
		</div>
	);
}
