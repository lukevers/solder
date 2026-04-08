// src/components/WaveformDisplay.tsx
import { useEffect, useRef, useState } from 'react';

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
  const [splitFraction, setSplitFraction] = useState(0.5);
  const draggingRef = useRef(false);

  useEffect(() => {
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

    const splitX = w * splitFraction;

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

    // Draw dry (left of split)
    if (inputBuffer) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, splitX, h);
      ctx.clip();
      drawBuffer(inputBuffer, '#be185d');
      ctx.restore();
    }

    // Draw wet (right of split)
    if (outputBuffer) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(splitX, 0, w - splitX, h);
      ctx.clip();
      drawBuffer(outputBuffer, '#22c55e');
      ctx.restore();
    }

    // Draw divider line
    if (inputBuffer || outputBuffer) {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(splitX, 0);
      ctx.lineTo(splitX, h);
      ctx.stroke();

      // Draw handle circle
      const cy = h / 2;
      ctx.fillStyle = '#e5e7eb';
      ctx.beginPath();
      ctx.arc(splitX, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [inputBuffer, outputBuffer, height, splitFraction]);

  function getFraction(e: React.PointerEvent<HTMLCanvasElement>): number {
    const canvas = canvasRef.current;
    if (!canvas) return 0.5;
    const rect = canvas.getBoundingClientRect();
    return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!inputBuffer && !outputBuffer) return;
    draggingRef.current = true;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    setSplitFraction(getFraction(e));
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return;
    setSplitFraction(getFraction(e));
  }

  function onPointerUp() {
    draggingRef.current = false;
  }

  const hasAny = inputBuffer || outputBuffer;

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={176}
        height={height}
        className="rounded border border-gray-800 w-full"
        style={{ cursor: hasAny ? 'col-resize' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      {hasAny && (
        <div className="flex items-center justify-between text-xs font-mono">
          {inputBuffer && (
            <span style={{ color: '#be185d' }}>dry</span>
          )}
          {outputBuffer && (
            <span style={{ color: '#22c55e' }}>wet</span>
          )}
        </div>
      )}
    </div>
  );
}
