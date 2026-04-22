import { clearSim } from './defaults';
import type { StoreSlice, StoreState } from './types';

type SimulationSlice = Pick<
  StoreState,
  | 'setSimulationStatus'
  | 'setOutputBuffer'
  | 'clearOutputBuffer'
  | 'setSimulationError'
  | 'setSimulatedInput'
  | 'requestSweep'
  | 'addSweepResult'
  | 'completeSweep'
  | 'failSweep'
  | 'clearSweep'
  | 'setSweepPlayingIndex'
>;

/**
 * Simulation and sweep actions for the active workspace.
 *
 * These fields are derived from the active circuit and are treated as
 * runtime-only state. They are intentionally reset on topology
 * changes and omitted from persistence.
 */
export const createSimulationSlice: StoreSlice<SimulationSlice> = (set) => ({
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),

  setOutputBuffer: (outputBuffer, elapsed) =>
    set({
      outputBuffer,
      ...(elapsed != null ? { simulationElapsed: elapsed } : {}),
    }),

  clearOutputBuffer: () => set(clearSim),

  setSimulationError: (simulationError) => set({ simulationError }),

  setSimulatedInput: (simulatedInput) => set({ simulatedInput }),

  requestSweep: (nodeId) =>
    set({
      sweepNodeId: nodeId,
      sweepStatus: 'running',
      sweepResults: [],
      sweepError: null,
      sweepPlayingIndex: null,
    }),

  addSweepResult: (result) =>
    set((state) => ({
      sweepResults: [...state.sweepResults, result].sort(
        (a, b) => a.position - b.position,
      ),
    })),

  completeSweep: () => set({ sweepStatus: 'done' }),

  failSweep: (error) => set({ sweepStatus: 'idle', sweepError: error }),

  clearSweep: () =>
    set({
      sweepNodeId: null,
      sweepStatus: 'idle',
      sweepResults: [],
      sweepError: null,
      sweepPlayingIndex: null,
    }),

  setSweepPlayingIndex: (sweepPlayingIndex) => set({ sweepPlayingIndex }),
});
