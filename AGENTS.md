# AGENTS.md

Routing guide for Claude Code and other coding agents working in this
repository. **CLAUDE.md is a symlink to this file** — edit `AGENTS.md`
once and both are updated.

**Solder** is a visual circuit editor and audio effects simulator built
with React 19 + TypeScript + Vite. Users place and connect circuit
components on a schematic canvas, and the app compiles that to a SPICE
netlist to simulate audio signal processing via ngspice WASM.

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

## Where to find what

Detailed documentation lives in `docs/`. **Read the relevant file
BEFORE making changes in the corresponding area.** Source files in
high-risk areas carry `// See docs/<name>.md` signposts at the top to
remind you.

| If you're touching… | Read first |
|---|---|
| `src/lib/netlist.ts`, op-amp `.SUBCKT`, or anything that runs in the simulation worker | [`docs/simulation.md`](docs/simulation.md) — POLY/1G/SAB gotchas, netlist compilation, ngspice quirks |
| `src/lib/models/` (adding a component, symbols, node renderers, XYFlow handles) | [`docs/component-library.md`](docs/component-library.md) — three-step registration, worker/import boundaries, handle ID table |
| `src/store/` or Zustand hooks | [`docs/architecture.md`](docs/architecture.md) — slice layout, hook guidelines, data flow |
| `src/lib/audio/`, `AudioPipeline`, sample uploads | [`docs/audio.md`](docs/audio.md) — autoplay policy, IndexedDB persistence rules |
| `src/lib/palette.ts`, `App.tsx` keydown handler, `HelpModal`, new modal overlays | [`docs/ui-patterns.md`](docs/ui-patterns.md) — palette catalog, global hotkey gating, modal opt-in |
| Adding or renaming a keyboard shortcut | [`docs/keyboard-shortcuts.md`](docs/keyboard-shortcuts.md) — user-facing reference; also see [`docs/ui-patterns.md`](docs/ui-patterns.md) for the implementation pattern |
| `src/examples/` (new example circuits) | [`docs/examples.md`](docs/examples.md) for the user-facing tour; [`docs/ui-patterns.md`](docs/ui-patterns.md) for the writing conventions |
| Writing any code | [`docs/code-style.md`](docs/code-style.md) — early returns, block comments, file organization |

## Project layout (one-screen overview)

```
src/
  App.tsx                 — top-level shell, global hotkeys, simulate orchestration
  components/             — React UI (Toolbar, Inspector, modals, etc.)
  examples/               — preset circuits as JSON
  lib/
    netlist.ts            — circuit → SPICE netlist compiler   [docs/simulation.md]
    palette.ts            — placement catalog (toolbar + cmd bar) [docs/ui-patterns.md]
    types.ts              — discriminated ComponentNode union
    models/               — per-component symbol + node + SPICE [docs/component-library.md]
    audio/                — AudioPipeline + local sample store  [docs/audio.md]
    engines/eecircuit.ts  — ngspice WASM wrapper
    circuit-io.ts         — JSON import/export
  store/                  — single Zustand store, split by domain [docs/architecture.md]
  workers/                — simulation + analysis Web Workers
  test/                   — vitest specs
docs/                     — split-out reference docs (this file routes to them)
```

## Tooling

- **Linter / Formatter:** Biome (`biome.json`) — single quotes, 2-space
  indent; the `biomejs.biome` VSCode extension is recommended.
- **Icons:** [Lucide React](https://lucide.dev) (`lucide-react`) — use
  Lucide for all UI icons (toolbar buttons, modal controls, etc.). Do
  NOT use inline SVGs or emoji/text symbols for icons. Circuit node
  renderers in `src/lib/models/` use inline SVG for schematic drawings,
  which is fine — those are not UI icons.
- **CSS:** Tailwind CSS + PostCSS.
- **Tests:** Vitest with jsdom; `@testing-library/react` and
  `@testing-library/jest-dom` matchers; test files live in `src/test/`.

## Conventions at a glance

These are universal — they apply everywhere and are the single
non-negotiable bit kept in this file. The full rationale + examples
live in [`docs/code-style.md`](docs/code-style.md).

- **Early returns** with braces; flatten nesting at the top of every
  function.
- **Multi-line `/** … */` block comments** above every function and
  top-level constant, even when it seems obvious. Write for a junior
  reader.
- **Split files by domain, not by kind** — no `types.ts` /
  `constants.ts` grab-bag files.
- **`font-mono`** for interaction chrome (buttons, toolbars, labels);
  **`font-sans`** for prose (modal body copy, help text).
- Never re-export a `.tsx` renderer from
  `src/lib/models/index.ts` — workers import from there. See
  [`docs/component-library.md`](docs/component-library.md).
