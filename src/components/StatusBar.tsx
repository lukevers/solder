// src/components/StatusBar.tsx
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';

export function StatusBar() {
  const {
    nodes,
    simulationStatus,
    simulationError,
    outputBuffer,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      simulationStatus: s.simulationStatus,
      simulationError: s.simulationError,
      outputBuffer: s.outputBuffer,
    })),
  );

  const statusColor =
    simulationStatus === 'error'
      ? 'text-red-400'
      : simulationStatus === 'running'
        ? 'text-yellow-400'
        : 'text-green-400';

  const statusLabel =
    simulationStatus === 'error'
      ? `● error: ${simulationError ?? 'unknown'}`
      : simulationStatus === 'running'
        ? '● simulating…'
        : outputBuffer
          ? `● ready · ${(outputBuffer.length / 44100).toFixed(1)} s`
          : '● ready';

  return (
    <div className="flex gap-4 px-3 py-1 bg-gray-900 border-t border-gray-800 text-xs font-mono text-gray-500 flex-shrink-0">
      <span className={statusColor}>{statusLabel}</span>
      <span>components: {nodes.length}</span>
      <span>ngspice · WASM</span>
      <div className="flex-1" />
      <span>44100 Hz</span>
    </div>
  );
}
