// src/lib/types.ts
import type { Edge, XYPosition } from '@xyflow/react'

export type { XYPosition }

export type ResistorData = { label: string; ohms: number }
export type CapacitorData = { label: string; farads: number }
export type OpAmpData = { label: string; model: 'TL072' | 'LM741' }
export type PowerData = { label: string; volts: number }
export type GroundData = { label: string }
export type InputData = { label: string }
export type OutputData = { label: string }

export type ComponentNode =
  | { id: string; type: 'resistor';  position: XYPosition; data: ResistorData }
  | { id: string; type: 'capacitor'; position: XYPosition; data: CapacitorData }
  | { id: string; type: 'opamp';     position: XYPosition; data: OpAmpData }
  | { id: string; type: 'power';     position: XYPosition; data: PowerData }
  | { id: string; type: 'ground';    position: XYPosition; data: GroundData }
  | { id: string; type: 'input';     position: XYPosition; data: InputData }
  | { id: string; type: 'output';    position: XYPosition; data: OutputData }

export type CircuitState = {
  nodes: ComponentNode[]
  edges: Edge[]
}

// Worker message types
export type SimulateRequest = {
  type: 'simulate'
  netlist: string
  inputBuffer: Float32Array
}

export type SimulateResponse =
  | { type: 'result'; outputBuffer: Float32Array }
  | { type: 'error'; message: string }

// Audio source
export type AudioSource =
  | { type: 'sample'; name: string }
  | { type: 'live' }
