// src/components/nodes/JackNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { JackData } from '../../lib/types';
import { NodeShell, NodeText } from './NodeShell';

export function JackNode({ id, data, selected }: NodeProps) {
  const d = data as JackData;
  const isIn = d.direction === 'in';
  const color = isIn ? '#3b82f6' : '#22c55e';
  const stroke = selected ? '#60a5fa' : color;

  return (
    <NodeShell id={id} width={80} height={60}>
      {isIn ? (
        <>
          <svg width="80" height="60" viewBox="0 0 80 60" overflow="visible">
            <rect
              x="2"
              y="4"
              width="76"
              height="52"
              rx="4"
              fill="#1f2937"
              stroke={stroke}
              strokeWidth="1.5"
            />
            <NodeText
              x={34}
              y={30}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {d.label}
            </NodeText>
            <NodeText
              x={68}
              y={23}
              textAnchor="middle"
              fill="#60a5fa"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              +
            </NodeText>
            <NodeText
              x={68}
              y={47}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              −
            </NodeText>
          </svg>
          <Handle
            type="source"
            position={Position.Right}
            id="pos"
            style={{ top: 20, background: '#3b82f6' }}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="neg"
            style={{ top: 44, background: '#4b5563' }}
          />
        </>
      ) : (
        <>
          <Handle
            type="target"
            position={Position.Left}
            id="pos"
            style={{ top: 20, background: '#22c55e' }}
          />
          <Handle
            type="target"
            position={Position.Left}
            id="neg"
            style={{ top: 44, background: '#4b5563' }}
          />
          <svg width="80" height="60" viewBox="0 0 80 60" overflow="visible">
            <rect
              x="2"
              y="4"
              width="76"
              height="52"
              rx="4"
              fill="#1f2937"
              stroke={stroke}
              strokeWidth="1.5"
            />
            <NodeText
              x={46}
              y={30}
              textAnchor="middle"
              dominantBaseline="central"
              fill={color}
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              {d.label}
            </NodeText>
            <NodeText
              x={12}
              y={23}
              textAnchor="middle"
              fill="#4ade80"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              +
            </NodeText>
            <NodeText
              x={12}
              y={47}
              textAnchor="middle"
              fill="#6b7280"
              fontSize="10"
              fontFamily="monospace"
              fontWeight="bold"
            >
              −
            </NodeText>
          </svg>
        </>
      )}
    </NodeShell>
  );
}
