# Circuit Export/Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users export the active tab's circuit to a `.json` file and import a `.json` file back into the active tab.

**Architecture:** A new pure-function module `src/lib/circuit-io.ts` handles serialisation/deserialisation with no DOM or React dependencies. The Toolbar gains Export and Import buttons in the palette row (between Examples and the divider). Import uses a hidden `<input type="file">` ref; errors surface through the existing `setSimulationError` store action.

**Tech Stack:** React, Zustand, TypeScript, browser Blob/URL APIs, Vitest

---

## Files

| File | Change |
|---|---|
| `src/lib/circuit-io.ts` | Create — `exportCircuit`, `importCircuit` |
| `src/test/circuit-io.test.ts` | Create — unit tests for both functions |
| `src/components/Toolbar.tsx` | Modify — Export + Import buttons, hidden file input |

---

## Task 1: `circuit-io.ts` — serialisation module + tests (TDD)

**Files:**
- Create: `src/lib/circuit-io.ts`
- Create: `src/test/circuit-io.test.ts`

### Background

`exportCircuit(tab)` takes a `Tab` (imported from `src/store`) and returns a pretty-printed JSON string in the format:
```json
{ "version": 1, "name": "Circuit 1", "nodes": [...], "edges": [...] }
```

`importCircuit(json)` parses and validates, returning `{ name, nodes, edges }` or throwing a descriptive `Error`.

The `Tab` type is already exported from `src/store/index.ts`. `ComponentNode` is exported from `src/lib/types.ts`. `Edge` is from `@xyflow/react`.

---

- [ ] **Step 1: Write the failing tests**

Create `src/test/circuit-io.test.ts`:

```ts
// src/test/circuit-io.test.ts
import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { Tab } from '../store';

const SAMPLE_TAB: Tab = {
  id: 'tab-1',
  name: 'My Circuit',
  nodes: [
    {
      id: 'n1',
      type: 'resistor',
      position: { x: 100, y: 100 },
      data: { label: 'R1', ohms: 10000 },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'n1',
      sourceHandle: 'a',
      target: 'n2',
      targetHandle: 'b',
    } as Edge,
  ],
  selectedNodeId: null,
  past: [],
  future: [],
};

describe('exportCircuit', () => {
  it('returns valid JSON', () => {
    expect(() => JSON.parse(exportCircuit(SAMPLE_TAB))).not.toThrow();
  });

  it('includes version 1', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.version).toBe(1);
  });

  it('includes name from tab', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.name).toBe('My Circuit');
  });

  it('includes nodes and edges', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
  });
});

describe('importCircuit', () => {
  it('round-trips a tab', () => {
    const json = exportCircuit(SAMPLE_TAB);
    const result = importCircuit(json);
    expect(result.name).toBe('My Circuit');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('n1');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].id).toBe('e1');
  });

  it('throws on invalid JSON', () => {
    expect(() => importCircuit('not json')).toThrow('Invalid JSON file');
  });

  it('throws on non-object', () => {
    expect(() => importCircuit('42')).toThrow('expected an object');
  });

  it('throws when nodes missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ name: 'x', edges: [] })),
    ).toThrow('"nodes" array');
  });

  it('throws when edges missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ name: 'x', nodes: [] })),
    ).toThrow('"edges" array');
  });

  it('throws when name missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ nodes: [], edges: [] })),
    ).toThrow('"name" string');
  });

  it('returns name, nodes, edges on valid input', () => {
    const result = importCircuit(
      JSON.stringify({ version: 1, name: 'Test', nodes: [], edges: [] }),
    );
    expect(result).toEqual({ name: 'Test', nodes: [], edges: [] });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -15
```

Expected: errors like `Cannot find module '../lib/circuit-io'`.

---

- [ ] **Step 3: Create `src/lib/circuit-io.ts`**

```ts
// src/lib/circuit-io.ts
import type { Edge } from '@xyflow/react';
import type { Tab } from '../store';
import type { ComponentNode } from './types';

export function exportCircuit(tab: Tab): string {
  return JSON.stringify(
    { version: 1, name: tab.name, nodes: tab.nodes, edges: tab.edges },
    null,
    2,
  );
}

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

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected:
```
 Test Files  3 passed (3)
      Tests  41 passed (41)
```

If biome complains, run:
```bash
pnpm biome check --write --unsafe src/lib/circuit-io.ts src/test/circuit-io.test.ts
```

- [ ] **Step 5: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/lib/circuit-io.ts src/test/circuit-io.test.ts && git commit -m "feat: add circuit-io serialisation module with tests"
```

---

## Task 2: Toolbar — Export and Import buttons

**Files:**
- Modify: `src/components/Toolbar.tsx`

### Background

The current palette row is:
```
[ 📁 Examples ] [ | divider ] [ IN ] [ OUT ] … [ U ] [flex-1] [ ▶ Simulate ]
```

After this task:
```
[ 📁 Examples ] [ ↓ Export ] [ ↑ Import ] [ | divider ] [ IN ] [ OUT ] … [ U ] [flex-1] [ ▶ Simulate ]
```

Export and Import sit between the Examples button and the existing vertical divider, with `gap-2` already applied by the parent flex container.

**Export logic:**
1. Find the active tab: `tabs.find((t) => t.id === activeTabId)!`
2. Call `exportCircuit(activeTab)` → JSON string
3. `new Blob([json], { type: 'application/json' })`
4. Create `<a>`, set `href = URL.createObjectURL(blob)`, set `download = sanitiseFilename(activeTab.name) + '.json'`
5. Append to `document.body`, `.click()`, remove, `URL.revokeObjectURL(href)`

