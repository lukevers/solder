import { Music2, Trash2, Upload } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import { useAudioActions, useAudioState } from '../store/hooks';

/**
 * Built-in bundled samples shipped with the app.
 *
 * These names map directly to `/public/samples/*.wav`
 * and are loaded on demand through `AudioPipeline`.
 */
const SAMPLES = ['guitar', 'bass'];

type AudioControlsProps = {
  onUploadLocalSample: (file: File) => void;
  onRemoveLocalSample: (id: string) => void;
};

export function AudioControls({
  onUploadLocalSample,
  onRemoveLocalSample,
}: AudioControlsProps) {
  const { audioSource, localSamples } = useAudioState();
  const { setAudioSource } = useAudioActions();
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Forward the selected WAV file to the app-level
   * upload handler, then clear the input value so
   * picking the same file again still emits a
   * change event.
   */
  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) {
      return;
    }

    onUploadLocalSample(file);
  }

  return (
    <div className="p-3">
      <div className="mb-2 text-gray-500 text-xs uppercase tracking-wider">
        WAV Samples
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

      <div className="mt-4 mb-2 flex items-center justify-between">
        <div className="text-gray-500 text-xs uppercase tracking-wider">
          WAV Files
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 rounded border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-[10px] text-gray-300 uppercase tracking-wider transition-colors hover:bg-gray-700"
        >
          <Upload size={10} />
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".wav,audio/wav,audio/wave"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {localSamples.length === 0 ? (
        <div className="rounded border border-gray-800 border-dashed px-3 py-2 text-gray-500 text-xs">
          Upload a WAV file to simulate your own sample. Local uploads last for
          the current browser session.
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {localSamples.map((sample) => (
            <div
              key={sample.id}
              className="flex items-center gap-2 rounded border border-gray-800 bg-gray-900/60 px-2 py-1.5"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-gray-300 text-xs">
                <input
                  type="radio"
                  name="audio-source"
                  checked={
                    audioSource.type === 'local-sample' &&
                    audioSource.id === sample.id
                  }
                  onChange={() =>
                    setAudioSource({
                      type: 'local-sample',
                      id: sample.id,
                      name: sample.name,
                    })
                  }
                  className="accent-blue-500"
                />
                <Music2 size={12} className="flex-shrink-0 text-gray-500" />
                <span className="truncate">{sample.name}</span>
              </label>
              <button
                type="button"
                onClick={() => onRemoveLocalSample(sample.id)}
                className="text-gray-500 transition-colors hover:text-red-300"
                aria-label={`Remove ${sample.name}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
