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
export type PotTaper = 'linear' | 'log' | 'antilog';
export type PotData = {
  label: string;
  ohms: number;
  position: number;
  taper?: PotTaper;
};
export type LabelData = { label: string };

type NodeBase = { id: string; position: XYPosition; rotation?: number };

export type ComponentNode =
  | (NodeBase & { type: 'resistor'; data: ResistorData })
  | (NodeBase & { type: 'capacitor'; data: CapacitorData })
  | (NodeBase & { type: 'opamp'; data: OpAmpData })
  | (NodeBase & { type: 'power'; data: PowerData })
  | (NodeBase & { type: 'ground'; data: GroundData })
  | (NodeBase & { type: 'audiin'; data: InputData })
  | (NodeBase & { type: 'audiout'; data: OutputData })
  | (NodeBase & { type: 'diode'; data: DiodeData })
  | (NodeBase & { type: 'pot'; data: PotData })
  | (NodeBase & { type: 'cap_polar'; data: CapacitorData })
  | (NodeBase & { type: 'label'; data: LabelData });

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

// Pot sweep
export const SWEEP_POSITIONS = [0, 0.25, 0.5, 0.75, 1.0] as const;

export type SweepResult = {
  position: number;
  outputBuffer: Float32Array;
};

// Audio source
export type AudioSource = { type: 'sample'; name: string } | { type: 'live' };

export function isEdgeDC(
  srcType?: ComponentNode['type'],
  tgtType?: ComponentNode['type'],
): boolean {
  return (
    srcType === 'power' ||
    srcType === 'ground' ||
    tgtType === 'power' ||
    tgtType === 'ground'
  );
}
