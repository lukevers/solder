import { clearSim } from './defaults';
import { appendHistorySnapshot } from './helpers';
import type { StoreSlice, StoreState } from './types';

type HistorySlice = Pick<StoreState, 'pushHistory' | 'undo' | 'redo'>;

/**
 * Undo and redo actions for the active workspace.
 *
 * History is scoped to the selected tab's live workspace copy. Any
 * restore operation also drops derived simulation output because the
 * restored topology may no longer match the old analysis results.
 */
export const createHistorySlice: StoreSlice<HistorySlice> = (set, get) => ({
  pushHistory: () => set((state) => appendHistorySnapshot(state)),

  undo: () => {
    const { past, nodes, edges, future } = get();
    if (past.length === 0) {
      return;
    }

    const previousSnapshot = past[past.length - 1];

    set({
      past: past.slice(0, -1),
      future: [{ nodes, edges }, ...future],
      nodes: previousSnapshot.nodes,
      edges: previousSnapshot.edges,
      selectedNodeId: null,
      ...clearSim,
    });
  },

  redo: () => {
    const { past, nodes, edges, future } = get();
    if (future.length === 0) {
      return;
    }

    const nextSnapshot = future[0];

    set({
      past: [...past, { nodes, edges }],
      future: future.slice(1),
      nodes: nextSnapshot.nodes,
      edges: nextSnapshot.edges,
      selectedNodeId: null,
      ...clearSim,
    });
  },
});
