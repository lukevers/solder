import { type NodeProps, Position } from '@xyflow/react';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../node-shell';
import type { MOSFETData } from './types';

interface MOSFETNodeProps extends NodeProps {
  data: MOSFETData;
}

export function MOSFETNode({ id, data, selected }: MOSFETNodeProps) {
  const isP = data.polarity === 'P';
  const stroke = selected ? '#fbbf24' : '#f59e0b';

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
          x2="14"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Gate plate (insulated) */}
        <line
          x1="14"
          y1="12"
          x2="14"
          y2="48"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Channel segments (three dashes showing enhancement mode) */}
        <line
          x1="20"
          y1="12"
          x2="20"
          y2="21"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <line
          x1="20"
          y1="26"
          x2="20"
          y2="34"
          stroke={stroke}
          strokeWidth="2.5"
        />
        <line
          x1="20"
          y1="39"
          x2="20"
          y2="48"
          stroke={stroke}
          strokeWidth="2.5"
        />
        {/* Drain line */}
        <line
          x1="20"
          y1="15"
          x2="60"
          y2="10"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Source line */}
        <line
          x1="20"
          y1="45"
          x2="60"
          y2="50"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Body line: middle segment to source */}
        <line
          x1="20"
          y1="30"
          x2="32"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <line
          x1="32"
          y1="30"
          x2="32"
          y2="50"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {isP ? (
          /* P-channel: arrow on body pointing away from channel (right) */
          <polygon points="28,26 36,30 28,34" fill={stroke} />
        ) : (
          /* N-channel: arrow on body pointing toward channel (left) */
          <polygon points="36,26 28,30 36,34" fill={stroke} />
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
