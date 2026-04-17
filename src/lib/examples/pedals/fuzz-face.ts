// src/lib/examples/fuzz-face.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const fuzzFaceNodes: Array<ComponentNode> = [
  // ── Input chain ──
  {
    id: 'ff-in',
    type: 'jack',
    position: { x: 40, y: 280 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'ff-gnd_in',
    type: 'ground',
    position: { x: 100, y: 380 },
    data: { label: 'GND' },
  },
  {
    id: 'ff-c1',
    type: 'cap_polar',
    position: { x: 220, y: 280 },
    data: { label: 'C1', farads: 2.2e-6 },
  },

  // ── Q1 — first stage ──
  {
    id: 'ff-q1',
    type: 'bjt',
    position: { x: 380, y: 260 },
    data: { label: 'Q1', polarity: 'PNP', model: 'AC128' },
  },
  // Junction at Q1 collector (splits to R1 and Q2.b)
  {
    id: 'ff-jct-q1c',
    type: 'junction',
    position: { x: 460, y: 240 },
    data: { label: 'J1' },
  },
  {
    id: 'ff-r1',
    type: 'resistor',
    position: { x: 440, y: 120 },
    data: { label: 'R1', ohms: 33000 },
  },
  {
    id: 'ff-vcc',
    type: 'power',
    position: { x: 500, y: 40 },
    data: { label: 'VCC', volts: -9 },
  },
  {
    id: 'ff-gnd_q1',
    type: 'ground',
    position: { x: 420, y: 380 },
    data: { label: 'GND' },
  },

  // ── Q2 — second stage ──
  {
    id: 'ff-q2',
    type: 'bjt',
    position: { x: 600, y: 260 },
    data: { label: 'Q2', polarity: 'PNP', model: 'AC128' },
  },
  // Junction at Q2 collector (splits to R2 and C3)
  {
    id: 'ff-jct-q2c',
    type: 'junction',
    position: { x: 680, y: 240 },
    data: { label: 'J2' },
  },
  {
    id: 'ff-r2',
    type: 'resistor',
    position: { x: 660, y: 140 },
    data: { label: 'R2', ohms: 470 },
  },
  {
    id: 'ff-r3',
    type: 'resistor',
    position: { x: 660, y: 60 },
    data: { label: 'R3', ohms: 8200 },
  },
  {
    id: 'ff-vcc2',
    type: 'power',
    position: { x: 720, y: 0 },
    data: { label: 'VCC', volts: -9 },
  },

  // ── Q2 emitter network ──
  // Junction at Q2 emitter (splits to FUZZ, C2, and R4 feedback)
  {
    id: 'ff-jct-q2e',
    type: 'junction',
    position: { x: 660, y: 340 },
    data: { label: 'J3' },
  },
  {
    id: 'ff-r4',
    type: 'resistor',
    position: { x: 460, y: 400 },
    data: { label: 'R4', ohms: 100000 },
  },
  {
    id: 'ff-fuzz',
    type: 'pot',
    position: { x: 720, y: 380 },
    data: { label: 'FUZZ', ohms: 1000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'ff-c2',
    type: 'cap_polar',
    position: { x: 720, y: 500 },
    data: { label: 'C2', farads: 20e-6 },
  },
  {
    id: 'ff-gnd_e',
    type: 'ground',
    position: { x: 760, y: 600 },
    data: { label: 'GND' },
  },

  // ── Output chain ──
  {
    id: 'ff-c3',
    type: 'capacitor',
    position: { x: 820, y: 280 },
    data: { label: 'C3', farads: 10e-9 },
  },
  {
    id: 'ff-vol',
    type: 'pot',
    position: { x: 960, y: 280 },
    data: { label: 'VOL', ohms: 500000, position: 0.8, taper: 'log' },
  },
  {
    id: 'ff-gnd_vol',
    type: 'ground',
    position: { x: 1000, y: 400 },
    data: { label: 'GND' },
  },
  {
    id: 'ff-out',
    type: 'jack',
    position: { x: 1140, y: 280 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'ff-gnd_out',
    type: 'ground',
    position: { x: 1120, y: 380 },
    data: { label: 'GND' },
  },
];

export const fuzzFaceEdges: Array<Edge> = [
  // ── Input chain ──
  {
    id: 'ff-e1',
    source: 'ff-in',
    sourceHandle: 'pos',
    target: 'ff-c1',
    targetHandle: 'pos',
  },
  {
    id: 'ff-e2',
    source: 'ff-in',
    sourceHandle: 'neg',
    target: 'ff-gnd_in',
    targetHandle: 'gnd',
  },
  {
    id: 'ff-e3',
    source: 'ff-c1',
    sourceHandle: 'neg',
    target: 'ff-q1',
    targetHandle: 'b',
  },

  // ── Q1 collector → junction ──
  {
    id: 'ff-e4',
    source: 'ff-q1',
    sourceHandle: 'c',
    target: 'ff-jct-q1c',
    targetHandle: 'tl',
  },
  // Junction → R1 (collector load, up to VCC)
  {
    id: 'ff-e5',
    source: 'ff-jct-q1c',
    sourceHandle: 'st',
    target: 'ff-r1',
    targetHandle: 'b',
  },
  {
    id: 'ff-e5b',
    source: 'ff-r1',
    sourceHandle: 'a',
    target: 'ff-vcc',
    targetHandle: 'pos',
  },
  // Junction → Q2.b (interstage coupling)
  {
    id: 'ff-e7',
    source: 'ff-jct-q1c',
    sourceHandle: 'sr',
    target: 'ff-q2',
    targetHandle: 'b',
  },
  // Q1 emitter to ground
  {
    id: 'ff-e6',
    source: 'ff-q1',
    sourceHandle: 'e',
    target: 'ff-gnd_q1',
    targetHandle: 'gnd',
  },

  // ── Q2 collector → junction ──
  {
    id: 'ff-e8',
    source: 'ff-q2',
    sourceHandle: 'c',
    target: 'ff-jct-q2c',
    targetHandle: 'tl',
  },
  // Junction → R2 (collector load, up)
  {
    id: 'ff-e9',
    source: 'ff-jct-q2c',
    sourceHandle: 'st',
    target: 'ff-r2',
    targetHandle: 'b',
  },
  {
    id: 'ff-e10',
    source: 'ff-r2',
    sourceHandle: 'a',
    target: 'ff-r3',
    targetHandle: 'b',
  },
  {
    id: 'ff-e10b',
    source: 'ff-r3',
    sourceHandle: 'a',
    target: 'ff-vcc2',
    targetHandle: 'pos',
  },
  // Junction → C3 (output, right)
  {
    id: 'ff-e18',
    source: 'ff-jct-q2c',
    sourceHandle: 'sr',
    target: 'ff-c3',
    targetHandle: 'a',
  },

  // ── Q2 emitter → junction ──
  {
    id: 'ff-e11a',
    source: 'ff-q2',
    sourceHandle: 'e',
    target: 'ff-jct-q2e',
    targetHandle: 'tl',
  },
  // Junction → FUZZ pot (variable emitter resistor, right)
  {
    id: 'ff-e11',
    source: 'ff-jct-q2e',
    sourceHandle: 'sr',
    target: 'ff-fuzz',
    targetHandle: 'ccw',
  },
  {
    id: 'ff-e12',
    source: 'ff-fuzz',
    sourceHandle: 'cw',
    target: 'ff-gnd_e',
    targetHandle: 'gnd',
  },
  {
    id: 'ff-e13',
    source: 'ff-fuzz',
    sourceHandle: 'wiper',
    target: 'ff-gnd_e',
    targetHandle: 'gnd',
  },
  // Junction → C2 emitter bypass cap (down)
  {
    id: 'ff-e14',
    source: 'ff-jct-q2e',
    sourceHandle: 'sb',
    target: 'ff-c2',
    targetHandle: 'pos',
  },
  {
    id: 'ff-e15',
    source: 'ff-c2',
    sourceHandle: 'neg',
    target: 'ff-gnd_e',
    targetHandle: 'gnd',
  },
  // Junction → R4 feedback (left, back to Q1 base)
  {
    id: 'ff-e16',
    source: 'ff-jct-q2e',
    sourceHandle: 'sl',
    target: 'ff-r4',
    targetHandle: 'b',
  },
  {
    id: 'ff-e17',
    source: 'ff-r4',
    sourceHandle: 'a',
    target: 'ff-q1',
    targetHandle: 'b',
  },

  // ── Output: C3 → VOL → OUT ──
  {
    id: 'ff-e19',
    source: 'ff-c3',
    sourceHandle: 'b',
    target: 'ff-vol',
    targetHandle: 'ccw',
  },
  {
    id: 'ff-e20',
    source: 'ff-vol',
    sourceHandle: 'wiper',
    target: 'ff-out',
    targetHandle: 'pos',
  },
  {
    id: 'ff-e21',
    source: 'ff-vol',
    sourceHandle: 'cw',
    target: 'ff-gnd_vol',
    targetHandle: 'gnd',
  },
  {
    id: 'ff-e22',
    source: 'ff-gnd_out',
    sourceHandle: 'gnd',
    target: 'ff-out',
    targetHandle: 'neg',
  },
];
