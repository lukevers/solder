import { clearSim, defaultSimState, defaultTab, nextTabName } from './defaults';
import { flushActive, simStateFromTab } from './helpers';
import type { StoreSlice, StoreState } from './types';

type TabsSlice = Pick<
  StoreState,
  | 'addTab'
  | 'switchTab'
  | 'closeTab'
  | 'renameTab'
  | 'setExamplesActiveCategory'
  | 'setViewport'
>;

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
        const newTab = defaultTab('Circuit 1');

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
});
