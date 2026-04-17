import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../types';
import gainStage from './circuits/gain-stage.json';
import hardClipping from './circuits/hard-clipping.json';
import highPassFilter from './circuits/high-pass-filter.json';
import lowPassFilter from './circuits/low-pass-filter.json';
import softClipping from './circuits/soft-clipping.json';
import volumePot from './circuits/volume-pot.json';
import distortionPlus from './pedals/distortion-plus.json';
import fuzzFace from './pedals/fuzz-face.json';
import rat from './pedals/rat.json';

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

const raw = [
  rat,
  fuzzFace,
  distortionPlus,
  lowPassFilter,
  highPassFilter,
  softClipping,
  hardClipping,
  gainStage,
  volumePot,
];

export const EXAMPLES: Array<ExampleCircuit> = raw as Array<ExampleCircuit>;
