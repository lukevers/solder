# Trace Delete UX Design

**Date:** 2026-04-16  
**Status:** Approved

## Problem

There is currently no way to delete a trace (edge) on mobile or touch devices. On desktop, selecting an edge and pressing Backspace/Delete works, but there is no keyboard on mobile. Additionally, the Inspector sidebar shows edge details but lacks a delete button (unlike nodes).

## Solution

Two complementary delete affordances:

1. **Midpoint popup on the trace** — A pill button (Trash2 icon + "Delete" label) rendered at the geometric midpoint of the selected trace, floating above the canvas. Appears whenever any trace is selected (desktop and mobile).
2. **Delete button in the Inspector sidebar** — A delete button added to the `EdgeInspector` section in `Inspector.tsx`, matching the existing node delete button style exactly.

## Design Details

### Midpoint popup

- Appears when a trace's `selected` prop is `true`
- Positioned at `labelX, labelY` from `getSmoothStepPath` (the geometric midpoint of the edge path)
- Rendered via XYFlow's `EdgeLabelRenderer` — this ensures it moves correctly with pan and zoom
- Style: dark background (`#1f2937`), red border (`#ef4444`), red text/icon (`#f87171`), rounded pill (`border-radius: 6px`), `padding: 5px 12px`, drop shadow
- Content: `Trash2` icon (11px) + "Delete" text, monospace font, 12px
- Uses `transform: translate(-50%, -50%)` via `nodrag nopan` class to center on the midpoint

### Inspector sidebar delete button

- Added to `EdgeInspector` in `Inspector.tsx`
- Identical styling to the existing node delete button:
  `bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300`
- Shows `Trash2` icon (11px) + "Delete" label
- Positioned below the edge details fields

### Store change

- Add `deleteEdge(id: string)` action to the Zustand store (mirrors `deleteNode`)
- Inline history push: appends current `{ nodes, edges }` snapshot to `past`, clears `future` (same as `deleteNode`)
- Filters `edges` by id
- Clears `outputBuffer` and resets `simulationStatus` to `idle` (via `clearSim`, same as other circuit mutations)
- Sets `selectedEdgeId: null`
- All in a single atomic `set()` call — no separate `pushHistory()` or `selectEdge()` calls needed

## Files to Change

| File | Change |
|------|--------|
| `src/store/index.ts` | Add `deleteEdge` action to store interface and implementation |
| `src/components/edges/SignalEdge.tsx` | Destructure `labelX, labelY`; add `EdgeLabelRenderer` with pill delete button when `selected` |
| `src/components/Inspector.tsx` | Add delete button to `EdgeInspector`; wire to `deleteEdge` |

## Behaviour

- Clicking delete in either location calls `deleteEdge(id)` — the action atomically pushes history, removes the edge, clears sim state, and sets `selectedEdgeId: null`
- Undo restores the deleted edge (via existing history mechanism)
- The popup does not appear on unselected traces

## Out of Scope

- Confirmation dialog before delete (matches existing node delete behaviour — no confirmation)
- Any change to how Desktop keyboard Delete/Backspace works
