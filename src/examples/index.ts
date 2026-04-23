import type { Edge } from '@xyflow/react';
import type { ComponentNode } from '../lib/types';
import gainStage from './circuits/gain-stage.json';
import hardClipping from './circuits/hard-clipping.json';
import highPassFilter from './circuits/high-pass-filter.json';
import lowPassFilter from './circuits/low-pass-filter.json';
import softClipping from './circuits/soft-clipping.json';
import volumePot from './circuits/volume-pot.json';
import distortionPlus from './pedals/distortion-plus.json';
import fuzzFace from './pedals/fuzz-face.json';
import rat from './pedals/rat.json';

/**
 * Stable runtime values for example categories.
 *
 * The examples panel, store defaults, and persisted state all refer to these
 * category ids, so the strings should not be repeated inline.
 */
export const EXAMPLE_CATEGORY = {
  pedals: 'pedals',
  circuits: 'circuits',
} as const;

/**
 * Union type for the example categories shown in the sidebar.
 */
export type ExampleCategory =
  (typeof EXAMPLE_CATEGORY)[keyof typeof EXAMPLE_CATEGORY];

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
