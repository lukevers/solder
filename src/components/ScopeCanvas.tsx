// src/components/ScopeCanvas.tsx

import { useEffect, useRef } from 'react';
import { SAMPLE_RATE } from '../lib/constants';

export type ScopeTrace = {
  color: string;
  values: Float32Array;
};

type Props = {
  traces: Array<ScopeTrace>;
  yScale: number;
  timeDiv: number;
  speed: number;
  running: boolean;
  height: number;
  emptyMessage?: string;
  /** Called when the user interacts (drag/scroll) to request pausing. */
  onPause?: () => void;
};

const DIVS_X = 10;
const DIVS_Y = 8;

export function ScopeCanvas({
  traces,
  yScale,
  timeDiv,
  speed,
  running,
  height,
  emptyMessage,
  onPause,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(0);
  const dragRef = useRef<{ startX: number; startPhase: number } | null>(null);
  const onPauseRef = useRef(onPause);
  onPauseRef.current = onPause;

  const windowSamples = Math.floor((timeDiv / 1000) * SAMPLE_RATE * DIVS_X);

  function getMaxLen() {
    return traces.reduce((m, t) => Math.max(m, t.values.length), 1);
  }

  function wrapPhase(phase: number) {
    const len = getMaxLen();
    return ((phase % len) + len) % len;
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio ?? 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // CRT background
    const grad = ctx.createRadialGradient(
      w / 2,
      h / 2,
      0,
      w / 2,
      h / 2,
      w * 0.7,
    );
    grad.addColorStop(0, '#0c140c');
    grad.addColorStop(1, '#060a06');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const pad = { l: 44, r: 8, t: 8, b: 18 };
    const pw = w - pad.l - pad.r;
    const ph = h - pad.t - pad.b;
    const midY = pad.t + ph / 2;

    // Minor grid
    ctx.strokeStyle = '#162616';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= DIVS_X; i++) {
      const x = pad.l + (i / DIVS_X) * pw;
      ctx.beginPath();
      ctx.moveTo(x, pad.t);
      ctx.lineTo(x, pad.t + ph);
      ctx.stroke();
    }
    for (let i = 0; i <= DIVS_Y; i++) {
      const y = pad.t + (i / DIVS_Y) * ph;
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(pad.l + pw, y);
      ctx.stroke();
    }

    // Center axes
    ctx.strokeStyle = '#1e3a1e';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.l, midY);
    ctx.lineTo(pad.l + pw, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad.l + pw / 2, pad.t);
    ctx.lineTo(pad.l + pw / 2, pad.t + ph);
    ctx.stroke();

    // Time labels
    ctx.fillStyle = '#3a6a3a';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i <= DIVS_X; i += 2) {
      const ms = i * timeDiv;
      const label =
        ms >= 1000
          ? `${(ms / 1000).toFixed(1)}s`
          : `${ms.toFixed(ms < 1 ? 1 : 0)}ms`;
      ctx.fillText(label, pad.l + (i / DIVS_X) * pw, pad.t + ph + 13);
    }

    // Voltage labels (auto-scaled)
    ctx.textAlign = 'right';
    const vSteps = [-1, -0.5, 0, 0.5, 1];
    for (const frac of vSteps) {
      const y = midY - (frac * ph) / 2;
      const v = frac * yScale;
      let label: string;
      if (yScale >= 1) label = frac === 0 ? '0' : `${v.toFixed(1)}V`;
      else label = frac === 0 ? '0' : `${(v * 1000).toFixed(0)}mV`;
      ctx.fillText(label, pad.l - 4, y + 3);
    }

    // Draw traces
    const start = Math.floor(phaseRef.current);
    const step = Math.max(1, Math.floor(windowSamples / (pw * 2)));

    for (const t of traces) {
      if (!t.values.length) continue;
      const len = t.values.length;

      // Glow
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = t.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      let first = true;
      for (let i = 0; i < windowSamples; i += step) {
        const idx = (start + i) % len;
        const x = pad.l + (i / windowSamples) * pw;
        const y = midY - (t.values[idx] / yScale) * (ph / 2);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Main trace
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      first = true;
      for (let i = 0; i < windowSamples; i += step) {
        const idx = (start + i) % len;
        const x = pad.l + (i / windowSamples) * pw;
        const y = midY - (t.values[idx] / yScale) * (ph / 2);
        if (first) {
          ctx.moveTo(x, y);
          first = false;
        } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Border
    ctx.strokeStyle = '#1e3a1e';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
    ctx.strokeRect(pad.l, pad.t, pw, ph);

    // Empty message
    if (traces.length === 0 && emptyMessage) {
      ctx.fillStyle = '#3a6a3a';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(emptyMessage, pad.l + pw / 2, midY);
    }
  }

  // Animation loop
  // biome-ignore lint/correctness/useExhaustiveDependencies: draw reads state via closure
  useEffect(() => {
    if (!running || traces.length === 0) {
      draw();
      return;
    }
    let raf: number;
    let last = performance.now();
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      const maxLen = traces.reduce((m, t) => Math.max(m, t.values.length), 1);
      phaseRef.current = (phaseRef.current + dt * SAMPLE_RATE * speed) % maxLen;
      draw();
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, traces, windowSamples, yScale, timeDiv, speed]);

  // Redraw when paused
  // biome-ignore lint/correctness/useExhaustiveDependencies: draw reads state via closure
  useEffect(() => {
    if (running) return;
    draw();
    const onResize = () => draw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [running, traces, windowSamples, yScale, timeDiv]);

  // Drag-to-pan: global mouse handlers
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const pw = canvas.clientWidth - 52; // pad.l + pad.r
      const samplesPerPx = windowSamples / Math.max(pw, 1);
      const dx = dragRef.current.startX - e.clientX;
      phaseRef.current = wrapPhase(
        dragRef.current.startPhase + dx * samplesPerPx,
      );
      draw();
    }
    function onMouseUp() {
      dragRef.current = null;
      document.body.style.cursor = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  function handleMouseDown(e: React.MouseEvent) {
    if (traces.length === 0) return;
    e.preventDefault();
    onPauseRef.current?.();
    dragRef.current = { startX: e.clientX, startPhase: phaseRef.current };
    document.body.style.cursor = 'grabbing';
  }

  function handleWheel(e: React.WheelEvent) {
    if (traces.length === 0) return;
    e.preventDefault();
    onPauseRef.current?.();
    const scrollAmount = windowSamples * 0.1 * Math.sign(e.deltaY);
    phaseRef.current = wrapPhase(phaseRef.current + scrollAmount);
    draw();
  }

  return (
    <div style={{ height }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: traces.length > 0 ? 'grab' : undefined }}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      />
    </div>
  );
}
