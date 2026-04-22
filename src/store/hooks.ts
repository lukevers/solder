import { useShallow } from 'zustand/react/shallow';
import { useStore } from './index';
import type { StoreState } from './types';

/**
 * Selector for the tab and workspace-shell fields that drive tab
 * chrome, examples category state, and viewport persistence.
 *
 * Components that only care about tab management should use this
 * instead of reaching into the full store shape.
 */
const selectTabState = (state: StoreState) => ({
  tabs: state.tabs,
  activeTabId: state.activeTabId,
  examplesActiveCategory: state.examplesActiveCategory,
  viewResetKey: state.viewResetKey,
  viewport: state.viewport,
});

/**
 * Selector for the tab strip's visible state.
 *
 * This narrower selector avoids subscribing tab bar components to
 * unrelated fields such as examples category or viewport state.
 */
const selectTabBarState = (state: StoreState) => ({
  tabs: state.tabs,
  activeTabId: state.activeTabId,
});

/**
 * Selector for examples-panel routing state.
 *
 * The examples panel only needs to know which workspace tab is active
 * and which example category is selected, so this keeps its
 * subscription intentionally small.
 */
const selectExamplesState = (state: StoreState) => ({
  activeTabId: state.activeTabId,
  examplesActiveCategory: state.examplesActiveCategory,
});

/**
 * Selector for viewport-driven shell state.
 *
 * Canvas and app-shell components use this to react to fit-view
 * resets and to read the current viewport transform without
 * subscribing to the full tab slice.
 */
const selectViewportState = (state: StoreState) => ({
  viewResetKey: state.viewResetKey,
  viewport: state.viewport,
});

/**
 * Selector for tab and workspace-shell actions.
 *
 * These actions coordinate tab lifecycle and viewport bookkeeping,
 * so grouping them here keeps consumers from assembling ad hoc
 * selector objects in every component.
 */
const selectTabActions = (state: StoreState) => ({
  addTab: state.addTab,
  switchTab: state.switchTab,
  closeTab: state.closeTab,
  renameTab: state.renameTab,
  setExamplesActiveCategory: state.setExamplesActiveCategory,
  setViewport: state.setViewport,
});

/**
 * Selector for the active circuit's live editing state.
 *
 * The root store mirrors the active tab's circuit fields so editor
 * surfaces can read a flat workspace view without digging through
 * the `tabs` array.
 */
const selectCircuitState = (state: StoreState) => ({
  nodes: state.nodes,
  edges: state.edges,
  selectedNodeId: state.selectedNodeId,
  selectedEdgeId: state.selectedEdgeId,
});

/**
 * Selector for circuit editing actions on the active workspace.
 *
 * These actions own topology changes, selection, and circuit load
 * flows, all of which may invalidate derived simulation output.
 */
const selectCircuitActions = (state: StoreState) => ({
  addNode: state.addNode,
  deleteNode: state.deleteNode,
  deleteEdge: state.deleteEdge,
  setNodes: state.setNodes,
  setEdges: state.setEdges,
  selectNode: state.selectNode,
  selectEdge: state.selectEdge,
  updateNodeData: state.updateNodeData,
  rotateNode: state.rotateNode,
  loadCircuit: state.loadCircuit,
});

/**
 * Selector for undo/redo actions.
 *
 * History currently only exposes commands to consumers, not the raw
 * stacks, which keeps most UI code decoupled from implementation
 * details of snapshot storage.
 */
const selectHistoryActions = (state: StoreState) => ({
  pushHistory: state.pushHistory,
  undo: state.undo,
  redo: state.redo,
});

/**
 * Selector for runtime simulation fields derived from the active
 * circuit.
 *
 * These values are shared by playback controls, status UI, and the
 * simulation worker orchestration in `App`.
 */
const selectSimulationState = (state: StoreState) => ({
  simulationStatus: state.simulationStatus,
  outputBuffer: state.outputBuffer,
  simulationError: state.simulationError,
  simulationDuration: state.simulationDuration,
  simulationElapsed: state.simulationElapsed,
  simulatedInput: state.simulatedInput,
  inputFrequency: state.inputFrequency,
  inputAmplitude: state.inputAmplitude,
});

/**
 * Selector for simulation control actions.
 *
 * Components that coordinate worker output or clear derived state
 * should use this hook instead of assembling the action bag inline.
 */
const selectSimulationActions = (state: StoreState) => ({
  setSimulationStatus: state.setSimulationStatus,
  setOutputBuffer: state.setOutputBuffer,
  clearOutputBuffer: state.clearOutputBuffer,
  setSimulationError: state.setSimulationError,
  setSimulatedInput: state.setSimulatedInput,
});

/**
 * Selector for sweep-analysis state associated with the active tab.
 *
 * Sweep results are orthogonal to normal simulation output, so they
 * get their own hook to keep consumers precise about what they read.
 */
const selectSweepState = (state: StoreState) => ({
  sweepNodeId: state.sweepNodeId,
  sweepStatus: state.sweepStatus,
  sweepResults: state.sweepResults,
  sweepError: state.sweepError,
  sweepPlayingIndex: state.sweepPlayingIndex,
});

