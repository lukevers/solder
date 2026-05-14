# Component Library

The unified component-domain library at `src/lib/models/`. Each
subdirectory co-locates a component's schematic symbol, React node
renderer, data types, and any SPICE model definitions needed for that
domain.

## Layout

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

## Adding a new component

Three registration points:

1. Create a new subdirectory with `symbol.ts`, `node.tsx`, `types.ts`,
   `model.ts`, and `index.ts`.
2. Register the symbol in `SYMBOLS` (`symbol-registry.ts`) and the node
   renderer in `nodeTypes` (`registry.ts`).
3. Add an entry — or one per variant for components with multiple models
   like diodes/BJTs — to `PALETTE_ITEMS` in `src/lib/palette.ts` so the
   `a` command bar and toolbar can place it. The palette catalog is NOT
   auto-derived from the symbol/node registries. See
   [ui-patterns.md](ui-patterns.md).

## Worker / import boundary rules

The simulation and analysis workers import from `src/lib/models/index.ts`
but cannot tolerate React or browser-only modules. Violating this surface
breaks the worker silently — often as `window is not defined` from
`@react-refresh`.

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
  `@react-refresh`, assume a React/TSX module leaked into the worker
  import graph and inspect recent barrel exports first.

## Component nodes (`src/lib/models/<component>/node.tsx`)

One renderer per circuit element type, co-located with its symbol
definition. Each exports a single React component (`ResistorNode`,
`OpAmpNode`, `BJTNode`, etc.). Shared rendering primitives (`NodeShell`,
`RotatedHandle`, `NodeSvg`, `NodeText`) live in
`src/lib/models/node-shell.tsx`.

## KiCad-style power pins

Ground and Power nodes act as global net labels (like KiCad power flags).
Users can place multiple instances:

- **Ground**: All ground nodes are automatically on SPICE net `0`
  regardless of wiring. Place a GND symbol anywhere and wire it locally —
  no need to draw a long wire back to a single ground.
- **Power**: All power nodes with the same label (e.g., `VCC`) share the
  same net and only one voltage source is emitted. Place multiple VCC
  symbols throughout the circuit and they're all connected.

Connections can also be dropped directly onto existing wires (edges) to
join that net without targeting a specific handle.

## XYFlow handle conventions

### Bidirectional handles

All passive components (resistor, capacitor, cap_polar, diode, pot) plus
ground, power, and input jacks expose **both** a `type="source"` and
`type="target"` handle at each pin position. XYFlow identifies handles
by the tuple `(nodeId, handleId, handleType)`, so two handles with the
same `id` but different `type` coexist. The primary handle is visible;
the complementary one is hidden (`opacity: 0`). This allows edges to
reference any handle as either `sourceHandle` or `targetHandle`
regardless of signal direction — important because current flows both
ways through passive components.

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

`loadCircuit` in the store injects `measured: { width, height }` on every
node using `ensureMeasured()`. This gives XYFlow node dimensions before
DOM measurement, so edge handle positions are correct on the first
render. Without this, edges appear "floating" (disconnected from
handles) until XYFlow's ResizeObserver fires. Component dimensions are
looked up from the `SYMBOLS` registry in `src/lib/models/`; rotation
(90/270) swaps width and height.
