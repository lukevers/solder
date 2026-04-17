// src/components/nodes/ResistorNode.tsx
import { type NodeProps, Position } from '@xyflow/react';
import type { ResistorData } from '../../lib/types';
import { formatOhms } from '../../lib/units';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from './NodeShell';

export function ResistorNode({ id, data, selected }: NodeProps) {
  const d = data as ResistorData;

  return (
    <NodeShell id={id} width={80} height={40}>
      <RotatedHandle
        type="target"
        position={Position.Left}
        id="a"
        style={HANDLE_STYLE}
      />
      <NodeSvg width={80} height={40}>
        <line
          x1="0"
          y1="20"
          x2="14"
          y2="20"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <polyline
          points="14,20 18,10 24,30 30,10 36,30 42,10 48,30 54,20 66,20"
          fill="none"
          stroke={selected ? '#60a5fa' : '#e5e7eb'}
          strokeWidth="1.5"
        />
        <line
          x1="66"
          y1="20"
          x2="80"
          y2="20"
          stroke={selected ? '#60a5fa' : '#9ca3af'}
          strokeWidth="1.5"
        />
        <NodeText
          x={40}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="8"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        <NodeText
          x={40}
          y={38}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="7"
          fontFamily="monospace"
        >
          {formatOhms(d.ohms)}
        </NodeText>
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="b"
        style={HANDLE_STYLE}
      />
    </NodeShell>
  );
}