/**
 * Selector for sweep-analysis actions.
 *
 * The sweep lifecycle is coordinated from `App`, but a few other
 * components observe or nudge it, so we expose a dedicated action
 * hook instead of mixing it into the simulation hook.
 */
const selectSweepActions = (state: StoreState) => ({
  requestSweep: state.requestSweep,
  addSweepResult: state.addSweepResult,
  completeSweep: state.completeSweep,
  failSweep: state.failSweep,
  clearSweep: state.clearSweep,
  setSweepPlayingIndex: state.setSweepPlayingIndex,
});

/**
 * Selector for audio playback state shared across the shell.
 *
 * The heavy Web Audio work lives outside the store, so the store only
 * needs to expose the chosen source, current volume, and playback bit.
 */
const selectAudioState = (state: StoreState) => ({
  audioSource: state.audioSource,
  localSamples: state.localSamples,
  volume: state.volume,
  playing: state.playing,
});

/**
 * Selector for audio playback actions.
 *
 * These setters are intentionally tiny, but centralizing them in a
 * hook keeps audio UI components from hand-rolling shallow selectors.
 */
const selectAudioActions = (state: StoreState) => ({
  setAudioSource: state.setAudioSource,
  setLocalSamples: state.setLocalSamples,
  addLocalSample: state.addLocalSample,
  removeLocalSample: state.removeLocalSample,
  setVolume: state.setVolume,
  setPlaying: state.setPlaying,
});

/**
 * Read the full tab-domain state exposed by the store hook layer.
 *
 * This is useful for shell-level consumers that genuinely need the
 * whole tab slice in one subscription.
 */
export function useTabState() {
  return useStore(useShallow(selectTabState));
}

/**
 * Read only the fields needed to render and manage the tab strip.
 *
 * Consumers avoid extra re-renders from unrelated viewport or
 * examples-panel changes by using this narrower selector.
 */
export function useTabBarState() {
  return useStore(useShallow(selectTabBarState));
}

/**
 * Read the state required by the examples panel.
 *
 * Keeping this separate from the full tab hook makes the examples UI
 * subscribe only to the active workspace id and selected category.
 */
export function useExamplesState() {
  return useStore(useShallow(selectExamplesState));
}

/**
 * Read viewport and fit-view reset state for canvas-level consumers.
 *
 * These values change independently from the rest of the tab slice,
 * so a focused hook keeps subscriptions tighter.
 */
export function useViewportState() {
  return useStore(useShallow(selectViewportState));
}

/**
 * Read the tab and workspace-shell actions as a grouped action bag.
 *
 * This keeps callers from manually composing the same shallow
 * selector shape whenever they need tab lifecycle commands.
 */
export function useTabActions() {
  return useStore(useShallow(selectTabActions));
}

/**
 * Read the active circuit's live node, edge, and selection state.
 *
 * Editor surfaces and analysis tools use this hook to stay scoped to
 * the current workspace circuit without pulling unrelated domains.
 */
export function useCircuitState() {
  return useStore(useShallow(selectCircuitState));
}

/**
 * Read the active circuit mutation actions.
 *
 * Components that edit the schematic should take their commands from
 * this hook rather than reaching into the raw store directly.
 */
export function useCircuitActions() {
  return useStore(useShallow(selectCircuitActions));
}

/**
 * Read undo and redo commands for the active workspace.
 *
 * The hook intentionally exposes only the command surface because the
 * UI rarely needs direct access to the underlying snapshot stacks.
 */
export function useHistoryActions() {
  return useStore(useShallow(selectHistoryActions));
}

/**
 * Read the active workspace's runtime simulation fields.
 *
 * Playback controls, status UI, and worker coordination all consume
 * these derived values.
 */
export function useSimulationState() {
  return useStore(useShallow(selectSimulationState));
}

/**
 * Read the imperative simulation control actions.
 *
 * This hook is primarily used by worker orchestration code that needs
 * to update or clear derived simulation artifacts.
 */
export function useSimulationActions() {
  return useStore(useShallow(selectSimulationActions));
}

/**
 * Read the sweep-analysis state for the active workspace.
 *
 * Keeping sweep data separate from generic simulation state helps
 * consumers subscribe only to the analysis mode they display.
 */
export function useSweepState() {
  return useStore(useShallow(selectSweepState));
}

/**
 * Read the sweep-analysis lifecycle actions.
 *
 * This action bag is shared by the app shell and analysis views that
 * coordinate parameter sweeps.
 */
export function useSweepActions() {
  return useStore(useShallow(selectSweepActions));
}

/**
 * Read the audio playback fields shared across the editor shell.
 *
 * The selected source, volume, and play bit are the only audio
 * fields that need to fan out through React state.
 */
export function useAudioState() {
  return useStore(useShallow(selectAudioState));
}

/**
 * Read the audio playback setters.
 *
 * This keeps audio UI code consistent with the rest of the domain
 * hook layer while preserving a narrow subscription.
 */
export function useAudioActions() {
  return useStore(useShallow(selectAudioActions));
}
