import { voltageToAudioBuffer } from '../lib/audio-convert';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { compileNetlist } from '../lib/netlist';
import type { SpiceEngine } from '../lib/spice-engine';
import type { SimulateRequest, SimulateResponse } from '../lib/types';

const SAMPLE_RATE = 44100;

// Engine is created once; WASM loads lazily on first init() call
const engine: SpiceEngine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<SimulateRequest>) => {
  if (e.data.type !== 'simulate') {
    return;
  }

  const {
    nodes,
    edges,
    duration,
    frequency,
    amplitude,
    inputBuffer,
    inputSampleRate,
  } = e.data;

  try {
    await engine.init();
    const netlist = compileNetlist(
      nodes,
      edges,
      duration,
      frequency,
      amplitude,
      inputBuffer,
      inputSampleRate,
    );

    const output = await engine.run(netlist);
    const audioBuffer = voltageToAudioBuffer(output, SAMPLE_RATE);
    const response: SimulateResponse = {
      type: 'result',
      outputBuffer: audioBuffer,
    };

    self.postMessage(response, {
      transfer: [audioBuffer.buffer] as Array<Transferable>,
    });
  } catch (err) {
    const response: SimulateResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };

    self.postMessage(response);
  }
};
