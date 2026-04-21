import { Pause, Play, Repeat, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AudioPipeline } from '../lib/audio/pipeline';
import { SAMPLE_RATE } from '../lib/constants';
import {
  WaveformDisplay,
  type WaveformDisplayHandle,
  type WaveformSelection,
} from './WaveformDisplay';

function formatTime(seconds: number): string {
  if (seconds >= 1) {
    return `${seconds.toFixed(1)}s`;
  }
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

  const [activeSignal, setActiveSignal] = useState<'input' | 'output'>(
    outputBuffer ? 'output' : 'input',
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
    if (!outputBuffer) {
      setActiveSignal('input');
    }
  }, [outputBuffer]);

  const playFromRef = useRef<
    (signal: 'input' | 'output', fraction: number) => void
  >(() => {});

  const playFrom = useCallback(
    (signal: 'input' | 'output', fraction: number) => {
      let buffer = signal === 'input' ? inputBuffer : outputBuffer;
      if (!buffer) {
        buffer = signal === 'input' ? outputBuffer : inputBuffer;
      }
      if (!buffer || !pipeline) {
        return;
      }

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
    if (isPlayingRef.current) {
      handleStop();
    } else {
      handlePlay();
    }
  }, [handlePlay, handleStop]);

  const handlePlayPauseRef = useRef(handlePlayPause);
  handlePlayPauseRef.current = handlePlayPause;

  const handleSignalChange = useCallback(
    (signal: 'input' | 'output') => {
      if (signal === activeSignalRef.current) {
        return;
      }
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
    if (!isPlaying || !pipeline) {
      return;
    }
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
      if (e.key === 'Escape') {
        onClose();
      }
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
        className="rounded-lg border border-gray-700 bg-gray-900 p-5 shadow-2xl"
        style={{ width: 680 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-gray-400 text-xs uppercase tracking-wider">
              Waveform
            </span>
            <div className="group relative">
              <div className="flex h-4 w-4 cursor-help select-none items-center justify-center rounded-full border border-gray-600 text-gray-500 text-xs leading-none">
                i
              </div>
              <div className="pointer-events-none absolute top-6 left-1/2 z-10 w-64 -translate-x-1/2 rounded border border-gray-600 bg-gray-800 p-3 font-sans text-gray-300 text-xs opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                <p className="mb-2">
                  <span className="font-mono text-gray-400">Y axis</span> —
                  normalized amplitude, from -1.0 (full negative) to +1.0 (full
                  positive). In digital audio, ±1.0 is the maximum level before
                  clipping.
                </p>
                <p className="mb-2">
                  <span className="font-mono text-gray-400">X axis</span> — time
                  in milliseconds (ms) or seconds (s).
                </p>
                <p>
                  <span className="font-mono text-gray-400">Click</span> to
                  seek. <span className="font-mono text-gray-400">Drag</span> to
                  select a region for simulation.
                </p>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 leading-none transition-colors hover:text-gray-200"
            aria-label="Close"
          >
            <X size={16} />
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
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePlayPause}
                className="flex h-8 w-8 items-center justify-center rounded border border-gray-600 text-gray-300 transition-colors hover:border-gray-400 hover:text-white"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>

              <button
                type="button"
                onClick={onToggleLoop}
                className={`flex h-8 w-8 items-center justify-center rounded border transition-colors ${
                  looping
                    ? 'border-blue-500 text-blue-400'
                    : 'border-gray-600 text-gray-500 hover:border-gray-400 hover:text-gray-300'
                }`}
                aria-label={looping ? 'Disable loop' : 'Enable loop'}
              >
                <Repeat size={14} />
              </button>

              {selection && totalDuration > 0 && (
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="text-blue-400">
                    {formatTime(selection.start * totalDuration)} —{' '}
                    {formatTime(selection.end * totalDuration)}
                  </span>
                  {onSelectionChange && (
                    <button
                      type="button"
                      onClick={() => onSelectionChange(null)}
                      className="text-gray-500 leading-none transition-colors hover:text-gray-300"
                      aria-label="Clear selection"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              )}
            </div>

            {hasBoth && (
              <div className="flex items-center gap-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleSignalChange('input')}
                  className="rounded border px-2 py-0.5 transition-colors"
                  style={{
                    color: '#3b82f6',
                    borderColor:
                      activeSignal === 'input' ? '#3b82f6' : '#374151',
                    background:
                      activeSignal === 'input'
                        ? 'rgba(59,130,246,0.15)'
                        : 'transparent',
                  }}
                >
                  input
                </button>
                <button
                  type="button"
                  onClick={() => handleSignalChange('output')}
                  className="rounded border px-2 py-0.5 transition-colors"
                  style={{
                    color: '#22c55e',
                    borderColor:
                      activeSignal === 'output' ? '#22c55e' : '#374151',
                    background:
                      activeSignal === 'output'
                        ? 'rgba(34,197,94,0.15)'
                        : 'transparent',
                  }}
                >
                  output
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
