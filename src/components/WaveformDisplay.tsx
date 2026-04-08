// src/components/WaveformDisplay.tsx
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

const SAMPLE_RATE = 44100;

export type WaveformSelection = { start: number; end: number };

type Props = {
  inputBuffer: Float32Array | null;
  outputBuffer: Float32Array | null;
  height?: number;
  showTicks?: boolean;
  /** When provided, enables overlaid mode with click-to-seek / drag-to-select. */
  onSeek?: (fraction: number) => void;
  /** Fires on pointer-up after a seek (click, not drag). */
  onSeekEnd?: (fraction: number) => void;
  /** Which signal to visually emphasise in overlaid mode. */
  highlightSignal?: 'input' | 'output';
  /** Current selection range (fractions 0–1). */
  selection?: WaveformSelection | null;
  /** Called when the user drags to create or update a selection. */
  onSelectionChange?: (selection: WaveformSelection | null) => void;
};

export type WaveformDisplayHandle = {
  drawWithCursor: (cursor: number | null) => void;
};

const SELECT_THRESHOLD = 0.01;

export const WaveformDisplay = forwardRef<WaveformDisplayHandle, Props>(
  function WaveformDisplay(
    {
      inputBuffer,
      outputBuffer,
      height = 80,
      showTicks = false,
      onSeek,
      onSeekEnd,
      highlightSignal,
      selection,
      onSelectionChange,
    },
    ref,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const splitRef = useRef(0.5);
    const draggingRef = useRef(false);
    const seekingRef = useRef(false);
    const isSelectingRef = useRef(false);
    const seekStartRef = useRef(0);
    const cursorRef = useRef<number | null>(null);
    const highlightRef = useRef(highlightSignal);
    highlightRef.current = highlightSignal;
    const selectionRef = useRef(selection);
    selectionRef.current = selection;

    const padL = showTicks ? 30 : 0;
    const padB = showTicks ? 16 : 0;

    function draw(split: number, cursor?: number | null) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio ?? 1;
      const layoutWidth =
        canvas.getBoundingClientRect().width || canvas.offsetWidth;
      const w = layoutWidth;
      const h = height;
      canvas.width = layoutWidth * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#0d1117';
      ctx.fillRect(0, 0, w, h);

      const plotW = w - padL;
      const plotH = h - padB;
      const plotMidY = plotH / 2;
      const splitX = padL + plotW * split;

      // Grid lines (X and Y axes)
      if (showTicks) {
        const totalSamples = Math.max(
          inputBuffer?.length ?? 0,
          outputBuffer?.length ?? 0,
        );
        const duration = totalSamples / SAMPLE_RATE;
        ctx.lineWidth = 1;
        ctx.font = '9px monospace';

        const ampLevels = [1.0, 0.5, 0, -0.5, -1.0];
        for (const amp of ampLevels) {
          const y = plotMidY - (amp * plotH) / 2.5;
          ctx.strokeStyle = amp === 0 ? '#374151' : '#1f2937';
          ctx.beginPath();
          ctx.moveTo(padL, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          ctx.fillStyle = '#4b5563';
          ctx.textAlign = 'right';
          const label = amp === 0 ? '0' : amp > 0 ? `+${amp}` : `${amp}`;
          ctx.fillText(label, padL - 4, y + 3);
        }

        const candidates = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10];
        const interval =
          candidates.find((c) => duration / c <= 10 && duration / c >= 3) ??
          candidates[candidates.length - 1];
        const tickCount = Math.floor(duration / interval);
        ctx.fillStyle = '#4b5563';
        ctx.textAlign = 'center';
        for (let i = 1; i <= tickCount; i++) {
          const t = i * interval;
          const x = padL + (t / duration) * plotW;
          ctx.strokeStyle = '#1f2937';
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, plotH);
          ctx.stroke();
          const label =
            t >= 1 ? `${t.toFixed(0)}s` : `${(t * 1000).toFixed(0)}ms`;
          ctx.fillText(label, x, h - 3);
        }
      }

      function drawBuffer(buf: Float32Array, color: string) {
        if (!ctx) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        for (let i = 0; i < buf.length; i++) {
          const x = padL + (i / buf.length) * plotW;
          const y = plotMidY - (buf[i] * plotH) / 2.5;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      if (onSeek) {
        // Overlaid mode — draw both waveforms without clipping
        const hl = highlightRef.current;
        const hasBoth = inputBuffer && outputBuffer;
        const pairs: Array<[Float32Array | null, string, boolean]> =
          hl === 'input'
            ? [
                [outputBuffer, '#22c55e', !!hasBoth],
                [inputBuffer, '#3b82f6', false],
              ]
            : [
                [inputBuffer, '#3b82f6', !!hasBoth],
                [outputBuffer, '#22c55e', false],
              ];
        for (const [buf, color, dimmed] of pairs) {
          if (!buf) continue;
          if (dimmed) ctx.globalAlpha = 0.3;
          drawBuffer(buf, color);
          if (dimmed) ctx.globalAlpha = 1;
        }
      } else {
        // Split mode with clip regions
        const bothBuffers = inputBuffer && outputBuffer;

        if (outputBuffer) {
          if (bothBuffers) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(padL, 0, splitX - padL, plotH);
            ctx.clip();
          }
          drawBuffer(outputBuffer, '#22c55e');
          if (bothBuffers) ctx.restore();
        }

        if (inputBuffer) {
          if (bothBuffers) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(splitX, 0, w - splitX, plotH);
            ctx.clip();
          }
          drawBuffer(inputBuffer, '#3b82f6');
          if (bothBuffers) ctx.restore();
        }

        if (bothBuffers) {
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, plotH);
          ctx.stroke();

          const cy = plotH / 2;
          ctx.fillStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.arc(splitX, cy, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#374151';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // Draw selection overlay
      const sel = selectionRef.current;
      if (sel && Math.abs(sel.end - sel.start) > 0.001) {
        const x1 = padL + Math.min(sel.start, sel.end) * plotW;
        const x2 = padL + Math.max(sel.start, sel.end) * plotW;

        // Dim areas outside selection
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(padL, 0, x1 - padL, plotH);
        ctx.fillRect(x2, 0, w - x2, plotH);

        // Subtle tint inside selection
        ctx.fillStyle = 'rgba(96, 165, 250, 0.08)';
        ctx.fillRect(x1, 0, x2 - x1, plotH);

        // Selection edge lines
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.lineTo(x1, plotH);
        ctx.moveTo(x2, 0);
        ctx.lineTo(x2, plotH);
        ctx.stroke();
      }

      // Draw playback cursor
      const c = cursor ?? cursorRef.current;
      if (c != null && c >= 0 && c <= 1) {
        const cx = padL + c * plotW;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, plotH);
        ctx.stroke();
      }
    }

    useImperativeHandle(ref, () => ({
      drawWithCursor(cursor: number | null) {
        cursorRef.current = cursor;
        draw(splitRef.current, cursor);
      },
    }));

    // biome-ignore lint/correctness/useExhaustiveDependencies: draw uses refs for mutable state
    useEffect(() => {
      draw(splitRef.current, cursorRef.current);
    }, [
      inputBuffer,
      outputBuffer,
      height,
      showTicks,
      highlightSignal,
      selection,
    ]);

    function getFraction(e: React.PointerEvent<HTMLCanvasElement>): number {
      const canvas = canvasRef.current;
      if (!canvas) return 0.5;
      const rect = canvas.getBoundingClientRect();
      const plotW = rect.width - padL;
      const x = e.clientX - rect.left - padL;
      return Math.max(0, Math.min(1, x / plotW));
    }

    function setGrabbing(el: HTMLCanvasElement, active: boolean) {
      el.style.cursor = active ? 'grabbing' : '';
    }

    function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      const el = e.target as HTMLCanvasElement;
      if (onSeek) {
        seekingRef.current = true;
        isSelectingRef.current = false;
        el.setPointerCapture(e.pointerId);
        setGrabbing(el, true);
        const frac = getFraction(e);
        seekStartRef.current = frac;
        cursorRef.current = frac;
        onSeek(frac);
        draw(splitRef.current, frac);
        return;
      }
      if (!inputBuffer && !outputBuffer) return;
      draggingRef.current = true;
      isSelectingRef.current = false;
      const frac = getFraction(e);
      seekStartRef.current = frac;
      el.setPointerCapture(e.pointerId);
      setGrabbing(el, true);
      if (inputBuffer && outputBuffer) {
        splitRef.current = frac;
      }
      draw(splitRef.current);
    }

    function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (onSeek && seekingRef.current) {
        const frac = getFraction(e);
        const dist = Math.abs(frac - seekStartRef.current);

        if (
          onSelectionChange &&
          (dist > SELECT_THRESHOLD || isSelectingRef.current)
        ) {
          // Drag → selection mode (only when selection editing is enabled)
          isSelectingRef.current = true;
          const start = Math.min(seekStartRef.current, frac);
          const end = Math.max(seekStartRef.current, frac);
          selectionRef.current = { start, end };
          onSelectionChange({ start, end });
          draw(splitRef.current, cursorRef.current);
        } else if (!isSelectingRef.current) {
          // Seek (cursor follows pointer)
          cursorRef.current = frac;
          onSeek(frac);
          draw(splitRef.current, frac);
        }
        return;
      }
      if (!draggingRef.current) return;
      const frac = getFraction(e);
      const dist = Math.abs(frac - seekStartRef.current);

      if (
        (dist > SELECT_THRESHOLD || isSelectingRef.current) &&
        onSelectionChange
      ) {
        isSelectingRef.current = true;
        const start = Math.min(seekStartRef.current, frac);
        const end = Math.max(seekStartRef.current, frac);
        selectionRef.current = { start, end };
        onSelectionChange({ start, end });
        draw(splitRef.current);
      } else if (!isSelectingRef.current && inputBuffer && outputBuffer) {
        splitRef.current = frac;
        draw(splitRef.current);
      }
    }

    function onPointerUp(e: React.PointerEvent<HTMLCanvasElement>) {
      setGrabbing(e.target as HTMLCanvasElement, false);
      if (onSeek && seekingRef.current) {
        seekingRef.current = false;
        const frac = getFraction(e);

        if (isSelectingRef.current && onSelectionChange) {
          // Commit selection
          isSelectingRef.current = false;
          const start = Math.min(seekStartRef.current, frac);
          const end = Math.max(seekStartRef.current, frac);
          selectionRef.current = { start, end };
          onSelectionChange({ start, end });
          draw(splitRef.current, cursorRef.current);
        } else {
          // Click or drag-seek → commit seek position
          isSelectingRef.current = false;
          cursorRef.current = frac;
          onSeekEnd?.(frac);
          draw(splitRef.current, frac);
        }
        return;
      }
      if (draggingRef.current) {
        draggingRef.current = false;
        if (isSelectingRef.current) {
          isSelectingRef.current = false;
          const frac = getFraction(e);
          const start = Math.min(seekStartRef.current, frac);
          const end = Math.max(seekStartRef.current, frac);
          selectionRef.current = { start, end };
          onSelectionChange?.({ start, end });
          draw(splitRef.current);
        }
      }
    }

    function onPointerCancel(e: React.PointerEvent<HTMLCanvasElement>) {
      setGrabbing(e.target as HTMLCanvasElement, false);
      seekingRef.current = false;
      isSelectingRef.current = false;
      draggingRef.current = false;
    }

    const hasAny = inputBuffer || outputBuffer;
    const hasBoth = inputBuffer && outputBuffer;

    return (
      <div className="flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          width={176}
          height={height}
          className="rounded border border-gray-800 w-full"
          style={{
            cursor: onSeek
              ? 'grab'
              : onSelectionChange
                ? 'grab'
                : hasBoth
                  ? 'col-resize'
                  : 'default',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        />
        {!onSeek && hasAny && (
          <div className="flex items-center justify-between text-xs font-mono gap-1">
            {inputBuffer && (
              <button
                type="button"
                onClick={() => {
                  splitRef.current = 0;
                  draw(0);
                }}
                className="px-2 py-0.5 rounded border transition-colors"
                style={{
                  color: '#3b82f6',
                  borderColor: '#3b82f6',
                  background: 'transparent',
                }}
              >
                input
              </button>
            )}
            {outputBuffer && (
              <button
                type="button"
                onClick={() => {
                  splitRef.current = 1;
                  draw(1);
                }}
                className="px-2 py-0.5 rounded border transition-colors"
                style={{
                  color: '#22c55e',
                  borderColor: '#22c55e',
                  background: 'transparent',
                }}
              >
                output
              </button>
            )}
          </div>
        )}
      </div>
    );
  },
);
