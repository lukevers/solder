# Architecture

High-level layout of state, data flow, and where things live.

## State (`src/store/index.ts`)

A single Zustand store holds tab, circuit, history, audio, and simulation
state:

- **Tab state** — open tabs, active tab, viewport reset key
- **Circuit state** — nodes, edges, selection; undo/redo with 50-item snapshot history
- **Audio state** — `audioSource`, `localSamples`, volume, playing state
- **Simulation state** — `simulationStatus`, `outputBuffer`, `simulationError`

Any circuit mutation (add/delete node, connect/disconnect edge, update
component value, undo/redo) clears `outputBuffer` and resets
`simulationStatus` to `idle`. Node position/selection changes do NOT
invalidate.

## Store architecture

The app uses **one** Zustand store at runtime, but the implementation is
split by domain under `src/store/`:

```
src/store/
  index.ts              — root store composition + persist config
  types.ts              — shared store/tab types
  defaults.ts           — initial state + default tab/runtime values
  helpers.ts            — shared orchestration helpers (`flushActive`, etc.)
  tabs-slice.ts         — tab lifecycle + viewport/extras
  circuit-slice.ts      — active circuit mutations
  history-slice.ts      — undo/redo
  simulation-slice.ts   — simulation + sweep runtime state
  audio-slice.ts        — audio source/playback state
  hooks.ts              — domain-specific selector hooks
```

### Guidelines

- Keep cross-domain editor state in the single store. Do **not** split
  tab, circuit, simulation, or audio into separate runtime stores unless
  the app architecture changes substantially.
- Prefer adding or reusing domain hooks from `src/store/hooks.ts`
  (`useCircuitState`, `useSimulationActions`, `useViewportState`, etc.)
  instead of creating new ad hoc `useStore(useShallow(...))` selectors in
  components.
- If a component needs more than 2-3 store fields, that is usually a sign
  it should use or introduce a named domain hook.
- Prefer narrow hooks (`useExamplesState`, `useViewportState`,
  `useTabBarState`) over broad subscriptions when only one part of the
  store is needed.
- Use raw `useStore(...)` directly only for tiny single-field
  subscriptions or deliberate `useStore.getState()` escape hatches.
- The active workspace is mirrored at the store root. Anything touching
  tab switching, persistence, or workspace hydration must go through the
  shared store helpers rather than duplicating that orchestration in
  components.

## Core data flow

1. User edits circuit on the `SchematicCanvas` (XYFlow / `@xyflow/react`)
2. User clicks **Simulate** — `App.tsx` resolves the selected audio
   source (bundled sample, persisted local WAV, or none), reads the
   decoded `Float32Array` from `AudioPipeline`, and posts a
   `SimulateRequest` to the Web Worker.
3. Worker calls `compileNetlist()` which downsamples the audio buffer to
   `SPICE_SAMPLE_RATE` (10 kHz) and builds a PWL voltage source; if no
   buffer, uses a SIN test tone.
4. Worker calls `engine.run(netlist)` — ngspice WASM (`eecircuit-engine`)
   runs the full transient simulation.
5. `voltageToAudioBuffer()` linearly interpolates the variable-step SPICE
   output back up to 44 100 Hz.
6. Resulting `Float32Array` stored as `outputBuffer` in the store.
7. User clicks **Play** — `AudioPipeline.playBuffer()` plays it once
   through the Web Audio API.

For the netlist compiler and ngspice quirks, see
[simulation.md](simulation.md). For sample loading and playback details,
see [audio.md](audio.md).

## Key lib files

- `src/lib/types.ts` — discriminated union `ComponentNode` type for all
  circuit elements; re-exports per-domain data types.
- `src/lib/netlist.ts` — circuit → SPICE netlist compiler
  (`compileNetlist`, `buildPortGroups`, `SPICE_SAMPLE_RATE`). See
  [simulation.md](simulation.md).
- `src/lib/models/` — unified component-domain library: symbols, node
  renderers, per-domain data types, and SPICE model definitions. See
  [component-library.md](component-library.md).
- `src/lib/palette.ts` — hand-maintained catalog feeding the toolbar and
  the `a` command bar. See [ui-patterns.md](ui-patterns.md).
- `src/lib/audio/audio-convert.ts` — `voltageToAudioBuffer` interpolates
  SPICE output to fixed sample rate.
- `src/lib/audio/pipeline.ts` — Web Audio API integration for sample
  loading and playback. See [audio.md](audio.md).
- `src/lib/audio/local-sample-store.ts` — IndexedDB persistence for
  uploaded local WAV samples. See [audio.md](audio.md).
- `src/lib/engines/eecircuit.ts` — `EECircuitEngine` wrapping the
  `eecircuit-engine` npm package.
- `src/lib/circuit-io.ts` — JSON import/export for circuits.
- `src/examples/` — preset circuits as JSON. See
  [ui-patterns.md](ui-patterns.md) for the writing conventions.
