# Guitar Pedal Circuit Simulator — Design Spec
_Date: 2026-04-03_

## Overview

A React + TypeScript + Vite web application that lets users build guitar pedal circuits using a schematic editor and hear how the circuit sounds in real time. Users place and wire electronic components (resistors, capacitors, op-amps) on a schematic canvas, then simulate the circuit using ngspice (compiled to WebAssembly) against a pre-loaded guitar audio sample or live microphone input.

---

## Architecture

Five subsystems, primary data flow left to right:

```
[Schematic Editor] → [Netlist Compiler] → [Simulation Engine] → [Audio Pipeline] → speakers
                                                    ↓
                                              [UI Shell] (waveform display, status)
```

### 1. Schematic Editor

- **Library**: `react-flow` for the graph canvas (handles pan/zoom, drag, wire drawing, snap-to-grid)
- **Custom node types**: one React component per component type — `ResistorNode`, `CapacitorNode`, `OpAmpNode`, `PowerNode`, `GroundNode`, `InputNode`, `OutputNode`
- Each node renders its schematic symbol (SVG): zigzag for resistors, parallel lines for capacitors, triangle for op-amps
- Wires are react-flow edges; nodes have named ports (e.g., op-amp has `+in`, `-in`, `out`, `vcc`, `gnd`)
- Clicking a component opens the Inspector panel (right sidebar) to edit its value/label

### 2. Netlist Compiler

- Pure function: `compileNetlist(nodes: ComponentNode[], edges: Edge[]): string`
- Walks the graph, assigns integer node IDs to each connected wire junction via BFS
- Emits valid SPICE netlist syntax with `.tran` directive set for one buffer length (2048 samples at 44100 Hz = ~46ms)
- Injects the audio input buffer as a piecewise-linear voltage source (`PWL`) on the `Vin` node before each simulation batch
- Output probe is `V(out_node)` where `out_node` is the ID assigned to the `OutputNode`

### 3. Simulation Engine

- **Engine**: ngspice compiled to WebAssembly (`ngspice-wasm` or equivalent)
- Runs in a **Web Worker** to avoid blocking the main thread
- Interface:
  ```ts
  // Main → Worker
  { type: 'simulate', netlist: string, inputBuffer: Float32Array }
  // Worker → Main
  { type: 'result', outputBuffer: Float32Array }
  | { type: 'error', message: string }
  ```
- On receiving a simulate message: injects PWL data into netlist, calls ngspice, extracts `V(out)` as a Float32Array, posts result back
- Simulation is triggered by pressing "Simulate" button, or automatically on component value change with a 300ms debounce

### 4. Audio Pipeline

- **Samples mode**: pre-loaded `.wav` files decoded into `AudioBuffer` via `AudioContext.decodeAudioData`, looped. Each simulation cycle draws the next 2048-sample chunk as the input buffer.
- **Live mode**: `getUserMedia({ audio: true })` → `MediaStreamAudioSourceNode` → captures 2048-sample chunks as the input buffer
- **Playback**: output buffers queued into `AudioBufferSourceNode`s scheduled one buffer length ahead (~46ms) for gapless playback despite async simulation roundtrip
- Volume controlled via `GainNode` before output

### 5. UI Shell

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme, monospace font)
- **State management**: Zustand with three slices:
  - `circuitSlice` — `nodes`, `edges`, `selectedNodeId`
  - `simulationSlice` — `status: 'idle' | 'running' | 'error'`, `outputBuffer: Float32Array | null`, `errorMessage: string | null`
  - `audioSlice` — `source: { type: 'sample'; name: string } | { type: 'live' }`, `volume: number`, `playing: boolean`

---

## Data Model

```ts
type ComponentNode =
  | { type: 'resistor';  id: string; position: XYPosition; data: { label: string; ohms: number } }
  | { type: 'capacitor'; id: string; position: XYPosition; data: { label: string; farads: number } }
  | { type: 'opamp';     id: string; position: XYPosition; data: { label: string; model: 'TL072' | 'LM741' } }
  | { type: 'power';     id: string; position: XYPosition; data: { label: string; volts: number } }
  | { type: 'ground';    id: string; position: XYPosition; data: { label: string } }
  | { type: 'input';     id: string; position: XYPosition; data: { label: string } }
  | { type: 'output';    id: string; position: XYPosition; data: { label: string } }
```

Full circuit state: `{ nodes: ComponentNode[], edges: Edge[] }` — plain serializable JSON.

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚡ solder │ [R] [C] [U] [V+] [GND] [IN] [OUT]      [▶ Simulate] │  ← toolbar
├──────────────────────────────────────────┬──────────────────────┤
│                                          │ Inspector · R1       │
│           Schematic Canvas               │ ─────────────────    │
│           (react-flow)                   │ Resistance: 10 kΩ    │
│                                          │ Label: R1            │
│   ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  │ ─────────────────    │
│   ·  IN──R1──┬──U1──OUT  ·  ·  ·  ·  ·  │ Waveform             │
│   ·  ·  ·  C1⊥  ·  ·  ·  ·  ·  ·  ·  · │ [~~~in  ~~~out]      │
│   ·  ·  ·  GND  ·  ·  ·  ·  ·  ·  ·  · │ ─────────────────    │
│                                          │ Source               │
│                                          │ ○ Sample: guitar     │
│                                          │ ○ Sample: bass       │
│                                          │ ○ 🎙 Live input      │
│                                          │ Volume: ████░░       │
│                                          │ [⏹ Stop]             │
├──────────────────────────────────────────┴──────────────────────┤
│ ● simulation ready  latency: ~180ms  nodes: 3  ngspice 42·WASM  │  ← status bar
└─────────────────────────────────────────────────────────────────┘
```

---

## Key Constraints & Decisions

- **Simulation latency**: ~100–500ms per buffer batch. Not real-time in the strict sense, but acceptable for a circuit-building tool where the user is tweaking components, not performing.
- **ngspice WASM bundle size**: expect ~5–20MB. Loaded once at startup, cached.
- **Initial component scope**: resistors, capacitors, op-amps (TL072, LM741), power supply, ground, input node, output node. Expandable later.
- **No save/load in v1**: circuit state lives in memory only. Can be added later via JSON export.
- **No mobile support in v1**: schematic editing requires mouse/trackpad precision.

---

## Out of Scope (v1)

- Additional component types (transistors, diodes, MOSFETs, etc.)
- Save/load circuits to file
- Multiple output probes / oscilloscope view
- Frequency response plots
- Mobile / touch support
