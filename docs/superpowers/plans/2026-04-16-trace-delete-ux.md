# Trace Delete UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pill-style delete button at the midpoint of selected traces (edges) and a matching delete button in the Inspector sidebar.

**Architecture:** A new `deleteEdge(id)` store action mirrors `deleteNode` — atomic history push, edge filter, sim clear, and deselect. `SignalEdge` renders an `EdgeLabelRenderer`-based pill button when selected. `Inspector`'s `EdgeInspector` gets the same delete button nodes already have.

**Tech Stack:** React 19, Zustand, XYFlow (`@xyflow/react`), Lucide React, Tailwind CSS, Vitest

---

## File Map

| File | Change |
|------|--------|
| `src/store/index.ts` | Add `deleteEdge` to interface + implementation |
| `src/components/edges/SignalEdge.tsx` | Add `EdgeLabelRenderer` pill when `selected` |
| `src/components/Inspector.tsx` | Add delete button to `EdgeInspector` |
| `src/test/store.test.ts` | Add `deleteEdge` tests |

---

### Task 1: Add `deleteEdge` to the store

**Files:**
- Modify: `src/store/index.ts`
- Test: `src/test/store.test.ts`

- [ ] **Step 1: Write the failing test**

Open `src/test/store.test.ts` and add these two tests inside the existing `describe('circuitSlice', ...)` block, after the existing tests:

```typescript
it('deleteEdge removes the edge and clears selectedEdgeId', () => {
  useStore.setState({
    edges: [{ id: 'e1', source: 'r1', target: 'c1' }],
    selectedEdgeId: 'e1',
  });
  useStore.getState().deleteEdge('e1');
  expect(useStore.getState().edges).toHaveLength(0);
  expect(useStore.getState().selectedEdgeId).toBeNull();
});

it('deleteEdge pushes history and clears sim', () => {
  useStore.setState({
    nodes: [],
    edges: [{ id: 'e1', source: 'r1', target: 'c1' }],
    outputBuffer: new Float32Array([1, 2, 3]),
    simulationStatus: 'idle',
    past: [],
    future: [],
  });
  useStore.getState().deleteEdge('e1');
  expect(useStore.getState().past).toHaveLength(1);
  expect(useStore.getState().future).toHaveLength(0);
  expect(useStore.getState().outputBuffer).toBeNull();
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
npx vitest run src/test/store.test.ts
```

Expected: 2 failures mentioning `deleteEdge is not a function`.

- [ ] **Step 3: Add `deleteEdge` to the store interface**

In `src/store/index.ts`, find the line:

```typescript
  deleteNode: (id: string) => void;
```

Add immediately after it:

```typescript
  deleteEdge: (id: string) => void;
```

- [ ] **Step 4: Add `deleteEdge` implementation**

In `src/store/index.ts`, find the `deleteNode` implementation block (around line 312) which ends with `})),`. Add the following immediately after it:

```typescript
      deleteEdge: (id) =>
        set((s) => ({
          past: [
            ...s.past.slice(-MAX_HISTORY),
            { nodes: s.nodes, edges: s.edges },
          ],
          future: [],
          edges: s.edges.filter((e) => e.id !== id),
          selectedEdgeId: null,
          ...clearSim,
        })),
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
npx vitest run src/test/store.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/store/index.ts src/test/store.test.ts
git commit -m "feat: add deleteEdge store action"
```

---

### Task 2: Add pill delete button to SignalEdge

**Files:**
- Modify: `src/components/edges/SignalEdge.tsx`

- [ ] **Step 1: Update the import line**

Replace the existing import at the top of `src/components/edges/SignalEdge.tsx`:

```typescript
import { type EdgeProps, getSmoothStepPath } from '@xyflow/react';
```

with:

```typescript
import { type EdgeProps, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useStore } from '../../store';
```

- [ ] **Step 2: Destructure `labelX` and `labelY` from `getSmoothStepPath`**

Find:

```typescript
  const [edgePath] = getSmoothStepPath({
```

Replace with:

```typescript
  const [edgePath, labelX, labelY] = getSmoothStepPath({
```

- [ ] **Step 3: Add `deleteEdge` from the store**

Find the line:

```typescript
  const d = data as SignalEdgeData | undefined;
```

Add one line before it:

```typescript
  const deleteEdge = useStore((s) => s.deleteEdge);
```

- [ ] **Step 4: Add the `EdgeLabelRenderer` pill**

The current `return` statement ends with `</>`. Replace the entire `return` block with:

```tsx
  return (
    <>
      {/* Wide invisible hit area for easier interaction */}
      <path d={edgePath} fill="none" stroke="transparent" strokeWidth={20} />
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.3}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6 5"
        className={isDC ? 'edge-anim-dc' : 'edge-anim-ac'}
      />
      {selected && (
        <EdgeLabelRenderer>
          <button
            type="button"
            className="nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 12px',
              background: '#1f2937',
              border: '1px solid #ef4444',
              borderRadius: '6px',
              color: '#f87171',
              fontSize: '12px',
              fontFamily: 'monospace',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            }}
            onClick={() => deleteEdge(id)}
          >
            <Trash2 size={11} />
            Delete
          </button>
        </EdgeLabelRenderer>
      )}
    </>
  );
```

- [ ] **Step 5: Verify no lint errors**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/edges/SignalEdge.tsx
git commit -m "feat: show delete pill at midpoint of selected trace"
```

---

### Task 3: Add delete button to EdgeInspector in Inspector sidebar

**Files:**
- Modify: `src/components/Inspector.tsx`

- [ ] **Step 1: Add `deleteEdge` to the Inspector's store subscription**

Find the `Inspector` function (near line 681). It currently destructures from the store:

```typescript
  const { nodes, edges, selectedNodeId, selectedEdgeId, deleteNode } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeId: s.selectedNodeId,
      selectedEdgeId: s.selectedEdgeId,
      deleteNode: s.deleteNode,
    })),
  );
```

Replace with:

```typescript
  const { nodes, edges, selectedNodeId, selectedEdgeId, deleteNode, deleteEdge } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeId: s.selectedNodeId,
      selectedEdgeId: s.selectedEdgeId,
      deleteNode: s.deleteNode,
      deleteEdge: s.deleteEdge,
    })),
  );
```

- [ ] **Step 2: Add delete button to the edge inspector panel**

Find the block that renders `EdgeInspector` when `selectedEdgeId` is set:

```tsx
  if (selectedEdgeId) {
    return (
      <div className="p-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Inspector · trace
        </div>
        <EdgeInspector edgeId={selectedEdgeId} nodes={nodes} edges={edges} />
      </div>
    );
  }
```

Replace with:

```tsx
  if (selectedEdgeId) {
    return (
      <div className="p-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Inspector · trace
        </div>
        <EdgeInspector edgeId={selectedEdgeId} nodes={nodes} edges={edges} />
        <button
          type="button"
          onClick={() => deleteEdge(selectedEdgeId)}
          className="flex items-center justify-center gap-1.5 w-full mt-2 text-xs py-1.5 rounded font-mono transition-colors bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    );
  }
```

- [ ] **Step 3: Verify no lint errors**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Smoke test manually**

Run `pnpm dev`, open the app, draw a wire between two components, click it — verify:
- A "Delete" pill appears at the midpoint of the selected trace
- The Inspector sidebar shows a "Delete" button at the bottom
- Clicking either button removes the trace
- Cmd+Z (undo) restores it

- [ ] **Step 5: Commit**

```bash
git add src/components/Inspector.tsx
git commit -m "feat: add delete button for traces in Inspector sidebar"
```
