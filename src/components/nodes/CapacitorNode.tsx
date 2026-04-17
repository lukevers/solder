// src/components/nodes/CapacitorNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { CapacitorData } from '../../lib/types';
import { HANDLE_STYLE, NodeShell, NodeText } from './NodeShell';

export function CapacitorNode({ id, data, selected }: NodeProps) {
  const d = data as CapacitorData;

  const faradsLabel =
    d.farads >= 1e-6
      ? `${+(d.farads * 1e6).toPrecision(4)}μF`
      : d.farads >= 1e-9
        ? `${+(d.farads * 1e9).toPrecision(4)}nF`
        : `${+(d.farads * 1e12).toPrecision(4)}pF`;

  return (
    <NodeShell id={id} width={60} height={40}>
      <Handle
        type="target"
        position={Position.Left}
        id="a"
        style={HANDLE_STYLE}
      />
      <svg width="60" height="40" viewBox="0 0 60 40">
        <line
          x1="0"
          y1="20"
          x2="22"
          y2="20"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <line
          x1="22"
          y1="8"
          x2="22"
          y2="32"
          stroke={selected ? '#60a5fa' : '#e5e7eb'}
          strokeWidth="2.5"
        />
        <line
          x1="28"
          y1="8"
          x2="28"
          y2="32"
          stroke={selected ? '#60a5fa' : '#e5e7eb'}
          strokeWidth="2.5"
        />
        <line
          x1="28"
          y1="20"
          x2="60"
          y2="20"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <NodeText
          x={25}
          y={6}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="8"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        <NodeText
          x={30}
          y={38}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="7"
          fontFamily="monospace"
        >
          {faradsLabel}
        </NodeText>
      </svg>
      <Handle
        type="source"
        position={Position.Right}
        id="b"
        style={HANDLE_STYLE}
      />
    </NodeShell>
  );
}
