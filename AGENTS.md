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
Single Zustand store with tab, circuit, history,
audio, and simulation state:
- **Tab state** — open tabs, active tab, viewport reset key
- **Circuit state** — nodes, edges, selection; undo/redo with 50-item snapshot history
- **Audio state** — audioSource, localSamples, volume, playing state
- **Simulation state** — simulationStatus, outputBuffer, simulationError

Any circuit mutation (add/delete node, connect/disconnect edge, update component value, undo/redo) clears `outputBuffer` and resets `simulationStatus` to `idle`. Node position/selection changes do NOT invalidate.

### Store architecture
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

Guidelines:
- Keep cross-domain editor state in the single store. Do **not** split tab,
  circuit, simulation, or audio into separate runtime stores unless the app
  architecture changes substantially.
- Prefer adding or reusing domain hooks from `src/store/hooks.ts`
  (`useCircuitState`, `useSimulationActions`, `useViewportState`, etc.)
  instead of creating new ad hoc `useStore(useShallow(...))` selectors in
  components.
- If a component needs more than 2-3 store fields, that is usually a sign it
  should use or introduce a named domain hook.
- Prefer narrow hooks (`useExamplesState`, `useViewportState`,
  `useTabBarState`) over broad subscriptions when only one part of the store
  is needed.
- Use raw `useStore(...)` directly only for tiny single-field subscriptions or
  deliberate `useStore.getState()` escape hatches.
- The active workspace is mirrored at the store root. Anything touching tab
  switching, persistence, or workspace hydration must go through the shared
  store helpers rather than duplicating that orchestration in components.

### Core data flow
1. User edits circuit on the `SchematicCanvas` (XYFlow/`@xyflow/react`)
2. User clicks Simulate — `App.tsx` resolves the selected audio source
   (bundled sample, persisted local WAV, or none), reads the decoded
   `Float32Array` from `AudioPipeline`, and posts a `SimulateRequest` to
   the Web Worker
3. Worker calls `compileNetlist()` which downsamples the audio buffer to `SPICE_SAMPLE_RATE` (10 kHz) and builds a PWL voltage source; if no buffer, uses a SIN test tone
4. Worker calls `engine.run(netlist)` — ngspice WASM (`eecircuit-engine`) runs the full transient simulation
5. `voltageToAudioBuffer()` linearly interpolates the variable-step SPICE output back up to 44100 Hz
6. Resulting `Float32Array` stored as `outputBuffer` in the store
7. User clicks Play — `AudioPipeline.playBuffer()` plays it once through Web Audio API

### Key lib files
- `src/lib/types.ts` — discriminated union `ComponentNode` type for all circuit elements; re-exports per-domain data types
- `src/lib/netlist.ts` — circuit → SPICE netlist compiler (`compileNetlist`, `buildPortGroups`, `SPICE_SAMPLE_RATE`)
- `src/lib/models/` — unified component-domain library: symbols, node renderers, per-domain data types, and SPICE model definitions
- `src/lib/palette.ts` — hand-maintained catalog (`PALETTE_ITEMS`,
  `PALETTE_CATEGORIES`) feeding both the toolbar groupings and the `a`
  command bar; see "Command bar / palette catalog" below
- `src/lib/audio/audio-convert.ts` — `voltageToAudioBuffer`: interpolates SPICE output to fixed sample rate
- `src/lib/audio/local-sample-store.ts` — IndexedDB persistence for uploaded
  local WAV samples
- `src/lib/engines/eecircuit.ts` — `EECircuitEngine` wrapping `eecircuit-engine` npm package
- `src/lib/circuit-io.ts` — JSON import/export for circuits
- `src/examples/` — preset circuits as JSON

### Component Library (`src/lib/models/`)
Organized by component domain — each subdirectory co-locates a component's
symbol definition, React node renderer, data types, and any SPICE model
definitions needed for that domain:

