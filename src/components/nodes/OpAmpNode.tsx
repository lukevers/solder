// src/components/nodes/OpAmpNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { OpAmpData } from '../../lib/types'

export function OpAmpNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as OpAmpData
  const stroke = selected ? '#fb923c' : '#f97316'

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 100, height: 80 }}
    >
      {/* +in (non-inverting input, top-left) */}
      <Handle type="target" position={Position.Left} id="in_pos" style={{ top: '30%', background: '#4b5563' }} />
      {/* -in (inverting input, bottom-left) */}
      <Handle type="target" position={Position.Left} id="in_neg" style={{ top: '70%', background: '#4b5563' }} />
      {/* vcc (power supply, top) */}
      <Handle type="target" position={Position.Top}  id="vcc"    style={{ left: '50%', background: '#4b5563' }} />
      {/* gnd (ground reference, bottom) */}
      <Handle type="target" position={Position.Bottom} id="gnd"  style={{ left: '50%', background: '#4b5563' }} />
      {/* out (output, right) */}
      <Handle type="source" position={Position.Right} id="out"   style={{ background: '#4b5563' }} />

      <svg width="100" height="80" viewBox="0 0 100 80">
        <polygon points="10,5 10,75 90,40" fill="#1f2937" stroke={stroke} strokeWidth="1.5"/>
        <text x="22" y="30" fill="#e5e7eb" fontSize="10" fontFamily="monospace">+</text>
        <text x="22" y="56" fill="#e5e7eb" fontSize="10" fontFamily="monospace">−</text>
        <text x="50" y="44" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="monospace">{d.label}</text>
        <text x="50" y="20" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="monospace">{d.model}</text>
      </svg>
    </div>
  )
}
