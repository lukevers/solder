import type { AudioSource } from '../lib/simulation-types';
import { fingerprintCircuit } from './helpers';
import type { StoreState, Tab } from './types';

/**
 * Maximum number of undo snapshots we retain in memory for the
 * active circuit.
 *
 * The history stack intentionally stays small because each entry
 * stores the full node and edge arrays. A fixed cap keeps editing
 * responsive without letting long sessions accumulate unbounded
 * memory usage.
 */
export const MAX_HISTORY = 50;

/**
 * Baseline simulation and sweep state shared by every tab and by
 * the active workspace copy.
 *
 * Tabs persist circuit topology, selection, and history, but the
 * derived simulation artifacts are rebuilt as needed. Keeping the
 * default runtime state in one object makes it easy to reset those
 * fields consistently after edits, tab switches, and rehydration.
 */
export const defaultSimState = {
  outputBuffer: null as StoreState['outputBuffer'],
  simulationStatus: 'idle' as StoreState['simulationStatus'],
  simulationError: null as StoreState['simulationError'],
  simulationElapsed: null as StoreState['simulationElapsed'],
  simulatedInput: null as StoreState['simulatedInput'],
  sweepNodeId: null as StoreState['sweepNodeId'],
  sweepStatus: 'idle' as StoreState['sweepStatus'],
  sweepResults: [] as StoreState['sweepResults'],
  sweepError: null as StoreState['sweepError'],
  sweepPlayingIndex: null as StoreState['sweepPlayingIndex'],
};

/**
 * Fresh copy of the runtime-only state used when a circuit edit
 * invalidates previously computed simulation results.
 *
 * We clone the defaults once here so callers can spread a stable
 * object instead of rebuilding the same literal in every action.
 */
export const clearSim = { ...defaultSimState };

/**
 * Create a new tab seeded with the stock input/output jack layout.
 *
 * New workspaces start from a minimal pass-through circuit with
 * grounded negative terminals so the user can simulate immediately
 * without first wiring safety nets required by ngspice.
 */
export function defaultTab(
  name: string,
  originKind: 'custom' | 'starter' = 'custom',
): Tab {
  const id = crypto.randomUUID();
  const nodes = [
    {
      id: `${id}-in`,
      type: 'jack' as const,
      position: { x: 100, y: 200 },
      data: { label: 'INPUT', direction: 'in' as const },
    },
    {
      id: `${id}-gnd-in`,
      type: 'ground' as const,
      position: { x: 140, y: 320 },
      data: { label: 'GND' },
    },
    {
      id: `${id}-out`,
      type: 'jack' as const,
      position: { x: 400, y: 200 },
      data: { label: 'OUTPUT', direction: 'out' as const },
    },
    {
      id: `${id}-gnd-out`,
      type: 'ground' as const,
      position: { x: 340, y: 320 },
      data: { label: 'GND' },
    },
  ];
  const edges = [
    {
      id: `${id}-edge`,
      source: `${id}-in`,
      sourceHandle: 'pos',
      target: `${id}-out`,
      targetHandle: 'pos',
    },
    {
      id: `${id}-edge-in-gnd`,
      source: `${id}-in`,
      sourceHandle: 'neg',
      target: `${id}-gnd-in`,
      targetHandle: 'gnd',
    },
    {
      id: `${id}-edge-out-gnd`,
      source: `${id}-gnd-out`,
      sourceHandle: 'gnd',
      target: `${id}-out`,
      targetHandle: 'neg',
    },
  ];
  const origin =
    originKind === 'starter'
      ? {
          kind: 'starter' as const,
          defaultName: name,
          fingerprint: fingerprintCircuit(nodes, edges),
        }
      : { kind: 'custom' as const };

  return {
    id,
    name,
    origin,
    nodes,
    edges,
    selectedNodeId: null,
    past: [],
    future: [],
    ...defaultSimState,
  };
}

/**
 * Choose the next default tab label by scanning the existing
 * numbered circuit tabs.
 *
 * This preserves the current UX where user-renamed tabs are left
 * alone and only untouched "Circuit N" tabs contribute to the
 * sequence.
 */
export function nextTabName(tabs: Array<Tab>): string {
  let max = 0;

  for (const tab of tabs) {
    const match = tab.name.match(/^Circuit (\d+)$/);
    if (match) {
      max = Math.max(max, Number.parseInt(match[1], 10));
    }
  }

  return `Circuit ${max + 1}`;
}

/**
 * Initial tab used both for the first session and for store reset
 * cases where the user closes the last remaining tab.
 */
export const firstTab = defaultTab('Circuit 1', 'starter');

/**
 * Non-action store fields that seed the root Zustand store before
 * slice actions are attached.
 *
 * The active workspace mirrors the active tab so editor components
 * can read a flat live view without digging through the tabs array.
 */
export const initialState = {
  tabs: [firstTab],
  activeTabId: firstTab.id,
  examplesActiveCategory: 'pedals' as const,
  viewResetKey: 0,
  viewport: { x: 0, y: 0, zoom: 1 },
  nodes: firstTab.nodes,
  edges: firstTab.edges,
  selectedNodeId: null as StoreState['selectedNodeId'],
  selectedEdgeId: null as StoreState['selectedEdgeId'],
  past: [] as StoreState['past'],
  future: [] as StoreState['future'],
  simulationStatus: 'idle' as StoreState['simulationStatus'],
  outputBuffer: null as StoreState['outputBuffer'],
  simulationError: null as StoreState['simulationError'],
  simulationDuration: 0.1,
  simulationElapsed: null as StoreState['simulationElapsed'],
  simulatedInput: null as StoreState['simulatedInput'],
  inputFrequency: 1000,
  inputAmplitude: 0.1,
  sweepNodeId: null as StoreState['sweepNodeId'],
  sweepStatus: 'idle' as StoreState['sweepStatus'],
  sweepResults: [] as StoreState['sweepResults'],
  sweepError: null as StoreState['sweepError'],
  sweepPlayingIndex: null as StoreState['sweepPlayingIndex'],
  audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
  localSamples: [] as StoreState['localSamples'],
  volume: 0.7,
  playing: false,
} satisfies Partial<StoreState>;
