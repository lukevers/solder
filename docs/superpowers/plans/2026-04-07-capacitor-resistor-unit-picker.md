# Capacitor & Resistor Inline Unit Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the raw-farads and raw-ohms number inputs in the Inspector with an inline unit picker (number field + unit pills sharing one border).

**Architecture:** Extract unit detection and multiplier constants into `src/lib/units.ts` so they can be tested independently. Import them in `Inspector.tsx` and add local `useState` to `CapacitorInspector` and `ResistorInspector` for the active unit. The store and types are untouched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Vitest

---

### Task 1: Create `src/lib/units.ts` with tests

**Files:**
- Create: `src/lib/units.ts`
- Create: `src/test/units.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/test/units.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  detectCapUnit,
  detectResUnit,
  CAP_MULTIPLIERS,
  RES_MULTIPLIERS,
} from '../lib/units'

describe('detectCapUnit', () => {
  it('returns pF for values below 1 nF', () => {
    expect(detectCapUnit(1e-12)).toBe('pF')
    expect(detectCapUnit(999e-12)).toBe('pF')
  })
  it('returns nF for 1 nF to <1 µF', () => {
    expect(detectCapUnit(1e-9)).toBe('nF')
    expect(detectCapUnit(100e-9)).toBe('nF')
  })
  it('returns µF for 1 µF to <1 mF', () => {
    expect(detectCapUnit(1e-6)).toBe('µF')
    expect(detectCapUnit(47e-6)).toBe('µF')
  })
  it('returns mF for values ≥1 mF', () => {
    expect(detectCapUnit(1e-3)).toBe('mF')
  })
})

describe('detectResUnit', () => {
  it('returns Ω for values below 1 kΩ', () => {
    expect(detectResUnit(100)).toBe('Ω')
    expect(detectResUnit(999)).toBe('Ω')
  })
  it('returns kΩ for 1 kΩ to <1 MΩ', () => {
    expect(detectResUnit(1_000)).toBe('kΩ')
    expect(detectResUnit(10_000)).toBe('kΩ')
  })
  it('returns MΩ for values ≥1 MΩ', () => {
    expect(detectResUnit(1_000_000)).toBe('MΩ')
  })
})

describe('CAP_MULTIPLIERS', () => {
  it('converts 100 nF in farads to 100 for display', () => {
    expect(100e-9 * CAP_MULTIPLIERS['nF']).toBeCloseTo(100)
  })
  it('converts display value back to farads correctly', () => {
    expect(100 / CAP_MULTIPLIERS['nF']).toBeCloseTo(100e-9)
  })
})

describe('RES_MULTIPLIERS', () => {
  it('converts 10 kΩ in ohms to 10 for display', () => {
    expect(10_000 * RES_MULTIPLIERS['kΩ']).toBeCloseTo(10)
  })
  it('converts display value back to ohms correctly', () => {
    expect(10 / RES_MULTIPLIERS['kΩ']).toBeCloseTo(10_000)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/units.test.ts
```

Expected: FAIL — `Cannot find module '../lib/units'`

- [ ] **Step 3: Implement `src/lib/units.ts`**

Create `src/lib/units.ts`:

```ts
export type CapUnit = 'pF' | 'nF' | 'µF' | 'mF'
export type ResUnit = 'Ω' | 'kΩ' | 'MΩ'

export const CAP_MULTIPLIERS: Record<CapUnit, number> = {
  pF: 1e12,
  nF: 1e9,
  µF: 1e6,
  mF: 1e3,
}

export const RES_MULTIPLIERS: Record<ResUnit, number> = {
  'Ω': 1,
  'kΩ': 1e-3,
  'MΩ': 1e-6,
}

export function detectCapUnit(farads: number): CapUnit {
  if (farads < 1e-9) return 'pF'
  if (farads < 1e-6) return 'nF'
  if (farads < 1e-3) return 'µF'
  return 'mF'
}

export function detectResUnit(ohms: number): ResUnit {
  if (ohms < 1_000) return 'Ω'
  if (ohms < 1_000_000) return 'kΩ'
  return 'MΩ'
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/units.test.ts
```

Expected: all 8 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/units.ts src/test/units.test.ts
git commit -m "feat: add unit detection and multiplier utilities for capacitance and resistance"
```

---

### Task 2: Update `CapacitorInspector` with inline unit picker

**Files:**
- Modify: `src/components/Inspector.tsx`

- [ ] **Step 1: Add imports to `Inspector.tsx`**

At the top of `src/components/Inspector.tsx`, add `useState` to the React import and import the units utilities. The file currently starts with:

```ts
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode, DiodeData, PotData } from '../lib/types';
import { useStore } from '../store';
```

Change to:

```ts
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode, DiodeData, PotData } from '../lib/types';
import { useStore } from '../store';
import {
  CAP_MULTIPLIERS,
  detectCapUnit,
  type CapUnit,
} from '../lib/units';
```

- [ ] **Step 2: Replace `CapacitorInspector`**

The current `CapacitorInspector` (lines 58–91 of `src/components/Inspector.tsx`) is:

```tsx
function CapacitorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'capacitor' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, farads } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, farads })
          }
        />
      </Field>
      <Field label="Capacitance (F)">
        <input
          type="number"
          step="1e-9"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={farads}
          min={1e-12}
          onChange={(e) =>
            updateNodeData(node.id, { label, farads: Number(e.target.value) })
          }
        />
      </Field>
    </>
  );
}
```

Replace it with:

```tsx
const CAP_UNITS: CapUnit[] = ['pF', 'nF', 'µF', 'mF'];

function CapacitorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'capacitor' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, farads } = node.data;
  const [unit, setUnit] = useState<CapUnit>(() => detectCapUnit(farads));

  const displayValue = +(farads * CAP_MULTIPLIERS[unit]).toPrecision(6);

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, farads })
          }
        />
      </Field>
      <Field label="Capacitance">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          <input
            type="number"
            className="flex-1 min-w-0 bg-gray-950 text-gray-200 px-2 py-1 text-xs font-mono focus:outline-none"
            value={displayValue}
            min={0}
            onChange={(e) =>
              updateNodeData(node.id, {
                label,
                farads: Number(e.target.value) / CAP_MULTIPLIERS[unit],
              })
            }
          />
          {CAP_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={[
                'px-2 py-1 text-xs font-mono border-l border-gray-700',
                u === unit
                  ? 'bg-blue-950 text-blue-300'
                  : 'bg-gray-950 text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}
```

- [ ] **Step 3: Verify the app renders without errors**

```bash
pnpm dev
```

Open the app, place a capacitor, click it, confirm the Inspector shows a number field with pF / nF / µF / mF pills. Confirm switching pills rescales the number. Confirm typing a new number updates the component label on the canvas.

- [ ] **Step 4: Commit**

```bash
git add src/components/Inspector.tsx
git commit -m "feat: replace capacitor raw-farads input with inline unit picker"
```

---

### Task 3: Update `ResistorInspector` with inline unit picker

**Files:**
- Modify: `src/components/Inspector.tsx`

- [ ] **Step 1: Add `ResUnit` imports**

The import line added in Task 2 currently reads:

```ts
import {
  CAP_MULTIPLIERS,
  detectCapUnit,
  type CapUnit,
} from '../lib/units';
```

Change it to:

```ts
import {
  CAP_MULTIPLIERS,
  RES_MULTIPLIERS,
  detectCapUnit,
  detectResUnit,
  type CapUnit,
  type ResUnit,
} from '../lib/units';
```

- [ ] **Step 2: Replace `ResistorInspector`**

The current `ResistorInspector` (lines 24–56 of `src/components/Inspector.tsx`) is:

```tsx
function ResistorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'resistor' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, ohms } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, ohms })
          }
        />
      </Field>
      <Field label="Resistance (Ω)">
        <input
          type="number"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={ohms}
          min={1}
          onChange={(e) =>
            updateNodeData(node.id, { label, ohms: Number(e.target.value) })
          }
        />
      </Field>
    </>
  );
}
```

Replace it with:

```tsx
const RES_UNITS: ResUnit[] = ['Ω', 'kΩ', 'MΩ'];

function ResistorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'resistor' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, ohms } = node.data;
  const [unit, setUnit] = useState<ResUnit>(() => detectResUnit(ohms));

  const displayValue = +(ohms * RES_MULTIPLIERS[unit]).toPrecision(6);

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, ohms })
          }
        />
      </Field>
      <Field label="Resistance">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          <input
            type="number"
            className="flex-1 min-w-0 bg-gray-950 text-gray-200 px-2 py-1 text-xs font-mono focus:outline-none"
            value={displayValue}
            min={0}
            onChange={(e) =>
              updateNodeData(node.id, {
                label,
                ohms: Number(e.target.value) / RES_MULTIPLIERS[unit],
              })
            }
          />
          {RES_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
              className={[
                'px-2 py-1 text-xs font-mono border-l border-gray-700',
                u === unit
                  ? 'bg-blue-950 text-blue-300'
                  : 'bg-gray-950 text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {u}
            </button>
          ))}
        </div>
      </Field>
    </>
  );
}
```

Note: `PotInspector` also has a `Resistance (Ω)` field but uses a separate `ohms` from `PotData`. It is out of scope — leave it unchanged.

- [ ] **Step 3: Verify the app renders without errors**

```bash
pnpm dev
```

Open the app, place a resistor, click it, confirm the Inspector shows a number field with Ω / kΩ / MΩ pills. Confirm switching pills rescales the number. Confirm typing a new number updates the component.

- [ ] **Step 4: Run the full test suite**

```bash
pnpm test
```

Expected: all tests PASS (units tests + existing store/netlist/circuit-io tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/Inspector.tsx
git commit -m "feat: replace resistor raw-ohms input with inline unit picker"
```
