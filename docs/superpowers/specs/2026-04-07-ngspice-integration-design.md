# ngspice Integration Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the simulation worker stub with a real ngspice WASM engine so that clicking Simulate runs an actual SPICE transient analysis and produces audio-rate output.

**Architecture:** A `SpiceEngine` interface decouples the worker from any concrete WASM implementation. `EECircuitEngine` wraps the `eecircuit-engine` npm package (lazy-loaded on first simulate call). Simulation runs in batch mode: the worker runs a full transient analysis for a configurable duration, returns a `Float32Array`, and the main thread plays it once via a one-shot `AudioBufferSourceNode`.

**Tech Stack:** React, Zustand, TypeScript, Web Workers, Web Audio API, `eecircuit-engine` (npm), Vitest

---

## Execution model

**Batch (not streaming).** The worker simulates the full duration in one ngspice call and returns the complete output buffer. There is no chunk-by-chunk streaming. This removes the real-time constraint and allows ngspice to run at its natural step size.

**Input signal.** The `AudioIn` component maps to a SPICE sinusoidal source `SIN(0 amplitude frequency)`. Frequency (default 1000 Hz) and amplitude (default 1.0 V) are stored in the simulation slice of the Zustand store. They are not yet exposed in the UI — they are hardcoded defaults for this iteration.

**Simulation duration.** Default 1.0 second, stored in the simulation slice. Not yet exposed in the UI.

---

## `SpiceEngine` interface (`src/lib/spice-engine.ts`)

Single source of truth for what any SPICE backend must provide. No DOM, no React, no store imports.

```ts
export interface SimulationOutput {
  timeValues: Float64Array;    // seconds, one entry per ngspice output step
  voltageValues: Float64Array; // volts at output node, same length as timeValues
}

export interface SpiceEngine {
  /** Initialise the engine. Safe to call multiple times; resolves immediately after first call. */
  init(): Promise<void>;
  /** Write a file to the engine's virtual filesystem (e.g. .lib model files). */
  writeFile(path: string, content: string): void;
  /** Run a netlist string and return the output node voltage time series. */
  run(netlist: string): Promise<SimulationOutput>;
}
```

Two concrete implementations live in `src/lib/engines/`:

- **`EECircuitEngine`** — production implementation wrapping `eecircuit-engine`
- **`MockSpiceEngine`** — test implementation, returns a configurable waveform without touching ngspice

To swap to a custom-compiled WASM binary: implement `SpiceEngine`, change one line in the worker.

---

## `EECircuitEngine` (`src/lib/engines/eecircuit.ts`)

```ts
import type { SpiceEngine, SimulationOutput } from '../spice-engine';

export class EECircuitEngine implements SpiceEngine {
  private sim: import('eecircuit-engine').Simulation | null = null;

  async init(): Promise<void> {
    if (this.sim) return;
    const { Simulation } = await import('eecircuit-engine');
    this.sim = new Simulation();
    await this.sim.start();
  }

  writeFile(path: string, content: string): void {
    // eecircuit-engine exposes the Emscripten FS via sim.FS
    this.sim!.FS.writeFile(path, content);
  }

  async run(netlist: string): Promise<SimulationOutput> {
    this.sim!.setNetList(netlist);
    const stdout: string = await this.sim!.runSim();
    return parseNgspiceOutput(stdout);
  }
}
```

> **Implementer note:** Before coding `EECircuitEngine`, verify the exact `eecircuit-engine` API by reading the package source or README:
> - Confirm `sim.FS.writeFile(path, content)` is the correct virtual FS write method.
> - Confirm `sim.runSim()` returns a `string` (stdout). If it returns an object, adjust `parseNgspiceOutput` accordingly.
> - Confirm the stdout format for `.print tran V(out)` by running a minimal test netlist.
```

`parseNgspiceOutput(stdout: string): SimulationOutput` — pure function, no side effects:
- Splits stdout by newline
- Skips lines until a line starting with `"Time"` is found (the header)
- Parses subsequent non-empty lines as two whitespace-separated scientific-notation numbers
- Returns `{ timeValues: Float64Array, voltageValues: Float64Array }`
- Throws `Error('ngspice produced no output — check netlist')` if no data rows are found

---

## `MockSpiceEngine` (`src/lib/engines/mock.ts`)

Returns a sine wave of configurable frequency and amplitude. Used in all unit tests.

```ts
export class MockSpiceEngine implements SpiceEngine {
  constructor(
    private readonly frequency = 1000,
    private readonly amplitude = 1.0,
    private readonly sampleRate = 44100,
  ) {}

