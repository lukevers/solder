import { PALETTE_BY_ID, RECENTLY_USED_LIMIT } from '../lib/palette';
import type { StoreSlice, StoreState } from './types';

type PaletteSlice = Pick<StoreState, 'recordPaletteUse'>;

/**
 * Tracks which palette items the user has placed most recently so the
 * command bar can surface them at the top of its picker, in the same
 * spirit as KiCad's "recently used symbols" section.
 *
 * The list is bounded by RECENTLY_USED_LIMIT, deduped on insertion,
 * and silently drops ids that no longer match any catalog entry so
 * stale persisted values do not leak into the UI after a palette
 * refactor.
 */
export const createPaletteSlice: StoreSlice<PaletteSlice> = (set) => ({
  recordPaletteUse: (id) =>
    set((state) => {
      if (!PALETTE_BY_ID[id]) {
        return {};
      }

      const filtered = state.recentPaletteIds.filter(
        (existing) => existing !== id && PALETTE_BY_ID[existing] !== undefined,
      );

      return {
        recentPaletteIds: [id, ...filtered].slice(0, RECENTLY_USED_LIMIT),
      };
    }),
});