```
src/lib/models/
  types.ts           — shared SymbolDef, SymbolPin types
  node-shell.tsx     — shared rendering utilities (NodeShell, RotatedHandle, etc.)
  spice.ts           — shared SPICE model serialization helpers
  index.ts           — worker-safe barrel: only types, symbol defs, SPICE models, and helpers
  symbol-registry.ts — worker-safe SYMBOLS/DEFAULT_SYMBOL metadata + resolveOpAmpSymbol
  registry.ts        — browser-only XYFlow nodeTypes registry
  resistor/          — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  capacitor/         — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  cap-polar/         — symbol.ts + node.tsx + model.ts + index.ts
  opamp/             — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  diode/             — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  bjt/               — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  jfet/              — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  mosfet/            — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  pot/               — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  power/             — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  ground/            — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  jack/              — symbol.ts + node.tsx + types.ts + model.ts + index.ts
  junction/          — node.tsx + types.ts + model.ts + index.ts (no symbol)
  label/             — node.tsx + types.ts + model.ts + index.ts (no symbol)
  stickynote/        — node.tsx + types.ts + model.ts + index.ts (no symbol)
  box/               — node.tsx + types.ts + model.ts + index.ts (no symbol)
```

Adding a new component requires three registration points:
1. Create a new subdirectory with `symbol.ts`, `node.tsx`, `types.ts`,
   `model.ts`, and `index.ts`.
2. Register the symbol in `SYMBOLS` (`symbol-registry.ts`) and the node
   renderer in `nodeTypes` (`registry.ts`).
3. Add an entry — or one per variant for components with multiple models
   like diodes/BJTs — to `PALETTE_ITEMS` in `src/lib/palette.ts` so the
   `a` command bar and the toolbar can place it. The palette catalog is
   NOT auto-derived from the symbol/node registries.

Worker/import boundary rules:
- `src/lib/models/index.ts` is shared with the simulation and analysis
  workers. Keep it free of React components, Zustand store imports, and
  any `.tsx` dependency path.
- Do not re-export through component directory `index.ts` files from the
  worker-safe barrel if those directory barrels also export `node.tsx`
  renderers. Re-export `types.ts`, `symbol.ts`, and `model.ts` directly.
- Browser-only renderer wiring belongs in `src/lib/models/registry.ts`.
  Symbol metadata used by both workers and the UI belongs in
  `src/lib/models/symbol-registry.ts`.
- If a worker starts failing in dev with `window is not defined` from
  `@react-refresh`, assume a React/TSX module leaked into the worker import
  graph and inspect recent barrel exports first.

### KiCad-style power pins
Ground and Power nodes act as global net labels (like KiCad power flags). Users can place multiple instances:
- **Ground**: All ground nodes are automatically on SPICE net `0` regardless of wiring. Place a GND symbol anywhere and wire it locally — no need to draw a long wire back to a single ground.
- **Power**: All power nodes with the same label (e.g., `VCC`) share the same net and only one voltage source is emitted. Place multiple VCC symbols throughout the circuit and they're all connected.

Connections can also be dropped directly onto existing wires (edges) to join that net without targeting a specific handle.

### Component nodes (`src/lib/models/<component>/node.tsx`)
One renderer per circuit element type, co-located with its symbol definition. Each exports a single React component (e.g., `ResistorNode`, `OpAmpNode`, `BJTNode`). Shared rendering primitives (`NodeShell`, `RotatedHandle`, `NodeSvg`, `NodeText`) live in `src/lib/models/node-shell.tsx`.

### Command bar / palette catalog (`src/lib/palette.ts`)
`PALETTE_ITEMS` is the single source of truth for "things the user can
place." Both the toolbar groupings and the `a` command bar consume it.
The catalog is hand-maintained, not derived from the symbol or node
registries, because:
- One symbol can map to several palette entries (e.g. the diode symbol
  backs `1N914`, `1N4001`, `1N270`, …, each with a different
  `defaultData.model`).
