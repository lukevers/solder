// src/components/edges/SignalEdge.tsx
import { type EdgeProps, getSmoothStepPath } from '@xyflow/react';

type SignalEdgeData = {
  signalType?: string;
  sourceLabel?: string;
  sourceHandle?: string;
  targetLabel?: string;
  targetHandle?: string;
  connecting?: boolean;
};

export type { SignalEdgeData };

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

  const d = data as SignalEdgeData | undefined;
  const isDC = d?.signalType === 'dc';
  const color = selected
    ? isDC
      ? '#fbbf24'
      : '#60a5fa'
    : isDC
      ? '#f59e0b'
      : '#3b82f6';

  return (
    <>
      {/* Wide invisible hit area for easier interaction */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
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
