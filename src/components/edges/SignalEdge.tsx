// src/components/edges/SignalEdge.tsx
import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { useState } from 'react';

type SignalEdgeData = {
  signalType?: string;
  sourceLabel?: string;
  sourceHandle?: string;
  targetLabel?: string;
  targetHandle?: string;
  connecting?: boolean;
};

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
  const [hovered, setHovered] = useState(false);
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const d = data as SignalEdgeData | undefined;
  const isDC = d?.signalType === 'dc';
  const color = selected ? '#60a5fa' : isDC ? '#f59e0b' : '#3b82f6';

  const fromLabel = d?.sourceLabel ?? '?';
  const fromPin = d?.sourceHandle ?? '';
  const toLabel = d?.targetLabel ?? '?';
  const toPin = d?.targetHandle ?? '';

  return (
    <>
      {/* Wide invisible hit area for easier interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
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
      {hovered && !d?.connecting && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300 shadow-lg whitespace-nowrap"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <span className="text-gray-400">{fromLabel}</span>
            <span className="text-gray-600">.</span>
            <span className="text-gray-500">{fromPin}</span>
            <span className="text-gray-600 mx-1">&rarr;</span>
            <span className="text-gray-400">{toLabel}</span>
            <span className="text-gray-600">.</span>
            <span className="text-gray-500">{toPin}</span>
            <span className="ml-2 text-gray-600">{isDC ? 'DC' : 'AC'}</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
