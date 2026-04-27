import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { NET_VISUAL_ROLE, type NetVisualRole } from '../../lib/net-visual';
import { useStore } from '../../store';

/**
 * Edge metadata used only by the renderer.
 */
type SignalEdgeData = {
  netRole?: NetVisualRole;
  sourceLabel?: string;
  sourceHandle?: string;
  targetLabel?: string;
  targetHandle?: string;
  connecting?: boolean;
};

export type { SignalEdgeData };

/**
 * Visual palette for each net role.
 */
const EDGE_STYLE = {
  [NET_VISUAL_ROLE.rail]: {
    base: '#f59e0b',
    selected: '#fbbf24',
    animationClass: 'edge-anim-rail',
  },
  [NET_VISUAL_ROLE.biased]: {
    base: '#10b981',
    selected: '#34d399',
    animationClass: 'edge-anim-biased',
  },
  [NET_VISUAL_ROLE.signal]: {
    base: '#3b82f6',
    selected: '#60a5fa',
    animationClass: 'edge-anim-signal',
  },
} as const;

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
    borderRadius: 0,
    offset: 10,
  });

  const deleteEdge = useStore((s) => s.deleteEdge);
  const d = data as SignalEdgeData | undefined;
  const netRole = d?.netRole ?? NET_VISUAL_ROLE.signal;
  const style = EDGE_STYLE[netRole];
  const color = selected ? style.selected : style.base;

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
        className={style.animationClass}
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
            onClick={(e) => {
              e.stopPropagation();
              deleteEdge(id);
            }}
          >
            <Trash2 size={11} />
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
