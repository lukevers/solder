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
      <div className="mb-2 text-gray-500 text-xs uppercase tracking-wider">
        Audio Source
      </div>
      <div className="flex flex-col gap-1.5">
        {SAMPLES.map((name) => (
          <label
            key={name}
            className="flex cursor-pointer items-center gap-2 text-gray-300 text-xs"
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
      </div>
    </div>
  );
}
