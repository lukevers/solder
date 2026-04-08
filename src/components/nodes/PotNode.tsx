// src/components/nodes/PotNode.tsx
import { Handle, type NodeProps, Position } from '@xyflow/react';
import type { PotData } from '../../lib/types';
import { useStore } from '../../store';

export function PotNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode);
  const d = data as PotData;
  const stroke = selected ? '#60a5fa' : '#e5e7eb';
  const wiperColor = selected ? '#60a5fa' : '#a78bfa';

  // Wiper x position along the resistor body (body spans x 12–68)
  const wiperX = 12 + 56 * d.position;
  const pct = Math.round(d.position * 100);
  const val =
    d.ohms >= 1e6
      ? `${(d.ohms / 1e6).toPrecision(3)}MΩ`
      : d.ohms >= 1e3
        ? `${(d.ohms / 1e3).toPrecision(3)}kΩ`
        : `${d.ohms}Ω`;

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 80, height: 60 }}
    >
      {/* CCW end — left at y=20 (explicit px, on 20px grid) */}
      <Handle
        type="target"
        position={Position.Left}
        id="ccw"
        style={{ top: 20, background: '#4b5563' }}
      />
      {/* CW end — right at y=20 */}
      <Handle
        type="source"
        position={Position.Right}
        id="cw"
        style={{ top: 20, background: '#4b5563' }}
      />
      {/* Wiper tap — bottom center (x=40, y=60, both multiples of 20) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="wiper"
        style={{ left: '50%', background: '#a78bfa' }}
      />

      <svg width="80" height="60" viewBox="0 0 80 60">
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
        <text
          x="40"
          y="8"
          textAnchor="middle"
          fill="#7ee787"
          fontSize="7"
          fontFamily="monospace"
        >
          {d.label}
        </text>
        {/* Value + position */}
        <text
          x="40"
          y="58"
          textAnchor="middle"
          fill="#6b7280"
          fontSize="6"
          fontFamily="monospace"
        >
          {val} {pct}%
        </text>
      </svg>
    </div>
  );
}
