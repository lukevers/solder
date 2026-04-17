// src/components/nodes/StickyNoteNode.tsx
import type { NodeProps } from '@xyflow/react';
import type {
  StickyNoteColor,
  StickyNoteData,
  StickyNoteSize,
} from '../../lib/types';
import { useStore } from '../../store';

export const STICKY_COLORS: Record<
  StickyNoteColor,
  {
    bg: string;
    bgSelected: string;
    header: string;
    border: string;
    borderSelected: string;
    text: string;
  }
> = {
  yellow: {
    bg: '#fef08a',
    bgSelected: '#fde047',
    header: '#fde047',
    border: '#fde047',
    borderSelected: '#eab308',
    text: '#713f12',
  },
  blue: {
    bg: '#bfdbfe',
    bgSelected: '#93c5fd',
    header: '#93c5fd',
    border: '#93c5fd',
    borderSelected: '#3b82f6',
    text: '#1e3a5f',
  },
  green: {
    bg: '#bbf7d0',
    bgSelected: '#86efac',
    header: '#86efac',
    border: '#86efac',
    borderSelected: '#22c55e',
    text: '#14532d',
  },
  pink: {
    bg: '#fbcfe8',
    bgSelected: '#f9a8d4',
    header: '#f9a8d4',
    border: '#f9a8d4',
    borderSelected: '#ec4899',
    text: '#701a3e',
  },
  purple: {
    bg: '#ddd6fe',
    bgSelected: '#c4b5fd',
    header: '#c4b5fd',
    border: '#c4b5fd',
    borderSelected: '#8b5cf6',
    text: '#3b1f6e',
  },
  orange: {
    bg: '#fed7aa',
    bgSelected: '#fdba74',
    header: '#fdba74',
    border: '#fdba74',
    borderSelected: '#f97316',
    text: '#6b2f0a',
  },
};

const SIZE_CLASSES: Record<StickyNoteSize, string> = {
  xs: 'text-[5px] leading-tight',
  sm: 'text-[7px] leading-snug',
  md: 'text-[10px] leading-snug',
};

export function StickyNoteNode({ id, data, selected }: NodeProps) {
  const d = data as StickyNoteData;
  const selectNode = useStore((s) => s.selectNode);
  const c = STICKY_COLORS[d.color ?? 'yellow'];
  const sizeClass = SIZE_CLASSES[d.size ?? 'sm'];
  const w = d.width === 'slim' ? 80 : 160;

  return (
    <div
      onClick={() => selectNode(id)}
      className="cursor-pointer"
      style={{ width: w, minHeight: 80 }}
    >
      <div
        className="rounded overflow-hidden"
        style={{
          width: w,
          minHeight: 80,
          background: selected ? c.bgSelected : c.bg,
          border: selected
            ? `2px solid ${c.borderSelected}`
            : `2px solid ${c.border}`,
          boxShadow: '2px 2px 6px rgba(0,0,0,0.3)',
        }}
      >
        <div
          className="px-1 py-0.5 text-[5px] font-mono font-bold tracking-wider uppercase leading-tight"
          style={{
            background: selected ? c.borderSelected : c.header,
            color: c.text,
          }}
        >
          {d.label}
        </div>
        <div
          className={`px-2 py-1.5 font-sans whitespace-pre-wrap break-words ${sizeClass}`}
          style={{ color: c.text }}
        >
          {d.text}
        </div>
      </div>
    </div>
  );
}
