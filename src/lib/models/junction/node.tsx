import { Handle, type NodeProps, Position } from '@xyflow/react';
import { useStore } from '../../../store';

const NODE_SIZE = 20;
const DOT_RADIUS = 5;

const HIDDEN: React.CSSProperties = { opacity: 0 };

export function JunctionNode({ id }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode);

  return (
    <div
      onClick={() => selectNode(id)}
      style={{
        width: NODE_SIZE,
        height: NODE_SIZE,
        position: 'relative',
      }}
    >
      {/* Source handles — one per side */}
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="source"
        position={Position.Top}
        id="st"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="source"
        position={Position.Right}
        id="sr"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="source"
        position={Position.Bottom}
        id="sb"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="source"
        position={Position.Left}
        id="sl"
        style={HIDDEN}
      />
      {/* Target handles — one per side */}
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="target"
        position={Position.Top}
        id="tt"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="target"
        position={Position.Right}
        id="tr"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="target"
        position={Position.Bottom}
        id="tb"
        style={HIDDEN}
      />
      <Handle
        className="solder-node-handle solder-junction-handle"
        type="target"
        position={Position.Left}
        id="tl"
        style={HIDDEN}
      />

      <svg
        width={NODE_SIZE}
        height={NODE_SIZE}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        <circle
          cx={NODE_SIZE / 2}
          cy={NODE_SIZE / 2}
          r={DOT_RADIUS}
          fill="#22c55e"
        />
      </svg>
    </div>
  );
}
