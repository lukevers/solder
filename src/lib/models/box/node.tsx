import { type NodeProps, NodeResizer } from '@xyflow/react';
import { useStore } from '../../../store';
import { DEFAULT_NODE_COLOR } from '../../colors';
import { DEFAULT_BOX_VARIANT } from './constants';
import type { BoxData } from './types';
import { COLOR_MAP, dashArray } from './utils';

interface BoxNodeProps extends NodeProps {
  data: BoxData;
}

export function BoxNode({ id, data }: BoxNodeProps) {
  const selectNode = useStore((s) => s.selectNode);
  const isSelected = useStore((s) => s.selectedNodeId === id);

  const color = data.color ?? DEFAULT_NODE_COLOR;
  const variant = data.variant ?? DEFAULT_BOX_VARIANT;
  const { border: borderColor, fill } = COLOR_MAP[color];
  const strokeWidth = isSelected ? 2 : 1.5;

  /**
   * Border hit-strip thickness in pixels. These strips sit just inside the
   * visual border.
   */
  const hit = 10;

  /**
   * Shared props for all four border hit strips.
   *
   * They carry `box-drag-handle` so XYFlow only drags the box when the pointer
   * starts on one of these strips.
   */
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
        {data.label && (
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
            {data.label}
          </span>
        )}
      </div>
    </>
  );
}
