# Solder

A visual circuit editor and audio effects simulator. Place and connect circuit components on a schematic canvas, then simulate audio signal processing via SPICE (ngspice compiled to WebAssembly).

## Features

**Circuit Editor**
- Click-to-add component palette: resistors, capacitors, op-amps (TL072, LM741), diodes (1N914, 1N4001, 1N270), BJTs, JFETs, MOSFETs, potentiometers, power supplies, ground
- Net labels for KiCad-style global connections (place multiple labels with the same name and they share a net automatically)
- KiCad-style power pins (multiple GND/VCC symbols share the same net without explicit wires)
- Drop connections onto existing wires to join a net
- Undo/redo (`Cmd/Ctrl+Z`, `Cmd/Ctrl+Shift+Z`), multi-tab circuits, JSON import/export
- Click traces or components to inspect and edit values in the sidebar
- Potentiometers have visual knob controls with animated SVG wiper
- Sticky notes with configurable color, text size, and width for annotating circuits
- Circuit state persists across browser sessions via local storage

**Simulation**
- Compiles circuit to SPICE netlist and runs transient analysis via ngspice WASM ([eecircuit-engine](https://www.npmjs.com/package/eecircuit-engine))
- Use guitar/bass samples or a SIN test tone
- Select a region of the input waveform to simulate only a portion

**Audio Playback & Waveform**
- Play input and output audio with looping support
- Waveform display with input/output overlay comparison
- Expandable modal with seek (click), scrub (drag), and region selection
- Animated playback cursor tied to audio position

**Example Circuits**
- Pedals: ProCo RAT, Fuzz Face, MXR Distortion+
- Circuits: low-pass filter, high-pass filter, gain stage, soft clipping, hard clipping, volume pot
- Circuit examples include beginner-friendly sticky notes explaining how each circuit works

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173). The dev server enables Cross-Origin Isolation headers required for SharedArrayBuffer (ngspice WASM).

Requires a modern browser with WebAssembly and SharedArrayBuffer support.

## Commands

```bash
pnpm dev          # Start dev server with HMR
pnpm build        # TypeScript compile + production build
pnpm preview      # Preview production build locally
pnpm lint         # Lint with Biome
pnpm test         # Run all tests (vitest)
pnpm test:ui      # Run tests with interactive Vitest UI
```

## Tech Stack

- **UI:** React 19 + TypeScript + Vite
- **Canvas:** [XYFlow / React Flow](https://reactflow.dev) for the schematic editor
- **State:** Zustand with undo/redo history
- **Audio:** Web Audio API for sample loading and playback
- **Simulation:** ngspice WASM via eecircuit-engine, running in a Web Worker
- **Styling:** Tailwind CSS
- **Icons:** [Lucide React](https://lucide.dev)
- **Linting:** Biome (single quotes, 2-space indent)
- **Testing:** Vitest + jsdom + Testing Library

## Architecture Notes

- `src/lib/models/` is the unified component-domain library. Each
  component folder co-locates its symbol definition, React node renderer,
  data types, and any SPICE `model.ts` definitions that domain needs.
- `src/lib/netlist.ts` compiles the current circuit graph into a SPICE
  netlist and inlines only the device models required by the active
  circuit.
- `src/lib/audio/pipeline.ts` loads decoded sample audio from
  `/public/samples/` and provides playback helpers for the waveform and
  simulator UI.
