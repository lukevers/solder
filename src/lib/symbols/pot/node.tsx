import { type NodeProps, Position } from '@xyflow/react';
import { formatOhms } from '../../units';
import { NodeShell, NodeSvg, NodeText, RotatedHandle } from '../node-shell';
import type { PotData } from './types';

export function PotNode({ id, data, selected }: NodeProps) {
  const d = data as PotData;
  const stroke = selected ? '#60a5fa' : '#9ca3af';
  const wiperColor = selected ? '#60a5fa' : '#a78bfa';

  // Wiper x position along the resistor body (body spans x 12–68)
  const wiperX = 12 + 56 * d.position;
  const pct = Math.round(d.position * 100);
  const val = formatOhms(d.ohms);

  return (
    <NodeShell id={id} width={80} height={60}>
      {/* CCW end — left at y=20 (explicit px, on 20px grid) */}
      <RotatedHandle
        type="target"
        position={Position.Left}
        id="ccw"
        style={{ top: 20, background: '#4b5563' }}
      />
      <RotatedHandle
        type="source"
        position={Position.Left}
        id="ccw"
        style={{ top: 20, background: '#4b5563', opacity: 0 }}
      />
      {/* CW end — right at y=20 */}
      <RotatedHandle
        type="source"
        position={Position.Right}
        id="cw"
        style={{ top: 20, background: '#4b5563' }}
      />
      <RotatedHandle
        type="target"
        position={Position.Right}
        id="cw"
        style={{ top: 20, background: '#4b5563', opacity: 0 }}
      />
      {/* Wiper tap — bottom center (x=40, y=60, both multiples of 20) */}
      <RotatedHandle
        type="source"
        position={Position.Bottom}
        id="wiper"
        style={{ left: '50%', background: '#a78bfa' }}
      />
      <RotatedHandle
        type="target"
        position={Position.Bottom}
        id="wiper"
        style={{ left: '50%', background: '#a78bfa', opacity: 0 }}
      />

      <NodeSvg width={80} height={60}>
        {/* Leads at y=20 to match handle position */}
        <line
          x1="0"
          y1="20"
          x2="12"
          y2="20"
          stroke={stroke}
          strokeWidth="1.5"
        />
        <line
          x1="68"
          y1="20"
          x2="80"
          y2="20"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Resistor zigzag centered at y=20 */}
        <polyline
          points="12,20 16,10 22,30 28,10 34,30 40,10 46,30 52,20 68,20"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Wiper tick on the resistor body */}
        <line
          x1={wiperX}
          y1="14"
          x2={wiperX}
          y2="26"
          stroke={wiperColor}
          strokeWidth="2"
        />
        {/* Wiper arrow line down to the handle */}
        <line
          x1={wiperX}
          y1="26"
          x2="40"
          y2="52"
          stroke={wiperColor}
          strokeWidth="1.5"
        />
        {/* Arrow head */}
        <polygon
          points={`${wiperX - 4},32 ${wiperX + 4},32 ${wiperX},26`}
          fill={wiperColor}
        />
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
        {/* Value + position */}
        <NodeText
          x={40}
          y={58}
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {val} {pct}%
        </NodeText>
      </NodeSvg>
    </NodeShell>
  );
}