`sanitiseFilename(name: string): string` — inline helper: `name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '')` then fallback to `'circuit'` if the result is empty.

**Import logic:**
1. A hidden `<input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport}>` rendered once inside the component.
2. Clicking the Import button calls `fileInputRef.current?.click()`.
3. `handleImport(e)`: read `e.target.files?.[0]`, call `.text()`, call `importCircuit(text)`, then `loadCircuit(nodes, edges)` + `renameTab(activeTabId, name)`. On error, call `setSimulationError(err instanceof Error ? err.message : String(err))`. Always reset `e.target.value = ''`.

**New store selectors to add to the existing `useShallow` call:**
- `loadCircuit: s.loadCircuit`
- `setSimulationError: s.setSimulationError`

(`tabs`, `activeTabId`, `renameTab` are already selected.)

---

- [ ] **Step 1: Add new imports to `src/components/Toolbar.tsx`**

At the top of the file, add the `circuit-io` import. The existing imports are:

```ts
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';
```

Change to:

```ts
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';
```

- [ ] **Step 2: Extend the `useShallow` selector to include `loadCircuit` and `setSimulationError`**

The current selector (lines 84–106) ends with `renameTab: s.renameTab`. Extend it:

```ts
  const {
    addNode,
    simulationStatus,
    nodes,
    tabs,
    activeTabId,
    addTab,
    closeTab,
    switchTab,
    renameTab,
    loadCircuit,
    setSimulationError,
  } = useStore(
    useShallow((s) => ({
      addNode: s.addNode,
      simulationStatus: s.simulationStatus,
      nodes: s.nodes,
      tabs: s.tabs,
      activeTabId: s.activeTabId,
      addTab: s.addTab,
      closeTab: s.closeTab,
      switchTab: s.switchTab,
      renameTab: s.renameTab,
      loadCircuit: s.loadCircuit,
      setSimulationError: s.setSimulationError,
    })),
  );
```

- [ ] **Step 3: Add the file input ref, export handler, and import handler after the existing `commitRename` function**

After the `commitRename` function (line 138), add:

```ts
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const activeTab = tabs.find((t) => t.id === activeTabId)!;
    const json = exportCircuit(activeTab);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName =
      activeTab.name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '') ||
      'circuit';
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const { name, nodes: importedNodes, edges: importedEdges } =
        importCircuit(text);
      loadCircuit(importedNodes, importedEdges);
      renameTab(activeTabId, name);
    } catch (err) {
      setSimulationError(
        err instanceof Error ? err.message : String(err),
      );
    }
  }
```

- [ ] **Step 4: Add the hidden file input and the Export/Import buttons to the palette row JSX**

The palette row currently starts (line 211) with:

```tsx
      {/* Palette row: Examples + divider + components + Simulate */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Examples button */}
        <button
          type="button"
          onClick={onToggleExamples}
```

Replace the entire palette row `<div>` with:

```tsx
      {/* Palette row: Examples + Export + Import + divider + components + Simulate */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {/* Examples button */}
        <button
          type="button"
          onClick={onToggleExamples}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 ${
            showExamples
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
          }`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M1 3.5A1.5 1.5 0 012.5 2h2.086a1 1 0 01.707.293L6 3h3.5A1.5 1.5 0 0111 4.5v4A1.5 1.5 0 019.5 10h-7A1.5 1.5 0 011 8.5v-5z"
              fill="currentColor"
              fillOpacity="0.7"
            />
          </svg>
          Examples
        </button>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 1v6M2 5l3 3 3-3M1 9h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Export
        </button>

        {/* Import button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M5 9V3M2 5l3-3 3 3M1 1h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Import
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Component palette */}
        {PALETTE.map((item) => {
          const disabled =
            item.unique &&
            ((item.type === 'audiin' && hasAudiin) ||
              (item.type === 'audiout' && hasAudiout));
          return (
            <div key={item.type} className="relative group flex-shrink-0">
              <button
                type="button"
                onClick={() => handleAdd(item)}
                disabled={disabled}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
              >
                {item.label}
              </button>
              <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                {disabled ? `${item.tooltip} already placed` : item.tooltip}
              </div>
            </div>
          );
        })}

        <div className="flex-1" />

        {/* Simulate */}
        <button
          type="button"
          onClick={onSimulate}
          disabled={simulationStatus === 'running'}
          className="bg-green-800 hover:bg-green-700 disabled:opacity-50 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
        >
          {simulationStatus === 'running' ? '⏳ Simulating…' : '▶ Simulate'}
        </button>
      </div>
```

- [ ] **Step 5: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check src/components/Toolbar.tsx 2>&1 | tail -10
```

Expected: no errors. If any, run:
```bash
pnpm biome check --write --unsafe src/components/Toolbar.tsx
```

- [ ] **Step 6: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected:
```
 Test Files  3 passed (3)
      Tests  41 passed (41)
```

- [ ] **Step 7: Manual smoke test**

Start dev server (`pnpm dev`) and verify:
1. Palette row shows: `Examples` | `↓ Export` | `↑ Import` | divider | `IN` … `U` | `▶ Simulate`
2. Clicking Export downloads a `.json` file named after the active tab (spaces → underscores)
3. Opening the downloaded file shows `version`, `name`, `nodes`, `edges`
4. Loading an example circuit, then clicking Import and selecting the downloaded file restores the circuit and renames the tab
5. Importing a non-JSON file (e.g. a `.txt`) shows an error in the StatusBar
6. Importing `{}` (valid JSON, wrong shape) shows "missing a \\"nodes\\" array" in the StatusBar

- [ ] **Step 8: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/components/Toolbar.tsx && git commit -m "feat: add Export and Import buttons to toolbar"
```
