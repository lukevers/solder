import { DEFAULT_BUNDLED_SAMPLE_NAME } from '../lib/constants';
import { AUDIO_SOURCE_TYPE } from '../lib/simulation-types';
import type { StoreSlice, StoreState } from './types';

type AudioSlice = Pick<
  StoreState,
  | 'setAudioSource'
  | 'setLocalSamples'
  | 'addLocalSample'
  | 'removeLocalSample'
  | 'setVolume'
  | 'setPlaying'
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
  setLocalSamples: (localSamples) => set({ localSamples }),
  addLocalSample: (sample) =>
    set((state) => ({
      localSamples: [...state.localSamples, sample],
    })),
  removeLocalSample: (id) =>
    set((state) => ({
      localSamples: state.localSamples.filter((sample) => sample.id !== id),
      audioSource:
        state.audioSource.type === AUDIO_SOURCE_TYPE.localSample &&
        state.audioSource.id === id
          ? {
              type: AUDIO_SOURCE_TYPE.sample,
              name: DEFAULT_BUNDLED_SAMPLE_NAME,
            }
          : state.audioSource,
    })),
  setVolume: (volume) => set({ volume }),
  setPlaying: (playing) => set({ playing }),
});
