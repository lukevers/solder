import { Activity } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { PotData } from '../lib/types';
import { useStore } from '../store';
import { SIMULATION_STATUS, SWEEP_STATUS } from '../store/constants';

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
  if (sweep < 0.5) {
    return '';
  }
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KNOB_SIZE = 56;
const CX = KNOB_SIZE / 2;
const CY = KNOB_SIZE / 2;
const OUTER_R = 22; // track ring radius
const SKIRT_R = 18; // flying-saucer skirt radius
const DOME_R = 9; // raised center dome radius
const RIDGE_COUNT = 32; // grip ridges around skirt
const START_DEG = 225; // 7 o'clock (min)
const TOTAL_DEG = 270; // 270° travel

// ─── Single knob ─────────────────────────────────────────────────────────────

function PotKnob({
  nodeId,
  data,
  onSweep,
}: {
  nodeId: string;
  data: PotData;
  onSweep?: (nodeId: string) => void;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { sweepStatus, simulationStatus } = useStore(
    useShallow((s) => ({
      sweepStatus: s.sweepStatus,
      simulationStatus: s.simulationStatus,
    })),
  );
  const busy =
    sweepStatus === SWEEP_STATUS.running ||
    simulationStatus === SIMULATION_STATUS.running;
  const dragRef = useRef<{ startY: number; startPos: number } | null>(null);
  const uid = useId();
  const skirtGradId = `knob-skirt-${uid}`;
  const domeGradId = `knob-dome-${uid}`;

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = { startY: e.clientY, startPos: data.position };
    },
    [data.position],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current) {
        return;
      }
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
          {/* Flat silver skirt gradient */}
          <radialGradient id={skirtGradId} cx="45%" cy="42%" r="55%">
            <stop offset="0%" stopColor="#d4d4d8" />
            <stop offset="50%" stopColor="#a1a1aa" />
            <stop offset="85%" stopColor="#71717a" />
            <stop offset="100%" stopColor="#52525b" />
          </radialGradient>
          {/* Raised dome gradient */}
          <radialGradient id={domeGradId} cx="38%" cy="30%" r="55%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="60%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#1c1c1e" />
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

        {/* Flying-saucer skirt */}
        <circle cx={CX} cy={CY} r={SKIRT_R} fill={`url(#${skirtGradId})`} />
        <circle
          cx={CX}
          cy={CY}
          r={SKIRT_R}
          fill="none"
          stroke="#a1a1aa"
          strokeWidth="0.5"
        />

        {/* Grip ridges around skirt edge */}
        {Array.from({ length: RIDGE_COUNT }, (_, i) => {
          const angle = (i * 360) / RIDGE_COUNT;
          const inner = polarToXY(CX, CY, SKIRT_R - 1.5, angle);
          const outer = polarToXY(CX, CY, SKIRT_R, angle);
          return (
            <line
              key={angle}
              x1={inner.x.toFixed(2)}
              y1={inner.y.toFixed(2)}
              x2={outer.x.toFixed(2)}
              y2={outer.y.toFixed(2)}
              stroke="#8888"
              strokeWidth="0.6"
            />
          );
        })}

        {/* Indicator triangle on skirt */}
        {(() => {
          const triR = SKIRT_R - 1;
          const triTip = polarToXY(CX, CY, triR, currentDeg);
          const triL = polarToXY(CX, CY, triR - 7, currentDeg - 17.5);
          const triRt = polarToXY(CX, CY, triR - 7, currentDeg + 17.5);
          return (
            <polygon
              points={`${triTip.x.toFixed(2)},${triTip.y.toFixed(2)} ${triL.x.toFixed(2)},${triL.y.toFixed(2)} ${triRt.x.toFixed(2)},${triRt.y.toFixed(2)}`}
              fill="#18181b"
            />
          );
        })()}

        {/* Step ring between skirt and dome */}
        <circle
          cx={CX}
          cy={CY}
          r={DOME_R + 1.5}
          fill="none"
          stroke="#71717a"
          strokeWidth="1"
        />

        {/* Raised dome cap */}
        <circle cx={CX} cy={CY} r={DOME_R} fill={`url(#${domeGradId})`} />
        <circle
          cx={CX}
          cy={CY}
          r={DOME_R}
          fill="none"
          stroke="#52525b"
          strokeWidth="0.4"
        />
      </svg>

      <div className="text-center">
        <div className="font-bold font-mono text-gray-200 text-xs tracking-wide">
          {data.label}
        </div>
        <div className="font-mono text-[10px] text-gray-500">{pct}%</div>
      </div>
      {onSweep && (
        <button
          type="button"
          onClick={() => onSweep(nodeId)}
          disabled={busy}
          className="flex items-center justify-center gap-1 rounded border border-amber-800/50 bg-amber-950/60 px-2 py-0.5 font-mono text-[10px] text-amber-400 transition-colors hover:border-amber-700 hover:bg-amber-900/60 disabled:cursor-not-allowed disabled:opacity-40"
          title="Sweep 0–100%"
        >
          <Activity size={10} />
          Sweep
        </button>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function PedalPanel({
  onSweep,
}: {
  onSweep?: (nodeId: string) => void;
}) {
  const nodes = useStore(useShallow((s) => s.nodes));
  const pots = nodes.filter((n) => n.type === 'pot') as Array<
    Extract<(typeof nodes)[number], { type: 'pot' }>
  >;

  const [open, setOpen] = useState(true);

  if (pots.length === 0) {
    return null;
  }

  return (
    <div className="border-gray-800 border-b">
      {/* Collapse toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 px-3 py-2 font-bold font-mono text-[10px] text-gray-500 uppercase tracking-widest transition-colors hover:text-gray-300"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className={`transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
        >
          <path
            d="M1 3 L5 7 L9 3"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Controls
      </button>

      {open && (
        /* Pedal enclosure */
        <div className="mx-3 mb-3 rounded-lg border border-gray-700 bg-gray-950 p-3 shadow-inner">
          {/* Decorative screws top */}
          <div className="mb-3 flex justify-between">
            <div className="h-2 w-2 rounded-full border border-gray-600 bg-gray-700" />
            <div className="h-2 w-2 rounded-full border border-gray-600 bg-gray-700" />
          </div>

          {/* Knob grid */}
          <div className="flex flex-wrap justify-around gap-x-2 gap-y-4">
            {pots.map((n) => (
              <PotKnob
                key={n.id}
                nodeId={n.id}
                data={n.data}
                onSweep={onSweep}
              />
            ))}
          </div>

          {/* Bottom screws */}
          <div className="mt-3 flex justify-between">
            <div className="h-2 w-2 rounded-full border border-gray-600 bg-gray-700" />
            <div className="h-2 w-2 rounded-full border border-gray-600 bg-gray-700" />
          </div>
        </div>
      )}
    </div>
  );
}
