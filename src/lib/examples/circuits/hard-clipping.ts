// src/lib/examples/circuits/hard-clipping.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const hardClippingNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'hc-in',
    type: 'jack',
    position: { x: 40, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'hc-gnd-in',
    type: 'ground',
    position: { x: 160, y: 440 },
    data: { label: 'GND' },
  },

  // ── Input coupling cap ──
  {
    id: 'hc-c1',
    type: 'capacitor',
    position: { x: 180, y: 200 },
    data: { label: 'C1', farads: 100e-9 },
  },

  // ── Series resistor ──
  {
    id: 'hc-r1',
    type: 'resistor',
    position: { x: 280, y: 200 },
    data: { label: 'R1', ohms: 10000 },
  },

  // ── Junction at clipping node ──
  {
    id: 'hc-jct',
    type: 'junction',
    position: { x: 410, y: 210 },
    data: { label: 'J1' },
  },

  // ── Anti-parallel diodes (hard clipping to ground) ──
  {
    id: 'hc-d1',
    type: 'diode',
    position: { x: 360, y: 310 },
    rotation: 90,
    data: { label: 'D1', model: '1N914' },
  },
  {
    id: 'hc-d2',
    type: 'diode',
    position: { x: 440, y: 310 },
    rotation: 270,
    data: { label: 'D2', model: '1N914' },
  },
  {
    id: 'hc-gnd-clip',
    type: 'ground',
    position: { x: 400, y: 440 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'hc-out',
    type: 'jack',
    position: { x: 570, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'hc-gnd-out',
    type: 'ground',
    position: { x: 500, y: 440 },
    data: { label: 'GND' },
  },
];

export const hardClippingEdges: Array<Edge> = [
  // Input → C1
  {
    id: 'hc-e1',
    source: 'hc-in',
    sourceHandle: 'pos',
    target: 'hc-c1',
    targetHandle: 'a',
  },
  // Input ground
  {
    id: 'hc-e2',
    source: 'hc-in',
    sourceHandle: 'neg',
    target: 'hc-gnd-in',
    targetHandle: 'gnd',
  },
  // C1 → R1
  {
    id: 'hc-e3',
    source: 'hc-c1',
    sourceHandle: 'b',
    target: 'hc-r1',
    targetHandle: 'a',
  },
  // R1 → junction
  {
    id: 'hc-e4',
    source: 'hc-r1',
    sourceHandle: 'b',
    target: 'hc-jct',
    targetHandle: 'tl',
  },
  // Junction → D1 anode (clips positive)
  {
    id: 'hc-e5',
    source: 'hc-jct',
    sourceHandle: 'sb',
    target: 'hc-d1',
    targetHandle: 'a',
  },
  // D1 cathode → ground
  {
    id: 'hc-e6',
    source: 'hc-d1',
    sourceHandle: 'k',
    target: 'hc-gnd-clip',
    targetHandle: 'gnd',
  },
  // Ground → D2 anode (clips negative)
  {
    id: 'hc-e7',
    source: 'hc-gnd-clip',
    sourceHandle: 'gnd',
    target: 'hc-d2',
    targetHandle: 'a',
  },
  // D2 cathode → junction
  {
    id: 'hc-e8',
    source: 'hc-d2',
    sourceHandle: 'k',
    target: 'hc-jct',
    targetHandle: 'sb',
  },
  // Junction → output
  {
    id: 'hc-e9',
    source: 'hc-jct',
    sourceHandle: 'sr',
    target: 'hc-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'hc-e10',
    source: 'hc-gnd-out',
    sourceHandle: 'gnd',
    target: 'hc-out',
    targetHandle: 'neg',
  },
];
