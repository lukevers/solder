import { resampleAllTraces } from '../lib/audio-convert';
import { SAMPLE_RATE } from '../lib/constants';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { compileAnalysisNetlist } from '../lib/netlist';
import type { AnalyzeRequest, AnalyzeResponse } from '../lib/types';

/** Maximum total bytes we allow the resampled trace set to occupy (~128 MB). */
const MAX_TRACE_BYTES = 128 * 1024 * 1024;

const engine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<AnalyzeRequest>) => {
  if (e.data.type !== 'analyze') {
    return;
  }

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

    // Pre-flight memory estimate: traceCount * samplesPerTrace * 4 bytes
    const maxTime = output.timeValues[output.timeValues.length - 1] ?? 0;
    const samplesPerTrace = Math.round(maxTime * SAMPLE_RATE);
    const estimatedBytes = output.traces.size * samplesPerTrace * 4;
    if (estimatedBytes > MAX_TRACE_BYTES) {
      throw new Error(
        `Analysis would allocate ~${Math.round(estimatedBytes / 1024 / 1024)} MB for ${output.traces.size} traces. Reduce circuit complexity or duration.`,
      );
    }

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

    self.postMessage(response, {
      transfer: transferables as Array<Transferable>,
    });
  } catch (err) {
    const response: AnalyzeResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };

    self.postMessage(response);
  }
};
