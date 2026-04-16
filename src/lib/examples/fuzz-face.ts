// src/lib/examples/fuzz-face.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export const fuzzFaceNodes: Array<ComponentNode> = [
  // ── Input chain ──
  {
    id: 'ff-in',
    type: 'audiin',
    position: { x: 40, y: 340 },
    data: { label: 'INPUT' },
  },
  {
    id: 'ff-gnd_in',
    type: 'ground',
    position: { x: 80, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'ff-c1',
    type: 'cap_polar',
    position: { x: 220, y: 340 },
    data: { label: 'C1', farads: 2.2e-6 },
  },

  // ── Q1 — first stage ──
  {
    id: 'ff-q1',
    type: 'bjt',
    position: { x: 400, y: 320 },
    data: { label: 'Q1', polarity: 'PNP', model: 'AC128' },
  },
  {
    id: 'ff-r1',
    type: 'resistor',
    position: { x: 520, y: 160 },
    data: { label: 'R1', ohms: 33000 },
  },
  {
    id: 'ff-vcc',
    type: 'power',
    position: { x: 520, y: 40 },
    data: { label: 'VCC', volts: -9 },
  },
  {
    id: 'ff-gnd_q1',
    type: 'ground',
    position: { x: 520, y: 440 },
    data: { label: 'GND' },
  },

  // ── Q2 — second stage ──
  {
    id: 'ff-q2',
    type: 'bjt',
    position: { x: 660, y: 320 },
    data: { label: 'Q2', polarity: 'PNP', model: 'AC128' },
  },
  {
    id: 'ff-r2',
    type: 'resistor',
    position: { x: 780, y: 180 },
    data: { label: 'R2', ohms: 470 },
  },
  {
    id: 'ff-r3',
    type: 'resistor',
    position: { x: 780, y: 80 },
    data: { label: 'R3', ohms: 8200 },
  },
  {
    id: 'ff-vcc2',
    type: 'power',
    position: { x: 780, y: 0 },
    data: { label: 'VCC', volts: -9 },
  },

  // ── Q2 emitter network ──
  {
    id: 'ff-r4',
    type: 'resistor',
    position: { x: 540, y: 500 },
    data: { label: 'R4', ohms: 100000 },
  },
  {
    id: 'ff-fuzz',
    type: 'pot',
    position: { x: 780, y: 440 },
    data: { label: 'FUZZ', ohms: 1000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'ff-c2',
    type: 'cap_polar',
    position: { x: 780, y: 560 },
    data: { label: 'C2', farads: 20e-6 },
  },
  {
    id: 'ff-gnd_e',
    type: 'ground',
    position: { x: 820, y: 660 },
    data: { label: 'GND' },
  },

  // ── Output chain ──
  {
    id: 'ff-c3',
    type: 'capacitor',
    position: { x: 940, y: 340 },
    data: { label: 'C3', farads: 10e-9 },
  },
  {
    id: 'ff-vol',
    type: 'pot',
    position: { x: 1120, y: 340 },
    data: { label: 'VOL', ohms: 500000, position: 0.8, taper: 'log' },
  },
  {
    id: 'ff-gnd_vol',
    type: 'ground',
    position: { x: 1160, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'ff-out',
    type: 'audiout',
    position: { x: 1300, y: 340 },
    data: { label: 'OUTPUT' },
  },
  {
    id: 'ff-gnd_out',
    type: 'ground',
    position: { x: 1340, y: 460 },
    data: { label: 'GND' },
  },
];

export const fuzzFaceEdges: Array<Edge> = [
  // Input chain
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

  // Q1 collector load & inter-stage coupling
  {
    id: 'ff-e4',
    source: 'ff-q1',
    sourceHandle: 'c',
    target: 'ff-r1',
    targetHandle: 'a',
  },
  {
    id: 'ff-e5',
    source: 'ff-r1',
    sourceHandle: 'b',
    target: 'ff-vcc',
    targetHandle: 'pos',
  },
  {
    id: 'ff-e6',
    source: 'ff-q1',
    sourceHandle: 'e',
    target: 'ff-gnd_q1',
    targetHandle: 'gnd',
  },
  {
    id: 'ff-e7',
    source: 'ff-q1',
    sourceHandle: 'c',
    target: 'ff-q2',
    targetHandle: 'b',
  },

  // Q2 collector load (R2 + R3 in series)
  {
    id: 'ff-e8',
    source: 'ff-q2',
    sourceHandle: 'c',
    target: 'ff-r2',
    targetHandle: 'a',
  },
  {
    id: 'ff-e9',
    source: 'ff-r2',
    sourceHandle: 'b',
    target: 'ff-r3',
    targetHandle: 'a',
  },
  {
    id: 'ff-e10',
    source: 'ff-r3',
    sourceHandle: 'b',
    target: 'ff-vcc2',
    targetHandle: 'pos',
  },

  // Q2 emitter: FUZZ pot (variable resistor — wiper + cw shorted to ground)
  {
    id: 'ff-e11',
    source: 'ff-q2',
    sourceHandle: 'e',
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

  // C2 emitter bypass cap
  {
    id: 'ff-e14',
    source: 'ff-q2',
    sourceHandle: 'e',
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

  // R4 feedback: Q2 emitter → Q1 base
  {
    id: 'ff-e16',
    source: 'ff-q2',
    sourceHandle: 'e',
    target: 'ff-r4',
    targetHandle: 'a',
  },
  {
    id: 'ff-e17',
    source: 'ff-r4',
    sourceHandle: 'b',
    target: 'ff-q1',
    targetHandle: 'b',
  },

  // Output: Q2 collector → C3 → VOL → OUT
  {
    id: 'ff-e18',
    source: 'ff-q2',
    sourceHandle: 'c',
    target: 'ff-c3',
    targetHandle: 'a',
  },
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
