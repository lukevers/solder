# Circuit Tabs Implementation Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a multi-tab system to the solder circuit editor so users can maintain multiple independent circuits simultaneously, with each tab persisted to localStorage.

**Architecture:** Extend the existing Zustand store with a `tabs` array and `activeTabId`. All existing top-level circuit fields (`nodes`, `edges`, `selectedNodeId`, `past`, `future`) remain in place — `switchTab` saves current state into the departing tab and hydrates from the arriving tab. The `persist` middleware serializes tabs to localStorage. Only `Toolbar.tsx` and `src/store/index.ts` change; no canvas or inspector components are touched.

**Tech Stack:** React, Zustand (`persist` middleware), TypeScript, Tailwind CSS

---

## Data Model

### Tab type (added to `src/store/index.ts`)

```ts
type Tab = {
  id: string;
  name: string;
  nodes: ComponentNode[];
  edges: Edge[];
  selectedNodeId: string | null;
  past: Array<Snapshot>;
  future: Array<Snapshot>;
};
```

### Default tab factory

```ts
function defaultTab(name: string): Tab {
  return {
    id: crypto.randomUUID(),
    name,
    nodes: [
      { id: 'in', type: 'audiin', position: { x: 100, y: 200 }, data: { label: 'IN' } },
      { id: 'out', type: 'audiout', position: { x: 400, y: 200 }, data: { label: 'OUT' } },
    ] as Array<ComponentNode>,
    edges: [
      { id: 'e', source: 'in', sourceHandle: 'out', target: 'out', targetHandle: 'in' },
    ] as Array<Edge>,
    selectedNodeId: null,
    past: [],
    future: [],
  };
}
```

### New tab name

Auto-increment from the highest existing `"Circuit N"` number: if tabs are `["Circuit 1", "My pedal", "Circuit 3"]`, the next name is `"Circuit 4"`.

---

## Store Changes (`src/store/index.ts`)

### New state fields

```ts
tabs: Array<Tab>;         // all open tabs
activeTabId: string;      // id of the active tab
```

### New actions

| Action | Behaviour |
|---|---|
| `addTab()` | Flush current state into active tab, create `defaultTab("Circuit N")`, push to `tabs`, set as active |
| `switchTab(id)` | Flush current state into active tab, hydrate top-level fields from target tab, set `activeTabId` |
| `closeTab(id)` | Remove tab. If it was active, activate the nearest remaining tab (prefer the one to the left; fall back to the one to the right). If `tabs` becomes empty, create a fresh default tab and activate it. |
| `renameTab(id, name)` | Update `tabs[i].name` for the matching tab. |

### Flushing (save-on-switch)

Before switching away from the active tab, write current top-level state back into its `tabs` entry:

```ts
function flushActive(state: StoreState): Array<Tab> {
  return state.tabs.map((t) =>
    t.id === state.activeTabId
      ? { ...t, nodes: state.nodes, edges: state.edges,
          selectedNodeId: state.selectedNodeId,
          past: state.past, future: state.future }
      : t,
  );
}
```

### Persistence

Wrap `create` with Zustand's `persist` middleware:

```ts
import { persist } from 'zustand/middleware';

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({ ... }),
    {
      name: 'solder-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const active = state.tabs.find((t) => t.id === state.activeTabId);
        if (active) {
          state.nodes = active.nodes;
          state.edges = active.edges;
          state.selectedNodeId = active.selectedNodeId;
          state.past = active.past;
          state.future = active.future;
        }
      },
    },
  ),
);
```

### Initial state

Replace the flat `initialState` circuit fields with:

```ts
const firstTab = defaultTab('Circuit 1');
const initialState = {
  tabs: [firstTab],
  activeTabId: firstTab.id,
  nodes: firstTab.nodes,
  edges: firstTab.edges,
  selectedNodeId: null,
  past: [],
  future: [],
  // ... simulation and audio fields unchanged
};
```

---

## Toolbar Changes (`src/components/Toolbar.tsx`)

### Logo row layout

```
[ ⚡ solder ] [ | ] [ 📁 Examples ] [ | ] [ Circuit 1 ✕ ] [ Circuit 2 ✕ ] [ + ]  →  (fills remaining width)
```

- Logo and Examples button are pinned left with a vertical divider after them.
- Tab strip grows to fill remaining width using `flex-1`.
- Tabs overflow horizontally if there are many (no wrapping).
- The ＋ button sits immediately after the last tab.

### Tab component (inline in Toolbar)

Each tab renders:

- **Inactive:** `bg-transparent text-gray-400`, hover `text-gray-200 bg-gray-800`
- **Active:** `bg-gray-800 text-gray-100`, blue `border-b-2 border-blue-500`, `margin-bottom: -1px` to merge with the row's bottom border

**Rename interaction:**

- Double-click on the tab name → replace name `<span>` with `<input>` pre-filled with current name.
- `onBlur` and `onKeyDown Enter` → call `renameTab(id, trimmed)` and exit edit mode. If trimmed is empty, keep the old name.
- `onKeyDown Escape` → cancel without saving.
- Local `editingTabId: string | null` state in Toolbar controls which tab shows the input.

**Close interaction:**

- ✕ button on each tab calls `closeTab(id)`.
- Clicking ✕ does not propagate to the tab's `onClick` (i.e., `e.stopPropagation()`).
- The last remaining tab does not show ✕ (cannot close when only one tab exists).

### Props

`ToolbarProps` gains no new props — all tab state comes from the store directly.

---

## Behaviour Details

- **Undo/redo per tab:** Each tab stores its own `past`/`future`. Switching tabs restores the previous tab's undo stack exactly. The keyboard shortcut handler in `App.tsx` is unchanged — it calls `undo()`/`redo()` on the store, which always operates on the currently active tab's history.
- **Simulation state is global:** `simulationStatus`, `outputBuffer`, `simulationError` are not persisted and are not per-tab. Switching tabs does not reset or restart simulation.
- **Audio state is global:** `audioSource`, `volume`, `playing` are not per-tab and not persisted by the tabs middleware (they already have no persistence).
- **Examples panel:** Loading a circuit from Examples calls `loadCircuit`, which replaces the active tab's nodes/edges. This is unchanged — it does not create a new tab.
- **localStorage key:** `solder-tabs`. If the key is absent or corrupted, the store falls back to `initialState` (one default tab).

---

## Files Changed

| File | Change |
|---|---|
| `src/store/index.ts` | Add `Tab` type, `defaultTab()`, tab state fields, tab actions, `persist` wrapper, `onRehydrateStorage` |
| `src/components/Toolbar.tsx` | Render tab strip in logo row; tab click/close/rename/add interactions |

No other files change.
