import type { ExampleCircuit } from '../examples';
import { TAB_ORIGIN_KIND } from './constants';
import {
  clearSim,
  defaultSimState,
  defaultTab,
  FIRST_CIRCUIT_NAME,
  nextTabName,
} from './defaults';
import {
  ensureMeasured,
  fingerprintCircuit,
  flushActive,
  simStateFromTab,
} from './helpers';
import type { StoreSlice, StoreState, Tab } from './types';

type TabsSlice = Pick<
  StoreState,
  | 'addTab'
  | 'openExample'
  | 'switchTab'
  | 'closeTab'
  | 'renameTab'
  | 'setExamplesActiveCategory'
  | 'setViewport'
  | 'setHasSeenWelcome'
>;

/**
 * Create a tab snapshot seeded from an example circuit definition.
 *
 * Example tabs carry a structural fingerprint of the untouched payload so the
 * store can later decide whether another example click should reuse this tab.
 */
function createExampleTab(example: ExampleCircuit): Tab {
  const nodes = ensureMeasured(example.nodes);
  const fingerprint = fingerprintCircuit(nodes, example.edges);

  return {
    id: crypto.randomUUID(),
    name: example.name,
    origin: {
      kind: TAB_ORIGIN_KIND.example,
      exampleId: example.id,
      exampleName: example.name,
      fingerprint,
    },
    nodes,
    edges: example.edges,
    selectedNodeId: null,
    past: [],
    future: [],
    ...defaultSimState,
  };
}

/**
 * Return true when the active tab is still the untouched version of a
 * replaceable seeded circuit.
 *
 * Seeded tabs currently include examples and the very first starter circuit.
 * Renaming either one counts as a change so a later example click opens a new
 * tab instead of silently discarding that custom title.
 */
function isPristineReplaceableActiveTab(
  state: StoreState,
  activeTab: Tab,
): boolean {
  if (activeTab.origin.kind === TAB_ORIGIN_KIND.custom) {
    return false;
  }

  if (activeTab.origin.kind === TAB_ORIGIN_KIND.example) {
    if (activeTab.name !== activeTab.origin.exampleName) {
      return false;
    }
  } else if (activeTab.name !== activeTab.origin.defaultName) {
    return false;
  }

  return (
    fingerprintCircuit(state.nodes, state.edges) ===
    activeTab.origin.fingerprint
  );
}

/**
 * Actions responsible for tab lifecycle, workspace switching, and
 * lightweight workspace UI state.
 *
 * These actions are the orchestration layer of the editor because a
 * tab switch has to swap circuit, history, and simulation state as a
 * single transaction.
 */
export const createTabsSlice: StoreSlice<TabsSlice> = (set) => ({
  addTab: () =>
    set((state) => {
      const flushedTabs = flushActive(state);
      const newTab = defaultTab(nextTabName(flushedTabs));

      return {
        tabs: [...flushedTabs, newTab],
        activeTabId: newTab.id,
        viewResetKey: state.viewResetKey + 1,
        nodes: newTab.nodes,
        edges: newTab.edges,
        selectedNodeId: null,
        past: [],
        future: [],
        ...clearSim,
      };
    }),

  openExample: (example) =>
    set((state) => {
      const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId)!;

      if (isPristineReplaceableActiveTab(state, activeTab)) {
        const replacementTab = {
          ...createExampleTab(example),
          id: activeTab.id,
        };

        return {
          tabs: state.tabs.map((tab) =>
            tab.id === state.activeTabId ? replacementTab : tab,
          ),
          nodes: replacementTab.nodes,
          edges: replacementTab.edges,
          selectedNodeId: null,
          selectedEdgeId: null,
          past: [],
          future: [],
          viewResetKey: state.viewResetKey + 1,
          ...clearSim,
        };
      }

      const flushedTabs = flushActive(state);
      const newTab = createExampleTab(example);

      return {
        tabs: [...flushedTabs, newTab],
        activeTabId: newTab.id,
        viewResetKey: state.viewResetKey + 1,
        nodes: newTab.nodes,
        edges: newTab.edges,
        selectedNodeId: null,
        selectedEdgeId: null,
        past: [],
        future: [],
        ...clearSim,
      };
    }),

  switchTab: (id) =>
    set((state) => {
      if (state.activeTabId === id) {
        return {};
      }

      const flushedTabs = flushActive(state);
      const targetTab = flushedTabs.find((tab) => tab.id === id)!;

      return {
        tabs: flushedTabs,
        activeTabId: id,
        viewResetKey: state.viewResetKey + 1,
        nodes: targetTab.nodes,
        edges: targetTab.edges,
        selectedNodeId: targetTab.selectedNodeId,
        past: targetTab.past,
        future: targetTab.future,
        ...simStateFromTab(targetTab),
      };
    }),

  closeTab: (id) =>
    set((state) => {
      const flushedTabs = flushActive(state);
      const remainingTabs = flushedTabs.filter((tab) => tab.id !== id);

      if (remainingTabs.length === 0) {
        const newTab = defaultTab(FIRST_CIRCUIT_NAME, TAB_ORIGIN_KIND.starter);

        return {
          tabs: [newTab],
          activeTabId: newTab.id,
          viewResetKey: state.viewResetKey + 1,
          nodes: newTab.nodes,
          edges: newTab.edges,
          selectedNodeId: null,
          past: [],
          future: [],
          ...defaultSimState,
        };
      }

      if (state.activeTabId === id) {
        const closedIndex = flushedTabs.findIndex((tab) => tab.id === id);
        const nextTab =
          remainingTabs[Math.min(closedIndex, remainingTabs.length - 1)];

        return {
          tabs: remainingTabs,
          activeTabId: nextTab.id,
          viewResetKey: state.viewResetKey + 1,
          nodes: nextTab.nodes,
          edges: nextTab.edges,
          selectedNodeId: nextTab.selectedNodeId,
          past: nextTab.past,
          future: nextTab.future,
          ...simStateFromTab(nextTab),
        };
      }

      return { tabs: remainingTabs };
    }),

  renameTab: (id, name) =>
    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, name } : tab)),
    })),

  setExamplesActiveCategory: (examplesActiveCategory) =>
    set({ examplesActiveCategory }),

  setViewport: (viewport) => set({ viewport }),

  setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
});
