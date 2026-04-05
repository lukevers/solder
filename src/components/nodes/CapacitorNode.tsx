// src/components/nodes/CapacitorNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { CapacitorData } from '../../lib/types'

export function CapacitorNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as CapacitorData

  const faradsLabel = d.farads >= 1e-6
    ? `${d.farads * 1e6}μF`
    : `${d.farads * 1e9}nF`

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 60, height: 44 }}
    >
      <Handle type="target" position={Position.Left}  id="a" style={{ background: '#4b5563' }} />
      <svg width="60" height="44" viewBox="0 0 60 44">
        <line x1="0" y1="22" x2="22" y2="22" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <line x1="22" y1="8"  x2="22" y2="36" stroke={selected ? '#60a5fa' : '#e5e7eb'} strokeWidth="2.5"/>
        <line x1="28" y1="8"  x2="28" y2="36" stroke={selected ? '#60a5fa' : '#e5e7eb'} strokeWidth="2.5"/>
        <line x1="28" y1="22" x2="60" y2="22" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <text x="25" y="10" textAnchor="middle" fill="#7ee787" fontSize="8" fontFamily="monospace">{d.label}</text>
        <text x="30" y="42" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="monospace">{faradsLabel}</text>
      </svg>
      <Handle type="source" position={Position.Right} id="b" style={{ background: '#4b5563' }} />
    </div>
  )
}
