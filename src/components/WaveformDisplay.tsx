// src/components/WaveformDisplay.tsx
import { useEffect, useRef } from 'react';

type Props = {
  inputBuffer: Float32Array | null;
  outputBuffer: Float32Array | null;
  height?: number;
};

export function WaveformDisplay({
  inputBuffer,
  outputBuffer,
  height = 80,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const splitRef = useRef(0.5);
  const draggingRef = useRef(false);

  function draw(split: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const layoutWidth = canvas.getBoundingClientRect().width || canvas.offsetWidth;
    const w = layoutWidth;
    const h = height;
    canvas.width = layoutWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, w, h);

    const splitX = w * split;

    function drawBuffer(buf: Float32Array, color: string) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < buf.length; i++) {
        const x = (i / buf.length) * w;
        const y = h / 2 - (buf[i] * h) / 2.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const bothBuffers = inputBuffer && outputBuffer;

    if (inputBuffer) {
      if (bothBuffers) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, splitX, h);
        ctx.clip();
      }
      drawBuffer(inputBuffer, '#be185d');
      if (bothBuffers) ctx.restore();
    }

    if (outputBuffer) {
      if (bothBuffers) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(splitX, 0, w - splitX, h);
        ctx.clip();
      }
      drawBuffer(outputBuffer, '#22c55e');
      if (bothBuffers) ctx.restore();
    }

    if (bothBuffers) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      const cy = h / 2;
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(splitX, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  useEffect(() => {
    draw(splitRef.current);
  }, [inputBuffer, outputBuffer, height]);

  function getFraction(e: React.PointerEvent<HTMLCanvasElement>): number {
    const canvas = canvasRef.current;
    if (!canvas) return 0.5;
    const rect = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!inputBuffer || !outputBuffer) return;
    draggingRef.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    splitRef.current = getFraction(e);
    draw(splitRef.current);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return;
    splitRef.current = getFraction(e);
    draw(splitRef.current);
  }

  function onPointerUp() {
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
        style={{ cursor: hasBoth ? 'col-resize' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {hasAny && (
        <div className="flex items-center justify-between text-xs font-mono gap-1">
          {inputBuffer && (
            <button
              type="button"
              onClick={() => { splitRef.current = 1; draw(1); }}
              className="px-2 py-0.5 rounded border transition-colors"
              style={{ color: '#be185d', borderColor: '#be185d', background: 'transparent' }}
            >
              dry
            </button>
          )}
          {outputBuffer && (
            <button
              type="button"
              onClick={() => { splitRef.current = 0; draw(0); }}
              className="px-2 py-0.5 rounded border transition-colors"
              style={{ color: '#22c55e', borderColor: '#22c55e', background: 'transparent' }}
            >
              wet
            </button>
          )}
        </div>
      )}
    </div>
  );
}
