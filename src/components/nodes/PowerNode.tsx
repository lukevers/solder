// src/components/nodes/PowerNode.tsx
import { type NodeProps, Position } from '@xyflow/react';
import type { PowerData } from '../../lib/types';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from './NodeShell';

export function PowerNode({ id, data, selected }: NodeProps) {
  const d = data as PowerData;

  return (
    <NodeShell id={id} width={40} height={40}>
      <NodeSvg width={40} height={40}>
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#facc15'}
          strokeWidth="1.5"
        />
        <NodeText
          x={20}
          y={16}
          textAnchor="middle"
          fill="#facc15"
          fontSize="8"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        <NodeText
          x={20}
          y={27}
          textAnchor="middle"
          fill="#facc15"
          fontSize="9"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.volts}V
        </NodeText>
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Bottom}
        id="pos"
        style={HANDLE_STYLE}
      />
    </NodeShell>
  );
}
