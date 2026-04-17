// src/components/edges/SignalEdge.tsx
import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../../store';

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
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const deleteEdge = useStore((s) => s.deleteEdge);
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
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              background: '#1f2937',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '12px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => { e.stopPropagation(); deleteEdge(id); }}
          >
            <Trash2 size={11} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
