// src/components/PedalPanel.tsx

import { useCallback, useId, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { PotData } from '../lib/types';
import { useStore } from '../store';

// ─── Arc helpers ─────────────────────────────────────────────────────────────

/** Convert degrees (0° = 12-o'clock, clockwise) to SVG x/y */
function polarToXY(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

/**
 * SVG arc path from startDeg → endDeg (clockwise, 0° = 12 o'clock).
 * Always draws the clockwise arc between the two angles.
 */
function arcPath(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  const start = polarToXY(cx, cy, r, startDeg);
  const end = polarToXY(cx, cy, r, endDeg);
  const sweep = (endDeg - startDeg + 360) % 360;
  if (sweep < 0.5) return '';
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOB_SIZE = 56;
const CX = KNOB_SIZE / 2;
const CY = KNOB_SIZE / 2;
const OUTER_R = 22; // track ring radius
const INNER_R = 16; // knob face radius
const START_DEG = 225; // 7 o'clock (min)
const TOTAL_DEG = 270; // 270° travel

// ─── Single knob ─────────────────────────────────────────────────────────────

function PotKnob({ nodeId, data }: { nodeId: string; data: PotData }) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const dragRef = useRef<{ startY: number; startPos: number } | null>(null);
  const uid = useId();
  const gradId = `knob-grad-${uid}`;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startPos: data.position };
    },
    [data.position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) return;
      const delta = (dragRef.current.startY - e.clientY) / 120;
      const next = Math.max(0, Math.min(1, dragRef.current.startPos + delta));
      updateNodeData(nodeId, { ...data, position: next } as PotData);
    },
    [nodeId, data, updateNodeData],
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const currentDeg = START_DEG + data.position * TOTAL_DEG;
  const endDeg = START_DEG + TOTAL_DEG; // 495 = 135° = 5 o'clock

  const trackPath = arcPath(CX, CY, OUTER_R, START_DEG, endDeg);
  const valuePath =
    data.position > 0.005
      ? arcPath(CX, CY, OUTER_R, START_DEG, currentDeg)
      : '';

  // Indicator tip
  const tip = polarToXY(CX, CY, INNER_R - 3, currentDeg);

  const pct = Math.round(data.position * 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg
        width={KNOB_SIZE}
        height={KNOB_SIZE}
        className="cursor-ns-resize select-none"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <defs>
          <radialGradient id={gradId} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#4b5563" />
            <stop offset="100%" stopColor="#111827" />
          </radialGradient>
        </defs>

        {/* Track ring */}
        <path
          d={trackPath}
          fill="none"
          stroke="#374151"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Value arc */}
        {valuePath && (
          <path
            d={valuePath}
            fill="none"
            stroke="#a78bfa"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Knob face */}
        <circle cx={CX} cy={CY} r={INNER_R} fill={`url(#${gradId})`} />
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R}
          fill="none"
          stroke="#6b7280"
          strokeWidth="0.5"
        />

        {/* Indicator */}
        <line
          x1={CX}
          y1={CY}
          x2={tip.x.toFixed(2)}
          y2={tip.y.toFixed(2)}
          stroke="#e5e7eb"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <div className="text-center">
        <div className="text-gray-200 text-xs font-mono font-bold tracking-wide">
          {data.label}
        </div>
        <div className="text-gray-500 text-[10px] font-mono">{pct}%</div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function PedalPanel() {
  const nodes = useStore(useShallow((s) => s.nodes));
  const pots = nodes.filter((n) => n.type === 'pot') as Array<
    Extract<(typeof nodes)[number], { type: 'pot' }>
  >;

  if (pots.length === 0) return null;

  return (
    <div className="border-b border-gray-800">
      {/* Pedal enclosure */}
      <div className="m-3 rounded-lg bg-gray-950 border border-gray-700 p-3 shadow-inner">
        {/* Enclosure header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">
            Controls
          </span>
          {/* Decorative screws */}
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
          </div>
        </div>

        {/* Knob grid */}
        <div className="flex flex-wrap justify-around gap-x-2 gap-y-4">
          {pots.map((n) => (
            <PotKnob key={n.id} nodeId={n.id} data={n.data} />
          ))}
        </div>

        {/* Bottom screws */}
        <div className="flex justify-between mt-3">
          <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
          <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-600" />
        </div>
      </div>
    </div>
  );
}
