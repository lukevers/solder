// src/components/edges/SignalEdge.tsx
import { type EdgeProps, getSmoothStepPath } from '@xyflow/react';

export function SignalEdge({
	id,
	sourceX,
	sourceY,
	targetX,
	targetY,
	sourcePosition,
	targetPosition,
	data,
	selected,
}: EdgeProps) {
	const [edgePath] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
	});

	const isDC = (data as { signalType?: string })?.signalType === 'dc';
	const color = selected ? '#60a5fa' : isDC ? '#f59e0b' : '#3b82f6';

	return (
		<>
			<path
				id={id}
				d={edgePath}
				fill="none"
				stroke={color}
				strokeWidth={1.5}
				strokeOpacity={0.3}
			/>
			<path
				d={edgePath}
				fill="none"
				stroke={color}
				strokeWidth={1.5}
				strokeDasharray="6 5"
				className={isDC ? 'edge-anim-dc' : 'edge-anim-ac'}
			/>
		</>
	);
}
