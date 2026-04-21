import { Hourglass, Play, Square, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { SAMPLE_RATE } from '../lib/constants';
import type { SweepResult } from '../lib/simulation-types';

const SWEEP_COLORS = [
  '#ef4444', // 0%   red
  '#f59e0b', // 25%  amber
  '#22c55e', // 50%  green
  '#3b82f6', // 75%  blue
  '#a855f7', // 100% purple
];

type Props = {
  results: Array<SweepResult>;
  status: 'idle' | 'running' | 'done';
  playingIndex: number | null;
  onPlay: (index: number) => void;
  onStop: () => void;
  onClear: () => void;
};

function SweepWaveformCanvas({
  results,
  playingIndex,
}: {
  results: Array<SweepResult>;
  playingIndex: number | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || results.length === 0) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const dpr = window.devicePixelRatio ?? 1;
    const w = canvas.getBoundingClientRect().width || canvas.offsetWidth;
    const h = 80;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const midY = h / 2;

    for (let i = 0; i < results.length; i++) {
      const buf = results[i].outputBuffer;
      const color = SWEEP_COLORS[i % SWEEP_COLORS.length];
      const dimmed = playingIndex != null && playingIndex !== i;

      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.globalAlpha = dimmed ? 0.2 : 1;

      for (let s = 0; s < buf.length; s++) {
        const x = (s / buf.length) * w;
        const y = midY - (buf[s] * h) / 2.5;
        if (s === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }, [results, playingIndex]);

  return (
    <canvas
      ref={canvasRef}
      width={176}
      height={80}
      className="w-full rounded border border-gray-800"
    />
  );
}

export function SweepResults({
  results,
  status,
  playingIndex,
  onPlay,
  onStop,
  onClear,
}: Props) {
  const duration =
    results.length > 0
      ? (results[0].outputBuffer.length / SAMPLE_RATE).toFixed(1)
      : null;

  return (
    <div className="p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-gray-500 text-xs uppercase tracking-wider">
          Pot Sweep
          {status === 'running' && (
            <span className="ml-1 text-amber-400">({results.length}/5)</span>
          )}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-gray-500 transition-colors hover:text-gray-200"
          aria-label="Close sweep results"
        >
          <X size={13} />
        </button>
      </div>

      {status === 'running' && results.length === 0 ? (
        <div className="flex h-20 items-center justify-center gap-2 rounded border border-gray-800 bg-gray-950 font-mono text-amber-400 text-xs">
          <Hourglass size={12} /> Simulating 5 variants…
        </div>
      ) : (
        <SweepWaveformCanvas results={results} playingIndex={playingIndex} />
      )}

      {results.length > 0 && (
        <div className="mt-2 flex flex-col gap-1">
          {results.map((r, i) => {
            const color = SWEEP_COLORS[i % SWEEP_COLORS.length];
            const pct = Math.round(r.position * 100);
            const isPlaying = playingIndex === i;

            return (
              <button
                key={r.position}
                type="button"
                onClick={() => (isPlaying ? onStop() : onPlay(i))}
                className={`flex items-center gap-2 rounded border px-2 py-1 font-mono text-xs transition-colors ${
                  isPlaying
                    ? 'border-gray-600 bg-gray-800'
                    : 'border-gray-800 bg-gray-950 hover:border-gray-600'
                }`}
              >
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-300">{pct}%</span>
                <span className="flex-1" />
                {isPlaying ? (
                  <Square size={10} className="text-red-400" />
                ) : (
                  <Play size={10} className="text-gray-500" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {duration && (
        <div className="mt-1 text-center font-mono text-gray-600 text-xs">
          {duration}s each
        </div>
      )}
    </div>
  );
}
