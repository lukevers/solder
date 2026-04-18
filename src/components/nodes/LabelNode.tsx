// src/components/nodes/LabelNode.tsx
import { type NodeProps, Position } from '@xyflow/react';
import type { LabelData } from '../../lib/types';
import { NodeShell, NodeSvg, RotatedHandle } from './NodeShell';

export function LabelNode({ id, data, selected }: NodeProps) {
  const d = data as LabelData;

  const color = selected ? '#60a5fa' : '#a78bfa';

  return (
    <NodeShell id={id} width={80} height={20}>
      <NodeSvg width={80} height={20}>
        {/* Flag shape: rectangle with a triangular notch on the right */}
        <path
          d="M2 1 H68 L78 10 L68 19 H2 Z"
          fill="#1f2937"
          stroke={color}
          strokeWidth="1.5"
        />
        <text
          x={36}
          y={14}
          textAnchor="middle"
          fill={color}
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.label}
        </text>
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Left}
        id="net"
        isConnectableEnd={true}
        style={{ background: '#a78bfa' }}
      />
    </NodeShell>
  );
}
