# Code Style

Conventions Biome doesn't enforce. Apply across all `.ts` / `.tsx`
files.

## Early returns

Always use early returns to reduce nesting. Guard clauses at the top of
a function should handle edge cases and bail out early, keeping the main
logic at the lowest indentation level. Always use braces for return
statements — no single-line `if (x) return y`.

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

## Logical grouping

Group related lines of code together and separate unrelated blocks with
a blank line. Reorder statements within a block (where it doesn't affect
functionality) so that related logic is adjacent rather than
interleaved. Add blank lines after block statements (`if`, `for`,
`while`, etc.) to visually separate them from the next piece of logic.

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

## Block-level comments

Always add a multi-line `/** */` comment above functions and top-level
constants, even if they seem self-explanatory. Write for a junior
engineer — explain *what* and *why*, not just *how*. Use ASCII art
diagrams and tables inside comments where they help clarify
relationships, data flow, or structure. Comments must wrap at 80
characters. Never use the single-line `/** ... */` style — always use
multi-line.

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

## File organization — split by domain, not by kind

Don't create generic catch-all files that group things by what they are
(e.g., a single `types.ts` for all types, a single `symbols.ts` for all
symbols). Instead, split files by the domain they describe so that each
file is focused and self-contained. When a file starts covering multiple
unrelated domains, break it apart.

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

The test: if you need to add a new resistor variant, you should only
need to touch files in one area — not an 800-line grab-bag file shared
with op-amps, diodes, and audio types.

## Repeated hardcoded strings

If a non-trivial string literal appears in more than one place, replace
it with a named constant, a `const` object, or a type/enum derived from
a single source of truth. Prefer the narrowest useful scope:
domain-local constants for strings only used in one area, exported
constants for strings shared across modules, and union types derived
from those constants for state/status/category values. Do not keep
retyping the same status, kind, direction, label, or category string
inline across the repo.

## UI typography

- Default to `font-mono` for circuit-facing UI and interaction chrome
  such as buttons, labels, tabs, inspectors, numeric controls, and
  anything that should feel like part of the schematic tool.
- Default to `font-sans` for general reading text such as modal body
  copy, explanatory paragraphs, help text, and longer descriptive
  content.
