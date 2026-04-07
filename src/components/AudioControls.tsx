// src/components/AudioControls.tsx
import { useStore } from '../store'
import { useShallow } from 'zustand/react/shallow'

const SAMPLES = ['guitar', 'bass']

export function AudioControls() {
  const { audioSource, volume, playing, setAudioSource, setVolume, setPlaying } = useStore(useShallow((s) => ({
    audioSource:    s.audioSource,
    volume:         s.volume,
    playing:        s.playing,
    setAudioSource: s.setAudioSource,
    setVolume:      s.setVolume,
    setPlaying:     s.setPlaying,
  })))

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Audio Source</div>
      <div className="flex flex-col gap-1.5 mb-3">
        {SAMPLES.map((name) => (
          <label key={name} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="audio-source"
              checked={audioSource.type === 'sample' && audioSource.name === name}
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

      <div className="mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-green-500"
        />
      </div>

      <button
        onClick={() => setPlaying(!playing)}
        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs py-1.5 rounded font-mono transition-colors"
      >
        {playing ? '⏹ Stop' : '▶ Play'}
      </button>
    </div>
  )
}
