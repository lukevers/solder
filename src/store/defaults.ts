import { EXAMPLE_CATEGORY } from '../examples';
import { normalizeCircuitMetadata } from '../lib/circuit-metadata';
import { CIRCUIT_LABEL, DEFAULT_BUNDLED_SAMPLE_NAME } from '../lib/constants';
import { JACK_DIRECTION } from '../lib/models/jack/types';
import { AUDIO_SOURCE_TYPE, type AudioSource } from '../lib/simulation-types';
import { SIMULATION_STATUS, SWEEP_STATUS, TAB_ORIGIN_KIND } from './constants';
import { fingerprintCircuit } from './helpers';
import type { StoreState, Tab } from './types';

/**
 * Name used for the seeded starter tab shown on first load and after the last
 * tab is closed.
 */
export const FIRST_CIRCUIT_NAME = 'Circuit 1';

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
  simulationStatus: SIMULATION_STATUS.idle as StoreState['simulationStatus'],
  simulationError: null as StoreState['simulationError'],
  simulationElapsed: null as StoreState['simulationElapsed'],
  simulatedInput: null as StoreState['simulatedInput'],
  sweepNodeId: null as StoreState['sweepNodeId'],
  sweepStatus: SWEEP_STATUS.idle as StoreState['sweepStatus'],
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
  originKind:
    | typeof TAB_ORIGIN_KIND.custom
    | typeof TAB_ORIGIN_KIND.starter = TAB_ORIGIN_KIND.custom,
): Tab {
  const id = crypto.randomUUID();
  const metadata = normalizeCircuitMetadata({
    name,
    category: EXAMPLE_CATEGORY.circuits,
  });
  const nodes = [
    {
      id: `${id}-in`,
      type: 'jack' as const,
      position: { x: 100, y: 200 },
      data: { label: CIRCUIT_LABEL.input, direction: JACK_DIRECTION.in },
    },
    {
      id: `${id}-gnd-in`,
      type: 'ground' as const,
      position: { x: 140, y: 320 },
      data: { label: CIRCUIT_LABEL.ground },
    },
    {
      id: `${id}-out`,
      type: 'jack' as const,
      position: { x: 400, y: 200 },
      data: { label: CIRCUIT_LABEL.output, direction: JACK_DIRECTION.out },
    },
    {
      id: `${id}-gnd-out`,
      type: 'ground' as const,
      position: { x: 340, y: 320 },
      data: { label: CIRCUIT_LABEL.ground },
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
    originKind === TAB_ORIGIN_KIND.starter
      ? {
          kind: TAB_ORIGIN_KIND.starter,
          seed: metadata,
          fingerprint: fingerprintCircuit(nodes, edges),
        }
      : { kind: TAB_ORIGIN_KIND.custom };

  return {
    id,
    ...metadata,
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
export const firstTab = defaultTab(FIRST_CIRCUIT_NAME, TAB_ORIGIN_KIND.starter);

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
  examplesActiveCategory: EXAMPLE_CATEGORY.pedals,
  viewResetKey: 0,
  viewport: { x: 0, y: 0, zoom: 1 },
  hasSeenWelcome: false,
  nodes: firstTab.nodes,
  edges: firstTab.edges,
  selectedNodeId: null as StoreState['selectedNodeId'],
  selectedEdgeId: null as StoreState['selectedEdgeId'],
  past: [] as StoreState['past'],
  future: [] as StoreState['future'],
  simulationStatus: SIMULATION_STATUS.idle as StoreState['simulationStatus'],
  outputBuffer: null as StoreState['outputBuffer'],
  simulationError: null as StoreState['simulationError'],
  simulationDuration: 0.1,
  simulationElapsed: null as StoreState['simulationElapsed'],
  simulatedInput: null as StoreState['simulatedInput'],
  inputFrequency: 1000,
  inputAmplitude: 0.1,
  sweepNodeId: null as StoreState['sweepNodeId'],
  sweepStatus: SWEEP_STATUS.idle as StoreState['sweepStatus'],
  sweepResults: [] as StoreState['sweepResults'],
  sweepError: null as StoreState['sweepError'],
  sweepPlayingIndex: null as StoreState['sweepPlayingIndex'],
  audioSource: {
    type: AUDIO_SOURCE_TYPE.sample,
    name: DEFAULT_BUNDLED_SAMPLE_NAME,
  } as AudioSource,
  localSamples: [] as StoreState['localSamples'],
  volume: 0.7,
  playing: false,
} satisfies Partial<StoreState>;
