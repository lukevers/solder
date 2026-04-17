// src/lib/examples/circuits/volume-pot.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const volumePotNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'vp-in',
    type: 'jack',
    position: { x: 40, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'vp-gnd-in',
    type: 'ground',
    position: { x: 100, y: 430 },
    data: { label: 'GND' },
  },

  // ── Volume pot (voltage divider) ──
  {
    id: 'vp-pot',
    type: 'pot',
    position: { x: 240, y: 200 },
    data: { label: 'VOLUME', ohms: 100000, position: 0.7, taper: 'log' },
  },
  {
    id: 'vp-gnd-pot',
    type: 'ground',
    position: { x: 280, y: 340 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'vp-out',
    type: 'jack',
    position: { x: 420, y: 280 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'vp-gnd-out',
    type: 'ground',
    position: { x: 380, y: 430 },
    data: { label: 'GND' },
  },
];

export const volumePotEdges: Array<Edge> = [
  // Input → pot CCW (signal enters left side)
  {
    id: 'vp-e1',
    source: 'vp-in',
    sourceHandle: 'pos',
    target: 'vp-pot',
    targetHandle: 'ccw',
  },
  // Input ground
  {
    id: 'vp-e2',
    source: 'vp-in',
    sourceHandle: 'neg',
    target: 'vp-gnd-in',
    targetHandle: 'gnd',
  },
  // Pot CW → ground
  {
    id: 'vp-e3',
    source: 'vp-pot',
    sourceHandle: 'cw',
    target: 'vp-gnd-pot',
    targetHandle: 'gnd',
  },
  // Pot wiper → output
  {
    id: 'vp-e4',
    source: 'vp-pot',
    sourceHandle: 'wiper',
    target: 'vp-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'vp-e5',
    source: 'vp-gnd-out',
    sourceHandle: 'gnd',
    target: 'vp-out',
    targetHandle: 'neg',
  },
];
