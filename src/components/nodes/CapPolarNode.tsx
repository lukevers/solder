// src/components/nodes/CapPolarNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { CapacitorData } from '../../lib/types';
import { HANDLE_STYLE, NodeShell, NodeText } from './NodeShell';

export function CapPolarNode({ id, data, selected }: NodeProps) {
  const d = data as CapacitorData;

  const faradsLabel =
    d.farads >= 1e-6
      ? `${+(d.farads * 1e6).toPrecision(4)}μF`
      : d.farads >= 1e-9
        ? `${+(d.farads * 1e9).toPrecision(4)}nF`
        : `${+(d.farads * 1e12).toPrecision(4)}pF`;

  const wire = selected ? '#60a5fa' : '#9ca3af';
  const plate = selected ? '#60a5fa' : '#e5e7eb';

  return (
    <NodeShell id={id} width={60} height={40}>
      <Handle
        type="target"
        position={Position.Left}
        id="pos"
        style={HANDLE_STYLE}
      />
      <svg width="60" height="40" viewBox="0 0 60 40">
        {/* Left wire */}
        <line x1="0" y1="20" x2="22" y2="20" stroke={wire} strokeWidth="1.5" />
        {/* Flat plate (positive side) */}
        <line x1="22" y1="8" x2="22" y2="32" stroke={plate} strokeWidth="2.5" />
        {/* Curved plate (negative side) */}
        <path
          d="M 28 8 Q 32 20 28 32"
          fill="none"
          stroke={plate}
          strokeWidth="2.5"
        />
        {/* Right wire */}
        <line x1="28" y1="20" x2="60" y2="20" stroke={wire} strokeWidth="1.5" />
        {/* + sign near positive plate */}
        <NodeText
          x={16}
          y={12}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="8"
          fontFamily="monospace"
        >
          +
        </NodeText>
        {/* Label */}
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
        {/* Value */}
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
        id="neg"
        style={HANDLE_STYLE}
      />
    </NodeShell>
  );
}
