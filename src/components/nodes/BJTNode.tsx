// src/components/nodes/BJTNode.tsx
import { type NodeProps, Position } from '@xyflow/react';
import type { BJTData } from '../../lib/types';
import {
  HANDLE_STYLE,
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from './NodeShell';

export function BJTNode({ id, data, selected }: NodeProps) {
  const d = data as BJTData;
  const isPNP = d.polarity === 'PNP';
  const stroke = selected ? '#a78bfa' : '#8b5cf6';

  return (
    <NodeShell id={id} width={60} height={60}>
      {/* Base — left center */}
      <RotatedHandle
        type="target"
        position={Position.Left}
        id="b"
        style={HANDLE_STYLE}
      />
      {/* Collector — right top */}
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="c"
        style={{ top: 10, background: '#4b5563' }}
      />
      {/* Emitter — right bottom */}
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="e"
        style={{ top: 50, background: '#4b5563' }}
      />

      <NodeSvg width={60} height={60}>
        {/* Base wire */}
        <line
          x1="0"
          y1="30"
          x2="22"
          y2="30"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Base bar */}
        <line
          x1="22"
          y1="12"
          x2="22"
          y2="48"
          stroke={stroke}
          strokeWidth="2.5"
        />
        {/* Collector line */}
        <line
          x1="22"
          y1="19"
          x2="60"
          y2="10"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Emitter line */}
        <line
          x1="22"
          y1="41"
          x2="60"
          y2="50"
          stroke={stroke}
          strokeWidth="1.5"
        />

        {isPNP ? (
          /* PNP: arrow on emitter pointing toward base */
          <polygon points="29,37 22,41 29,45" fill={stroke} />
        ) : (
          /* NPN: arrow on emitter pointing away from base */
          <polygon points="53,45 60,50 53,54" fill={stroke} />
        )}

        {/* Label */}
        <NodeText
          x={40}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        {/* Model */}
        <NodeText
          x={40}
          y={58}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {d.model}
        </NodeText>
      </NodeSvg>
    </NodeShell>
  );
}
