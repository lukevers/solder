// src/components/StatusBar.tsx
import { useStore } from '../store'

export function StatusBar() {
  const { nodes, simulationStatus, simulationError } = useStore((s) => ({
    nodes: s.nodes,
    simulationStatus: s.simulationStatus,
    simulationError: s.simulationError,
  }))

  const statusColor =
    simulationStatus === 'error'   ? 'text-red-400' :
    simulationStatus === 'running' ? 'text-yellow-400' :
                                     'text-green-400'

  const statusLabel =
    simulationStatus === 'error'   ? `● error: ${simulationError ?? 'unknown'}` :
    simulationStatus === 'running' ? '● simulating…' :
                                     '● ready'

  return (
    <div className="flex gap-4 px-3 py-1 bg-gray-900 border-t border-gray-800 text-xs font-mono text-gray-500 flex-shrink-0">
      <span className={statusColor}>{statusLabel}</span>
      <span>components: {nodes.length}</span>
      <span>ngspice · WASM</span>
      <div className="flex-1" />
      <span>44100 Hz · 2048 samples/buffer</span>
    </div>
  )
}
