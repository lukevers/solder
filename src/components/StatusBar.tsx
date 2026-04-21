import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';

export function StatusBar() {
  const {
    nodes,
    simulationStatus,
    simulationError,
    outputBuffer,
    simulationElapsed,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      simulationStatus: s.simulationStatus,
      simulationError: s.simulationError,
      outputBuffer: s.outputBuffer,
      simulationElapsed: s.simulationElapsed,
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
          ? `● ready · ${(outputBuffer.length / 44100).toFixed(1)} s${simulationElapsed != null ? ` (took ${simulationElapsed.toFixed(1)}s)` : ''}`
          : '● ready';

  return (
    <div className="flex flex-shrink-0 gap-3 border-gray-800 border-t bg-gray-900 px-3 py-1 font-mono text-gray-500 text-xs">
      <span className={statusColor}>{statusLabel}</span>
      <span className="hidden sm:inline">components: {nodes.length}</span>
      <span className="hidden sm:inline">ngspice · WASM</span>
      <div className="flex-1" />
      <span className="hidden sm:inline">44100 Hz</span>
    </div>
  );
}
