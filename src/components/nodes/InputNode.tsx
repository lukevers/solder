// src/components/nodes/InputNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { InputData } from '../../lib/types';
import { NodeShell } from './NodeShell';

export function InputNode({ id, data, selected }: NodeProps) {
  const d = data as InputData;
  const stroke = selected ? '#60a5fa' : '#3b82f6';

  return (
    <NodeShell id={id} width={80} height={60}>
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
          x="34"
          y="30"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#3b82f6"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.label}
        </text>
        {/* + / - labels next to handles */}
        <text
          x="68"
          y="23"
          textAnchor="middle"
          fill="#60a5fa"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          +
        </text>
        <text
          x="68"
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
      <Handle
        type="source"
        position={Position.Right}
        id="pos"
        style={{ top: 20, background: '#3b82f6' }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="neg"
        style={{ top: 44, background: '#4b5563' }}
      />
    </NodeShell>
  );
}
