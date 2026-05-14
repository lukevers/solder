import { type NodeProps, Position } from '@xyflow/react';
import {
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../../ui/node-shell';
import { JACK_DIRECTION, type JackData } from './types';

interface JackNodeProps extends NodeProps {
  data: JackData;
}

export function JackNode({ id, data, selected }: JackNodeProps) {
  const isIn = data.direction === JACK_DIRECTION.in;
  const color = isIn ? '#3b82f6' : '#22c55e';
  const stroke = selected ? '#60a5fa' : color;

  return (
    <NodeShell id={id} width={80} height={60}>
      {isIn ? (
        <>
          <NodeSvg width={80} height={60}>
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
              {data.label}
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
          </NodeSvg>
          <RotatedHandle
            type="source"
            position={Position.Right}
            id="pos"
            style={{ top: 20, background: '#3b82f6' }}
          />
          <RotatedHandle
            type="target"
            position={Position.Right}
            id="pos"
            style={{ top: 20, opacity: 0 }}
          />
          <RotatedHandle
            type="source"
            position={Position.Right}
            id="neg"
            style={{ top: 44, background: '#4b5563' }}
          />
          <RotatedHandle
            type="target"
            position={Position.Right}
            id="neg"
            style={{ top: 44, opacity: 0 }}
          />
        </>
      ) : (
        <>
          <RotatedHandle
            type="target"
            position={Position.Left}
            id="pos"
            style={{ top: 20, background: '#22c55e' }}
          />
          <RotatedHandle
            type="source"
            position={Position.Left}
            id="pos"
            style={{ top: 20, background: '#22c55e', opacity: 0 }}
          />
          <RotatedHandle
            type="target"
            position={Position.Left}
            id="neg"
            style={{ top: 44, background: '#4b5563' }}
          />
          <RotatedHandle
            type="source"
            position={Position.Left}
            id="neg"
            style={{ top: 44, background: '#4b5563', opacity: 0 }}
          />
          <NodeSvg width={80} height={60}>
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
              {data.label}
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
          </NodeSvg>
        </>
      )}
    </NodeShell>
  );
}
