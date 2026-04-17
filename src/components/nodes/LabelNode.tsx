// src/components/nodes/LabelNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { LabelData } from '../../lib/types';
import { NodeShell, NodeText } from './NodeShell';

export function LabelNode({ id, data, selected }: NodeProps) {
  const d = data as LabelData;

  const color = selected ? '#60a5fa' : '#a78bfa';

  return (
    <NodeShell id={id} width={80} height={28}>
      <svg width="80" height="28" viewBox="0 0 80 28">
        {/* Flag shape: rectangle with a triangular notch on the right */}
        <path
          d="M2 2 H68 L78 14 L68 26 H2 Z"
          fill="#1f2937"
          stroke={color}
          strokeWidth="1.5"
        />
        <NodeText
          x={36}
          y={18}
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.label}
        </NodeText>
      </svg>
      <Handle
        type="source"
        position={Position.Left}
        id="net"
        isConnectableEnd={true}
        style={{ background: '#a78bfa' }}
      />
    </NodeShell>
  );
}
