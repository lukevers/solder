// src/lib/examples/rat.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export type ExampleCircuit = {
  id: string;
  name: string;
  description: string;
  tags: Array<string>;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

const ratNodes: Array<ComponentNode> = [
  // ── Input chain ──────────────────────────────────
  {
    id: 'in',
    type: 'audiin',
    position: { x: 40, y: 320 },
    data: { label: 'INPUT' },
  },
  {
    id: 'c1',
    type: 'capacitor',
    position: { x: 200, y: 320 },
    data: { label: 'C1', farads: 47e-9 },
  },
  {
    id: 'r1',
    type: 'resistor',
    position: { x: 360, y: 320 },
    data: { label: 'R1', ohms: 47 },
  },
  {
    id: 'r2',
    type: 'resistor',
    position: { x: 520, y: 320 },
    data: { label: 'R2', ohms: 100 },
  },

  // ── Op-amp ───────────────────────────────────────
  {
    id: 'u1',
    type: 'opamp',
    position: { x: 780, y: 280 },
    data: { label: 'U1', model: 'TL072' },
  },

  // Net labels at the two key junctions so feedback / clipping
  // sections can be wired locally without long crossing traces.
  {
    id: 'inv-a',
    type: 'label',
    position: { x: 660, y: 350 },
    data: { label: 'INV' },
  },
  {
    id: 'opout-a',
    type: 'label',
    position: { x: 920, y: 320 },
    data: { label: 'OPOUT' },
  },

  // ── Bias network ─────────────────────────────────
  {
    id: 'vcc1',
    type: 'power',
    position: { x: 660, y: 60 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'r3',
    type: 'resistor',
    position: { x: 660, y: 160 },
    data: { label: 'R3', ohms: 47000 },
  },
  {
    id: 'r4',
    type: 'resistor',
    position: { x: 840, y: 160 },
    data: { label: 'R4', ohms: 47000 },
  },
  {
    id: 'gnd-bias',
    type: 'ground',
    position: { x: 940, y: 200 },
    data: { label: 'GND' },
  },
  {
    id: 'vcc2',
    type: 'power',
    position: { x: 820, y: 180 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'gnd-opamp',
    type: 'ground',
    position: { x: 820, y: 420 },
    data: { label: 'GND' },
  },

  // ── Feedback (R5 + DIST pot + C2) ────────────────
  {
    id: 'opout-fb',
    type: 'label',
    position: { x: 1060, y: 80 },
    data: { label: 'OPOUT' },
  },
  {
    id: 'r5',
    type: 'resistor',
    position: { x: 1140, y: 80 },
    data: { label: 'R5', ohms: 2200 },
  },
  {
    id: 'dist',
    type: 'pot',
    position: { x: 1300, y: 80 },
    data: { label: 'DIST', ohms: 500000, position: 0.5 },
  },
  {
    id: 'inv-fb-dist',
    type: 'label',
    position: { x: 1380, y: 180 },
    data: { label: 'INV' },
  },
  {
    id: 'opout-cap',
    type: 'label',
    position: { x: 1060, y: 180 },
    data: { label: 'OPOUT' },
  },
  {
    id: 'c2',
    type: 'capacitor',
    position: { x: 1180, y: 180 },
    data: { label: 'C2', farads: 100e-12 },
  },
  {
    id: 'inv-fb-cap',
    type: 'label',
    position: { x: 1340, y: 180 },
    data: { label: 'INV' },
  },

  // ── Clipping diodes ──────────────────────────────
  {
    id: 'inv-d',
    type: 'label',
    position: { x: 1060, y: 280 },
    data: { label: 'INV' },
  },
  {
    id: 'd1',
    type: 'diode',
    position: { x: 1180, y: 280 },
    data: { label: 'D1', model: '1N914' },
  },
  {
    id: 'opout-d1',
    type: 'label',
    position: { x: 1320, y: 280 },
    data: { label: 'OPOUT' },
  },
  {
    id: 'opout-d2',
    type: 'label',
    position: { x: 1060, y: 340 },
    data: { label: 'OPOUT' },
  },
  {
    id: 'd2',
    type: 'diode',
    position: { x: 1180, y: 340 },
    data: { label: 'D2', model: '1N914' },
  },
  {
    id: 'inv-d2',
    type: 'label',
    position: { x: 1320, y: 340 },
    data: { label: 'INV' },
  },

  // ── Tone + output ────────────────────────────────
  {
    id: 'opout-tone',
    type: 'label',
    position: { x: 1060, y: 440 },
    data: { label: 'OPOUT' },
  },
  {
    id: 'r6',
    type: 'resistor',
    position: { x: 1180, y: 440 },
    data: { label: 'R6', ohms: 10000 },
  },
  {
    id: 'c3',
    type: 'capacitor',
    position: { x: 1340, y: 520 },
    data: { label: 'C3', farads: 100e-9 },
  },
  {
    id: 'gnd-tone',
    type: 'ground',
    position: { x: 1440, y: 560 },
    data: { label: 'GND' },
  },
  {
    id: 'c4',
    type: 'capacitor',
    position: { x: 1380, y: 440 },
    data: { label: 'C4', farads: 100e-9 },
  },
  {
    id: 'vol',
    type: 'pot',
    position: { x: 1540, y: 440 },
    data: { label: 'VOL', ohms: 100000, position: 0.8 },
  },
  {
    id: 'gnd-vol',
    type: 'ground',
    position: { x: 1580, y: 560 },
    data: { label: 'GND' },
  },
  {
    id: 'out',
    type: 'audiout',
    position: { x: 1700, y: 440 },
    data: { label: 'OUTPUT' },
  },
];

const ratEdges: Array<Edge> = [
  // Input chain
  {
    id: 'e-in-c1',
    source: 'in',
    sourceHandle: 'out',
    target: 'c1',
    targetHandle: 'a',
  },
  {
    id: 'e-c1-r1',
    source: 'c1',
    sourceHandle: 'b',
    target: 'r1',
    targetHandle: 'a',
  },
  {
    id: 'e-r1-r2',
    source: 'r1',
    sourceHandle: 'b',
    target: 'r2',
    targetHandle: 'a',
  },
  // R2 → INV label → U1.in_neg
  {
    id: 'e-r2-inv',
    source: 'r2',
    sourceHandle: 'b',
    target: 'inv-a',
    targetHandle: 'net',
  },
  {
    id: 'e-inv-u1',
    source: 'inv-a',
    sourceHandle: 'net',
    target: 'u1',
    targetHandle: 'in_neg',
  },
  // U1.out → OPOUT label
  {
    id: 'e-u1-opout',
    source: 'u1',
    sourceHandle: 'out',
    target: 'opout-a',
    targetHandle: 'net',
  },

  // Bias
  {
    id: 'e-vcc-r3',
    source: 'vcc1',
    sourceHandle: 'pos',
    target: 'r3',
    targetHandle: 'a',
  },
  {
    id: 'e-r3-r4',
    source: 'r3',
    sourceHandle: 'b',
    target: 'r4',
    targetHandle: 'a',
  },
  {
    id: 'e-r3-inp',
    source: 'r3',
    sourceHandle: 'b',
    target: 'u1',
    targetHandle: 'in_pos',
  },
  {
    id: 'e-r4-gnd',
    source: 'r4',
    sourceHandle: 'b',
    target: 'gnd-bias',
    targetHandle: 'gnd',
  },
  {
    id: 'e-vcc-u1',
    source: 'vcc2',
    sourceHandle: 'pos',
    target: 'u1',
    targetHandle: 'vcc',
  },
  {
    id: 'e-gnd-u1',
    source: 'gnd-opamp',
    sourceHandle: 'gnd',
    target: 'u1',
    targetHandle: 'gnd',
  },

  // Feedback: R5 + DIST
  {
    id: 'e-opout-r5',
    source: 'opout-fb',
    sourceHandle: 'net',
    target: 'r5',
    targetHandle: 'a',
  },
  {
    id: 'e-r5-dist',
    source: 'r5',
    sourceHandle: 'b',
    target: 'dist',
    targetHandle: 'cw',
  },
  {
    id: 'e-dist-w',
    source: 'dist',
    sourceHandle: 'wiper',
    target: 'inv-fb-dist',
    targetHandle: 'net',
  },
  {
    id: 'e-dist-ccw',
    source: 'dist',
    sourceHandle: 'ccw',
    target: 'inv-fb-dist',
    targetHandle: 'net',
  },

  // Feedback: C2
  {
    id: 'e-opout-c2',
    source: 'opout-cap',
    sourceHandle: 'net',
    target: 'c2',
    targetHandle: 'a',
  },
  {
    id: 'e-c2-inv',
    source: 'c2',
    sourceHandle: 'b',
    target: 'inv-fb-cap',
    targetHandle: 'net',
  },

  // Clipping diodes
  {
    id: 'e-inv-d1',
    source: 'inv-d',
    sourceHandle: 'net',
    target: 'd1',
    targetHandle: 'a',
  },
  {
    id: 'e-d1-opout',
    source: 'd1',
    sourceHandle: 'k',
    target: 'opout-d1',
    targetHandle: 'net',
  },
  {
    id: 'e-opout-d2',
    source: 'opout-d2',
    sourceHandle: 'net',
    target: 'd2',
    targetHandle: 'a',
  },
  {
    id: 'e-d2-inv',
    source: 'd2',
    sourceHandle: 'k',
    target: 'inv-d2',
    targetHandle: 'net',
  },

  // Tone + output
  {
    id: 'e-opout-r6',
    source: 'opout-tone',
    sourceHandle: 'net',
    target: 'r6',
    targetHandle: 'a',
  },
  {
    id: 'e-r6-c3',
    source: 'r6',
    sourceHandle: 'b',
    target: 'c3',
    targetHandle: 'a',
  },
  {
    id: 'e-c3-gnd',
    source: 'c3',
    sourceHandle: 'b',
    target: 'gnd-tone',
    targetHandle: 'gnd',
  },
  {
    id: 'e-r6-c4',
    source: 'r6',
    sourceHandle: 'b',
    target: 'c4',
    targetHandle: 'a',
  },
  {
    id: 'e-c4-vol',
    source: 'c4',
    sourceHandle: 'b',
    target: 'vol',
    targetHandle: 'ccw',
  },
  {
    id: 'e-vol-out',
    source: 'vol',
    sourceHandle: 'wiper',
    target: 'out',
    targetHandle: 'in',
  },
  {
    id: 'e-vol-gnd',
    source: 'vol',
    sourceHandle: 'cw',
    target: 'gnd-vol',
    targetHandle: 'gnd',
  },
];

export const EXAMPLES: Array<ExampleCircuit> = [
  {
    id: 'procorat',
    name: 'ProCo RAT',
    description:
      'Classic distortion pedal. LM308 inverting gain stage with 1N914 hard clipping in feedback, RC tone control.',
    tags: ['distortion', 'fuzz', 'guitar'],
    nodes: ratNodes,
    edges: ratEdges,
  },
];
