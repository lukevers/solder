// src/lib/examples/index.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';
import { gainStageEdges, gainStageNodes } from './circuits/gain-stage';
import { hardClippingEdges, hardClippingNodes } from './circuits/hard-clipping';
import {
  highPassFilterEdges,
  highPassFilterNodes,
} from './circuits/high-pass-filter';
import {
  lowPassFilterEdges,
  lowPassFilterNodes,
} from './circuits/low-pass-filter';
import { softClippingEdges, softClippingNodes } from './circuits/soft-clipping';
import { volumePotEdges, volumePotNodes } from './circuits/volume-pot';
import {
  distortionPlusEdges,
  distortionPlusNodes,
} from './pedals/distortion-plus';
import { fuzzFaceEdges, fuzzFaceNodes } from './pedals/fuzz-face';
import { ratEdges, ratNodes } from './pedals/rat';

export type ExampleCategory = 'pedals' | 'circuits';

export type ExampleCircuit = {
  id: string;
  name: string;
  description: string;
  tags: Array<string>;
  category: ExampleCategory;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

export const EXAMPLES: Array<ExampleCircuit> = [
  // ── Pedals ──
  {
    id: 'procorat',
    name: 'ProCo RAT',
    description:
      'Classic distortion pedal. LM308 inverting gain stage with 1N914 hard clipping in feedback, RC tone control.',
    tags: ['distortion', 'fuzz', 'guitar'],
    category: 'pedals',
    nodes: ratNodes,
    edges: ratEdges,
  },
  {
    id: 'fuzzface',
    name: 'Fuzz Face',
    description:
      'Two-transistor PNP germanium fuzz. AC128 common-emitter stages with shunt-series feedback (R4) for the classic 60s fuzz tone.',
    tags: ['fuzz', 'guitar', 'vintage'],
    category: 'pedals',
    nodes: fuzzFaceNodes,
    edges: fuzzFaceEdges,
  },
  {
    id: 'distortionplus',
    name: 'MXR Distortion+',
    description:
      'Non-inverting LM741 gain stage with 1N270 germanium soft clipping. Variable gain via DIST pot in the feedback network.',
    tags: ['distortion', 'overdrive', 'guitar'],
    category: 'pedals',
    nodes: distortionPlusNodes,
    edges: distortionPlusEdges,
  },
  // ── Circuits ──
  {
    id: 'lowpassfilter',
    name: 'Low Pass Filter',
    description:
      'First-order RC low-pass filter. The CUTOFF pot acts as a variable series resistor — turning it up raises the cutoff frequency, letting more treble through.',
    tags: ['filter', 'basic'],
    category: 'circuits',
    nodes: lowPassFilterNodes,
    edges: lowPassFilterEdges,
  },
  {
    id: 'highpassfilter',
    name: 'High Pass Filter',
    description:
      'First-order CR high-pass filter. The series capacitor blocks DC and low frequencies. The CUTOFF pot shunts the signal to ground, controlling how much bass passes through.',
    tags: ['filter', 'basic'],
    category: 'circuits',
    nodes: highPassFilterNodes,
    edges: highPassFilterEdges,
  },
  {
    id: 'softclipping',
    name: 'Soft Clipping',
    description:
      'Anti-parallel germanium diodes (1N270) shunt signal to ground after a series resistor. Germanium diodes have a lower forward voltage (~0.3V), producing a gentle, rounded clipping.',
    tags: ['clipping', 'distortion', 'basic'],
    category: 'circuits',
    nodes: softClippingNodes,
    edges: softClippingEdges,
  },
  {
    id: 'hardclipping',
    name: 'Hard Clipping',
    description:
      'Anti-parallel silicon diodes (1N914) shunt signal to ground after a series resistor. Silicon diodes clip sharply at ~0.7V, producing an aggressive, squared-off waveform.',
    tags: ['clipping', 'distortion', 'basic'],
    category: 'circuits',
    nodes: hardClippingNodes,
    edges: hardClippingEdges,
  },
  {
    id: 'gainstage',
    name: 'Gain Stage',
    description:
      'Inverting op-amp gain stage with TL072. Gain is set by the ratio of R2/R1 (100k/10k = 10x). Includes bias network for single-supply operation.',
    tags: ['amplifier', 'op-amp', 'basic'],
    category: 'circuits',
    nodes: gainStageNodes,
    edges: gainStageEdges,
  },
  {
    id: 'volumepot',
    name: 'Volume Pot',
    description:
      'Simple voltage divider using a logarithmic potentiometer. The wiper taps a fraction of the input signal — turn the knob to attenuate.',
    tags: ['volume', 'attenuator', 'basic'],
    category: 'circuits',
    nodes: volumePotNodes,
    edges: volumePotEdges,
  },
];
