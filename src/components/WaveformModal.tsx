// src/components/WaveformModal.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioPipeline } from '../audio/pipeline';
import {
  WaveformDisplay,
  type WaveformDisplayHandle,
  type WaveformSelection,
} from './WaveformDisplay';

const SAMPLE_RATE = 44100;

function formatTime(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(1)}s`;
  return `${Math.round(seconds * 1000)}ms`;
}

type Props = {
  inputBuffer: Float32Array | null;
  outputBuffer: Float32Array | null;
  pipeline: AudioPipeline | null;
  selection: WaveformSelection | null;
  onSelectionChange?: (selection: WaveformSelection | null) => void;
  looping: boolean;
  onToggleLoop: () => void;
  onClose: () => void;
};

export function WaveformModal({
  inputBuffer,
  outputBuffer,
  pipeline,
  selection,
  onSelectionChange,
  looping,
  onToggleLoop,
  onClose,
}: Props) {
  const displayRef = useRef<WaveformDisplayHandle>(null);
  const cursorRef = useRef<number | null>(null);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;
  const playbackSelectionRef = useRef<WaveformSelection | null>(null);

  const [activeSignal, setActiveSignal] = useState<'dry' | 'wet'>(
    outputBuffer ? 'wet' : 'dry',
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  const loopingRef = useRef(looping);
  const activeSignalRef = useRef(activeSignal);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);
  useEffect(() => {
    loopingRef.current = looping;
  }, [looping]);
  useEffect(() => {
    activeSignalRef.current = activeSignal;
  }, [activeSignal]);
  useEffect(() => {
    if (!outputBuffer) setActiveSignal('dry');
  }, [outputBuffer]);

  const playFromRef = useRef<(signal: 'dry' | 'wet', fraction: number) => void>(
    () => {},
  );

  const playFrom = useCallback(
    (signal: 'dry' | 'wet', fraction: number) => {
      let buffer = signal === 'dry' ? inputBuffer : outputBuffer;
      if (!buffer) buffer = signal === 'dry' ? outputBuffer : inputBuffer;
      if (!buffer || !pipeline) return;

      const sel = selectionRef.current;
      const totalDuration = buffer.length / SAMPLE_RATE;

      const onEnded = () => {
        if (loopingRef.current) {
          // Restart from selection start or buffer start
          const restartFrac = sel ? sel.start : 0;
          cursorRef.current = restartFrac;
          playFromRef.current(activeSignalRef.current, restartFrac);
        } else {
          setIsPlaying(false);
        }
      };

      if (sel) {
        let startFrac = fraction;
        if (startFrac < sel.start || startFrac >= sel.end) {
          startFrac = sel.start;
        }
        cursorRef.current = startFrac;
        const startSample = Math.floor(sel.start * buffer.length);
        const endSample = Math.floor(sel.end * buffer.length);
        const sliced = new Float32Array(
          buffer.subarray(startSample, endSample),
        );
        const offsetInSlice = (startFrac - sel.start) * totalDuration;
        pipeline.playBufferFrom(sliced, offsetInSlice, onEnded);
        playbackSelectionRef.current = sel;
      } else {
        pipeline.playBufferFrom(buffer, fraction * totalDuration, onEnded);
        playbackSelectionRef.current = null;
      }
      setIsPlaying(true);
    },
    [pipeline, inputBuffer, outputBuffer],
  );
  playFromRef.current = playFrom;

  const handlePlay = useCallback(() => {
    playFrom(activeSignalRef.current, cursorRef.current ?? 0);
  }, [playFrom]);

  const handleStop = useCallback(() => {
    if (pipeline) {
      const rawFrac = pipeline.getPlaybackFraction();
      if (rawFrac != null) {
        const sel = playbackSelectionRef.current;
        cursorRef.current = sel
          ? sel.start + rawFrac * (sel.end - sel.start)
          : rawFrac;
      }
    }
    pipeline?.stopPlayback();
    setIsPlaying(false);
    displayRef.current?.drawWithCursor(cursorRef.current);
  }, [pipeline]);

  const handlePlayPause = useCallback(() => {
    if (isPlayingRef.current) handleStop();
    else handlePlay();
  }, [handlePlay, handleStop]);

  const handlePlayPauseRef = useRef(handlePlayPause);
  handlePlayPauseRef.current = handlePlayPause;

  const handleSignalChange = useCallback(
    (signal: 'dry' | 'wet') => {
      if (signal === activeSignalRef.current) return;
      setActiveSignal(signal);
      activeSignalRef.current = signal;
      if (isPlayingRef.current && pipeline) {
        const rawFrac = pipeline.getPlaybackFraction() ?? 0;
        const sel = playbackSelectionRef.current;
        const frac = sel
          ? sel.start + rawFrac * (sel.end - sel.start)
          : rawFrac;
        cursorRef.current = frac;
        playFrom(signal, frac);
      }
    },
    [pipeline, playFrom],
  );

  // Seek: visual update during drag, pause audio
  const handleSeek = useCallback(
    (fraction: number) => {
      cursorRef.current = fraction;
      if (isPlayingRef.current) {
        pipeline?.stopPlayback();
      }
    },
    [pipeline],
  );

  // Seek commit: restart playback on pointer-up (click, not drag)
  const handleSeekEnd = useCallback(
    (fraction: number) => {
      cursorRef.current = fraction;
      displayRef.current?.drawWithCursor(fraction);
      if (isPlayingRef.current) {
        playFrom(activeSignalRef.current, fraction);
      }
    },
    [playFrom],
  );

  // RAF loop for animated cursor during playback
  useEffect(() => {
    if (!isPlaying || !pipeline) return;
    let raf: number;
    function tick() {
      const rawFrac = pipeline!.getPlaybackFraction();
      if (rawFrac != null) {
        const sel = playbackSelectionRef.current;
        const mappedFrac = sel
          ? sel.start + rawFrac * (sel.end - sel.start)
          : rawFrac;
        cursorRef.current = mappedFrac;
        displayRef.current?.drawWithCursor(mappedFrac);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying, pipeline]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        handlePlayPauseRef.current();
      }
      if (
        (e.key === 'Backspace' || e.key === 'Delete') &&
        selectionRef.current &&
        onSelectionChange
      ) {
        e.preventDefault();
        onSelectionChange(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onSelectionChange]);

  // Stop modal playback on unmount
  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup-only effect
  useEffect(() => {
    return () => {
      pipeline?.stopPlayback();
    };
  }, []);

  const hasBoth = inputBuffer && outputBuffer;
  const hasAny = inputBuffer || outputBuffer;

  const totalSamples = Math.max(
    inputBuffer?.length ?? 0,
    outputBuffer?.length ?? 0,
  );
  const totalDuration = totalSamples / SAMPLE_RATE;

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
            <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">
              Waveform
            </span>
            <div className="relative group">
              <div className="w-4 h-4 rounded-full border border-gray-600 text-gray-500 flex items-center justify-center text-xs cursor-help leading-none select-none">
                i
              </div>
              <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-6 w-64 bg-gray-800 border border-gray-600 rounded p-3 text-xs text-gray-300 font-sans opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10 shadow-xl">
                <p className="mb-2">
                  <span className="text-gray-400 font-mono">Y axis</span> —
                  normalized amplitude, from -1.0 (full negative) to +1.0 (full
                  positive). In digital audio, ±1.0 is the maximum level before
                  clipping.
                </p>
                <p className="mb-2">
                  <span className="text-gray-400 font-mono">X axis</span> — time
                  in milliseconds (ms) or seconds (s).
                </p>
                <p>
                  <span className="text-gray-400 font-mono">Click</span> to
                  seek. <span className="text-gray-400 font-mono">Drag</span> to
                  select a region for simulation.
                </p>
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

        <WaveformDisplay
          ref={displayRef}
          inputBuffer={inputBuffer}
          outputBuffer={outputBuffer}
          height={220}
          showTicks
          onSeek={handleSeek}
          onSeekEnd={handleSeekEnd}
          highlightSignal={activeSignal}
          selection={selection}
          onSelectionChange={onSelectionChange}
        />

        {hasAny && (
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                className="w-8 h-8 flex items-center justify-center rounded border border-gray-600 text-gray-300 hover:text-white hover:border-gray-400 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <svg
                    width="12"
                    height="14"
                    viewBox="0 0 12 14"
                    fill="currentColor"
                  >
                    <rect x="0" y="0" width="4" height="14" rx="1" />
                    <rect x="8" y="0" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  <svg
                    width="12"
                    height="14"
                    viewBox="0 0 12 14"
                    fill="currentColor"
                  >
                    <path d="M0 0v14l12-7z" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={onToggleLoop}
                className={`w-8 h-8 flex items-center justify-center rounded border transition-colors ${
                  looping
                    ? 'border-blue-500 text-blue-400'
                    : 'border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400'
                }`}
                aria-label={looping ? 'Disable loop' : 'Enable loop'}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 1l2 2-2 2" />
                  <path d="M4 3h8" />
                  <path d="M4 11l-2-2 2-2" />
                  <path d="M10 11H2" />
                </svg>
              </button>

              {selection && totalDuration > 0 && (
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className="text-blue-400">
                    {formatTime(selection.start * totalDuration)} —{' '}
                    {formatTime(selection.end * totalDuration)}
                  </span>
                  {onSelectionChange && (
                    <button
                      type="button"
                      onClick={() => onSelectionChange(null)}
                      className="text-gray-500 hover:text-gray-300 transition-colors leading-none"
                      aria-label="Clear selection"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasBoth && (
              <div className="flex items-center gap-1 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => handleSignalChange('dry')}
                  className="px-2 py-0.5 rounded border transition-colors"
                  style={{
                    color: '#f472b6',
                    borderColor: activeSignal === 'dry' ? '#f472b6' : '#374151',
                    background:
                      activeSignal === 'dry'
                        ? 'rgba(244,114,182,0.15)'
                        : 'transparent',
                  }}
                >
                  dry
                </button>
                <button
                  type="button"
                  onClick={() => handleSignalChange('wet')}
                  className="px-2 py-0.5 rounded border transition-colors"
                  style={{
                    color: '#22c55e',
                    borderColor: activeSignal === 'wet' ? '#22c55e' : '#374151',
                    background:
                      activeSignal === 'wet'
                        ? 'rgba(34,197,94,0.15)'
                        : 'transparent',
                  }}
                >
                  wet
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
