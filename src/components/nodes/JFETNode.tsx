// src/components/nodes/JFETNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { JFETData } from '../../lib/types';
import { HANDLE_STYLE, NodeShell, NodeText } from './NodeShell';

export function JFETNode({ id, data, selected }: NodeProps) {
  const d = data as JFETData;
  const isP = d.polarity === 'P';
  const stroke = selected ? '#22d3ee' : '#06b6d4';

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
          x2="22"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Channel bar */}
        <line
          x1="22"
          y1="12"
          x2="22"
          y2="48"
          stroke={stroke}
          strokeWidth="2.5"
        />
        {/* Drain line */}
        <line
          x1="22"
          y1="15"
          x2="60"
          y2="15"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Source line */}
        <line
          x1="22"
          y1="45"
          x2="60"
          y2="45"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {isP ? (
          /* P-channel: gate arrow pointing away from channel (left) */
          <polygon points="22,26 14,30 22,34" fill={stroke} />
        ) : (
          /* N-channel: gate arrow pointing toward channel (right) */
          <polygon points="14,26 22,30 14,34" fill={stroke} />
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
