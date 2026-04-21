import { type NodeProps, Position } from '@xyflow/react';
import type { CapacitorData } from '../../lib/types';
import { formatFarads } from '../../lib/units';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from './NodeShell';

export function CapacitorNode({ id, data, selected }: NodeProps) {
  const d = data as CapacitorData;
  const faradsLabel = formatFarads(d.farads);

  return (
    <NodeShell id={id} width={60} height={40}>
      <RotatedHandle
        type="target"
        position={Position.Left}
        id="a"
        style={HANDLE_STYLE}
      />
      <RotatedHandle
        type="source"
        position={Position.Left}
        id="a"
        style={{ ...HANDLE_STYLE, opacity: 0 }}
      />
      <NodeSvg width={60} height={40}>
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
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="b"
        style={HANDLE_STYLE}
      />
      <RotatedHandle
        type="target"
        position={Position.Right}
        id="b"
        style={{ ...HANDLE_STYLE, opacity: 0 }}
      />
    </NodeShell>
  );
}
