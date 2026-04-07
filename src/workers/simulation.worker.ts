// src/workers/simulation.worker.ts
// Stub implementation: passes input buffer through as output unchanged.
// Replace the runSimulation function with real ngspice WASM when available.
import type { SimulateRequest, SimulateResponse } from '../lib/types';

/**
 * Stub: returns the input buffer as the output.
 * Replace this with a real ngspice WASM call.
 * The real implementation should:
 *   1. Load ngspice WASM module (once, at worker startup)
 *   2. Pass the netlist string to ngspice
 *   3. Return V(out) as a Float32Array
 */
function runSimulation(
	netlist: string,
	inputBuffer: Float32Array,
): Float32Array {
	// TODO: replace with ngspice WASM call
	// The netlist already has PWL data injected by compileNetlist().
	// ngspice should return a voltage array for V(out_node).
	console.log(
		'[worker] stub — running passthrough. Netlist length:',
		netlist.length,
	);
	return new Float32Array(inputBuffer);
}

self.onmessage = (e: MessageEvent<SimulateRequest>) => {
	const { type, netlist, inputBuffer } = e.data;
	if (type !== 'simulate') return;

	try {
		const outputBuffer = runSimulation(netlist, inputBuffer);
		const response: SimulateResponse = { type: 'result', outputBuffer };
		self.postMessage(response, [outputBuffer.buffer]);
	} catch (err) {
		const response: SimulateResponse = {
			type: 'error',
			message: err instanceof Error ? err.message : String(err),
		};
		self.postMessage(response);
	}
};
