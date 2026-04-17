// src/lib/examples/high-pass-filter.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export const highPassFilterNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'hpf-in',
    type: 'jack',
    position: { x: 40, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'hpf-gnd-in',
    type: 'ground',
    position: { x: 100, y: 300 },
    data: { label: 'GND' },
  },

  // ── Series capacitor ──
  {
    id: 'hpf-cap',
    type: 'capacitor',
    position: { x: 220, y: 220 },
    data: { label: 'C1', farads: 10e-9 },
  },

  // ── Pot (variable shunt resistor to ground) ──
  {
    id: 'hpf-pot',
    type: 'pot',
    position: { x: 280, y: 380 },
    data: { label: 'CUTOFF', ohms: 100000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'hpf-gnd-pot',
    type: 'ground',
    position: { x: 300, y: 520 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'hpf-out',
    type: 'jack',
    position: { x: 480, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'hpf-gnd-out',
    type: 'ground',
    position: { x: 460, y: 300 },
    data: { label: 'GND' },
  },
];

export const highPassFilterEdges: Array<Edge> = [
  // Input to cap
  {
    id: 'hpf-e1',
    source: 'hpf-in',
    sourceHandle: 'pos',
    target: 'hpf-cap',
    targetHandle: 'a',
  },
  // Input ground
  {
    id: 'hpf-e2',
    source: 'hpf-in',
    sourceHandle: 'neg',
    target: 'hpf-gnd-in',
    targetHandle: 'gnd',
  },
  // Cap to pot CCW (junction → shunt R to ground)
  {
    id: 'hpf-e3',
    source: 'hpf-cap',
    sourceHandle: 'b',
    target: 'hpf-pot',
    targetHandle: 'ccw',
  },
  // Pot wiper to ground
  {
    id: 'hpf-e4',
    source: 'hpf-pot',
    sourceHandle: 'wiper',
    target: 'hpf-gnd-pot',
    targetHandle: 'gnd',
  },
  // Cap to output (same junction as pot input)
  {
    id: 'hpf-e5',
    source: 'hpf-cap',
    sourceHandle: 'b',
    target: 'hpf-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'hpf-e6',
    source: 'hpf-gnd-out',
    sourceHandle: 'gnd',
    target: 'hpf-out',
    targetHandle: 'neg',
  },
];
