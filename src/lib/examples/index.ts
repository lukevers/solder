// src/lib/examples/index.ts
import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';
import {
  highPassFilterEdges,
  highPassFilterNodes,
} from './circuits/high-pass-filter';
import {
  lowPassFilterEdges,
  lowPassFilterNodes,
} from './circuits/low-pass-filter';
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
];
