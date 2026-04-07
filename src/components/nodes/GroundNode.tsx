// src/components/nodes/GroundNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useStore } from '../../store';

export function GroundNode({ id, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 40, height: 36 }}
		>
			<Handle
				type="target"
				position={Position.Top}
				id="gnd"
				style={{ background: '#4b5563' }}
			/>
			<svg width="40" height="36" viewBox="0 0 40 36">
				<line
					x1="20"
					y1="0"
					x2="20"
					y2="12"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="1.5"
				/>
				<line
					x1="4"
					y1="12"
					x2="36"
					y2="12"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="2"
				/>
				<line
					x1="10"
					y1="18"
					x2="30"
					y2="18"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="1.5"
				/>
				<line
					x1="16"
					y1="24"
					x2="24"
					y2="24"
					stroke={selected ? '#60a5fa' : '#9ca3af'}
					strokeWidth="1"
				/>
			</svg>
		</div>
	);
}
