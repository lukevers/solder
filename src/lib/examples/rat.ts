// src/lib/examples/rat.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';
import { fuzzFaceNodes, fuzzFaceEdges } from './fuzz-face';

export type ExampleCircuit = {
  id: string;
  name: string;
  description: string;
  tags: Array<string>;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

const ratNodes: Array<ComponentNode> = [
  // ── Input chain (y=340) ──
  {
    id: 'rat-in',
    type: 'audiin',
    position: { x: 40, y: 340 },
    data: { label: 'INPUT' },
  },
  {
    id: 'rat-gnd_in',
    type: 'ground',
    position: { x: 80, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'rat-c1',
    type: 'capacitor',
    position: { x: 220, y: 340 },
    data: { label: 'C1', farads: 47e-9 },
  },
  {
    id: 'rat-r1',
    type: 'resistor',
    position: { x: 400, y: 340 },
    data: { label: 'R1', ohms: 47 },
  },
  {
    id: 'rat-r2',
    type: 'resistor',
    position: { x: 580, y: 340 },
    data: { label: 'R2', ohms: 1000 },
  },

  // ── Op-amp ──
  {
    id: 'rat-u1',
    type: 'opamp',
    position: { x: 780, y: 300 },
    data: { label: 'U1', model: 'TL072' },
  },

  // ── Bias (above signal path) ──
  {
    id: 'rat-vcc',
    type: 'power',
    position: { x: 580, y: 40 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'rat-vcc2',
    type: 'power',
    position: { x: 820, y: 220 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'rat-rbias1',
    type: 'resistor',
    position: { x: 580, y: 160 },
    data: { label: 'R3', ohms: 47000 },
  },
  {
    id: 'rat-rbias2',
    type: 'resistor',
    position: { x: 760, y: 160 },
    data: { label: 'R4', ohms: 47000 },
  },
  {
    id: 'rat-gnd_b',
    type: 'ground',
    position: { x: 860, y: 200 },
    data: { label: 'GND' },
  },

  // ── Op-amp ground ──
  {
    id: 'rat-gnd_u',
    type: 'ground',
    position: { x: 820, y: 460 },
    data: { label: 'GND' },
  },

  // ── Feedback: R5 + DIST (above, y=80) ──
  {
    id: 'rat-rfb',
    type: 'resistor',
    position: { x: 920, y: 80 },
    data: { label: 'R5', ohms: 2200 },
  },
  {
    id: 'rat-rdist',
    type: 'pot',
    position: { x: 1100, y: 120 },
    data: { label: 'DIST', ohms: 500000, position: 0.5, taper: 'linear' },
  },

  // ── Feedback: C2 (top, y=20) ──
  {
    id: 'rat-cfb',
    type: 'capacitor',
    position: { x: 920, y: 20 },
    data: { label: 'C2', farads: 100e-12 },
  },

  // ── Clipping diodes (below, y=460/540) ──
  {
    id: 'rat-d1',
    type: 'diode',
    position: { x: 680, y: 460 },
    data: { label: 'D1', model: '1N914' },
  },
  {
    id: 'rat-d2',
    type: 'diode',
    position: { x: 680, y: 540 },
    data: { label: 'D2', model: '1N914' },
  },

  // ── Tone + output (y=340) ──
  {
    id: 'rat-filter',
    type: 'pot',
    position: { x: 1060, y: 340 },
    data: { label: 'FILTER', ohms: 100000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'rat-ctone',
    type: 'capacitor',
    position: { x: 1060, y: 440 },
    data: { label: 'C3', farads: 3.3e-9 },
  },
  {
    id: 'rat-gnd_t',
    type: 'ground',
    position: { x: 1100, y: 540 },
    data: { label: 'GND' },
  },
  {
    id: 'rat-cout',
    type: 'cap_polar',
    position: { x: 1240, y: 340 },
    data: { label: 'C4', farads: 1e-6 },
  },
  {
    id: 'rat-vol',
    type: 'pot',
    position: { x: 1420, y: 340 },
    data: { label: 'VOL', ohms: 100000, position: 0.8, taper: 'log' },
  },
  {
    id: 'rat-gnd_v',
    type: 'ground',
    position: { x: 1460, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'rat-out',
    type: 'audiout',
    position: { x: 1600, y: 340 },
    data: { label: 'OUTPUT' },
  },
  {
    id: 'rat-gnd_out',
    type: 'ground',
    position: { x: 1640, y: 460 },
    data: { label: 'GND' },
  },
];

const ratEdges: Array<Edge> = [
  {
    id: 'rat-e1',
    source: 'rat-in',
    sourceHandle: 'pos',
    target: 'rat-c1',
    targetHandle: 'a',
  },
  {
    id: 'rat-e_in_gnd',
    source: 'rat-in',
    sourceHandle: 'neg',
    target: 'rat-gnd_in',
    targetHandle: 'gnd',
  },
  {
    id: 'rat-e2',
    source: 'rat-c1',
    sourceHandle: 'b',
    target: 'rat-r1',
    targetHandle: 'a',
  },
  {
    id: 'rat-e3',
    source: 'rat-r1',
    sourceHandle: 'b',
    target: 'rat-r2',
    targetHandle: 'a',
  },
  {
    id: 'rat-e4',
    source: 'rat-r2',
    sourceHandle: 'b',
    target: 'rat-u1',
    targetHandle: 'in_neg',
  },
  {
    id: 'rat-e5',
    source: 'rat-vcc2',
    sourceHandle: 'pos',
    target: 'rat-u1',
    targetHandle: 'vcc',
  },
  {
    id: 'rat-e6',
    source: 'rat-vcc',
    sourceHandle: 'pos',
    target: 'rat-rbias1',
    targetHandle: 'a',
  },
  {
    id: 'rat-e7',
    source: 'rat-rbias1',
    sourceHandle: 'b',
    target: 'rat-rbias2',
    targetHandle: 'a',
  },
  {
    id: 'rat-e8',
    source: 'rat-rbias1',
    sourceHandle: 'b',
    target: 'rat-u1',
    targetHandle: 'in_pos',
  },
  {
    id: 'rat-e9',
    source: 'rat-rbias2',
    sourceHandle: 'b',
    target: 'rat-gnd_b',
    targetHandle: 'gnd',
  },
  {
    id: 'rat-e10',
    source: 'rat-gnd_u',
    sourceHandle: 'gnd',
    target: 'rat-u1',
    targetHandle: 'gnd',
  },
  {
    id: 'rat-e11',
    source: 'rat-u1',
    sourceHandle: 'out',
    target: 'rat-rfb',
    targetHandle: 'a',
  },
  {
    id: 'rat-e12',
    source: 'rat-rfb',
    sourceHandle: 'b',
    target: 'rat-rdist',
    targetHandle: 'cw',
  },
  {
    id: 'rat-e13',
    source: 'rat-rdist',
    sourceHandle: 'wiper',
    target: 'rat-u1',
    targetHandle: 'in_neg',
  },
  {
    id: 'rat-e14',
    source: 'rat-u1',
    sourceHandle: 'out',
    target: 'rat-cfb',
    targetHandle: 'a',
  },
  {
    id: 'rat-e15',
    source: 'rat-cfb',
    sourceHandle: 'b',
    target: 'rat-u1',
    targetHandle: 'in_neg',
  },
  {
    id: 'rat-e16',
    source: 'rat-r2',
    sourceHandle: 'b',
    target: 'rat-d1',
    targetHandle: 'a',
  },
  {
    id: 'rat-e17',
    source: 'rat-d1',
    sourceHandle: 'k',
    target: 'rat-rfb',
    targetHandle: 'a',
  },
  {
    id: 'rat-e18',
    source: 'rat-u1',
    sourceHandle: 'out',
    target: 'rat-d2',
    targetHandle: 'a',
  },
  {
    id: 'rat-e19',
    source: 'rat-d2',
    sourceHandle: 'k',
    target: 'rat-u1',
    targetHandle: 'in_neg',
  },
  {
    id: 'rat-e20',
    source: 'rat-u1',
    sourceHandle: 'out',
    target: 'rat-cout',
    targetHandle: 'pos',
  },
  {
    id: 'rat-e20b',
    source: 'rat-u1',
    sourceHandle: 'out',
    target: 'rat-filter',
    targetHandle: 'cw',
  },
  {
    id: 'rat-e21',
    source: 'rat-filter',
    sourceHandle: 'wiper',
    target: 'rat-ctone',
    targetHandle: 'a',
  },
  {
    id: 'rat-e22',
    source: 'rat-ctone',
    sourceHandle: 'b',
    target: 'rat-gnd_t',
    targetHandle: 'gnd',
  },
  {
    id: 'rat-e24',
    source: 'rat-cout',
    sourceHandle: 'neg',
    target: 'rat-vol',
    targetHandle: 'ccw',
  },
  {
    id: 'rat-e25',
    source: 'rat-vol',
    sourceHandle: 'wiper',
    target: 'rat-out',
    targetHandle: 'pos',
  },
  {
    id: 'rat-e_out_gnd',
    source: 'rat-gnd_out',
    sourceHandle: 'gnd',
    target: 'rat-out',
    targetHandle: 'neg',
  },
  {
    id: 'rat-e26',
    source: 'rat-vol',
    sourceHandle: 'cw',
    target: 'rat-gnd_v',
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
  {
    id: 'fuzzface',
    name: 'Fuzz Face',
    description:
      'Two-transistor PNP germanium fuzz. AC128 common-emitter stages with shunt-series feedback (R4) for the classic 60s fuzz tone.',
    tags: ['fuzz', 'guitar', 'vintage'],
    nodes: fuzzFaceNodes,
    edges: fuzzFaceEdges,
  },
];