  async init(): Promise<void> {}
  writeFile(_path: string, _content: string): void {}

  async run(_netlist: string): Promise<SimulationOutput> {
    const n = this.sampleRate;
    const timeValues = new Float64Array(n);
    const voltageValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      timeValues[i] = i / this.sampleRate;
      voltageValues[i] =
        this.amplitude * Math.sin(2 * Math.PI * this.frequency * timeValues[i]);
    }
    return { timeValues, voltageValues };
  }
}
```

---

## SPICE model constants (`src/lib/spice-models.ts`)

TL072 and LM741 `.lib` files bundled as exported string constants. The worker writes these to the engine's virtual filesystem before running the netlist.

```ts
export const TL072_LIB: string = `...`;  // full SPICE subcircuit definition
export const LM741_LIB: string = `...`;  // full SPICE subcircuit definition
```

The `.lib` file contents are standard public-domain SPICE models. The implementer must source them before writing `spice-models.ts`. Canonical sources:
- TL072: shipped with ngspice in `models/` directory; also available from Texas Instruments SPICE models
- LM741: shipped with ngspice in `models/` directory; also available from Texas Instruments SPICE models

The plan step that creates `spice-models.ts` must include the full verbatim `.lib` text — no placeholders.

---

## `voltageToAudioBuffer` (`src/lib/audio-convert.ts`)

Pure function. No DOM, no React, no store imports. Fully unit-testable.

```ts
export function voltageToAudioBuffer(
  output: SimulationOutput,
  sampleRate: number,
): Float32Array
```

Steps:
1. **Resample** — linear interpolation from ngspice's variable-step time points to exactly `sampleRate` evenly-spaced samples covering `[0, maxTime]`.
2. **Normalise** — divide all samples by `Math.max(peakAbsoluteValue, 0.01)` to map to `[-1, 1]`. The `0.01` floor prevents division-by-near-zero on silent circuits.
3. Return `Float32Array` of length `Math.round(maxTime * sampleRate)`.

---

## Netlist changes (`src/lib/netlist.ts`)

`compileNetlist` gains three new parameters (with defaults for backwards compatibility):

```ts
export function compileNetlist(
  nodes: ComponentNode[],
  edges: Edge[],
  duration: number = 1.0,       // seconds
  frequency: number = 1000,     // Hz for AudioIn sine source
  amplitude: number = 1.0,      // Volts for AudioIn sine source
): string
```

- The `AudioIn` node emits `Vin n_in 0 SIN(0 {amplitude} {frequency})` instead of a PWL source.
- The `.tran` line becomes `.tran {1/sampleRate} {duration}` where `sampleRate` is the internal constant 44100.
- The `inputBuffer` parameter is removed. The call site in `App.tsx` must be updated to the new signature — it currently passes `(nodes, edges, inputBuffer, 44100)` and will need to pass `(nodes, edges, duration, frequency, amplitude)` instead.

---

## Worker rewrite (`src/workers/simulation.worker.ts`)

```ts
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { TL072_LIB, LM741_LIB } from '../lib/spice-models';
import { compileNetlist } from '../lib/netlist';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import type { SimulateRequest, SimulateResponse } from '../lib/types';

