# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # TypeScript compile + production build
pnpm preview      # Preview production build locally
pnpm lint         # Lint with Biome
pnpm test         # Run all tests (vitest)
pnpm test:ui      # Run tests with interactive Vitest UI

# Run a single test file
npx vitest run src/test/store.test.ts

# Run tests by name pattern
npx vitest run -t "addNode appends a node"
```

## Architecture

**Solder** is a visual circuit editor and audio effects simulator built with React 19 + TypeScript + Vite. Users place and connect circuit components (resistors, capacitors, op-amps, etc.) on a schematic canvas, and the app compiles that to a SPICE netlist to simulate audio signal processing via ngspice WASM.

### State (`src/store/index.ts`)
Single Zustand store with three slices:
- **Circuit slice** — nodes, edges, selectedNodeId; undo/redo with 50-item snapshot history
- **Audio slice** — audioSource, volume, playing state
- **Simulation slice** — simulationStatus, outputBuffer, simulationError

Any circuit mutation (add/delete node, connect/disconnect edge, update component value, undo/redo) clears `outputBuffer` and resets `simulationStatus` to `idle`. Node position/selection changes do NOT invalidate.

### Core data flow
1. User edits circuit on the `SchematicCanvas` (XYFlow/`@xyflow/react`)
2. User clicks Simulate — `App.tsx` reads the decoded guitar sample `Float32Array` from `AudioPipeline` and posts a `SimulateRequest` to the Web Worker
3. Worker calls `compileNetlist()` which downsamples the audio buffer to `SPICE_SAMPLE_RATE` (10 kHz) and builds a PWL voltage source; if no buffer, uses a SIN test tone
4. Worker calls `engine.run(netlist)` — ngspice WASM (`eecircuit-engine`) runs the full transient simulation
5. `voltageToAudioBuffer()` linearly interpolates the variable-step SPICE output back up to 44100 Hz
6. Resulting `Float32Array` stored as `outputBuffer` in the store
7. User clicks Play — `AudioPipeline.playBuffer()` plays it once through Web Audio API

### Key lib files
- `src/lib/types.ts` — discriminated union `ComponentNode` type for all circuit elements
- `src/lib/netlist.ts` — circuit → SPICE netlist compiler (`compileNetlist`, `buildPortGroups`, `SPICE_SAMPLE_RATE`)
- `src/lib/spice-models.ts` — TL072 and LM741 subcircuit definitions (POLY-free for eecircuit-engine)
- `src/lib/audio-convert.ts` — `voltageToAudioBuffer`: interpolates SPICE output to fixed sample rate
- `src/lib/engines/eecircuit.ts` — `EECircuitEngine` wrapping `eecircuit-engine` npm package
- `src/lib/circuit-io.ts` — JSON import/export for circuits
- `src/lib/examples/` — preset circuits (e.g., `rat.ts`)

### KiCad-style power pins
Ground and Power nodes act as global net labels (like KiCad power flags). Users can place multiple instances:
- **Ground**: All ground nodes are automatically on SPICE net `0` regardless of wiring. Place a GND symbol anywhere and wire it locally — no need to draw a long wire back to a single ground.
- **Power**: All power nodes with the same label (e.g., `VCC`) share the same net and only one voltage source is emitted. Place multiple VCC symbols throughout the circuit and they're all connected.

Connections can also be dropped directly onto existing wires (edges) to join that net without targeting a specific handle.

### Component nodes (`src/components/nodes/`)
One renderer per circuit element type: `ResistorNode`, `CapacitorNode`, `OpAmpNode`, `DiodeNode`, `PotentiometerNode`, `PowerNode`, `GroundNode`, `AudioInNode`, `AudioOutNode`, `StickyNoteNode`.

### Audio pipeline (`src/audio/pipeline.ts`)
Web Audio API integration: loads `.wav` samples from `/public/samples/`, exposes `getSampleData(name)` to get raw `Float32Array`, uses `ScriptProcessorNode` for live input buffer callbacks.

## Tooling
- **Linter/Formatter:** Biome (`biome.json`) — single quotes, 2-space indent; VSCode extension `biomejs.biome` recommended
- **Icons:** [Lucide React](https://lucide.dev) (`lucide-react`) — use Lucide icons for all UI icons (toolbar buttons, modal controls, etc.). Do NOT use inline SVGs or emoji/text symbols for icons. Circuit node renderers in `src/components/nodes/` use inline SVG for schematic drawings, which is fine — those are not UI icons.
- **CSS:** Tailwind CSS + PostCSS
- **Tests:** Vitest with jsdom; `@testing-library/react` and `@testing-library/jest-dom` matchers; test files live in `src/test/`

## eecircuit-engine compatibility

`eecircuit-engine` wraps a trimmed ngspice WASM build. Several things that work in standard ngspice do NOT work here:

### POLY() on E/F elements is not supported
Throws "XSPICE is required to run the 'poly' option". Replace with standard elements:
- `EGND 99 0 POLY(2) (3,0) (4,0) 0 .5 .5` → `EGND 99 4 3 4 0.5` (midpoint via single E element)
- `FB POLY(5) vs1..vs5 0 c1..c5` → five individual F elements summing at the same nodes
- `EOS POLY(1) nc+ nc- offset gain` → E element + series voltage source for the offset
- `F POLY(1) Vname dc_offset gain` → F element + parallel DC current source

### `1G` suffix not recognised — use `1000Meg`

### SharedArrayBuffer is required
`runSim()` hangs forever without Cross-Origin-Isolation. The Vite dev server is configured with:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```
If simulation hangs without error, check `typeof SharedArrayBuffer !== 'undefined'` in the worker.

### Open circuits cause a hang
A netlist with only a voltage source and no passive load hangs `runSim()`. Always include `Rprobe ${outputNode} 0 1000Meg` in compiled netlists.

### Floating audiin/audiout neg handles cause singular matrix
The `Vin` source connects `inputPos` to `inputNeg`, and `Rprobe` connects `outputPos` to `outputNeg`. If neither neg handle is wired to ground, those nets have no DC path to net 0 and ngspice fails with "singular matrix". This especially happens when a coupling capacitor (DC-blocking) sits between the input and the rest of the circuit. Always wire audiin/audiout neg handles to a ground node. The `makeCircuit` test helper in `src/test/simulation/setup.ts` does this automatically.

### SPICE element naming
The first letter of an element name determines its type (D=diode, R=resistor, C=capacitor, etc.). Pot labels like `DIST` produce element names `DISTa`/`DISTb` — ngspice reads the leading `D` as a diode and fails. The netlist compiler always prefixes pot split-resistors with `R`.

### Adding new op-amp subcircuit models
Before adding a new `.SUBCKT` to `spice-models.ts`, scan it for `POLY(` and replace as described above. The TL072 and LM741 in the file are already converted and serve as reference.
