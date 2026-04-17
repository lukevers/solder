// src/lib/examples/circuits/soft-clipping.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const softClippingNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'sc-in',
    type: 'jack',
    position: { x: 40, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'sc-gnd-in',
    type: 'ground',
    position: { x: 160, y: 440 },
    data: { label: 'GND' },
  },

  // ── Input coupling cap ──
  {
    id: 'sc-c1',
    type: 'capacitor',
    position: { x: 180, y: 200 },
    data: { label: 'C1', farads: 100e-9 },
  },

  // ── Series resistor ──
  {
    id: 'sc-r1',
    type: 'resistor',
    position: { x: 280, y: 200 },
    data: { label: 'R1', ohms: 10000 },
  },

  // ── Junction at clipping node ──
  {
    id: 'sc-jct',
    type: 'junction',
    position: { x: 410, y: 210 },
    data: { label: 'J1' },
  },

  // ── Anti-parallel diodes (soft clipping to ground) ──
  {
    id: 'sc-d1',
    type: 'diode',
    position: { x: 360, y: 310 },
    rotation: 90,
    data: { label: 'D1', model: '1N270' },
  },
  {
    id: 'sc-d2',
    type: 'diode',
    position: { x: 440, y: 310 },
    rotation: 270,
    data: { label: 'D2', model: '1N270' },
  },
  {
    id: 'sc-gnd-clip',
    type: 'ground',
    position: { x: 400, y: 440 },
    data: { label: 'GND' },
  },

  // ── Output ──
  {
    id: 'sc-out',
    type: 'jack',
    position: { x: 570, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'sc-gnd-out',
    type: 'ground',
    position: { x: 500, y: 440 },
    data: { label: 'GND' },
  },
];

export const softClippingEdges: Array<Edge> = [
  // Input → C1
  {
    id: 'sc-e1',
    source: 'sc-in',
    sourceHandle: 'pos',
    target: 'sc-c1',
    targetHandle: 'a',
  },
  // Input ground
  {
    id: 'sc-e2',
    source: 'sc-in',
    sourceHandle: 'neg',
    target: 'sc-gnd-in',
    targetHandle: 'gnd',
  },
  // C1 → R1
  {
    id: 'sc-e3',
    source: 'sc-c1',
    sourceHandle: 'b',
    target: 'sc-r1',
    targetHandle: 'a',
  },
  // R1 → junction
  {
    id: 'sc-e4',
    source: 'sc-r1',
    sourceHandle: 'b',
    target: 'sc-jct',
    targetHandle: 'tl',
  },
  // Junction → D1 anode (clips positive)
  {
    id: 'sc-e5',
    source: 'sc-jct',
    sourceHandle: 'sb',
    target: 'sc-d1',
    targetHandle: 'a',
  },
  // D1 cathode → ground
  {
    id: 'sc-e6',
    source: 'sc-d1',
    sourceHandle: 'k',
    target: 'sc-gnd-clip',
    targetHandle: 'gnd',
  },
  // Ground → D2 anode (clips negative)
  {
    id: 'sc-e7',
    source: 'sc-gnd-clip',
    sourceHandle: 'gnd',
    target: 'sc-d2',
    targetHandle: 'a',
  },
  // D2 cathode → junction
  {
    id: 'sc-e8',
    source: 'sc-d2',
    sourceHandle: 'k',
    target: 'sc-jct',
    targetHandle: 'sb',
  },
  // Junction → output
  {
    id: 'sc-e9',
    source: 'sc-jct',
    sourceHandle: 'sr',
    target: 'sc-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'sc-e10',
    source: 'sc-gnd-out',
    sourceHandle: 'gnd',
    target: 'sc-out',
    targetHandle: 'neg',
  },
];
