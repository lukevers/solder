import { type NodeProps, Position } from '@xyflow/react';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../../ui/node-shell';
import type { DiodeData } from './types';

interface DiodeNodeProps extends NodeProps {
  data: DiodeData;
}

export function DiodeNode({ id, data, selected }: DiodeNodeProps) {
  const stroke = selected ? '#60a5fa' : '#e5e7eb';

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
          x2="16"
          y2="20"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <polygon
          points="16,10 16,30 36,20"
          fill={selected ? '#1e3a5f' : '#1f2937'}
          stroke={stroke}
          strokeWidth="1.5"
        />
        <line x1="36" y1="10" x2="36" y2="30" stroke={stroke} strokeWidth="2" />
        <line
          x1="36"
          y1="20"
          x2="60"
          y2="20"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <NodeText
          x={28}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {data.label}
        </NodeText>
        <NodeText
          x={28}
          y={38}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {data.model}
        </NodeText>
      </NodeSvg>
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="k"
        style={HANDLE_STYLE}
      />
      <RotatedHandle
        type="target"
        position={Position.Right}
        id="k"
        style={{ ...HANDLE_STYLE, opacity: 0 }}
      />
    </NodeShell>
  );
}
