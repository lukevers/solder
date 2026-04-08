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
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">Waveform</span>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-200 transition-colors text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <WaveformDisplay inputBuffer={inputBuffer} outputBuffer={outputBuffer} height={220} />
      </div>
    </div>
  );
}
