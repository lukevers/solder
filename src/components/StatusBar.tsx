import { APP_VERSION } from '../lib/app-version';
import { SAMPLE_RATE } from '../lib/constants';
import { SIMULATION_STATUS } from '../store/constants';
import { useCircuitState, useSimulationState } from '../store/hooks';

export function StatusBar() {
  const { nodes } = useCircuitState();
  const { simulationStatus, simulationError, outputBuffer, simulationElapsed } =
    useSimulationState();

  const statusColor =
    simulationStatus === SIMULATION_STATUS.error
      ? 'text-red-400'
      : simulationStatus === SIMULATION_STATUS.running
        ? 'text-yellow-400'
        : 'text-green-400';

  const statusLabel =
    simulationStatus === SIMULATION_STATUS.error
      ? `● error: ${simulationError ?? 'unknown'}`
      : simulationStatus === SIMULATION_STATUS.running
        ? '● simulating…'
        : outputBuffer
          ? `● ready · ${(outputBuffer.length / SAMPLE_RATE).toFixed(1)} s${simulationElapsed != null ? ` (took ${simulationElapsed.toFixed(1)}s)` : ''}`
          : '● ready';

  return (
    <div className="flex flex-shrink-0 gap-3 border-gray-800 border-t bg-gray-900 px-3 py-1 font-mono text-gray-500 text-xs">
      <span className={statusColor}>{statusLabel}</span>
      <span className="hidden sm:inline">components: {nodes.length}</span>
      <span className="hidden sm:inline">ngspice · WASM</span>
      <span className="hidden sm:inline">{SAMPLE_RATE} Hz</span>
      <div className="flex-1" />
      <span>version: {APP_VERSION}</span>
    </div>
  );
}
