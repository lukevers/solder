# UI Patterns

Conventions for the editor shell: the placement command bar, global
keyboard shortcuts, modals, and example circuits.

## Command bar / palette catalog (`src/lib/palette.ts`)

`PALETTE_ITEMS` is the single source of truth for "things the user can
place." Both the toolbar groupings and the `a` command bar consume it.
The catalog is hand-maintained, **not** derived from the symbol or node
registries, because:

- One symbol can map to several palette entries (e.g. the diode symbol
  backs `1N914`, `1N4001`, `1N270`, …, each with a different
  `defaultData.model`).
- Some palette entries (junction, label, stickynote, box) have no
  schematic symbol but still need a placement entry.

When adding to the catalog:

- Pick a stable `id` — it is persisted in the recently-used list and
  must not be reused once shipped.
- Place the entry in an existing `PALETTE_CATEGORIES` bucket or extend
  the array. Section order drives the on-screen order of the command
  bar.
- Fill in `searchTokens` with the aliases users will actually type
  ("op-amp", "fuzz", "fet"); the fuzzy filter matches against them.

## Global hotkeys and modal overlays

Editor-wide hotkeys live in `App.tsx`'s window-level `keydown` listener
(`a` to place, `r` / `Shift+R` to rotate, `Cmd/Ctrl+Z` to undo, `?` / `/`
for help, etc.). The handler gates on two things before doing anything:

1. **The focused element** — `INPUT`, `TEXTAREA`, `SELECT`, or
   `isContentEditable` short-circuits early so typing into a field never
   hijacks a shortcut.
2. **`anyModalOpenRef`** — a ref mirrored from every blocking modal flag
   (`showWelcomeModal`, `showHelpModal`, `showWaveformModal`,
   `commandBarOpen`). If any of those is true, the handler bails so the
   canvas underneath does not respond.

### When introducing a new modal/overlay

Add its open state to the `anyModalOpenRef` `useEffect` in `App.tsx`. A
modal that does not opt in will leak shortcuts to the schematic
underneath (e.g. pressing `a` would open the command bar behind a help
dialog).

### When adding a new global shortcut

Update **both** the keydown handler in `App.tsx` **and**
`buildSections()` in `src/components/HelpModal.tsx` so the `?` reference
stays accurate. The modal lists shortcuts grouped into Canvas / Edit /
Waveform / General; pick the closest section or extend the list.

## Writing example circuits

Example circuits live in `src/examples/` as JSON and are registered in
`src/examples/index.ts`. Key rules:

- **Edge direction must match handle types.** An edge's `sourceHandle`
  must exist as a `type="source"` handle on the source node, and
  `targetHandle` as `type="target"` on the target node. Mismatches
  produce React Flow error #008 and visually broken edges. With
  bidirectional handles this is usually fine, but junction handles are
  strictly directional (`s*` = source only, `t*` = target only). See
  [component-library.md](component-library.md) for the handle table.
- **`measured` is injected automatically** by `loadCircuit` →
  `ensureMeasured()`. You do NOT need to include `measured` in example
  JSON files.
- **Positions should align with op-amp handle offsets.** For the TL072
  triangle (80×80), `in_pos` (+) is upper-left (~y+20) and `in_neg` (−)
  is lower-left (~y+60). Place the inverting-input junction ~50px below
  the op-amp origin to visually align with `−`. See the gain-stage
  example as reference.
- **Bias networks for single-supply op-amps** need VCC → R → junction →
  R → GND voltage divider, bypass cap to ground, and junction →
  `in_pos`. Position the bias junction nearly above the op-amp so the
  wire drops vertically.
