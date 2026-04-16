// src/lib/examples/distortion-plus.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';

export const distortionPlusNodes: Array<ComponentNode> = [
  // ── Input chain ──
  {
    id: 'mxr-in',
    type: 'audiin',
    position: { x: 40, y: 340 },
    data: { label: 'INPUT' },
  },
  {
    id: 'mxr-gnd_in',
    type: 'ground',
    position: { x: 80, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-c1',
    type: 'capacitor',
    position: { x: 180, y: 420 },
    data: { label: 'C1', farads: 1e-9 },
  },
  {
    id: 'mxr-gnd_c1',
    type: 'ground',
    position: { x: 220, y: 520 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-r1',
    type: 'resistor',
    position: { x: 280, y: 340 },
    data: { label: 'R1', ohms: 10000 },
  },
  {
    id: 'mxr-c2',
    type: 'capacitor',
    position: { x: 460, y: 340 },
    data: { label: 'C2', farads: 10e-9 },
  },

  // ── Bias network (4.5V virtual ground) ──
  {
    id: 'mxr-vcc',
    type: 'power',
    position: { x: 560, y: 40 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'mxr-r6',
    type: 'resistor',
    position: { x: 560, y: 160 },
    data: { label: 'R6', ohms: 1000000 },
  },
  {
    id: 'mxr-r7',
    type: 'resistor',
    position: { x: 740, y: 160 },
    data: { label: 'R7', ohms: 1000000 },
  },
  {
    id: 'mxr-gnd_bias',
    type: 'ground',
    position: { x: 840, y: 200 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-c6',
    type: 'cap_polar',
    position: { x: 660, y: 260 },
    data: { label: 'C6', farads: 1e-6 },
  },
  {
    id: 'mxr-gnd_c6',
    type: 'ground',
    position: { x: 700, y: 360 },
    data: { label: 'GND' },
  },

  // ── Non-inverting input bias ──
  {
    id: 'mxr-r2',
    type: 'resistor',
    position: { x: 640, y: 400 },
    data: { label: 'R2', ohms: 1000000 },
  },

  // ── Op-amp (LM741) ──
  {
    id: 'mxr-u1',
    type: 'opamp',
    position: { x: 780, y: 320 },
    data: { label: 'U1', model: 'LM741' },
  },
  {
    id: 'mxr-vcc2',
    type: 'power',
    position: { x: 820, y: 220 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'mxr-gnd_u',
    type: 'ground',
    position: { x: 820, y: 460 },
    data: { label: 'GND' },
  },

  // ── Feedback network ──
  {
    id: 'mxr-r4',
    type: 'resistor',
    position: { x: 920, y: 100 },
    data: { label: 'R4', ohms: 1000000 },
  },
  {
    id: 'mxr-c3',
    type: 'capacitor',
    position: { x: 780, y: 100 },
    data: { label: 'C3', farads: 47e-9 },
  },
  {
    id: 'mxr-r3',
    type: 'resistor',
    position: { x: 640, y: 100 },
    data: { label: 'R3', ohms: 4700 },
  },
  {
    id: 'mxr-dist',
    type: 'pot',
    position: { x: 500, y: 140 },
    data: { label: 'DIST', ohms: 1000000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'mxr-gnd_dist',
    type: 'ground',
    position: { x: 540, y: 260 },
    data: { label: 'GND' },
  },

  // ── Output coupling ──
  {
    id: 'mxr-c4',
    type: 'cap_polar',
    position: { x: 1060, y: 340 },
    data: { label: 'C4', farads: 1e-6 },
  },

  // ── Clipping stage ──
  {
    id: 'mxr-r5',
    type: 'resistor',
    position: { x: 1240, y: 340 },
    data: { label: 'R5', ohms: 10000 },
  },
  {
    id: 'mxr-d1',
    type: 'diode',
    position: { x: 1380, y: 420 },
    data: { label: 'D1', model: '1N270' },
  },
  {
    id: 'mxr-d2',
    type: 'diode',
    position: { x: 1380, y: 500 },
    data: { label: 'D2', model: '1N270' },
  },
  {
    id: 'mxr-c5',
    type: 'capacitor',
    position: { x: 1500, y: 420 },
    data: { label: 'C5', farads: 1e-9 },
  },
  {
    id: 'mxr-gnd_clip',
    type: 'ground',
    position: { x: 1460, y: 580 },
    data: { label: 'GND' },
  },

  // ── Output volume ──
  {
    id: 'mxr-vol',
    type: 'pot',
    position: { x: 1620, y: 340 },
    data: { label: 'OUTPUT', ohms: 10000, position: 0.8, taper: 'log' },
  },
  {
    id: 'mxr-gnd_vol',
    type: 'ground',
    position: { x: 1660, y: 460 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-out',
    type: 'audiout',
    position: { x: 1800, y: 340 },
    data: { label: 'OUTPUT' },
  },
  {
    id: 'mxr-gnd_out',
    type: 'ground',
    position: { x: 1840, y: 460 },
    data: { label: 'GND' },
  },
];

export const distortionPlusEdges: Array<Edge> = [
  // ── Input chain ──
  {
    id: 'mxr-e_in_pos',
    source: 'mxr-in',
    sourceHandle: 'pos',
    target: 'mxr-r1',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_in_neg',
    source: 'mxr-in',
    sourceHandle: 'neg',
    target: 'mxr-gnd_in',
    targetHandle: 'gnd',
  },
  // C1: RF filter cap from input node to ground
  {
    id: 'mxr-e_c1_in',
    source: 'mxr-in',
    sourceHandle: 'pos',
    target: 'mxr-c1',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_c1_gnd',
    source: 'mxr-c1',
    sourceHandle: 'b',
    target: 'mxr-gnd_c1',
    targetHandle: 'gnd',
  },
  // R1 → C2 (coupling cap)
  {
    id: 'mxr-e_r1_c2',
    source: 'mxr-r1',
    sourceHandle: 'b',
    target: 'mxr-c2',
    targetHandle: 'a',
  },
  // C2 → op-amp non-inverting input
  {
    id: 'mxr-e_c2_u1',
    source: 'mxr-c2',
    sourceHandle: 'b',
    target: 'mxr-u1',
    targetHandle: 'in_pos',
  },

  // ── Bias network ──
  // VCC → R6 → R7 → GND (voltage divider for 4.5V)
  {
    id: 'mxr-e_vcc_r6',
    source: 'mxr-vcc',
    sourceHandle: 'pos',
    target: 'mxr-r6',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_r6_r7',
    source: 'mxr-r6',
    sourceHandle: 'b',
    target: 'mxr-r7',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_r7_gnd',
    source: 'mxr-r7',
    sourceHandle: 'b',
    target: 'mxr-gnd_bias',
    targetHandle: 'gnd',
  },
  // C6 decoupling: 4.5V node → C6 → GND
  {
    id: 'mxr-e_bias_c6',
    source: 'mxr-r6',
    sourceHandle: 'b',
    target: 'mxr-c6',
    targetHandle: 'pos',
  },
  {
    id: 'mxr-e_c6_gnd',
    source: 'mxr-c6',
    sourceHandle: 'neg',
    target: 'mxr-gnd_c6',
    targetHandle: 'gnd',
  },
  // R2: 4.5V bias → non-inverting input
  {
    id: 'mxr-e_bias_r2',
    source: 'mxr-r6',
    sourceHandle: 'b',
    target: 'mxr-r2',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_r2_u1',
    source: 'mxr-r2',
    sourceHandle: 'b',
    target: 'mxr-u1',
    targetHandle: 'in_pos',
  },

  // ── Op-amp power ──
  {
    id: 'mxr-e_vcc_u1',
    source: 'mxr-vcc2',
    sourceHandle: 'pos',
    target: 'mxr-u1',
    targetHandle: 'vcc',
  },
  {
    id: 'mxr-e_gnd_u1',
    source: 'mxr-gnd_u',
    sourceHandle: 'gnd',
    target: 'mxr-u1',
    targetHandle: 'gnd',
  },

  // ── Feedback network ──
  // R4: op-amp output → inverting input
  {
    id: 'mxr-e_out_r4',
    source: 'mxr-u1',
    sourceHandle: 'out',
    target: 'mxr-r4',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_r4_inv',
    source: 'mxr-r4',
    sourceHandle: 'b',
    target: 'mxr-u1',
    targetHandle: 'in_neg',
  },
  // C3: inverting input → R3
  {
    id: 'mxr-e_inv_c3',
    source: 'mxr-u1',
    sourceHandle: 'in_neg',
    target: 'mxr-c3',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_c3_r3',
    source: 'mxr-c3',
    sourceHandle: 'b',
    target: 'mxr-r3',
    targetHandle: 'a',
  },
  // R3 → DIST pot (variable resistor: CW to R3, wiper+CCW to GND)
  {
    id: 'mxr-e_r3_dist',
    source: 'mxr-r3',
    sourceHandle: 'b',
    target: 'mxr-dist',
    targetHandle: 'cw',
  },
  {
    id: 'mxr-e_dist_wiper_gnd',
    source: 'mxr-dist',
    sourceHandle: 'wiper',
    target: 'mxr-gnd_dist',
    targetHandle: 'gnd',
  },
  {
    id: 'mxr-e_dist_ccw_gnd',
    source: 'mxr-dist',
    sourceHandle: 'ccw',
    target: 'mxr-gnd_dist',
    targetHandle: 'gnd',
  },

  // ── Output coupling ──
  // Op-amp output → C4
  {
    id: 'mxr-e_u1_c4',
    source: 'mxr-u1',
    sourceHandle: 'out',
    target: 'mxr-c4',
    targetHandle: 'pos',
  },
  // C4 → R5
  {
    id: 'mxr-e_c4_r5',
    source: 'mxr-c4',
    sourceHandle: 'neg',
    target: 'mxr-r5',
    targetHandle: 'a',
  },

  // ── Clipping stage ──
  // D1: anode at clipping node, cathode to GND (clips positive)
  {
    id: 'mxr-e_r5_d1',
    source: 'mxr-r5',
    sourceHandle: 'b',
    target: 'mxr-d1',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_d1_gnd',
    source: 'mxr-d1',
    sourceHandle: 'k',
    target: 'mxr-gnd_clip',
    targetHandle: 'gnd',
  },
  // D2: anode at GND, cathode at clipping node (clips negative)
  {
    id: 'mxr-e_gnd_d2',
    source: 'mxr-gnd_clip',
    sourceHandle: 'gnd',
    target: 'mxr-d2',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_d2_clip',
    source: 'mxr-d2',
    sourceHandle: 'k',
    target: 'mxr-r5',
    targetHandle: 'b',
  },
  // C5: low-pass filter across clipping node to GND
  {
    id: 'mxr-e_clip_c5',
    source: 'mxr-r5',
    sourceHandle: 'b',
    target: 'mxr-c5',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_c5_gnd',
    source: 'mxr-c5',
    sourceHandle: 'b',
    target: 'mxr-gnd_clip',
    targetHandle: 'gnd',
  },

  // ── Output volume ──
  // Clipping node → OUTPUT pot (CW), CCW to GND, wiper to output
  {
    id: 'mxr-e_clip_vol',
    source: 'mxr-r5',
    sourceHandle: 'b',
    target: 'mxr-vol',
    targetHandle: 'ccw',
  },
  {
    id: 'mxr-e_vol_gnd',
    source: 'mxr-vol',
    sourceHandle: 'cw',
    target: 'mxr-gnd_vol',
    targetHandle: 'gnd',
  },
  {
    id: 'mxr-e_vol_out',
    source: 'mxr-vol',
    sourceHandle: 'wiper',
    target: 'mxr-out',
    targetHandle: 'pos',
  },
  {
    id: 'mxr-e_out_gnd',
    source: 'mxr-gnd_out',
    sourceHandle: 'gnd',
    target: 'mxr-out',
    targetHandle: 'neg',
  },
];
