import type { StickyNoteColor } from '../stickynote/types';
import type { BoxVariant } from './types';

export const COLOR_MAP: Record<
  StickyNoteColor,
  { border: string; fill: string }
> = {
  yellow: {
    border: '#eab308',
    fill: 'rgba(234,179,8,0.07)',
  },
  blue: {
    border: '#3b82f6',
    fill: 'rgba(59,130,246,0.07)',
  },
  green: {
    border: '#22c55e',
    fill: 'rgba(34,197,94,0.07)',
  },
  pink: {
    border: '#ec4899',
    fill: 'rgba(236,72,153,0.07)',
  },
  purple: {
    border: '#8b5cf6',
    fill: 'rgba(139,92,246,0.07)',
  },
  orange: {
    border: '#f97316',
    fill: 'rgba(249,115,22,0.07)',
  },
  gray: {
    border: '#6b7280',
    fill: 'rgba(107,114,128,0.07)',
  },
};

export function dashArray(variant: BoxVariant): string | undefined {
  return variant === 'dashed' ? '8 4' : undefined;
}