- Some palette entries (junction, label, stickynote, box) have no
  schematic symbol but still need a placement entry.

When adding to the catalog:
- Pick a stable `id` — it is persisted in the recently-used list and must
  not be reused once shipped.
- Place the entry in an existing `PALETTE_CATEGORIES` bucket or extend
  the array. Section order drives the on-screen order of the command bar.
- Fill in `searchTokens` with the aliases users will actually type
  ("op-amp", "fuzz", "fet"); the fuzzy filter matches against them.

### Global hotkeys and modal overlays
Editor-wide hotkeys live in `App.tsx`'s window-level `keydown` listener
(`a` to place, `r`/`Shift+R` to rotate, `Cmd/Ctrl+Z` to undo, `?`/`/` for
help, etc.). The handler gates on two things before doing anything:

1. The focused element — `INPUT`, `TEXTAREA`, `SELECT`, or
   `isContentEditable` short-circuits early so typing into a field never
   hijacks a shortcut.
2. `anyModalOpenRef` — a ref mirrored from every blocking modal flag
   (`showWelcomeModal`, `showHelpModal`, `showWaveformModal`,
   `commandBarOpen`). If any of those is true, the handler bails so the
   canvas underneath does not respond.

When introducing a new modal/overlay, add its open state to the
`anyModalOpenRef` `useEffect` in `App.tsx`. A modal that does not opt in
will leak shortcuts to the schematic underneath (e.g. pressing `a`
opening the command bar behind a help dialog).

When adding a new global shortcut, update **both** the keydown handler
in `App.tsx` **and** `buildSections()` in `src/components/HelpModal.tsx`
so the `?` reference stays accurate. The modal lists shortcuts grouped
into Canvas / Edit / Waveform / General; pick the closest section or
extend the list.

### Audio pipeline (`src/lib/audio/pipeline.ts`)
Web Audio API integration for sample loading and playback. Loads `.wav`
samples from `/public/samples/` and exposes `getSampleData(name)` to get
raw `Float32Array` data.

Browser audio policy:
- Do not create `AudioContext` on app mount. Browsers will warn and may leave
  the context suspended until the user interacts with the page.
- Initialize or resume audio only after a user gesture (pointer/key press, or
  the click that starts playback/simulation).
- If a feature depends on decoded sample audio, make that action await audio
  initialization and sample loading instead of assuming the pipeline is ready
  during initial render.

Local sample persistence:
- User-uploaded WAV files are persisted in IndexedDB via
  `src/lib/audio/local-sample-store.ts`, not in Zustand's persisted
  localStorage payload.
- Persist only lightweight metadata and the selected `audioSource` in the
  Zustand store. Do not try to serialize raw WAV bytes into the store.
- Restore the sidebar sample list from IndexedDB on boot, but decode audio
  lazily on selection/playback/simulation so refreshes stay cheap.

