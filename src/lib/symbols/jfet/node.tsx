import { type NodeProps, Position } from '@xyflow/react';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../node-shell';
import type { JFETData } from './types';

interface JFETNodeProps extends NodeProps {
  data: JFETData;
}

export function JFETNode({ id, data, selected }: JFETNodeProps) {
  const isP = data.polarity === 'P';
  const stroke = selected ? '#22d3ee' : '#06b6d4';

  return (
    <NodeShell id={id} width={60} height={60}>
      {/* Gate — left center */}
      <RotatedHandle
        type="target"
        position={Position.Left}
        id="g"
        style={HANDLE_STYLE}
      />
      {/* Drain — right top */}
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="d"
        style={{ top: 10, background: '#4b5563' }}
      />
      {/* Source — right bottom */}
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="s"
        style={{ top: 50, background: '#4b5563' }}
      />

      <NodeSvg width={60} height={60}>
        {/* Gate wire */}
        <line
          x1="0"
          y1="30"
          x2="22"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Channel bar */}
        <line
          x1="22"
          y1="12"
          x2="22"
          y2="48"
          stroke={stroke}
          strokeWidth="2.5"
        />
        {/* Drain line */}
        <line
          x1="22"
          y1="15"
          x2="60"
          y2="10"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Source line */}
        <line
          x1="22"
          y1="45"
          x2="60"
          y2="50"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {isP ? (
          /* P-channel: gate arrow pointing away from channel (left) */
          <polygon points="22,26 14,30 22,34" fill={stroke} />
        ) : (
          /* N-channel: gate arrow pointing toward channel (right) */
          <polygon points="14,26 22,30 14,34" fill={stroke} />
        )}

        {/* Label */}
        <NodeText
          x={42}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {data.label}
        </NodeText>
        {/* Model */}
        <NodeText
          x={42}
          y={58}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {data.model}
        </NodeText>
      </NodeSvg>
    </NodeShell>
  );
}
