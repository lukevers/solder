# Circuit Export/Import Design

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users export the active tab's circuit to a JSON file and import a JSON file back into the active tab.

**Architecture:** Pure serialization logic lives in a new `src/lib/circuit-io.ts` (no DOM, fully unit-testable). The Toolbar gains Export and Import buttons in the palette row. Import uses a hidden `<input type="file">` ref. Errors surface through the existing `setSimulationError` store action so the StatusBar displays them without any new UI.

**Tech Stack:** React, Zustand, TypeScript, browser File/Blob APIs, Vitest

---

## JSON Format

```json
{
  "version": 1,
  "name": "Circuit 1",
  "nodes": [ ... ],
  "edges": [ ... ]
}
```

- `version`: integer — always `1` for now; reserved for future format migrations.
- `name`: string — the tab name at the time of export; restores the tab name on import.
- `nodes`: `ComponentNode[]` — full ReactFlow node objects as-is.
- `edges`: `Edge[]` — full ReactFlow edge objects as-is.

The file is saved with the tab's name as the filename, e.g. `Circuit 1.json`. Non-filesystem-safe characters are stripped.

---

## `src/lib/circuit-io.ts` (new file)

Two exported functions, no DOM, no React, no store imports.

### `exportCircuit(tab: Tab): string`

Serialises `tab.name`, `tab.nodes`, `tab.edges` into the JSON format above and returns the JSON string. Does not trigger a download — the caller handles that.

```ts
import type { Tab } from '../store';

export function exportCircuit(tab: Tab): string {
  return JSON.stringify(
    { version: 1, name: tab.name, nodes: tab.nodes, edges: tab.edges },
    null,
    2,
  );
}
```

### `importCircuit(json: string): { name: string; nodes: ComponentNode[]; edges: Edge[] }`

Parses and validates. Throws a descriptive `Error` for any of these cases:
- Input is not valid JSON
- Parsed value is not an object
- `nodes` field is missing or not an array
- `edges` field is missing or not an array
- `name` field is missing or not a string

Does **not** validate individual node/edge shapes — trusts that exported files are well-formed. Returns `{ name, nodes, edges }` on success.

```ts
export function importCircuit(json: string): {
  name: string;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error('Invalid JSON file');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('File is not a valid circuit (expected an object)');
  }
  const obj = parsed as Record<string, unknown>;
  if (!Array.isArray(obj.nodes)) {
    throw new Error('File is missing a "nodes" array');
  }
  if (!Array.isArray(obj.edges)) {
    throw new Error('File is missing an "edges" array');
  }
  if (typeof obj.name !== 'string') {
    throw new Error('File is missing a "name" string');
  }
  return {
    name: obj.name,
    nodes: obj.nodes as Array<ComponentNode>,
    edges: obj.edges as Array<Edge>,
  };
}
```

---

## Toolbar Changes (`src/components/Toolbar.tsx`)

### Palette row layout (updated)

```
[ 📁 Examples ] [ ↓ Export ] [ ↑ Import ] [ | ] [ IN ] [ OUT ] ... [ U ] → [ ▶ Simulate ]
```

Export and Import sit between Examples and the divider, with no additional dividers between them and Examples.

### Export button behaviour

1. Get the active tab: read `tabs` and `activeTabId` from the store.
2. Call `exportCircuit(activeTab)` to get the JSON string.
3. Create `new Blob([json], { type: 'application/json' })`.
4. Create a temporary `<a>` element, set `href = URL.createObjectURL(blob)`, set `download = sanitisedFileName(activeTab.name)` (strip characters not safe in filenames: replace `/\s+/g` with `_` and `/[^\w\-_.]/g` with empty string, then append `.json`).
5. Click the anchor, then `URL.revokeObjectURL`.

The active tab is read directly from the store inside the click handler, so it does not need to be a reactive selector.

### Import button behaviour

1. A hidden `<input type="file" accept=".json" ref={fileInputRef}>` is rendered once in the component (outside the JSX tree, using `style={{ display: 'none' }}`).
2. Clicking the Import button calls `fileInputRef.current?.click()`.
3. The input's `onChange` reads `e.target.files?.[0]`, calls `file.text()`, then calls `importCircuit(text)`.
4. On success: calls `loadCircuit(nodes, edges)` and `renameTab(activeTabId, name)`.
5. On error: calls `setSimulationError(err.message)`.
6. Resets `e.target.value = ''` so the same file can be re-imported if needed.

### New store selectors needed in Toolbar

```ts
const { ..., tabs, activeTabId, renameTab, loadCircuit, setSimulationError } = useStore(
  useShallow((s) => ({
    ...
    tabs: s.tabs,
    activeTabId: s.activeTabId,
    renameTab: s.renameTab,
    loadCircuit: s.loadCircuit,
    setSimulationError: s.setSimulationError,
  })),
);
```

---

## Tests (`src/test/circuit-io.test.ts`, new file)

| Test | Description |
|---|---|
| `exportCircuit` produces valid JSON | Parse the output of `exportCircuit` — should not throw |
| `exportCircuit` includes version 1 | Parsed object has `version === 1` |
| `exportCircuit` round-trips nodes and edges | `importCircuit(exportCircuit(tab))` returns same nodes/edges/name |
| `importCircuit` throws on invalid JSON | Input `"not json"` → throws "Invalid JSON file" |
| `importCircuit` throws on non-object | Input `"42"` → throws "expected an object" |
| `importCircuit` throws when nodes missing | `{ name: 'x', edges: [] }` → throws "missing a \"nodes\" array" |
| `importCircuit` throws when edges missing | `{ name: 'x', nodes: [] }` → throws "missing an \"edges\" array" |
| `importCircuit` throws when name missing | `{ nodes: [], edges: [] }` → throws "missing a \"name\" string" |
| `importCircuit` returns name, nodes, edges | Valid input → correct shape returned |

---

## Files Changed

| File | Change |
|---|---|
| `src/lib/circuit-io.ts` | New — `exportCircuit`, `importCircuit` |
| `src/test/circuit-io.test.ts` | New — unit tests for both functions |
| `src/components/Toolbar.tsx` | Add Export/Import buttons to palette row; hidden file input ref |
