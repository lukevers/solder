// src/components/nodes/OutputNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { OutputData } from '../../lib/types';
import { useStore } from '../../store';

export function OutputNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode);
  const d = data as OutputData;

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 80, height: 40 }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{ background: '#22c55e' }}
      />
      <svg width="80" height="40" viewBox="0 0 80 40">
        <rect
          x="2"
          y="4"
          width="76"
          height="32"
          rx="4"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#22c55e'}
          strokeWidth="1.5"
        />
        <text
          x="40"
          y="24"
          textAnchor="middle"
          fill="#22c55e"
          fontSize="10"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {d.label}
        </text>
      </svg>
    </div>
  );
}
