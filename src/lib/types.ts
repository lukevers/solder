import type { Edge, XYPosition } from '@xyflow/react';

export type { XYPosition };

export type ResistorData = { label: string; ohms: number; symbol?: string };
export type CapacitorData = { label: string; farads: number; symbol?: string };
export type OpAmpData = {
  label: string;
  model: 'TL072' | 'LM741' | 'LM308';
  symbol?: string;
};
export type PowerData = { label: string; volts: number; symbol?: string };
export type GroundData = { label: string; symbol?: string };
export type JackData = {
  label: string;
  direction: 'in' | 'out';
  symbol?: string;
};
export type DiodeData = {
  label: string;
  model: '1N914' | '1N4001' | '1N4002' | '1N270';
  symbol?: string;
};
export type PotTaper = 'linear' | 'log' | 'antilog';
export type PotData = {
  label: string;
  ohms: number;
  position: number;
  taper?: PotTaper;
  symbol?: string;
};
export type LabelData = { label: string };
export type StickyNoteColor =
  | 'yellow'
  | 'blue'
  | 'green'
  | 'pink'
  | 'purple'
  | 'orange'
  | 'gray';
export type StickyNoteSize = 'xs' | 'sm' | 'md';
export type StickyNoteWidth = 'slim' | 'normal';
export type StickyNoteData = {
  label: string;
  text: string;
  color?: StickyNoteColor;
  size?: StickyNoteSize;
  width?: StickyNoteWidth;
};
export type BoxVariant = 'outline' | 'filled' | 'dashed';
export type BoxData = {
  label: string;
  color?: StickyNoteColor;
  variant?: BoxVariant;
};
export type JunctionData = { label: string };
export type BJTModel =
  | '2N3904'
  | '2N3906'
  | 'AC128'
  | '2N5088'
  | '2N5089'
  | 'BC108'
  | 'BC549'
  | 'MPSA18';
export type BJTData = {
  label: string;
  polarity: 'NPN' | 'PNP';
  model: BJTModel;
  symbol?: string;
};
export type JFETModel =
  | '2N5457'
  | '2N5458'
  | 'J201'
  | 'J113'
  | 'MPF102'
  | '2N5460';
export type JFETData = {
  label: string;
  polarity: 'N' | 'P';
  model: JFETModel;
  symbol?: string;
};
export type MOSFETModel = 'BS170' | 'IRF510' | 'IRF9510' | '2N7000';
export type MOSFETData = {
  label: string;
  polarity: 'N' | 'P';
  model: MOSFETModel;
  symbol?: string;
};

type NodeBase = {
  id: string;
  position: XYPosition;
  rotation?: number;
  measured?: { width?: number; height?: number };
};

export type ComponentNode =
  | (NodeBase & { type: 'resistor'; data: ResistorData })
  | (NodeBase & { type: 'capacitor'; data: CapacitorData })
  | (NodeBase & { type: 'opamp'; data: OpAmpData })
  | (NodeBase & { type: 'power'; data: PowerData })
  | (NodeBase & { type: 'ground'; data: GroundData })
  | (NodeBase & { type: 'jack'; data: JackData })
  | (NodeBase & { type: 'diode'; data: DiodeData })
  | (NodeBase & { type: 'pot'; data: PotData })
  | (NodeBase & { type: 'cap_polar'; data: CapacitorData })
  | (NodeBase & { type: 'label'; data: LabelData })
  | (NodeBase & { type: 'junction'; data: JunctionData })
  | (NodeBase & { type: 'bjt'; data: BJTData })
  | (NodeBase & { type: 'jfet'; data: JFETData })
  | (NodeBase & { type: 'mosfet'; data: MOSFETData })
  | (NodeBase & { type: 'stickynote'; data: StickyNoteData })
  | (NodeBase & {
      type: 'box';
      data: BoxData;
      style?: { width?: number; height?: number };
      dragHandle?: string;
      className?: string;
    });

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

// Circuit analysis
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export type AnalyzeRequest = {
  type: 'analyze';
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  duration: number;
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
};

export type AnalyzeTraceData = {
  node: string;
  values: Float32Array;
};

export type AnalyzeResponse =
  | { type: 'result'; traces: Array<AnalyzeTraceData>; sampleRate: number }
  | { type: 'error'; message: string };

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
