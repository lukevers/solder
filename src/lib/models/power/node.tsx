import { type NodeProps, Position } from '@xyflow/react';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../node-shell';
import type { PowerData } from './types';

interface PowerNodeProps extends NodeProps {
  data: PowerData;
}

export function PowerNode({ id, data, selected }: PowerNodeProps) {
  return (
    <NodeShell id={id} width={40} height={48}>
      <NodeSvg width={40} height={48}>
        <circle
          cx="20"
          cy="20"
          r="14"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#facc15'}
          strokeWidth="1.5"
        />
        <line
          x1="20"
          y1="34"
          x2="20"
          y2="48"
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
          {data.label}
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
          {data.volts}V
        </NodeText>
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Bottom}
        id="pos"
        style={HANDLE_STYLE}
      />
      <RotatedHandle
        type="target"
        position={Position.Bottom}
        id="pos"
        style={{ ...HANDLE_STYLE, opacity: 0 }}
      />
    </NodeShell>
  );
}
