// src/components/WaveformDisplay.tsx
import { useEffect, useRef, useState } from 'react';

type Props = {
  inputBuffer: Float32Array | null;
  outputBuffer: Float32Array | null;
  height?: number;
};

const WINDOW_SAMPLES = 22050; // 0.5 s at 44100 Hz — scrollable window size

export function WaveformDisplay({
  inputBuffer,
  outputBuffer,
  height = 80,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewFraction, setViewFraction] = useState(0);

  const totalSamples = Math.max(
    inputBuffer?.length ?? 0,
    outputBuffer?.length ?? 0,
  );
  const windowSize =
    totalSamples > WINDOW_SAMPLES ? WINDOW_SAMPLES : totalSamples;
  const maxOffset = Math.max(0, totalSamples - windowSize);
  const startSample = Math.floor(viewFraction * maxOffset);
  const needsSlider = totalSamples > WINDOW_SAMPLES;

  // Reset scroll when buffers change
  useEffect(() => {
    setViewFraction(0);
  }, [inputBuffer, outputBuffer]);

  useEffect(() => {
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

    if (totalSamples === 0) return;

    function drawBuffer(buf: Float32Array, color: string) {
      if (!ctx) return;
      const end = Math.min(startSample + windowSize, buf.length);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = startSample; i < end; i++) {
        const x = ((i - startSample) / windowSize) * w;
        const y = h / 2 - (buf[i] * h) / 2.5;
        if (i === startSample) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (inputBuffer) drawBuffer(inputBuffer, '#be185d');
    if (outputBuffer) drawBuffer(outputBuffer, '#22c55e');
  }, [inputBuffer, outputBuffer, height, startSample, windowSize, totalSamples]);

  const hasAny = inputBuffer || outputBuffer;

  return (
    <div className="flex flex-col gap-1">
      <canvas
        ref={canvasRef}
        width={176}
        height={height}
        className="rounded border border-gray-800 w-full"
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
      {needsSlider && (
        <input
          type="range"
          min={0}
          max={1}
          step={0.001}
          value={viewFraction}
          onChange={(e) => setViewFraction(Number(e.target.value))}
          className="w-full accent-gray-500"
          aria-label="Waveform scroll"
        />
      )}
    </div>
  );
}
