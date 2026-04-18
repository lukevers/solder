// src/components/nodes/BoxNode.tsx
import { type NodeProps, NodeResizer } from '@xyflow/react';
import type { BoxData, BoxVariant, StickyNoteColor } from '../../lib/types';
import { useStore } from '../../store';

const COLOR_MAP: Record<StickyNoteColor, { border: string; fill: string }> = {
  yellow: { border: '#eab308', fill: 'rgba(234,179,8,0.07)' },
  blue: { border: '#3b82f6', fill: 'rgba(59,130,246,0.07)' },
  green: { border: '#22c55e', fill: 'rgba(34,197,94,0.07)' },
  pink: { border: '#ec4899', fill: 'rgba(236,72,153,0.07)' },
  purple: { border: '#8b5cf6', fill: 'rgba(139,92,246,0.07)' },
  orange: { border: '#f97316', fill: 'rgba(249,115,22,0.07)' },
  gray: { border: '#6b7280', fill: 'rgba(107,114,128,0.07)' },
};

function dashArray(variant: BoxVariant): string | undefined {
  return variant === 'dashed' ? '8 4' : undefined;
}

export function BoxNode({ id, data }: NodeProps) {
  const d = data as BoxData;
  const selectNode = useStore((s) => s.selectNode);
  const isSelected = useStore((s) => s.selectedNodeId === id);

  const color = d.color ?? 'blue';
  const variant = d.variant ?? 'outline';
  const { border: borderColor, fill } = COLOR_MAP[color];
  const strokeWidth = isSelected ? 2 : 1.5;

  // Hit-strip thickness: 10px inward from the visual border
  const hit = 10;

  // Props shared by all four border hit strips.
  // They carry `box-drag-handle` so XYFlow only drags the box when the
  // pointer starts on one of these strips (set via dragHandle on the node).
  const strip = {
    className: 'box-drag-handle',
    style: {
      position: 'absolute' as const,
      pointerEvents: 'auto' as const,
      cursor: 'grab' as const,
    },
    onClick: () => selectNode(id),
  };

  return (
    <>
      <NodeResizer
        isVisible={isSelected}
        minWidth={80}
        minHeight={60}
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: borderColor,
          border: 'none',
          zIndex: 10,
        }}
        lineStyle={{ border: `1px dashed ${borderColor}` }}
      />

      {/*
        Outer container: pointer-events none so the interior is fully
        transparent to clicks — they fall through to the canvas for panning
        or to nodes sitting beneath the box.
      */}
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          pointerEvents: 'none',
        }}
      >
        {/* Fill layer for 'filled' variant — visual only */}
        {variant === 'filled' && (
          <div style={{ position: 'absolute', inset: 0, background: fill }} />
        )}

        {/* SVG border — purely visual, no pointer events */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
            pointerEvents: 'none',
          }}
        >
          <rect
            x={strokeWidth / 2}
            y={strokeWidth / 2}
            width={`calc(100% - ${strokeWidth}px)`}
            height={`calc(100% - ${strokeWidth}px)`}
            fill="none"
            stroke={borderColor}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray(variant)}
            style={{ pointerEvents: 'none' }}
          />
        </svg>

        {/* Center drag area — active only when selected, sits below nodes in z-order */}
        {isSelected && (
          <div
            className="box-drag-handle"
            style={{
              position: 'absolute',
              inset: hit,
              pointerEvents: 'auto',
              cursor: 'grab',
              zIndex: 0,
            }}
          />
        )}

        {/* Four border hit strips — the only interactive surfaces on the box */}
        <div
          {...strip}
          style={{ ...strip.style, top: 0, left: 0, right: 0, height: hit }}
        />
        <div
          {...strip}
          style={{ ...strip.style, bottom: 0, left: 0, right: 0, height: hit }}
        />
        <div
          {...strip}
          style={{ ...strip.style, top: hit, left: 0, bottom: hit, width: hit }}
        />
        <div
          {...strip}
          style={{
            ...strip.style,
            top: hit,
            right: 0,
            bottom: hit,
            width: hit,
          }}
        />

        {/* Label — cut into the top border, KiCad style */}
        {d.label && (
          <span
            style={{
              position: 'absolute',
              top: -9,
              left: 8,
              background: '#111827',
              padding: '0 4px',
              fontSize: 10,
              fontFamily: 'monospace',
              fontWeight: 'bold',
              color: borderColor,
              lineHeight: '16px',
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {d.label}
          </span>
        )}
      </div>
    </>
  );
}
