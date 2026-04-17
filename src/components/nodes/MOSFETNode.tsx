// src/components/nodes/MOSFETNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { MOSFETData } from '../../lib/types';
import { HANDLE_STYLE, NodeShell, NodeText } from './NodeShell';

export function MOSFETNode({ id, data, selected }: NodeProps) {
  const d = data as MOSFETData;
  const isP = d.polarity === 'P';
  const stroke = selected ? '#fbbf24' : '#f59e0b';

  return (
    <NodeShell id={id} width={60} height={60}>
      {/* Gate — left center */}
      <Handle
        type="target"
        position={Position.Left}
        id="g"
        style={HANDLE_STYLE}
      />
      {/* Drain — right top */}
      <Handle
        type="source"
        position={Position.Right}
        id="d"
        style={{ top: 15, background: '#4b5563' }}
      />
      {/* Source — right bottom */}
      <Handle
        type="source"
        position={Position.Right}
        id="s"
        style={{ top: 45, background: '#4b5563' }}
      />

      <svg width="60" height="60" viewBox="0 0 60 60">
        {/* Gate wire */}
        <line
          x1="0"
          y1="30"
          x2="14"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Gate plate (insulated) */}
        <line
          x1="14"
          y1="12"
          x2="14"
          y2="48"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Channel segments (three dashes showing enhancement mode) */}
        <line
          x1="20"
          y1="12"
          x2="20"
          y2="21"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <line
          x1="20"
          y1="26"
          x2="20"
          y2="34"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <line
          x1="20"
          y1="39"
          x2="20"
          y2="48"
          stroke={stroke}
          strokeWidth="2.5"
        />
        {/* Drain line */}
        <line
          x1="20"
          y1="15"
          x2="60"
          y2="15"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Source line */}
        <line
          x1="20"
          y1="45"
          x2="60"
          y2="45"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Body line: middle segment to source */}
        <line
          x1="20"
          y1="30"
          x2="32"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <line
          x1="32"
          y1="30"
          x2="32"
          y2="45"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {isP ? (
          /* P-channel: arrow on body pointing away from channel (right) */
          <polygon points="28,26 36,30 28,34" fill={stroke} />
        ) : (
          /* N-channel: arrow on body pointing toward channel (left) */
          <polygon points="36,26 28,30 36,34" fill={stroke} />
        )}

        {/* Label */}
        <NodeText
          x={42}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        {/* Model */}
        <NodeText
          x={42}
          y={58}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {d.model}
        </NodeText>
      </svg>
    </NodeShell>
  );
}
