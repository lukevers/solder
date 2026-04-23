import { voltageToAudioBuffer } from '../lib/audio/audio-convert';
import { SAMPLE_RATE } from '../lib/constants';
import { EECircuitEngine } from '../lib/engines/eecircuit';
import type { SpiceEngine } from '../lib/engines/spice-engine';
import { compileNetlist } from '../lib/netlist';
import type {
  SimulateRequest,
  SimulateResponse,
} from '../lib/simulation-types';
import { WORKER_MESSAGE_TYPE } from '../lib/simulation-types';

// Engine is created once; WASM loads lazily on first init() call
const engine: SpiceEngine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<SimulateRequest>) => {
  if (e.data.type !== WORKER_MESSAGE_TYPE.simulate) {
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
      type: WORKER_MESSAGE_TYPE.result,
      outputBuffer: audioBuffer,
    };

    self.postMessage(response, {
      transfer: [audioBuffer.buffer] as Array<Transferable>,
    });
  } catch (err) {
    const response: SimulateResponse = {
      type: WORKER_MESSAGE_TYPE.error,
      message: err instanceof Error ? err.message : String(err),
    };

    self.postMessage(response);
  }
};
