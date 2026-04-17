// src/lib/examples/distortion-plus.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../../types';

export const distortionPlusNodes: Array<ComponentNode> = [
  // ── Input chain ──
  {
    id: 'mxr-in',
    type: 'jack',
    position: { x: 40, y: 340 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'mxr-gnd_in',
    type: 'ground',
    position: { x: 100, y: 440 },
    data: { label: 'GND' },
  },
  // Junction at input (splits to R1 and C1 RF filter)
  {
    id: 'mxr-jct-in',
    type: 'junction',
    position: { x: 160, y: 340 },
    data: { label: 'J1' },
  },
  {
    id: 'mxr-c1',
    type: 'capacitor',
    position: { x: 140, y: 440 },
    rotation: 90,
    data: { label: 'C1', farads: 1e-9 },
  },
  {
    id: 'mxr-gnd_c1',
    type: 'ground',
    position: { x: 140, y: 500 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-r1',
    type: 'resistor',
    position: { x: 240, y: 340 },
    data: { label: 'R1', ohms: 10000 },
  },
  {
    id: 'mxr-c2',
    type: 'capacitor',
    position: { x: 400, y: 340 },
    data: { label: 'C2', farads: 10e-9 },
  },

  // ── Bias network (4.5V virtual ground) ──
  {
    id: 'mxr-vcc',
    type: 'power',
    position: { x: 520, y: 40 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'mxr-r6',
    type: 'resistor',
    position: { x: 500, y: 140 },
    data: { label: 'R6', ohms: 1000000 },
  },
  // Junction at bias midpoint (splits to R7, C6, R2)
  {
    id: 'mxr-jct-bias',
    type: 'junction',
    position: { x: 600, y: 140 },
    data: { label: 'J2' },
  },
  {
    id: 'mxr-r7',
    type: 'resistor',
    position: { x: 660, y: 140 },
    data: { label: 'R7', ohms: 1000000 },
  },
  {
    id: 'mxr-gnd_bias',
    type: 'ground',
    position: { x: 760, y: 180 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-c6',
    type: 'cap_polar',
    position: { x: 580, y: 240 },
    data: { label: 'C6', farads: 1e-6 },
  },
  {
    id: 'mxr-gnd_c6',
    type: 'ground',
    position: { x: 620, y: 320 },
    data: { label: 'GND' },
  },

  // ── Non-inverting input bias ──
  {
    id: 'mxr-r2',
    type: 'resistor',
    position: { x: 580, y: 380 },
    data: { label: 'R2', ohms: 1000000 },
  },

  // ── Op-amp (LM741) ──
  {
    id: 'mxr-u1',
    type: 'opamp',
    position: { x: 740, y: 300 },
    data: { label: 'U1', model: 'LM741' },
  },
  {
    id: 'mxr-vcc2',
    type: 'power',
    position: { x: 760, y: 220 },
    data: { label: 'VCC', volts: 9 },
  },
  {
    id: 'mxr-gnd_u',
    type: 'ground',
    position: { x: 760, y: 440 },
    data: { label: 'GND' },
  },

  // ── Feedback network (above signal) ──
  {
    id: 'mxr-r4',
    type: 'resistor',
    position: { x: 860, y: 100 },
    data: { label: 'R4', ohms: 1000000 },
  },
  {
    id: 'mxr-c3',
    type: 'capacitor',
    position: { x: 740, y: 100 },
    data: { label: 'C3', farads: 47e-9 },
  },
  {
    id: 'mxr-r3',
    type: 'resistor',
    position: { x: 600, y: 100 },
    data: { label: 'R3', ohms: 4700 },
  },
  {
    id: 'mxr-dist',
    type: 'pot',
    position: { x: 460, y: 140 },
    data: { label: 'DIST', ohms: 1000000, position: 0.5, taper: 'linear' },
  },
  {
    id: 'mxr-gnd_dist',
    type: 'ground',
    position: { x: 480, y: 260 },
    data: { label: 'GND' },
  },

  // ── Junction at U1 output (splits to feedback and output) ──
  {
    id: 'mxr-jct-out',
    type: 'junction',
    position: { x: 860, y: 320 },
    data: { label: 'J3' },
  },

  // ── Output coupling ──
  {
    id: 'mxr-c4',
    type: 'cap_polar',
    position: { x: 960, y: 340 },
    data: { label: 'C4', farads: 1e-6 },
  },

  // ── Clipping stage ──
  {
    id: 'mxr-r5',
    type: 'resistor',
    position: { x: 1100, y: 340 },
    data: { label: 'R5', ohms: 10000 },
  },
  // Junction at clipping node (splits to D1, D2, C5, VOL)
  {
    id: 'mxr-jct-clip',
    type: 'junction',
    position: { x: 1220, y: 340 },
    data: { label: 'J4' },
  },
  {
    id: 'mxr-d1',
    type: 'diode',
    position: { x: 1200, y: 440 },
    data: { label: 'D1', model: '1N270' },
  },
  {
    id: 'mxr-d2',
    type: 'diode',
    position: { x: 1200, y: 520 },
    data: { label: 'D2', model: '1N270' },
  },
  {
    id: 'mxr-c5',
    type: 'capacitor',
    position: { x: 1320, y: 440 },
    rotation: 90,
    data: { label: 'C5', farads: 1e-9 },
  },
  {
    id: 'mxr-gnd_clip',
    type: 'ground',
    position: { x: 1260, y: 600 },
    data: { label: 'GND' },
  },

  // ── Output volume ──
  {
    id: 'mxr-vol',
    type: 'pot',
    position: { x: 1400, y: 340 },
    data: { label: 'OUTPUT', ohms: 10000, position: 0.8, taper: 'log' },
  },
  {
    id: 'mxr-gnd_vol',
    type: 'ground',
    position: { x: 1440, y: 440 },
    data: { label: 'GND' },
  },
  {
    id: 'mxr-out',
    type: 'jack',
    position: { x: 1580, y: 340 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'mxr-gnd_out',
    type: 'ground',
    position: { x: 1560, y: 440 },
    data: { label: 'GND' },
  },
];

export const distortionPlusEdges: Array<Edge> = [
  // ── Input chain ──
  {
    id: 'mxr-e_in_pos',
    source: 'mxr-in',
    sourceHandle: 'pos',
    target: 'mxr-jct-in',
    targetHandle: 'tl',
  },
  {
    id: 'mxr-e_in_neg',
    source: 'mxr-in',
    sourceHandle: 'neg',
    target: 'mxr-gnd_in',
    targetHandle: 'gnd',
  },
  // Input junction → R1 (signal path, right)
  {
    id: 'mxr-e_jct_r1',
    source: 'mxr-jct-in',
    sourceHandle: 'sr',
    target: 'mxr-r1',
    targetHandle: 'a',
  },
  // Input junction → C1 RF filter (down)
  {
    id: 'mxr-e_jct_c1',
    source: 'mxr-jct-in',
    sourceHandle: 'sb',
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
  {
    id: 'mxr-e_vcc_r6',
    source: 'mxr-vcc',
    sourceHandle: 'pos',
    target: 'mxr-r6',
    targetHandle: 'a',
  },
  // R6 → bias junction
  {
    id: 'mxr-e_r6_jct',
    source: 'mxr-r6',
    sourceHandle: 'b',
    target: 'mxr-jct-bias',
    targetHandle: 'tl',
  },
  // Bias junction → R7 (right)
  {
    id: 'mxr-e_jct_r7',
    source: 'mxr-jct-bias',
    sourceHandle: 'sr',
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
  // Bias junction → C6 decoupling (down)
  {
    id: 'mxr-e_jct_c6',
    source: 'mxr-jct-bias',
    sourceHandle: 'sb',
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
  // Bias junction → R2 bias resistor (down to non-inverting input)
  {
    id: 'mxr-e_jct_r2',
    source: 'mxr-jct-bias',
    sourceHandle: 'sb',
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

  // ── U1 output → junction ──
  {
    id: 'mxr-e_u1_jct',
    source: 'mxr-u1',
    sourceHandle: 'out',
    target: 'mxr-jct-out',
    targetHandle: 'tl',
  },

  // ── Feedback from output junction (up) ──
  {
    id: 'mxr-e_jct_r4',
    source: 'mxr-jct-out',
    sourceHandle: 'st',
    target: 'mxr-r4',
    targetHandle: 'b',
  },
  {
    id: 'mxr-e_r4_inv',
    source: 'mxr-r4',
    sourceHandle: 'a',
    target: 'mxr-u1',
    targetHandle: 'in_neg',
  },
  // C3: inverting input → R3
  {
    id: 'mxr-e_inv_c3',
    source: 'mxr-u1',
    sourceHandle: 'in_neg',
    target: 'mxr-c3',
    targetHandle: 'b',
  },
  {
    id: 'mxr-e_c3_r3',
    source: 'mxr-c3',
    sourceHandle: 'a',
    target: 'mxr-r3',
    targetHandle: 'b',
  },
  // R3 → DIST pot
  {
    id: 'mxr-e_r3_dist',
    source: 'mxr-r3',
    sourceHandle: 'a',
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

  // ── Output coupling (right from junction) ──
  {
    id: 'mxr-e_jct_c4',
    source: 'mxr-jct-out',
    sourceHandle: 'sr',
    target: 'mxr-c4',
    targetHandle: 'pos',
  },
  {
    id: 'mxr-e_c4_r5',
    source: 'mxr-c4',
    sourceHandle: 'neg',
    target: 'mxr-r5',
    targetHandle: 'a',
  },

  // ── Clipping stage ──
  // R5 → clipping junction
  {
    id: 'mxr-e_r5_jct',
    source: 'mxr-r5',
    sourceHandle: 'b',
    target: 'mxr-jct-clip',
    targetHandle: 'tl',
  },
  // D1: junction → D1 anode (down), cathode to GND (clips positive)
  {
    id: 'mxr-e_jct_d1',
    source: 'mxr-jct-clip',
    sourceHandle: 'sb',
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
  // D2: GND → D2 anode, cathode to junction (clips negative)
  {
    id: 'mxr-e_gnd_d2',
    source: 'mxr-gnd_clip',
    sourceHandle: 'gnd',
    target: 'mxr-d2',
    targetHandle: 'a',
  },
  {
    id: 'mxr-e_d2_jct',
    source: 'mxr-d2',
    sourceHandle: 'k',
    target: 'mxr-jct-clip',
    targetHandle: 'sb',
  },
  // C5: junction → C5 (filter cap to GND)
  {
    id: 'mxr-e_jct_c5',
    source: 'mxr-jct-clip',
    sourceHandle: 'sb',
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

  // ── Output volume (right from clipping junction) ──
  {
    id: 'mxr-e_jct_vol',
    source: 'mxr-jct-clip',
    sourceHandle: 'sr',
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
