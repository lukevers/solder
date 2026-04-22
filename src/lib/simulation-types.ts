// Simulation and worker message types.
//
// These types define the IPC contract between the
// main thread and the Web Worker threads that run
// SPICE simulations and circuit analysis.

import type { Edge } from '@xyflow/react';

import type { ComponentNode } from './types';

// ── Simulation ───────────────────────────────────────────

/**
 * Message sent from the main thread to the
 * simulation Web Worker to kick off a SPICE
 * transient analysis.
 *
 * The worker compiles a netlist from the nodes
 * and edges, runs it through the eecircuit
 * engine, and returns a SimulateResponse.
 */
export type SimulateRequest = {
  type: 'simulate';
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  duration: number;
  frequency: number;
  amplitude: number;

  /**
   * Raw audio samples to use as a PWL voltage
   * source. When absent, the worker generates a
   * SIN test tone instead.
   */
  inputBuffer?: Float32Array;

  /**
   * Sample rate of inputBuffer (default 44100).
   */
  inputSampleRate?: number;
};

/**
 * Response from the simulation Web Worker.
 *
 * Either a successful result containing the
 * output audio buffer, or an error with a
 * human-readable message.
 */
export type SimulateResponse =
  | { type: 'result'; outputBuffer: Float32Array }
  | { type: 'error'; message: string };

// ── Pot sweep ────────────────────────────────────────────

/**
 * Fixed potentiometer positions used for sweep
 * analysis.
 *
 * The sweep runs one simulation per position
 * (0%, 25%, 50%, 75%, 100%) so the user can
 * hear how the pot affects the output.
 */
export const SWEEP_POSITIONS = [0, 0.25, 0.5, 0.75, 1.0] as const;

/**
 * Result of a single pot-sweep simulation at
 * one position value.
 */
export type SweepResult = {
  position: number;
  outputBuffer: Float32Array;
};

// ── Audio source ─────────────────────────────────────────

/**
 * Describes where the input audio comes from.
 *
 * Simulation currently uses pre-loaded sample
 * files only.
 */
export type LocalSample = {
  id: string;
  name: string;
};

export type AudioSource =
  | { type: 'sample'; name: string }
  | { type: 'local-sample'; id: string; name: string };

// ── Circuit analysis ─────────────────────────────────────

/**
 * Waveform shape for the test signal used in
 * circuit analysis mode.
 */
export type WaveformType = 'sine' | 'square' | 'triangle' | 'sawtooth';

/**
 * Message sent from the main thread to the
 * analysis Web Worker. Similar to SimulateRequest
 * but uses a generated waveform (not audio input)
 * and captures multiple node voltages.
 */
export type AnalyzeRequest = {
  type: 'analyze';
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  duration: number;
  frequency: number;
  amplitude: number;
  waveform: WaveformType;
};

/**
 * Voltage trace data for a single node in the
 * circuit, as returned by analysis.
 */
export type AnalyzeTraceData = {
  node: string;
  values: Float32Array;
};

/**
 * Response from the analysis Web Worker.
 *
 * Either a successful result with per-node
 * voltage traces and the output sample rate,
 * or an error with a human-readable message.
 */
export type AnalyzeResponse =
  | {
      type: 'result';
      traces: Array<AnalyzeTraceData>;
      sampleRate: number;
    }
  | { type: 'error'; message: string };
