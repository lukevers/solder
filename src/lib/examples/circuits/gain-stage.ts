// src/lib/examples/circuits/gain-stage.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const gainStageNodes: Array<ComponentNode> = [
  // ── Input ──
  {
    id: 'gs-in',
    type: 'jack',
    position: { x: 40, y: 300 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'gs-gnd-in',
    type: 'ground',
    position: { x: 100, y: 430 },
    data: { label: 'GND' },
  },

  // ── Input coupling cap ──
  {
    id: 'gs-c1',
    type: 'capacitor',
    position: { x: 180, y: 300 },
    data: { label: 'C1', farads: 100e-9 },
  },

  // ── Input resistor (to inverting input) ──
  {
    id: 'gs-r1',
    type: 'resistor',
    position: { x: 320, y: 300 },
    data: { label: 'R1', ohms: 10000 },
  },

  // ── Bias network (4.5V virtual ground) ──
  {
    id: 'gs-vcc',
    type: 'power',
    position: { x: 440, y: 40 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'gs-rb1',
    type: 'resistor',
    position: { x: 420, y: 140 },
    data: { label: 'RB1', ohms: 100000 },
  },
  {
    id: 'gs-jct-bias',
    type: 'junction',
    position: { x: 520, y: 140 },
    data: { label: 'J1' },
  },
  {
    id: 'gs-rb2',
    type: 'resistor',
    position: { x: 580, y: 140 },
    data: { label: 'RB2', ohms: 100000 },
  },
  {
    id: 'gs-gnd-bias',
    type: 'ground',
    position: { x: 680, y: 180 },
    data: { label: 'GND' },
  },
  {
    id: 'gs-cb',
    type: 'cap_polar',
    position: { x: 500, y: 220 },
    rotation: 90,
    data: { label: 'CB', farads: 10e-6 },
  },
  {
    id: 'gs-gnd-cb',
    type: 'ground',
    position: { x: 500, y: 310 },
    data: { label: 'GND' },
  },

  // ── Op-amp ──
  {
    id: 'gs-u1',
    type: 'opamp',
    position: { x: 560, y: 260 },
    data: { label: 'U1', model: 'TL072' },
  },
  {
    id: 'gs-vcc2',
    type: 'power',
    position: { x: 580, y: 180 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'gs-gnd-u',
    type: 'ground',
    position: { x: 580, y: 400 },
    data: { label: 'GND' },
  },

  // ── Feedback resistor (gain = R2/R1) ──
  {
    id: 'gs-r2',
    type: 'resistor',
    position: { x: 620, y: 140 },
    data: { label: 'R2', ohms: 100000 },
  },

  // ── Junction at op-amp output ──
  {
    id: 'gs-jct-out',
    type: 'junction',
    position: { x: 680, y: 280 },
    data: { label: 'J2' },
  },

  // ── Output coupling cap ──
  {
    id: 'gs-c2',
    type: 'cap_polar',
    position: { x: 760, y: 280 },
    data: { label: 'C2', farads: 1e-6 },
  },

  // ── Output ──
  {
    id: 'gs-out',
    type: 'jack',
    position: { x: 900, y: 280 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'gs-gnd-out',
    type: 'ground',
    position: { x: 860, y: 430 },
    data: { label: 'GND' },
  },
];

export const gainStageEdges: Array<Edge> = [
  // Input → C1
  {
    id: 'gs-e1',
    source: 'gs-in',
    sourceHandle: 'pos',
    target: 'gs-c1',
    targetHandle: 'a',
  },
  // Input ground
  {
    id: 'gs-e2',
    source: 'gs-in',
    sourceHandle: 'neg',
    target: 'gs-gnd-in',
    targetHandle: 'gnd',
  },
  // C1 → R1
  {
    id: 'gs-e3',
    source: 'gs-c1',
    sourceHandle: 'b',
    target: 'gs-r1',
    targetHandle: 'a',
  },
  // R1 → op-amp inverting input
  {
    id: 'gs-e4',
    source: 'gs-r1',
    sourceHandle: 'b',
    target: 'gs-u1',
    targetHandle: 'in_neg',
  },

  // ── Bias network ──
  // VCC → RB1
  {
    id: 'gs-e5',
    source: 'gs-vcc',
    sourceHandle: 'pos',
    target: 'gs-rb1',
    targetHandle: 'a',
  },
  // RB1 → bias junction
  {
    id: 'gs-e6',
    source: 'gs-rb1',
    sourceHandle: 'b',
    target: 'gs-jct-bias',
    targetHandle: 'tl',
  },
  // Bias junction → RB2
  {
    id: 'gs-e7',
    source: 'gs-jct-bias',
    sourceHandle: 'sr',
    target: 'gs-rb2',
    targetHandle: 'a',
  },
  // RB2 → ground
  {
    id: 'gs-e8',
    source: 'gs-rb2',
    sourceHandle: 'b',
    target: 'gs-gnd-bias',
    targetHandle: 'gnd',
  },
  // Bias junction → CB decoupling cap
  {
    id: 'gs-e9',
    source: 'gs-jct-bias',
    sourceHandle: 'sb',
    target: 'gs-cb',
    targetHandle: 'pos',
  },
  // CB → ground
  {
    id: 'gs-e10',
    source: 'gs-cb',
    sourceHandle: 'neg',
    target: 'gs-gnd-cb',
    targetHandle: 'gnd',
  },
  // Bias junction → op-amp non-inverting input
  {
    id: 'gs-e11',
    source: 'gs-jct-bias',
    sourceHandle: 'sb',
    target: 'gs-u1',
    targetHandle: 'in_pos',
  },

  // ── Op-amp power ──
  {
    id: 'gs-e12',
    source: 'gs-vcc2',
    sourceHandle: 'pos',
    target: 'gs-u1',
    targetHandle: 'vcc',
  },
  {
    id: 'gs-e13',
    source: 'gs-gnd-u',
    sourceHandle: 'gnd',
    target: 'gs-u1',
    targetHandle: 'gnd',
  },

  // ── Op-amp output → junction ──
  {
    id: 'gs-e14',
    source: 'gs-u1',
    sourceHandle: 'out',
    target: 'gs-jct-out',
    targetHandle: 'tl',
  },

  // ── Feedback: junction → R2 → inverting input ──
  {
    id: 'gs-e15',
    source: 'gs-jct-out',
    sourceHandle: 'st',
    target: 'gs-r2',
    targetHandle: 'b',
  },
  {
    id: 'gs-e16',
    source: 'gs-r2',
    sourceHandle: 'a',
    target: 'gs-u1',
    targetHandle: 'in_neg',
  },

  // ── Output coupling ──
  {
    id: 'gs-e17',
    source: 'gs-jct-out',
    sourceHandle: 'sr',
    target: 'gs-c2',
    targetHandle: 'pos',
  },
  {
    id: 'gs-e18',
    source: 'gs-c2',
    sourceHandle: 'neg',
    target: 'gs-out',
    targetHandle: 'pos',
  },
  // Output ground
  {
    id: 'gs-e19',
    source: 'gs-gnd-out',
    sourceHandle: 'gnd',
    target: 'gs-out',
    targetHandle: 'neg',
  },
];
