// src/lib/examples/circuits/low-pass-filter.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

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
    position: { x: 120, y: 430 },
    data: { label: 'GND' },
  },

  // ── Pot (variable series resistor) ──
  {
    id: 'lpf-pot',
    type: 'pot',
    position: { x: 220, y: 200 },
    data: { label: 'CUTOFF', ohms: 100000, position: 0.5, taper: 'linear' },
  },

  // ── Junction at wiper split ──
  {
    id: 'lpf-jct',
    type: 'junction',
    position: { x: 248, y: 290 },
    data: { label: 'J1' },
  },

  // ── Shunt capacitor (rotated vertical) ──
  {
    id: 'lpf-cap',
    type: 'capacitor',
    position: { x: 240, y: 340 },
    rotation: 90,
    data: { label: 'C1', farads: 47e-9 },
  },
  {
    id: 'lpf-gnd-cap',
    type: 'ground',
    position: { x: 240, y: 430 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'lpf-out',
    type: 'jack',
    position: { x: 440, y: 280 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'lpf-gnd-out',
    type: 'ground',
    position: { x: 380, y: 430 },
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
  // Pot wiper to junction
  {
    id: 'lpf-e3',
    source: 'lpf-pot',
    sourceHandle: 'wiper',
    target: 'lpf-jct',
    targetHandle: 'tt',
  },
  // Junction to output
  {
    id: 'lpf-e4',
    source: 'lpf-jct',
    sourceHandle: 'sr',
    target: 'lpf-out',
    targetHandle: 'pos',
  },
  // Junction to shunt cap
  {
    id: 'lpf-e5',
    source: 'lpf-jct',
    sourceHandle: 'sb',
    target: 'lpf-cap',
    targetHandle: 'a',
  },
  // Cap to ground
  {
    id: 'lpf-e6',
    source: 'lpf-cap',
    sourceHandle: 'b',
    target: 'lpf-gnd-cap',
    targetHandle: 'gnd',
  },
  // Output ground
  {
    id: 'lpf-e7',
    source: 'lpf-gnd-out',
    sourceHandle: 'gnd',
    target: 'lpf-out',
    targetHandle: 'neg',
  },
];
