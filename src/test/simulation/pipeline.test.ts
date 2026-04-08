// @vitest-environment node
//
// Full pipeline tests: compile -> simulate -> audio buffer conversion,
// PWL source determinism, and PWL with long audio buffers.
//
// These tests verify the complete data flow that happens when a user clicks
// "Simulate" in the app. Each step could silently corrupt the data (wrong
// sample rate, bad interpolation, normalization to zero). The PWL tests
// verify the path used when simulating with real guitar samples.

import type { Edge } from '@xyflow/react';
import { beforeAll, describe, expect, it } from 'vitest';
import { voltageToAudioBuffer } from '../../lib/audio-convert';
import { compileNetlist } from '../../lib/netlist';
import type { ComponentNode } from '../../lib/types';
import { engine, makeCircuit, peak, snapshot } from './setup';

beforeAll(async () => {
  await engine.init();
}, 15000);

// ┌──────────────────────────────────────────────────────────────────┐
// │  FULL PIPELINE — compile → simulate → voltageToAudioBuffer       │
// │                                                                  │
// │  Tests the complete data flow that happens when a user clicks    │
// │  "Simulate" in the app:                                          │
// │                                                                  │
// │    ComponentNodes + Edges                                        │
// │         │  compileNetlist()                                      │
// │         ▼                                                        │
// │    SPICE netlist string                                          │
// │         │  engine.run()                                          │
// │         ▼                                                        │
// │    { timeValues, voltageValues }  (variable-step Float64)        │
// │         │  voltageToAudioBuffer()                                │
// │         ▼                                                        │
// │    Float32Array @ 44100 Hz  (ready for Web Audio playback)       │
// │                                                                  │
// │  Why it matters: each step could silently corrupt the data       │
// │  (wrong sample rate, bad interpolation, normalization to zero).  │
// │  This end-to-end test catches integration bugs between layers.   │
// └──────────────────────────────────────────────────────────────────┘
describe('full pipeline: compile → simulate → audio buffer', () => {
  it('produces a valid, non-silent Float32Array at 44100 Hz', async () => {
    const { nodes, edges } = makeCircuit(
      [
        {
          id: 'r1',
          type: 'resistor',
          position: { x: 100, y: 0 },
          data: { label: 'R1', ohms: 1000 },
        },
      ],
      [
        {
          id: 'e1',
          source: 'in',
          sourceHandle: 'out',
          target: 'r1',
          targetHandle: 'a',
        },
        {
          id: 'e2',
          source: 'r1',
          sourceHandle: 'b',
          target: 'out',
          targetHandle: 'in',
        },
      ],
    );
    const netlist = compileNetlist(nodes, edges, 0.01, 1000, 1.0);
    const output = await engine.run(netlist);
    const audio = voltageToAudioBuffer(output, 44100);

    expect(audio).toBeInstanceOf(Float32Array);
    // 0.01s at 44100 Hz = 441 samples
    expect(audio.length).toBe(441);
    // Should be normalized: peak ≈ 1.0
    expect(peak(audio)).toBeCloseTo(1.0, 1);
    // Should contain both positive and negative values (it's a sine)
    expect(Math.min(...audio)).toBeLessThan(-0.5);
    expect(Math.max(...audio)).toBeGreaterThan(0.5);
  });
});

