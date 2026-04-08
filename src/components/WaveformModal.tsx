// src/components/WaveformModal.tsx
import { useEffect } from 'react';
import { WaveformDisplay } from './WaveformDisplay';

type Props = {
  inputBuffer: Float32Array | null;
  outputBuffer: Float32Array | null;
  onClose: () => void;
};

export function WaveformModal({ inputBuffer, outputBuffer, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-lg p-5 shadow-2xl"
        style={{ width: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Waveform</span>
            <div className="relative group">
              <div className="w-4 h-4 rounded-full border border-gray-600 text-gray-500 flex items-center justify-center text-xs cursor-help leading-none select-none">
                i
              </div>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 w-64 bg-gray-800 border border-gray-600 rounded p-3 text-xs text-gray-300 font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-xl">
                <p className="mb-2"><span className="text-gray-400 font-mono">Y axis</span> — normalized amplitude, from -1.0 (full negative) to +1.0 (full positive). In digital audio, ±1.0 is the maximum level before clipping.</p>
                <p><span className="text-gray-400 font-mono">X axis</span> — time in milliseconds (ms) or seconds (s).</p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <WaveformDisplay inputBuffer={inputBuffer} outputBuffer={outputBuffer} height={220} showTicks />
      </div>
    </div>
  );
}
