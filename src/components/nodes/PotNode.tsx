// src/components/nodes/PotNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { PotData } from '../../lib/types';
import { useStore } from '../../store';

export function PotNode({ id, data, selected }: NodeProps) {
	const selectNode = useStore((s) => s.selectNode);
	const d = data as PotData;
	const stroke = selected ? '#60a5fa' : '#9ca3af';
	const wiperColor = selected ? '#60a5fa' : '#a78bfa';

	// Wiper x position along the resistor body (body spans x 12–68)
	const wiperX = 12 + 56 * d.position;
	const pct = Math.round(d.position * 100);
	const val =
		d.ohms >= 1e6
			? `${(d.ohms / 1e6).toPrecision(3)}MΩ`
			: d.ohms >= 1e3
				? `${(d.ohms / 1e3).toPrecision(3)}kΩ`
				: `${d.ohms}Ω`;

	return (
		<div
			onClick={() => selectNode(id)}
			className="relative flex items-center justify-center cursor-pointer"
			style={{ width: 80, height: 60 }}
		>
			{/* CCW end — left */}
			<Handle
				type="target"
				position={Position.Left}
				id="ccw"
				style={{ top: '32%', background: '#4b5563' }}
			/>
			{/* CW end — right */}
			<Handle
				type="source"
				position={Position.Right}
				id="cw"
				style={{ top: '32%', background: '#4b5563' }}
			/>
			{/* Wiper tap — bottom */}
			<Handle
				type="source"
				position={Position.Bottom}
				id="wiper"
				style={{ left: '50%', background: '#a78bfa' }}
			/>

			<svg width="80" height="60" viewBox="0 0 80 60">
				{/* Leads */}
				<line
					x1="0"
					y1="18"
					x2="12"
					y2="18"
					stroke={stroke}
					strokeWidth="1.5"
				/>
				<line
					x1="68"
					y1="18"
					x2="80"
					y2="18"
					stroke={stroke}
					strokeWidth="1.5"
				/>
				{/* Resistor zigzag */}
				<polyline
					points="12,18 16,8 22,28 28,8 34,28 40,8 46,28 52,18 68,18"
					fill="none"
					stroke={stroke}
					strokeWidth="1.5"
				/>
				{/* Wiper tick on the resistor body */}
				<line
					x1={wiperX}
					y1="12"
					x2={wiperX}
					y2="24"
					stroke={wiperColor}
					strokeWidth="2"
				/>
				{/* Wiper arrow line down to the handle */}
				<line
					x1={wiperX}
					y1="24"
					x2="40"
					y2="52"
					stroke={wiperColor}
					strokeWidth="1.5"
				/>
				{/* Arrow head */}
				<polygon
					points={`${wiperX - 4},30 ${wiperX + 4},30 ${wiperX},24`}
					fill={wiperColor}
				/>
				{/* Label */}
				<text
					x="40"
					y="8"
					textAnchor="middle"
					fill="#7ee787"
					fontSize="7"
					fontFamily="monospace"
				>
					{d.label}
				</text>
				{/* Value + position */}
				<text
					x="40"
					y="58"
					textAnchor="middle"
					fill="#6b7280"
					fontSize="6"
					fontFamily="monospace"
				>
					{val} {pct}%
				</text>
			</svg>
		</div>
	);
}
