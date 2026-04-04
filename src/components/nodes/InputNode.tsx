// src/components/nodes/InputNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { InputData } from '../../lib/types'

export function InputNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as InputData

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 52, height: 32 }}
    >
      <svg width="52" height="32" viewBox="0 0 52 32">
        <rect x="2" y="4" width="44" height="24" rx="4"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#3b82f6'}
          strokeWidth="1.5"
        />
        <text x="24" y="20" textAnchor="middle" fill="#3b82f6" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {d.label}
        </text>
      </svg>
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#3b82f6' }} />
    </div>
  )
}