## Tooling
- **Linter/Formatter:** Biome (`biome.json`) — single quotes, 2-space indent; VSCode extension `biomejs.biome` recommended
- **Icons:** [Lucide React](https://lucide.dev) (`lucide-react`) — use Lucide icons for all UI icons (toolbar buttons, modal controls, etc.). Do NOT use inline SVGs or emoji/text symbols for icons. Circuit node renderers in `src/lib/models/` use inline SVG for schematic drawings, which is fine — those are not UI icons.
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
Before adding a new `.SUBCKT` to `src/lib/models/`, scan it for `POLY(` and replace as described above. The TL072 and LM741 in the file are already converted and serve as reference.

## XYFlow handle conventions

### Bidirectional handles
All passive components (resistor, capacitor, cap_polar, diode, pot) plus ground, power, and input jacks expose **both** a `type="source"` and `type="target"` handle at each pin position. XYFlow identifies handles by the tuple `(nodeId, handleId, handleType)`, so two handles with the same `id` but different `type` coexist. The primary handle is visible; the complementary one is hidden (`opacity: 0`). This allows edges to reference any handle as either `sourceHandle` or `targetHandle` regardless of signal direction — important because current flows both ways through passive components.

### Handle IDs by component
| Component | Handles (id) | Primary type |
|-----------|-------------|-------------|
| Resistor | `a` (left), `b` (right) | a=target, b=source |
| Capacitor | `a` (left), `b` (right) | a=target, b=source |
| Cap polar | `pos` (left), `neg` (right) | pos=target, neg=source |
| Diode | `a` (left), `k` (right) | a=target, k=source |
| Pot | `ccw` (left), `cw` (right), `wiper` (bottom) | ccw=target, cw/wiper=source |
| OpAmp | `in_pos`, `in_neg`, `vcc`, `gnd` (targets); `out` (source) | — |
| Junction | `st/sr/sb/sl` (sources), `tt/tr/tb/tl` (targets) | per-side pairs |
| Jack (in) | `pos`, `neg` (right) | source (+ hidden target) |
| Jack (out) | `pos`, `neg` (left) | target |
| Ground | `gnd` (top) | source (+ hidden target) |
| Power | `pos` (bottom) | source (+ hidden target) |

### `measured` dimensions on load
`loadCircuit` in the store injects `measured: { width, height }` on every node using `ensureMeasured()`. This gives XYFlow node dimensions before DOM measurement, so edge handle positions are correct on the first render. Without this, edges appear "floating" (disconnected from handles) until XYFlow's ResizeObserver fires. Component dimensions are looked up from the `SYMBOLS` registry in `src/lib/models/`; rotation (90/270) swaps width and height.

## Code style

- **Early returns:** Always use early returns to reduce nesting. Guard clauses at the top of a function should handle edge cases and bail out early, keeping the main logic at the lowest indentation level. Always use braces for return statements — no single-line `if (x) return y`.

  ```ts
  // Bad
  function process(node: ComponentNode | null) {
    if (node) {
      if (node.type === 'resistor') {
        return doSomething(node)
      }
    }
    return null
  }

  // Good
  function process(node: ComponentNode | null) {
    if (!node) {
      return null
    }

    if (node.type !== 'resistor') {
      return null
    }

    return doSomething(node)
  }
  ```

- **Logical grouping:** Group related lines of code together and separate unrelated blocks with a blank line. Reorder statements within a block (where it doesn't affect functionality) so that related logic is adjacent rather than interleaved. Add blank lines after block statements (`if`, `for`, `while`, etc.) to visually separate them from the next piece of logic.

  ```ts
  // Bad — declarations interleaved
  const width = node.measured?.width ?? 0
  const label = node.data.label
  const height = node.measured?.height ?? 0
  const rotation = node.data.rotation ?? 0
  const x = node.position.x + width / 2
  const y = node.position.y + height / 2

  // Good — related declarations grouped
  const label = node.data.label
  const rotation = node.data.rotation ?? 0

  const width = node.measured?.width ?? 0
  const height = node.measured?.height ?? 0
  const x = node.position.x + width / 2
  const y = node.position.y + height / 2
  ```

  ```ts
  // Bad — block statements crammed together
  if (!adj.has(ports[0])) {
    adj.set(ports[0], new Set());
  }
  if (!adj.has(ports[i])) {
    adj.set(ports[i], new Set());
  }
  adj.get(ports[0])!.add(ports[i]);
  adj.get(ports[i])!.add(ports[0]);

  // Good — blank line after each block statement
  if (!adj.has(ports[0])) {
    adj.set(ports[0], new Set());
  }

  if (!adj.has(ports[i])) {
    adj.set(ports[i], new Set());
  }

  adj.get(ports[0])!.add(ports[i]);
  adj.get(ports[i])!.add(ports[0]);
  ```

- **Block-level comments:** Always add a multi-line `/** */` comment above functions and top-level constants, even if they seem self-explanatory. Write for a junior engineer — explain *what* and *why*, not just *how*. Use ASCII art diagrams and tables inside comments where they help clarify relationships, data flow, or structure. Comments must wrap at 80 characters. Never use the single-line `/** ... */` style — always use multi-line.

  ```ts
  // Bad
  /** Maximum resampled samples per trace (≈45 seconds at 44.1 kHz, ~8 MB). */
  const MAX_SAMPLES = 2_000_000;

  // Good
  /**
   * Maximum number of resampled audio samples we keep per simulation trace.
   *
   * At 44.1 kHz this is roughly 45 seconds of audio and occupies ~8 MB as a
   * Float32Array. Keeping a hard cap here prevents runaway memory usage when
   * the user simulates a long transient.
   */
  const MAX_SAMPLES = 2_000_000;
  ```

  ```ts
  /**
   * Merge two sorted port arrays into a single adjacency list.
   *
   * Signal flow through the merge:
   *
   *   portA ──┐
   *           ├──► merged adjacency set
   *   portB ──┘
   *
   * Both inputs must already be sorted by net index. Duplicate entries are
   * collapsed so each neighbour appears at most once.
   */
  function mergePorts(portA: Port[], portB: Port[]) {
    // ...
  }
  ```

- **File organization — split by domain, not by kind.** Don't create generic catch-all files that group things by what they are (e.g., a single `types.ts` for all types, a single `symbols.ts` for all symbols). Instead, split files by the domain they describe so that each file is focused and self-contained. When a file starts covering multiple unrelated domains, break it apart.

  ```
  # Bad — one file per "kind" of thing
  src/lib/types.ts        ← every type in the project
  src/lib/constants.ts    ← every constant

  # Good — one file per domain (this is how models/ is organized)
  src/lib/models/resistor/types.ts
  src/lib/models/resistor/symbol.ts
  src/lib/models/resistor/node.tsx
  src/lib/models/opamp/types.ts
  src/lib/models/opamp/symbol.ts
  src/lib/models/opamp/node.tsx
  ```

  The test: if you need to add a new resistor variant, you should only need to touch files in one area — not a 800-line grab-bag file shared with op-amps, diodes, and audio types.

- **Repeated hardcoded strings:** If a non-trivial string literal appears in
  more than one place, replace it with a named constant, a `const` object, or
  a type/enum derived from a single source of truth. Prefer the narrowest
  useful scope:
  domain-local constants for strings only used in one area, exported constants
  for strings shared across modules, and union types derived from those
  constants for state/status/category values. Do not keep retyping the same
  status, kind, direction, label, or category string inline across the repo.

- **UI typography:** Default to `font-mono` for circuit-facing UI and
  interaction chrome such as buttons, labels, tabs, inspectors, numeric
  controls, and anything that should feel like part of the schematic tool.
  Default to `font-sans` for general reading text such as modal body copy,
  explanatory paragraphs, help text, and longer descriptive content.

## Writing example circuits

Example circuits live in `src/examples/` as JSON and are registered in
`index.ts`. Key rules:

- **Edge direction must match handle types.** An edge's `sourceHandle` must exist as a `type="source"` handle on the source node, and `targetHandle` as `type="target"` on the target node. Mismatches produce React Flow error #008 and visually broken edges. With bidirectional handles this is usually fine, but junction handles are strictly directional (`s*` = source only, `t*` = target only).
- **`measured` is injected automatically** by `loadCircuit` → `ensureMeasured()`. You do NOT need to include `measured` in example JSON files.
- **Positions should align with op-amp handle offsets.** For the TL072 triangle (80×80), `in_pos` (+) is upper-left (~y+20) and `in_neg` (−) is lower-left (~y+60). Place the inverting-input junction ~50px below the op-amp origin to visually align with `−`. See the gain-stage example as reference.
- **Bias networks for single-supply op-amps** need VCC → R → junction → R → GND voltage divider, bypass cap to ground, and junction → `in_pos`. Position the bias junction nearly above the op-amp so the wire drops vertically.
