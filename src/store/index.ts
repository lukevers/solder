import { create } from 'zustand';
import { type PersistOptions, persist } from 'zustand/middleware';
import { createAudioSlice } from './audio-slice';
import { createCircuitSlice } from './circuit-slice';
import { defaultSimState, initialState } from './defaults';
import {
  flushActive,
  normalizePersistedTab,
  stripTabRuntimeState,
} from './helpers';
import { createHistorySlice } from './history-slice';
import { createPaletteSlice } from './palette-slice';
import { createSimulationSlice } from './simulation-slice';
import { createTabsSlice } from './tabs-slice';
import type { PersistedStoreState, StoreState } from './types';

/**
 * Persistence key for the editor workspace.
 *
 * The value is unchanged from the previous single-file store so
 * existing browser storage keeps working across this refactor.
 */
const STORE_KEY = 'solder-tabs';

/**
 * Persistence configuration for the root store.
 *
 * Only structural workspace state is persisted. Runtime simulation
 * data is stripped from each tab before save and rebuilt to defaults
 * on rehydration.
 */
const persistOptions: PersistOptions<StoreState, PersistedStoreState> = {
  name: STORE_KEY,
  partialize: (state) => ({
    tabs: flushActive(state).map(stripTabRuntimeState),
    activeTabId: state.activeTabId,
    examplesActiveCategory: state.examplesActiveCategory,
    audioSource: state.audioSource,
    hasSeenWelcome: state.hasSeenWelcome,
    recentPaletteIds: state.recentPaletteIds,
  }),
  onRehydrateStorage: () => (state) => {
    if (!state) {
      return;
    }

    state.tabs = state.tabs.map((tab) => ({
      ...defaultSimState,
      ...normalizePersistedTab(tab),
    }));

    const activeTab = state.tabs.find((tab) => tab.id === state.activeTabId);
    if (!activeTab) {
      return;
    }

    state.nodes = activeTab.nodes;
    state.edges = activeTab.edges;
    state.selectedNodeId = activeTab.selectedNodeId;
    state.past = activeTab.past;
    state.future = activeTab.future;
  },
};

export const useStore = create<StoreState>()(
  persist(
    (...args) => ({
      ...initialState,
      ...createTabsSlice(...args),
      ...createCircuitSlice(...args),
      ...createHistorySlice(...args),
      ...createSimulationSlice(...args),
      ...createAudioSlice(...args),
      ...createPaletteSlice(...args),
    }),
    persistOptions,
  ),
);

export type { SimulationStatus } from './constants';
export type {
  PersistedStoreState,
  PersistedTab,
  Snapshot,
  StoreState,
  Tab,
} from './types';
