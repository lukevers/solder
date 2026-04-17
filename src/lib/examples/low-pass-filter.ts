// src/lib/examples/low-pass-filter.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export const lowPassFilterNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'lpf-in',
    type: 'jack',
    position: { x: 40, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'lpf-gnd-in',
    type: 'ground',
    position: { x: 100, y: 300 },
    data: { label: 'GND' },
  },

  // ── Pot (variable series resistor) ──
  {
    id: 'lpf-pot',
    type: 'pot',
    position: { x: 280, y: 200 },
    data: { label: 'CUTOFF', ohms: 100000, position: 0.5, taper: 'linear' },
  },

  // ── Shunt capacitor (rotated vertical) ──
  {
    id: 'lpf-cap',
    type: 'capacitor',
    position: { x: 300, y: 360 },
    rotation: 90,
    data: { label: 'C1', farads: 10e-9 },
  },
  {
    id: 'lpf-gnd-cap',
    type: 'ground',
    position: { x: 300, y: 460 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'lpf-out',
    type: 'jack',
    position: { x: 520, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'lpf-gnd-out',
    type: 'ground',
    position: { x: 500, y: 300 },
    data: { label: 'GND' },
  },
];

export const lowPassFilterEdges: Array<Edge> = [
  // Input to pot CCW (signal enters left side)
  {
    id: 'lpf-e1',
    source: 'lpf-in',
    sourceHandle: 'pos',
    target: 'lpf-pot',
    targetHandle: 'ccw',
  },
  // Input ground
  {
    id: 'lpf-e2',
    source: 'lpf-in',
    sourceHandle: 'neg',
    target: 'lpf-gnd-in',
    targetHandle: 'gnd',
  },
  // Pot wiper to shunt cap
  {
    id: 'lpf-e3',
    source: 'lpf-pot',
    sourceHandle: 'wiper',
    target: 'lpf-cap',
    targetHandle: 'a',
  },
  // Cap to ground
  {
    id: 'lpf-e4',
    source: 'lpf-cap',
    sourceHandle: 'b',
    target: 'lpf-gnd-cap',
    targetHandle: 'gnd',
  },
  // Pot wiper to output (same junction as cap)
  {
    id: 'lpf-e5',
    source: 'lpf-pot',
    sourceHandle: 'wiper',
    target: 'lpf-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'lpf-e6',
    source: 'lpf-gnd-out',
    sourceHandle: 'gnd',
    target: 'lpf-out',
    targetHandle: 'neg',
  },
];
