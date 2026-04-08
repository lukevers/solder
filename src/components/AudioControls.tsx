// src/components/AudioControls.tsx

import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';

const SAMPLES = ['guitar', 'bass'];

export function AudioControls() {
  const { audioSource, setAudioSource } = useStore(
    useShallow((s) => ({
      audioSource: s.audioSource,
      setAudioSource: s.setAudioSource,
    })),
  );

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
        Audio Source
      </div>
      <div className="flex flex-col gap-1.5">
        {SAMPLES.map((name) => (
          <label
            key={name}
            className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer"
          >
            <input
              type="radio"
              name="audio-source"
              checked={
                audioSource.type === 'sample' && audioSource.name === name
              }
              onChange={() => setAudioSource({ type: 'sample', name })}
              className="accent-blue-500"
            />
            Sample: {name}
          </label>
        ))}
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input
            type="radio"
            name="audio-source"
            checked={audioSource.type === 'live'}
            onChange={() => setAudioSource({ type: 'live' })}
            className="accent-blue-500"
          />
          🎙 Live input
        </label>
      </div>
    </div>
  );
}
