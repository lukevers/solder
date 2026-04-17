// src/components/nodes/OpAmpNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { OpAmpData } from '../../lib/types';
import { HANDLE_STYLE, NodeShell, NodeText } from './NodeShell';

export function OpAmpNode({ id, data, selected }: NodeProps) {
  const d = data as OpAmpData;
  const stroke = selected ? '#fb923c' : '#f97316';

  return (
    <NodeShell id={id} width={80} height={80}>
      {/* +in — non-inverting, top-left at y=20 (25% of 80) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in_pos"
        style={{ top: 20, background: '#4b5563' }}
      />
      {/* -in — inverting, bottom-left at y=60 (75% of 80) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in_neg"
        style={{ top: 60, background: '#4b5563' }}
      />
      {/* vcc — top center at x=40 (50% of 80) */}
      <Handle
        type="target"
        position={Position.Top}
        id="vcc"
        style={{ left: '50%', background: '#4b5563' }}
      />
      {/* gnd — bottom center at x=40 (50% of 80) */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="gnd"
        style={{ left: '50%', background: '#4b5563' }}
      />
      {/* out — right center at y=40 */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={HANDLE_STYLE}
      />

      <svg width="80" height="80" viewBox="0 0 80 80" overflow="visible">
        <polygon
          points="10,5 10,75 70,40"
          fill="#1f2937"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <NodeText x={20} y={28} fill="#e5e7eb" fontSize="10" fontFamily="monospace">
          +
        </NodeText>
        <NodeText x={20} y={58} fill="#e5e7eb" fontSize="10" fontFamily="monospace">
          −
        </NodeText>
        <NodeText
          x={40}
          y={44}
          textAnchor="middle"
          fill="#f97316"
          fontSize="8"
          fontFamily="monospace"
        >
          {d.label}
        </NodeText>
        <NodeText
          x={40}
          y={18}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="7"
          fontFamily="monospace"
        >
          {d.model}
        </NodeText>
      </svg>
    </NodeShell>
  );
}
