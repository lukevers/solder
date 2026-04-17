// src/lib/examples/circuits/high-pass-filter.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

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
    position: { x: 110, y: 430 },
    data: { label: 'GND' },
  },

  // ── Series capacitor ──
  {
    id: 'hpf-cap',
    type: 'capacitor',
    position: { x: 180, y: 200 },
    data: { label: 'C1', farads: 47e-9 },
  },

  // ── Junction at cap output split ──
  {
    id: 'hpf-jct',
    type: 'junction',
    position: { x: 290, y: 210 },
    data: { label: 'J1' },
  },

  // ── Pot (variable shunt resistor to ground, rotated) ──
  {
    id: 'hpf-pot',
    type: 'pot',
    position: { x: 260, y: 290 },
    rotation: 90,
    data: { label: 'CUTOFF', ohms: 100000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'hpf-gnd-pot',
    type: 'ground',
    position: { x: 220, y: 430 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'hpf-out',
    type: 'jack',
    position: { x: 430, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'hpf-gnd-out',
    type: 'ground',
    position: { x: 380, y: 430 },
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
  // Cap to junction
  {
    id: 'hpf-e3',
    source: 'hpf-cap',
    sourceHandle: 'b',
    target: 'hpf-jct',
    targetHandle: 'tl',
  },
  // Junction to output
  {
    id: 'hpf-e4',
    source: 'hpf-jct',
    sourceHandle: 'sr',
    target: 'hpf-out',
    targetHandle: 'pos',
  },
  // Junction to pot (shunt to ground)
  {
    id: 'hpf-e5',
    source: 'hpf-jct',
    sourceHandle: 'sb',
    target: 'hpf-pot',
    targetHandle: 'ccw',
  },
  // Pot wiper to ground
  {
    id: 'hpf-e6',
    source: 'hpf-pot',
    sourceHandle: 'wiper',
    target: 'hpf-gnd-pot',
    targetHandle: 'gnd',
  },
  // Output ground
  {
    id: 'hpf-e7',
    source: 'hpf-gnd-out',
    sourceHandle: 'gnd',
    target: 'hpf-out',
    targetHandle: 'neg',
  },
];
