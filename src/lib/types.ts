// src/lib/types.ts
import type { Edge, XYPosition } from '@xyflow/react';

export type { XYPosition };

export type ResistorData = { label: string; ohms: number };
export type CapacitorData = { label: string; farads: number };
export type OpAmpData = { label: string; model: 'TL072' | 'LM741' };
export type PowerData = { label: string; volts: number };
export type GroundData = { label: string };
export type InputData = { label: string };
export type OutputData = { label: string };
export type DiodeData = { label: string; model: '1N914' | '1N4001' };
export type PotData = { label: string; ohms: number; position: number };
export type LabelData = { label: string };

export type ComponentNode =
  | { id: string; type: 'resistor'; position: XYPosition; data: ResistorData }
  | { id: string; type: 'capacitor'; position: XYPosition; data: CapacitorData }
  | { id: string; type: 'opamp'; position: XYPosition; data: OpAmpData }
  | { id: string; type: 'power'; position: XYPosition; data: PowerData }
  | { id: string; type: 'ground'; position: XYPosition; data: GroundData }
  | { id: string; type: 'audiin'; position: XYPosition; data: InputData }
  | { id: string; type: 'audiout'; position: XYPosition; data: OutputData }
  | { id: string; type: 'diode'; position: XYPosition; data: DiodeData }
  | { id: string; type: 'pot'; position: XYPosition; data: PotData }
  | { id: string; type: 'label'; position: XYPosition; data: LabelData };

export type CircuitState = {
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

// Worker message types
export type SimulateRequest = {
  type: 'simulate';
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  duration: number;
  frequency: number;
  amplitude: number;
  /** Raw audio samples to use as PWL voltage source; absent → use SIN test tone */
  inputBuffer?: Float32Array;
  /** Sample rate of inputBuffer (default 44100) */
  inputSampleRate?: number;
};

export type SimulateResponse =
  | { type: 'result'; outputBuffer: Float32Array }
  | { type: 'error'; message: string };

// Audio source
export type AudioSource = { type: 'sample'; name: string } | { type: 'live' };
