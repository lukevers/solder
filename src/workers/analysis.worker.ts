// src/workers/analysis.worker.ts

import { resampleAllTraces } from '../lib/audio-convert';
import { SAMPLE_RATE } from '../lib/constants';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { compileAnalysisNetlist } from '../lib/netlist';
import type { AnalyzeRequest, AnalyzeResponse } from '../lib/types';

const engine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<AnalyzeRequest>) => {
  if (e.data.type !== 'analyze') return;
  const { nodes, edges, duration, frequency, amplitude, waveform } = e.data;
  try {
    await engine.init();
    const { netlist } = compileAnalysisNetlist(
      nodes,
      edges,
      duration,
      frequency,
      amplitude,
      waveform,
    );
    const output = await engine.runAnalysis(netlist);
    const resampled = resampleAllTraces(output, SAMPLE_RATE);

    const traces = [...resampled.entries()].map(([node, values]) => ({
      node,
      values,
    }));

    const transferables = traces.map((t) => t.values.buffer);
    const response: AnalyzeResponse = {
      type: 'result',
      traces,
      sampleRate: SAMPLE_RATE,
    };
    self.postMessage(response, transferables);
  } catch (err) {
    const response: AnalyzeResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
