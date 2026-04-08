// src/components/edges/SignalEdge.tsx
import {
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
} from '@xyflow/react';
import { useRef, useState } from 'react';

type SignalEdgeData = {
  signalType?: string;
  sourceLabel?: string;
  sourceHandle?: string;
  targetLabel?: string;
  targetHandle?: string;
  connecting?: boolean;
};

export function SignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showTooltip() {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  }
  function hideTooltip() {
    leaveTimer.current = setTimeout(() => setHovered(false), 150);
  }
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const d = data as SignalEdgeData | undefined;
  const isDC = d?.signalType === 'dc';
  const color = selected
    ? isDC
      ? '#fbbf24'
      : '#60a5fa'
    : isDC
      ? '#f59e0b'
      : '#3b82f6';

  const fromLabel = d?.sourceLabel ?? '?';
  const fromPin = d?.sourceHandle ?? '';
  const toLabel = d?.targetLabel ?? '?';
  const toPin = d?.targetHandle ?? '';
  const [copied, setCopied] = useState(false);
  const tooltipText = `${fromLabel}.${fromPin} → ${toLabel}.${toPin}  ${isDC ? 'DC' : 'AC'}`;

  function fallbackCopy(text: string) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
  }

  return (
    <>
      {/* Wide invisible hit area for easier interaction */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.3}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 5"
        className={isDC ? 'edge-anim-dc' : 'edge-anim-ac'}
      />
      {hovered && !d?.connecting && (
        <EdgeLabelRenderer>
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: tooltip copy action */}
          <div
            className="nopan nodrag nowheel absolute bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs font-mono text-gray-300 shadow-lg whitespace-nowrap cursor-pointer hover:border-gray-400 transition-colors"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              zIndex: 10,
            }}
            onMouseEnter={showTooltip}
            onMouseLeave={() => {
              hideTooltip();
              setCopied(false);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              const text = tooltipText;
              if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(text).then(
                  () => setCopied(true),
                  () => fallbackCopy(text),
                );
              } else {
                fallbackCopy(text);
              }
            }}
          >
            {copied ? (
              <span className="text-green-400">Copied!</span>
            ) : (
              <>
                <span className="text-gray-400">{fromLabel}</span>
                <span className="text-gray-600">.</span>
                <span className="text-gray-500">{fromPin}</span>
                <span className="text-gray-600 mx-1">&rarr;</span>
                <span className="text-gray-400">{toLabel}</span>
                <span className="text-gray-600">.</span>
                <span className="text-gray-500">{toPin}</span>
                <span className="ml-2 text-gray-600">{isDC ? 'DC' : 'AC'}</span>
              </>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