const engine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<SimulateRequest>) => {
  const { nodes, edges, duration, frequency, amplitude } = e.data;
  try {
    await engine.init();
    engine.writeFile('/TL072.lib', TL072_LIB);
    engine.writeFile('/LM741.lib', LM741_LIB);
    const netlist = compileNetlist(nodes, edges, duration, frequency, amplitude);
    const output = await engine.run(netlist);
    const audioBuffer = voltageToAudioBuffer(output, 44100);
    const response: SimulateResponse = { type: 'result', outputBuffer: audioBuffer };
    self.postMessage(response, [audioBuffer.buffer]);
  } catch (err) {
    const response: SimulateResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
```

The `SimulateRequest` type in `src/lib/types.ts` is updated: drop `inputBuffer`, add `duration`, `frequency`, `amplitude`.

---

## Store changes (`src/store/index.ts`)

Three new fields in the simulation slice:

```ts
simulationDuration: number;   // default 1.0
inputFrequency: number;       // default 1000
inputAmplitude: number;       // default 1.0
```

No new actions needed for these — they are read-only defaults for now.

The `playing` field already exists. The store's `startPlayback` / `stopPlayback` actions drive the audio pipeline.

---

## Audio pipeline changes (`src/audio/pipeline.ts`)

The `ScriptProcessorNode` streaming path is replaced by a one-shot `AudioBufferSourceNode`:

- `playOutputBuffer(buffer: Float32Array, sampleRate: number): void` — creates an `AudioBuffer`, copies `buffer` into channel 0, creates an `AudioBufferSourceNode`, connects it to the gain node, calls `.start()`, stores a ref for stopping.
- `stopPlayback(): void` — calls `.stop()` on the active source node if one exists.

The `ScriptProcessorNode` and the chunk-request loop are removed entirely.

---

## `App.tsx` changes

`handleSimulate` is updated to:
1. Read `simulationDuration`, `inputFrequency`, `inputAmplitude` from the store.
2. Post `SimulateRequest` with `{ type: 'simulate', nodes, edges, duration, frequency, amplitude }` to the worker (no `inputBuffer`).
3. On `SimulateResponse` with `type: 'result'`: store the `outputBuffer`, set `simulationStatus = 'idle'`.

---

## Toolbar changes (`src/components/Toolbar.tsx`)

The Simulate button gains two additional states driven by `simulationStatus` and `outputBuffer`:

| Condition | Label |
|---|---|
| `simulationStatus === 'idle'` and `outputBuffer === null` | `▶ Simulate` |
| `simulationStatus === 'running'` | `⏳ Simulating…` (disabled) |
| `simulationStatus === 'idle'` and `outputBuffer !== null` and not playing | `▶ Play` |
| `playing === true` | `⏹ Stop` |

Clicking Play calls `startPlayback()`; clicking Stop calls `stopPlayback()`.

---

## StatusBar changes (`src/components/StatusBar.tsx`)

When `simulationStatus === 'idle'` and `outputBuffer !== null`, display:

```
● ready · {simulationDuration.toFixed(1)} s
```

---

## Tests (`src/test/`)

| File | Tests |
|---|---|
| `spice-engine.test.ts` | `MockSpiceEngine` returns correct shape; `init()` is idempotent |
| `audio-convert.test.ts` | Resamples correctly; normalises to [-1,1]; handles silent output (peak < 0.01) |
| `netlist.test.ts` | `AudioIn` emits `SIN(...)` source; `.tran` step/stop match duration; no AudioIn emits no Vin |
| `eecircuit.test.ts` | `parseNgspiceOutput` parses valid stdout; throws on empty output |

`EECircuitEngine` itself is not unit-tested (it wraps a heavy WASM binary). `parseNgspiceOutput` is exported separately so it can be tested with fixture strings.

---

## Files changed

| File | Change |
|---|---|
| `src/lib/spice-engine.ts` | New — `SpiceEngine` interface, `SimulationOutput` type |
| `src/lib/engines/eecircuit.ts` | New — `EECircuitEngine`, `parseNgspiceOutput` |
| `src/lib/engines/mock.ts` | New — `MockSpiceEngine` |
| `src/lib/spice-models.ts` | New — TL072 + LM741 `.lib` string constants |
| `src/lib/audio-convert.ts` | New — `voltageToAudioBuffer` |
| `src/lib/netlist.ts` | Modify — replace PWL/inputBuffer with SIN params |
| `src/lib/types.ts` | Modify — update `SimulateRequest` |
| `src/workers/simulation.worker.ts` | Rewrite — use `SpiceEngine`, batch mode |
| `src/audio/pipeline.ts` | Modify — batch `AudioBufferSourceNode` playback |
| `src/store/index.ts` | Modify — add `simulationDuration`, `inputFrequency`, `inputAmplitude` |
| `src/App.tsx` | Modify — updated `handleSimulate` |
| `src/components/Toolbar.tsx` | Modify — Play/Stop button states |
| `src/components/StatusBar.tsx` | Modify — show simulation duration |
| `src/test/spice-engine.test.ts` | New |
| `src/test/audio-convert.test.ts` | New |
| `src/test/eecircuit.test.ts` | New |
| `src/test/netlist.test.ts` | Modify — update for new signature |