// ┌──────────────────────────────────────────────────────────────────┐
// │  PWL SOURCE DETERMINISM                                          │
// │                                                                  │
// │  Instead of a SIN test tone, feed a real audio buffer (a short   │
// │  synthetic waveform) through the netlist as a PWL voltage source │
// │  and snapshot the output. This tests the entire PWL code path:   │
// │                                                                  │
// │    Float32Array (44100 Hz)                                       │
// │         │  buildPwlSource() — downsamples to 10 kHz              │
// │         ▼                                                        │
// │    PWL(0 0.0 0.0001 0.5 0.0002 1.0 ...)                          │
// │         │  ngspice transient analysis                            │
// │         ▼                                                        │
// │    variable-step output                                          │
// │                                                                  │
// │  Why it matters: this is the path used when simulating with a    │
// │  real guitar sample. If PWL downsampling or formatting changes,  │
// │  the snapshot breaks.                                            │
// └──────────────────────────────────────────────────────────────────┘
describe('PWL source determinism', () => {
  it('synthetic buffer through passthrough produces deterministic output', async () => {
    const { nodes, edges } = makeCircuit(
      [],
      [
        {
          id: 'e1',
          source: 'in',
          sourceHandle: 'out',
          target: 'out',
          targetHandle: 'in',
        },
      ],
    );
    // Create a short 1kHz sine at 44100 Hz, 0.005s = 220.5 samples
    const sampleRate = 44100;
    const duration = 0.005;
    const numSamples = Math.round(sampleRate * duration);
    const buf = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buf[i] = Math.sin(2 * Math.PI * 1000 * (i / sampleRate));
    }

    const netlist = compileNetlist(
      nodes,
      edges,
      duration,
      1000,
      1.0,
      buf,
      sampleRate,
    );
    const output = await engine.run(netlist);

    expect(output.voltageValues.length).toBeGreaterThan(0);
    expect(snapshot(output.voltageValues, 10)).toMatchSnapshot();
  });
});

// ┌──────────────────────────────────────────────────────────────────┐
// │  PWL WITH LONG AUDIO BUFFER                                      │
// │                                                                  │
// │  Real guitar samples are ~2 seconds at 44100 Hz = 88,200        │
// │  samples. The PWL source downsamples to 10,000 Hz, producing    │
// │  ~20,000 breakpoints. This tests that the SPICE engine handles  │
// │  many breakpoints without errors or performance issues.          │
// │                                                                  │
// │  We simulate 0.1 seconds (4,410 samples → ~1,000 breakpoints)  │
// │  as a realistic sub-sample test.                                │
// │                                                                  │
// │  Why it matters: the PWL source is how real audio reaches the   │
// │  SPICE engine. Short test buffers (8 samples) don't stress the  │
// │  breakpoint handling the way real audio does.                   │
// └──────────────────────────────────────────────────────────────────┘
describe('PWL with long audio buffer', () => {
  it('handles 4410 samples without error', async () => {
    const { nodes, edges } = makeCircuit(
      [
        {
          id: 'r1',
          type: 'resistor',
          position: { x: 100, y: 0 },
          data: { label: 'R1', ohms: 1000 },
        },
        {
          id: 'c1',
          type: 'capacitor',
          position: { x: 200, y: 0 },
          data: { label: 'C1', farads: 100e-9 },
        },
        {
          id: 'g1',
          type: 'ground',
          position: { x: 200, y: 100 },
          data: { label: 'GND' },
        },
      ],
      [
        {
          id: 'e1',
          source: 'in',
          sourceHandle: 'out',
          target: 'r1',
          targetHandle: 'a',
        },
        {
          id: 'e2',
          source: 'r1',
          sourceHandle: 'b',
          target: 'c1',
          targetHandle: 'a',
        },
        {
          id: 'e3',
          source: 'r1',
          sourceHandle: 'b',
          target: 'out',
          targetHandle: 'in',
        },
        {
          id: 'e4',
          source: 'c1',
          sourceHandle: 'b',
          target: 'g1',
          targetHandle: 'gnd',
        },
      ],
    );

    // 0.1 seconds of 440 Hz sine at 44100 Hz = 4410 samples
    const sampleRate = 44100;
    const duration = 0.1;
    const numSamples = Math.round(sampleRate * duration);
    const buf = new Float32Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
      buf[i] = Math.sin(2 * Math.PI * 440 * (i / sampleRate));
    }

    const netlist = compileNetlist(
      nodes,
      edges,
      duration,
      440,
      1.0,
      buf,
      sampleRate,
    );
    const output = await engine.run(netlist);

    expect(output.timeValues.length).toBeGreaterThan(0);
    expect(output.voltageValues.length).toBeGreaterThan(0);
    // Should produce a filtered version of the 440 Hz input
    const peakV = peak(output.voltageValues, 0.1);
    expect(peakV).toBeGreaterThan(0.1);

    // Convert to audio buffer — should produce reasonable output
    const audio = voltageToAudioBuffer(output, sampleRate);
    expect(audio.length).toBeGreaterThan(4000);
  });
});
