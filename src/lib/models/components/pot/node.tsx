import { type NodeProps, Position } from '@xyflow/react';
import { formatOhms } from '../../../units';
import {
  NodeShell,
  NodeSvg,
  NodeText,
  RotatedHandle,
} from '../../ui/node-shell';
import type { PotData } from './types';

interface PotNodeProps extends NodeProps {
  data: PotData;
}

export function PotNode({ id, data, selected }: PotNodeProps) {
  const stroke = selected ? '#60a5fa' : '#9ca3af';
  const wiperColor = selected ? '#60a5fa' : '#a78bfa';

  /**
   * Wiper x position along the resistor body. The
   * body spans x = 12 through x = 68.
   */
  const wiperX = 12 + 56 * data.position;
  const pct = Math.round(data.position * 100);
  const val = formatOhms(data.ohms);

  return (
    <NodeShell id={id} width={80} height={60}>
      {/* CCW end at y = 20 on the left edge. */}
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
      {/* CW end at y = 20 on the right edge. */}
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
      {/* Wiper tap at the bottom-center handle. */}
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
        {/* Leads at y = 20 to match the handle row. */}
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
        {/* Resistor body centered on the lead row. */}
        <polyline
          points="12,20 16,10 22,30 28,10 34,30 40,10 46,30 52,20 68,20"
          fill="none"
          stroke={stroke}
          strokeWidth="1.5"
        />
        {/* Wiper tick on the resistor body. */}
        <line
          x1={wiperX}
          y1="14"
          x2={wiperX}
          y2="26"
          stroke={wiperColor}
          strokeWidth="2"
        />
        {/* Wiper arrow line down to the handle. */}
        <line
          x1={wiperX}
          y1="26"
          x2="40"
          y2="52"
          stroke={wiperColor}
          strokeWidth="1.5"
        />
        {/* Wiper arrow head. */}
        <polygon
          points={`${wiperX - 4},32 ${wiperX + 4},32 ${wiperX},26`}
          fill={wiperColor}
        />
        {/* Pot label. */}
        <NodeText
          x={40}
          y={8}
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {data.label}
        </NodeText>
        {/* Formatted value plus current position. */}
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
