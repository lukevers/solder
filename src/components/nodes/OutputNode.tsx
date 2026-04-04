// src/components/nodes/OutputNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { OutputData } from '../../lib/types'

export function OutputNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as OutputData

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 52, height: 32 }}
    >
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#22c55e' }} />
      <svg width="52" height="32" viewBox="0 0 52 32">
        <rect x="6" y="4" width="44" height="24" rx="4"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#22c55e'}
          strokeWidth="1.5"
        />
        <text x="28" y="20" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {d.label}
        </text>
      </svg>
    </div>
  )
}
