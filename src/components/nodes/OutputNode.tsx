// src/components/nodes/OutputNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { OutputData } from '../../lib/types';
import { NodeShell } from './NodeShell';

export function OutputNode({ id, data, selected }: NodeProps) {
  const d = data as OutputData;
  const stroke = selected ? '#60a5fa' : '#22c55e';

  return (
    <NodeShell id={id} width={80} height={60}>
      <Handle
        type="target"
        position={Position.Left}
        id="pos"
        style={{ top: 20, background: '#22c55e' }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="neg"
        style={{ top: 44, background: '#4b5563' }}
      />
      <svg width="80" height="60" viewBox="0 0 80 60">
        <rect
          x="2"
          y="4"
          width="76"
          height="52"
          rx="4"
          fill="#1f2937"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <text
          x="46"
          y="30"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#22c55e"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.label}
        </text>
        {/* + / - labels next to handles */}
        <text
          x="12"
          y="23"
          textAnchor="middle"
          fill="#4ade80"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          +
        </text>
        <text
          x="12"
          y="47"
          textAnchor="middle"
          fill="#6b7280"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          −
        </text>
      </svg>
    </NodeShell>
  );
}
