import type { StoreSlice, StoreState } from './types';

type AudioSlice = Pick<
  StoreState,
  'setAudioSource' | 'setVolume' | 'setPlaying'
>;

/**
 * Audio playback controls shared across the editor shell.
 *
 * This slice is intentionally small because the heavy lifting lives
 * in `AudioPipeline`; the store only keeps the selected source and
 * playback flags that multiple UI surfaces need to observe.
 */
export const createAudioSlice: StoreSlice<AudioSlice> = (set) => ({
  setAudioSource: (audioSource) => set({ audioSource }),
  setVolume: (volume) => set({ volume }),
  setPlaying: (playing) => set({ playing }),
});
