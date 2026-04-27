import type { NodeProps } from '@xyflow/react';
import { useStore } from '../../../../store';
import { DEFAULT_NODE_COLOR, NODE_COLOR_TOKENS } from '../../../colors';
import {
  DEFAULT_NODE_SIZE,
  DEFAULT_NODE_WIDTH,
  type NodeSize,
} from '../../../sizes';
import type { StickyNoteData } from './types';

const SIZE_CLASSES: Record<NodeSize, string> = {
  xs: 'text-[5px] leading-tight',
  sm: 'text-[7px] leading-snug',
  md: 'text-[10px] leading-snug',
};

interface StickyNoteNodeProps extends NodeProps {
  data: StickyNoteData;
}

export function StickyNoteNode({ id, data, selected }: StickyNoteNodeProps) {
  const selectNode = useStore((s) => s.selectNode);
  const c = NODE_COLOR_TOKENS[data.color ?? DEFAULT_NODE_COLOR];
  const sizeClass = SIZE_CLASSES[data.size ?? DEFAULT_NODE_SIZE];
  const width = data.width ?? DEFAULT_NODE_WIDTH;
  const w = width === 'slim' ? 80 : 160;

  return (
    <div
      onClick={() => selectNode(id)}
      className="cursor-pointer"
      style={{ width: w, minHeight: 80 }}
    >
      <div
        className="overflow-hidden rounded"
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
          className="px-1 py-0.5 font-bold font-mono text-[5px] uppercase leading-tight tracking-wider"
          style={{
            background: selected ? c.borderSelected : c.header,
            color: c.text,
          }}
        >
          {data.label}
        </div>
        <div
          className={`whitespace-pre-wrap break-words px-2 py-1.5 font-sans ${sizeClass}`}
          style={{ color: c.text }}
        >
          {data.text}
        </div>
      </div>
    </div>
  );
}
