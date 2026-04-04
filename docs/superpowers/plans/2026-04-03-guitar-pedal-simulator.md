# Guitar Pedal Circuit Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-based guitar pedal circuit simulator where users draw schematics (resistors, capacitors, op-amps) and hear the resulting audio effect via ngspice WASM simulation.

**Architecture:** react-flow canvas with custom SVG schematic nodes → pure-function netlist compiler (graph JSON → SPICE string) → ngspice WASM Web Worker (batch processes 2048-sample audio buffers) → Web Audio API playback pipeline.

**Tech Stack:** React 18, TypeScript, Vite, @xyflow/react, Zustand, Tailwind CSS, Vitest, ngspice WASM, Web Audio API

---

## File Structure

```
solder/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── public/
│   └── samples/
│       ├── guitar.wav          # CC0 clean electric guitar loop
│       └── bass.wav            # CC0 bass guitar loop
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── lib/
    │   ├── types.ts            # All shared TypeScript types
    │   └── netlist.ts          # compileNetlist() pure function
    ├── store/
    │   └── index.ts            # Zustand store (3 slices)
    ├── components/
    │   ├── Toolbar.tsx         # Component palette + Simulate button
    │   ├── SchematicCanvas.tsx # react-flow canvas
    │   ├── Inspector.tsx       # Right panel: selected component editor
    │   ├── WaveformDisplay.tsx # Canvas waveform renderer
    │   ├── AudioControls.tsx   # Source selector + volume + play/stop
    │   ├── StatusBar.tsx       # Bottom status strip
    │   └── nodes/
    │       ├── index.ts        # nodeTypes map for react-flow
    │       ├── ResistorNode.tsx
    │       ├── CapacitorNode.tsx
    │       ├── OpAmpNode.tsx
    │       ├── PowerNode.tsx
    │       ├── GroundNode.tsx
    │       ├── InputNode.tsx
    │       └── OutputNode.tsx
    ├── audio/
    │   └── pipeline.ts         # AudioPipeline class (Web Audio API)
    ├── workers/
    │   └── simulation.worker.ts # ngspice WASM Web Worker
    └── test/
        ├── setup.ts
        ├── netlist.test.ts
        └── store.test.ts
```

**Port/handle naming convention** (must be consistent between node components and the netlist compiler):
- `ResistorNode`: handles `a`, `b`
- `CapacitorNode`: handles `a`, `b`
- `OpAmpNode`: handles `in_pos`, `in_neg`, `out`, `vcc`, `gnd`
- `PowerNode`: handles `pos`
- `GroundNode`: handles `gnd`
- `InputNode`: handles `out`
- `OutputNode`: handles `in`

---

## Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`, `tsconfig.json`
- Create: `index.html`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Initialize the project with Vite**

```bash
cd /Users/lukevers/code/solder
npm create vite@latest . -- --template react-ts
```

Expected: Vite scaffolds `src/`, `index.html`, `package.json`, `tsconfig.json` etc.

- [ ] **Step 2: Install dependencies**

```bash
npm install @xyflow/react zustand
npm install -D tailwindcss postcss autoprefixer vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom @types/node
```

- [ ] **Step 3: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Configure tailwind.config.js**

Replace the generated `tailwind.config.js` with:

```js
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 5: Configure vite.config.ts**

```ts
// vite.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  worker: { format: 'es' },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 6: Create test setup file**

```ts
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 7: Add Tailwind to src/index.css**

Replace the contents of `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply bg-gray-950 text-gray-200 font-mono;
  margin: 0;
  overflow: hidden;
}
```

- [ ] **Step 8: Update src/main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 9: Create placeholder App.tsx**

```tsx
// src/App.tsx
export default function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-950 text-gray-200">
      <div className="p-4 text-blue-400 font-bold">⚡ solder — coming soon</div>
    </div>
  )
}
```

- [ ] **Step 10: Initialize git and verify dev server**

```bash
git init
git add .
git commit -m "chore: scaffold React + TS + Vite + Tailwind project"
npm run dev
```

Expected: dev server at http://localhost:5173, page shows "⚡ solder — coming soon"

---

## Task 2: Core type definitions

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/test/netlist.test.ts` (type import smoke test)

- [ ] **Step 1: Write a type smoke test**

```ts
// src/test/netlist.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type { ComponentNode, CircuitState } from '../lib/types'

describe('types', () => {
  it('ComponentNode discriminated union compiles', () => {
    const r: ComponentNode = {
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    }
    expectTypeOf(r.type).toEqualTypeOf<ComponentNode['type']>()
  })

  it('CircuitState contains nodes and edges', () => {
    expectTypeOf<CircuitState>().toHaveProperty('nodes')
    expectTypeOf<CircuitState>().toHaveProperty('edges')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: FAIL — `Cannot find module '../lib/types'`

- [ ] **Step 3: Create src/lib/types.ts**

```ts
// src/lib/types.ts
import type { Edge } from '@xyflow/react'

export interface XYPosition {
  x: number
  y: number
}

export type ResistorData = { label: string; ohms: number }
export type CapacitorData = { label: string; farads: number }
export type OpAmpData = { label: string; model: 'TL072' | 'LM741' }
export type PowerData = { label: string; volts: number }
export type GroundData = { label: string }
export type InputData = { label: string }
export type OutputData = { label: string }

export type ComponentNode =
  | { id: string; type: 'resistor';  position: XYPosition; data: ResistorData }
  | { id: string; type: 'capacitor'; position: XYPosition; data: CapacitorData }
  | { id: string; type: 'opamp';     position: XYPosition; data: OpAmpData }
  | { id: string; type: 'power';     position: XYPosition; data: PowerData }
  | { id: string; type: 'ground';    position: XYPosition; data: GroundData }
  | { id: string; type: 'input';     position: XYPosition; data: InputData }
  | { id: string; type: 'output';    position: XYPosition; data: OutputData }

export type CircuitState = {
  nodes: ComponentNode[]
  edges: Edge[]
}

// Worker message types
export type SimulateRequest = {
  type: 'simulate'
  netlist: string
  inputBuffer: Float32Array
}

export type SimulateResponse =
  | { type: 'result'; outputBuffer: Float32Array }
  | { type: 'error'; message: string }

// Audio source
export type AudioSource =
  | { type: 'sample'; name: string }
  | { type: 'live' }
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/types.ts src/test/netlist.test.ts src/test/setup.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: Zustand store

**Files:**
- Create: `src/store/index.ts`
- Modify: `src/test/store.test.ts`

- [ ] **Step 1: Write store tests**

```ts
// src/test/store.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from '../store'

// Reset store between tests by replacing state wholesale (true = replace, not merge)
beforeEach(() => {
  useStore.setState({
    nodes: [],
    edges: [],
    selectedNodeId: null,
    simulationStatus: 'idle',
    outputBuffer: null,
    simulationError: null,
    audioSource: { type: 'sample', name: 'guitar' },
    volume: 0.7,
    playing: false,
  }, true)
})

describe('circuitSlice', () => {
  it('starts with empty nodes and edges', () => {
    const { nodes, edges } = useStore.getState()
    expect(nodes).toEqual([])
    expect(edges).toEqual([])
  })

  it('addNode appends a node', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 100, y: 100 },
      data: { label: 'R1', ohms: 10000 },
    })
    expect(useStore.getState().nodes).toHaveLength(1)
    expect(useStore.getState().nodes[0].id).toBe('r1')
  })

  it('selectNode updates selectedNodeId', () => {
    useStore.getState().selectNode('r1')
    expect(useStore.getState().selectedNodeId).toBe('r1')
  })

  it('updateNodeData changes a node value', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    })
    useStore.getState().updateNodeData('r1', { label: 'R1', ohms: 47000 })
    const node = useStore.getState().nodes.find(n => n.id === 'r1')!
    expect(node.data).toEqual({ label: 'R1', ohms: 47000 })
  })
})

describe('simulationSlice', () => {
  it('starts idle with no output', () => {
    const { simulationStatus, outputBuffer } = useStore.getState()
    expect(simulationStatus).toBe('idle')
    expect(outputBuffer).toBeNull()
  })

  it('setSimulationStatus updates status', () => {
    useStore.getState().setSimulationStatus('running')
    expect(useStore.getState().simulationStatus).toBe('running')
  })

  it('setOutputBuffer stores buffer', () => {
    const buf = new Float32Array([0.1, 0.2, 0.3])
    useStore.getState().setOutputBuffer(buf)
    expect(useStore.getState().outputBuffer).toBe(buf)
  })
})

describe('audioSlice', () => {
  it('starts with guitar sample, not playing', () => {
    const { audioSource, volume, playing } = useStore.getState()
    expect(audioSource).toEqual({ type: 'sample', name: 'guitar' })
    expect(volume).toBe(0.7)
    expect(playing).toBe(false)
  })

  it('setAudioSource updates source', () => {
    useStore.getState().setAudioSource({ type: 'live' })
    expect(useStore.getState().audioSource).toEqual({ type: 'live' })
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/store.test.ts
```

Expected: FAIL — `Cannot find module '../store'`

- [ ] **Step 3: Create src/store/index.ts**

```ts
// src/store/index.ts
import { create } from 'zustand'
import type { Edge } from '@xyflow/react'
import type { ComponentNode, AudioSource } from '../lib/types'

type SimulationStatus = 'idle' | 'running' | 'error'

type StoreState = {
  // circuit slice
  nodes: ComponentNode[]
  edges: Edge[]
  selectedNodeId: string | null
  addNode: (node: ComponentNode) => void
  setNodes: (nodes: ComponentNode[]) => void
  setEdges: (edges: Edge[]) => void
  selectNode: (id: string | null) => void
  updateNodeData: (id: string, data: ComponentNode['data']) => void

  // simulation slice
  simulationStatus: SimulationStatus
  outputBuffer: Float32Array | null
  simulationError: string | null
  setSimulationStatus: (status: SimulationStatus) => void
  setOutputBuffer: (buf: Float32Array) => void
  setSimulationError: (msg: string) => void

  // audio slice
  audioSource: AudioSource
  volume: number
  playing: boolean
  setAudioSource: (source: AudioSource) => void
  setVolume: (v: number) => void
  setPlaying: (playing: boolean) => void
}

const initialState = {
  nodes: [] as ComponentNode[],
  edges: [] as Edge[],
  selectedNodeId: null,
  simulationStatus: 'idle' as SimulationStatus,
  outputBuffer: null,
  simulationError: null,
  audioSource: { type: 'sample', name: 'guitar' } as AudioSource,
  volume: 0.7,
  playing: false,
}

export const useStore = create<StoreState>()((set) => ({
  ...initialState,

  // circuit
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node] })),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  selectNode: (selectedNodeId) => set({ selectedNodeId }),
  updateNodeData: (id, data) =>
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, data } as ComponentNode : n)),
    })),

  // simulation
  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setOutputBuffer: (outputBuffer) => set({ outputBuffer }),
  setSimulationError: (simulationError) => set({ simulationError }),

  // audio
  setAudioSource: (audioSource) => set({ audioSource }),
  setVolume: (volume) => set({ volume }),
  setPlaying: (playing) => set({ playing }),
}))
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/store.test.ts
```

Expected: PASS (all 8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/index.ts src/test/store.test.ts
git commit -m "feat: add Zustand store with circuit, simulation, and audio slices"
```

---

## Task 4: Netlist compiler — port-to-node mapping

**Files:**
- Create: `src/lib/netlist.ts`
- Modify: `src/test/netlist.test.ts`

The compiler has two stages: (1) assign each connected wire junction an integer SPICE node ID using BFS, (2) emit SPICE syntax. This task covers stage 1.

- [ ] **Step 1: Add port grouping tests to netlist.test.ts**

Append to `src/test/netlist.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildPortGroups } from '../lib/netlist'
import type { ComponentNode } from '../lib/types'
import type { Edge } from '@xyflow/react'

describe('buildPortGroups', () => {
  it('assigns ground node port to "0"', () => {
    const nodes: ComponentNode[] = [
      { id: 'gnd1', type: 'ground', position: { x: 0, y: 0 }, data: { label: 'GND' } },
    ]
    const groups = buildPortGroups(nodes, [])
    expect(groups.get('gnd1|gnd')).toBe('0')
  })

  it('connects two ports sharing an edge into the same group', () => {
    const nodes: ComponentNode[] = [
      { id: 'in1',  type: 'input',    position: { x: 0, y: 0 }, data: { label: 'IN' } },
      { id: 'r1',   type: 'resistor', position: { x: 100, y: 0 }, data: { label: 'R1', ohms: 10000 } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'in1', sourceHandle: 'out', target: 'r1', targetHandle: 'a' },
    ]
    const groups = buildPortGroups(nodes, edges)
    expect(groups.get('in1|out')).toBe(groups.get('r1|a'))
  })

  it('ground propagates through connected edges', () => {
    const nodes: ComponentNode[] = [
      { id: 'gnd1', type: 'ground',    position: { x: 0, y: 0 }, data: { label: 'GND' } },
      { id: 'c1',   type: 'capacitor', position: { x: 100, y: 0 }, data: { label: 'C1', farads: 47e-9 } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'gnd1', sourceHandle: 'gnd', target: 'c1', targetHandle: 'b' },
    ]
    const groups = buildPortGroups(nodes, edges)
    expect(groups.get('c1|b')).toBe('0')
  })

  it('isolated port gets its own node ID', () => {
    const nodes: ComponentNode[] = [
      { id: 'r1', type: 'resistor', position: { x: 0, y: 0 }, data: { label: 'R1', ohms: 1000 } },
    ]
    const groups = buildPortGroups(nodes, [])
    // Both terminals get node IDs (may be different)
    expect(groups.has('r1|a')).toBe(true)
    expect(groups.has('r1|b')).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: FAIL — `Cannot find module '../lib/netlist'` or `buildPortGroups is not a function`

- [ ] **Step 3: Implement buildPortGroups in src/lib/netlist.ts**

```ts
// src/lib/netlist.ts
import type { Edge } from '@xyflow/react'
import type { ComponentNode } from './types'

/** All port handles for each component type */
const COMPONENT_HANDLES: Record<ComponentNode['type'], string[]> = {
  resistor:  ['a', 'b'],
  capacitor: ['a', 'b'],
  opamp:     ['in_pos', 'in_neg', 'out', 'vcc', 'gnd'],
  power:     ['pos'],
  ground:    ['gnd'],
  input:     ['out'],
  output:    ['in'],
}

/** Port identifier: "${nodeId}|${handleId}" */
type Port = string

function allPorts(nodes: ComponentNode[]): Port[] {
  return nodes.flatMap((n) =>
    COMPONENT_HANDLES[n.type].map((h) => `${n.id}|${h}`)
  )
}

function buildAdjacency(edges: Edge[]): Map<Port, Set<Port>> {
  const adj = new Map<Port, Set<Port>>()
  const add = (p: Port) => { if (!adj.has(p)) adj.set(p, new Set()) }
  for (const e of edges) {
    const src: Port = `${e.source}|${e.sourceHandle ?? ''}`
    const tgt: Port = `${e.target}|${e.targetHandle ?? ''}`
    add(src); add(tgt)
    adj.get(src)!.add(tgt)
    adj.get(tgt)!.add(src)
  }
  return adj
}

function bfs(
  start: Port,
  nodeId: string,
  adj: Map<Port, Set<Port>>,
  visited: Set<Port>,
  portToNode: Map<Port, string>
) {
  const queue = [start]
  visited.add(start)
  portToNode.set(start, nodeId)
  while (queue.length) {
    const cur = queue.shift()!
    for (const neighbor of adj.get(cur) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        portToNode.set(neighbor, nodeId)
        queue.push(neighbor)
      }
    }
  }
}

/**
 * Assigns each port a SPICE node ID string.
 * Ground ports → "0". Others → "n1", "n2", ...
 */
export function buildPortGroups(
  nodes: ComponentNode[],
  edges: Edge[]
): Map<Port, string> {
  const adj = buildAdjacency(edges)
  const portToNode = new Map<Port, string>()
  const visited = new Set<Port>()

  // Seed all known ports into adjacency (so isolated ports are included)
  for (const p of allPorts(nodes)) {
    if (!adj.has(p)) adj.set(p, new Set())
  }

  // Ground-connected ports first → node "0"
  const groundPorts = nodes
    .filter((n) => n.type === 'ground')
    .map((n) => `${n.id}|gnd`)

  for (const gp of groundPorts) {
    if (!visited.has(gp)) {
      bfs(gp, '0', adj, visited, portToNode)
    }
  }

  // Remaining groups
  let counter = 1
  for (const [port] of adj) {
    if (!visited.has(port)) {
      bfs(port, `n${counter++}`, adj, visited, portToNode)
    }
  }

  return portToNode
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: PASS (all 5 tests in the buildPortGroups suite, plus the 2 type tests from Task 2)

- [ ] **Step 5: Commit**

```bash
git add src/lib/netlist.ts src/test/netlist.test.ts
git commit -m "feat: implement netlist compiler port-to-node BFS mapping"
```

---

## Task 5: Netlist compiler — SPICE emission

**Files:**
- Modify: `src/lib/netlist.ts`
- Modify: `src/test/netlist.test.ts`

- [ ] **Step 1: Add SPICE emission tests**

Append to `src/test/netlist.test.ts`:

```ts
import { compileNetlist } from '../lib/netlist'

describe('compileNetlist', () => {
  const SAMPLE_RATE = 44100
  const BUFFER_SIZE = 2048

  // Minimal circuit: IN → R1 → OUT, with C1 to GND
  function makeRCCircuit() {
    const nodes: ComponentNode[] = [
      { id: 'in1',  type: 'input',    position: { x: 0, y: 0 }, data: { label: 'IN' } },
      { id: 'r1',   type: 'resistor', position: { x: 100, y: 0 }, data: { label: 'R1', ohms: 10000 } },
      { id: 'c1',   type: 'capacitor',position: { x: 200, y: 0 }, data: { label: 'C1', farads: 47e-9 } },
      { id: 'out1', type: 'output',   position: { x: 300, y: 0 }, data: { label: 'OUT' } },
      { id: 'gnd1', type: 'ground',   position: { x: 200, y: 100 }, data: { label: 'GND' } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'in1',  sourceHandle: 'out', target: 'r1',   targetHandle: 'a' },
      { id: 'e2', source: 'r1',   sourceHandle: 'b',   target: 'c1',   targetHandle: 'a' },
      { id: 'e3', source: 'r1',   sourceHandle: 'b',   target: 'out1', targetHandle: 'in' },
      { id: 'e4', source: 'c1',   sourceHandle: 'b',   target: 'gnd1', targetHandle: 'gnd' },
    ]
    return { nodes, edges }
  }

  it('emits a Vin source line', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist).toMatch(/^Vin /m)
  })

  it('emits R1 with correct resistance in kΩ notation', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist).toMatch(/R1 \S+ \S+ 10k/m)
  })

  it('emits C1 with correct capacitance in nF notation', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist).toMatch(/C1 \S+ 0 47n/m)
  })

  it('emits .tran directive matching buffer size and sample rate', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    // step = 1/44100 ≈ 22.676us, stop = 2048/44100 ≈ 46.44ms
    expect(netlist).toMatch(/\.tran/)
  })

  it('emits .probe V() for output node', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist).toMatch(/\.probe V\(\S+\)/m)
  })

  it('contains .end', () => {
    const { nodes, edges } = makeRCCircuit()
    const buf = new Float32Array(BUFFER_SIZE).fill(0)
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist.trim()).toMatch(/\.end$/)
  })

  it('injects PWL data from input buffer', () => {
    const { nodes, edges } = makeRCCircuit()
    // Non-zero sample so we can detect it
    const buf = new Float32Array(BUFFER_SIZE)
    buf[1] = 0.5
    const netlist = compileNetlist(nodes, edges, buf, SAMPLE_RATE)
    expect(netlist).toContain('0.5')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: FAIL — `compileNetlist is not a function`

- [ ] **Step 3: Implement compileNetlist in src/lib/netlist.ts**

Append to `src/lib/netlist.ts`:

```ts
/** Format ohms as SPICE: 10000 → "10k", 1000000 → "1Meg", etc. */
function formatResistance(ohms: number): string {
  if (ohms >= 1e6) return `${ohms / 1e6}Meg`
  if (ohms >= 1e3) return `${ohms / 1e3}k`
  return `${ohms}`
}

/** Format farads as SPICE: 47e-9 → "47n", 100e-12 → "100p", etc. */
function formatCapacitance(farads: number): string {
  if (farads >= 1e-3) return `${farads * 1e3}m`
  if (farads >= 1e-6) return `${farads * 1e6}u`
  if (farads >= 1e-9) return `${farads * 1e9}n`
  return `${farads * 1e12}p`
}

/**
 * Converts an audio input buffer to a SPICE PWL source string.
 * PWL(t0 v0 t1 v1 ...) where tn = n / sampleRate seconds
 */
function bufferToPWL(buf: Float32Array, sampleRate: number): string {
  const pairs: string[] = []
  for (let i = 0; i < buf.length; i++) {
    const t = (i / sampleRate).toExponential(6)
    const v = buf[i].toFixed(6)
    pairs.push(`${t} ${v}`)
  }
  return `PWL(${pairs.join(' ')})`
}

/**
 * Compiles a react-flow circuit graph into a SPICE netlist string.
 * @param nodes  - ComponentNode array from the circuit store
 * @param edges  - Edge array from the circuit store
 * @param inputBuffer - Float32Array of audio input samples
 * @param sampleRate  - Audio sample rate in Hz (typically 44100)
 */
export function compileNetlist(
  nodes: ComponentNode[],
  edges: Edge[],
  inputBuffer: Float32Array,
  sampleRate: number
): string {
  const portToNode = buildPortGroups(nodes, edges)

  const getNode = (nodeId: string, handle: string): string =>
    portToNode.get(`${nodeId}|${handle}`) ?? 'UNCONNECTED'

  const lines: string[] = ['* solder — auto-generated netlist']

  // Op-amp model includes
  const hasOpamp = nodes.some((n) => n.type === 'opamp')
  if (hasOpamp) {
    lines.push('.include TL072.lib')
    lines.push('.include LM741.lib')
  }

  // Find input and output nodes
  const inputNode = nodes.find((n) => n.type === 'input')
  const outputNode = nodes.find((n) => n.type === 'output')

  if (!inputNode) throw new Error('Circuit has no input node')
  if (!outputNode) throw new Error('Circuit has no output node')

  const inputSpiceNode = getNode(inputNode.id, 'out')
  const outputSpiceNode = getNode(outputNode.id, 'in')

  // Vin: audio source as PWL
  lines.push(`Vin ${inputSpiceNode} 0 ${bufferToPWL(inputBuffer, sampleRate)}`)

  // Emit each component
  for (const node of nodes) {
    if (node.type === 'resistor') {
      const na = getNode(node.id, 'a')
      const nb = getNode(node.id, 'b')
      lines.push(`${node.data.label} ${na} ${nb} ${formatResistance(node.data.ohms)}`)
    } else if (node.type === 'capacitor') {
      const na = getNode(node.id, 'a')
      const nb = getNode(node.id, 'b')
      lines.push(`${node.data.label} ${na} ${nb} ${formatCapacitance(node.data.farads)}`)
    } else if (node.type === 'opamp') {
      const inPos = getNode(node.id, 'in_pos')
      const inNeg = getNode(node.id, 'in_neg')
      const out   = getNode(node.id, 'out')
      const vcc   = getNode(node.id, 'vcc')
      const gnd   = getNode(node.id, 'gnd')
      // SPICE subcircuit call: X<label> in+ in- vcc gnd out <model>
      lines.push(`X${node.data.label} ${inPos} ${inNeg} ${vcc} ${gnd} ${out} ${node.data.model}`)
    } else if (node.type === 'power') {
      const pos = getNode(node.id, 'pos')
      lines.push(`V${node.data.label} ${pos} 0 DC ${node.data.volts}`)
    }
    // ground, input, output nodes: no SPICE line needed
  }

  // Transient analysis: step = 1/sampleRate, stop = bufferSize/sampleRate
  const step = (1 / sampleRate).toExponential(6)
  const stop = (inputBuffer.length / sampleRate).toExponential(6)
  lines.push(`.tran ${step} ${stop}`)

  lines.push(`.probe V(${outputSpiceNode})`)
  lines.push('.end')

  return lines.join('\n')
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run src/test/netlist.test.ts
```

Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/netlist.ts src/test/netlist.test.ts
git commit -m "feat: implement SPICE netlist compiler with PWL audio injection"
```

---

## Task 6: Custom schematic node components

**Files:**
- Create: `src/components/nodes/ResistorNode.tsx`
- Create: `src/components/nodes/CapacitorNode.tsx`
- Create: `src/components/nodes/OpAmpNode.tsx`
- Create: `src/components/nodes/PowerNode.tsx`
- Create: `src/components/nodes/GroundNode.tsx`
- Create: `src/components/nodes/InputNode.tsx`
- Create: `src/components/nodes/OutputNode.tsx`
- Create: `src/components/nodes/index.ts`

Each node has:
- A visible SVG schematic symbol
- `Handle` components from `@xyflow/react` with the correct IDs matching the netlist compiler's `COMPONENT_HANDLES`
- A label and value display
- Click handler that calls `useStore().selectNode(id)`

- [ ] **Step 1: Create ResistorNode.tsx**

```tsx
// src/components/nodes/ResistorNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { ResistorData } from '../../lib/types'

export function ResistorNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as ResistorData

  return (
    <div
      onClick={() => selectNode(id)}
      className={`relative flex items-center justify-center cursor-pointer`}
      style={{ width: 80, height: 36 }}
    >
      <Handle type="target" position={Position.Left}  id="a" style={{ background: '#4b5563' }} />
      <svg width="80" height="36" viewBox="0 0 80 36">
        <line x1="0" y1="18" x2="14" y2="18" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <polyline
          points="14,18 18,8 24,28 30,8 36,28 42,8 48,28 54,18 66,18"
          fill="none"
          stroke={selected ? '#60a5fa' : '#e5e7eb'}
          strokeWidth="1.5"
        />
        <line x1="66" y1="18" x2="80" y2="18" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <text x="40" y="10" textAnchor="middle" fill="#7ee787" fontSize="8" fontFamily="monospace">
          {d.label}
        </text>
        <text x="40" y="34" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="monospace">
          {d.ohms >= 1000 ? `${d.ohms / 1000}kΩ` : `${d.ohms}Ω`}
        </text>
      </svg>
      <Handle type="source" position={Position.Right} id="b" style={{ background: '#4b5563' }} />
    </div>
  )
}
```

- [ ] **Step 2: Create CapacitorNode.tsx**

```tsx
// src/components/nodes/CapacitorNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { CapacitorData } from '../../lib/types'

export function CapacitorNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as CapacitorData

  const faradsLabel = d.farads >= 1e-6
    ? `${d.farads * 1e6}μF`
    : `${d.farads * 1e9}nF`

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 60, height: 44 }}
    >
      <Handle type="target" position={Position.Left}  id="a" style={{ background: '#4b5563' }} />
      <svg width="60" height="44" viewBox="0 0 60 44">
        <line x1="0" y1="22" x2="22" y2="22" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <line x1="22" y1="8"  x2="22" y2="36" stroke={selected ? '#60a5fa' : '#e5e7eb'} strokeWidth="2.5"/>
        <line x1="28" y1="8"  x2="28" y2="36" stroke={selected ? '#60a5fa' : '#e5e7eb'} strokeWidth="2.5"/>
        <line x1="28" y1="22" x2="60" y2="22" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <text x="25" y="8"  textAnchor="middle" fill="#7ee787" fontSize="8" fontFamily="monospace">{d.label}</text>
        <text x="30" y="44" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="monospace">{faradsLabel}</text>
      </svg>
      <Handle type="source" position={Position.Right} id="b" style={{ background: '#4b5563' }} />
    </div>
  )
}
```

- [ ] **Step 3: Create OpAmpNode.tsx**

```tsx
// src/components/nodes/OpAmpNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { OpAmpData } from '../../lib/types'

export function OpAmpNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as OpAmpData
  const stroke = selected ? '#fb923c' : '#f97316'

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 100, height: 80 }}
    >
      {/* +in (top-left) */}
      <Handle type="target" position={Position.Left} id="in_pos" style={{ top: '30%', background: '#4b5563' }} />
      {/* -in (bottom-left) */}
      <Handle type="target" position={Position.Left} id="in_neg" style={{ top: '70%', background: '#4b5563' }} />
      {/* vcc (top) */}
      <Handle type="target" position={Position.Top}  id="vcc"    style={{ left: '50%', background: '#4b5563' }} />
      {/* gnd (bottom) */}
      <Handle type="target" position={Position.Bottom} id="gnd"  style={{ left: '50%', background: '#4b5563' }} />
      {/* out (right) */}
      <Handle type="source" position={Position.Right} id="out"   style={{ background: '#4b5563' }} />

      <svg width="100" height="80" viewBox="0 0 100 80">
        <polygon points="10,5 10,75 90,40" fill="#1f2937" stroke={stroke} strokeWidth="1.5"/>
        <text x="22" y="30" fill="#e5e7eb" fontSize="10" fontFamily="monospace">+</text>
        <text x="22" y="56" fill="#e5e7eb" fontSize="10" fontFamily="monospace">−</text>
        <text x="50" y="44" textAnchor="middle" fill="#f97316" fontSize="8" fontFamily="monospace">{d.label}</text>
        <text x="50" y="20" textAnchor="middle" fill="#6b7280" fontSize="7" fontFamily="monospace">{d.model}</text>
      </svg>
    </div>
  )
}
```

- [ ] **Step 4: Create PowerNode.tsx**

```tsx
// src/components/nodes/PowerNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { PowerData } from '../../lib/types'

export function PowerNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as PowerData

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 48, height: 40 }}
    >
      <svg width="48" height="40" viewBox="0 0 48 40">
        <circle cx="24" cy="20" r="14" fill="#1f2937" stroke={selected ? '#60a5fa' : '#facc15'} strokeWidth="1.5"/>
        <text x="24" y="16" textAnchor="middle" fill="#facc15" fontSize="8" fontFamily="monospace">{d.label}</text>
        <text x="24" y="27" textAnchor="middle" fill="#facc15" fontSize="9" fontFamily="monospace" fontWeight="bold">
          {d.volts}V
        </text>
      </svg>
      <Handle type="source" position={Position.Bottom} id="pos" style={{ background: '#4b5563' }} />
    </div>
  )
}
```

- [ ] **Step 5: Create GroundNode.tsx**

```tsx
// src/components/nodes/GroundNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'

export function GroundNode({ id, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 40, height: 36 }}
    >
      <Handle type="target" position={Position.Top} id="gnd" style={{ background: '#4b5563' }} />
      <svg width="40" height="36" viewBox="0 0 40 36">
        <line x1="20" y1="0"  x2="20" y2="12" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <line x1="4"  y1="12" x2="36" y2="12" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="2"/>
        <line x1="10" y1="18" x2="30" y2="18" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1.5"/>
        <line x1="16" y1="24" x2="24" y2="24" stroke={selected ? '#60a5fa' : '#9ca3af'} strokeWidth="1"/>
      </svg>
    </div>
  )
}
```

- [ ] **Step 6: Create InputNode.tsx**

```tsx
// src/components/nodes/InputNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { InputData } from '../../lib/types'

export function InputNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as InputData

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 52, height: 32 }}
    >
      <svg width="52" height="32" viewBox="0 0 52 32">
        <rect x="2" y="4" width="44" height="24" rx="4"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#3b82f6'}
          strokeWidth="1.5"
        />
        <text x="24" y="20" textAnchor="middle" fill="#3b82f6" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {d.label}
        </text>
      </svg>
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#3b82f6' }} />
    </div>
  )
}
```

- [ ] **Step 7: Create OutputNode.tsx**

```tsx
// src/components/nodes/OutputNode.tsx
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useStore } from '../../store'
import type { OutputData } from '../../lib/types'

export function OutputNode({ id, data, selected }: NodeProps) {
  const selectNode = useStore((s) => s.selectNode)
  const d = data as OutputData

  return (
    <div
      onClick={() => selectNode(id)}
      className="relative flex items-center justify-center cursor-pointer"
      style={{ width: 52, height: 32 }}
    >
      <Handle type="target" position={Position.Left} id="in" style={{ background: '#22c55e' }} />
      <svg width="52" height="32" viewBox="0 0 52 32">
        <rect x="6" y="4" width="44" height="24" rx="4"
          fill="#1f2937"
          stroke={selected ? '#60a5fa' : '#22c55e'}
          strokeWidth="1.5"
        />
        <text x="28" y="20" textAnchor="middle" fill="#22c55e" fontSize="10" fontFamily="monospace" fontWeight="bold">
          {d.label}
        </text>
      </svg>
    </div>
  )
}
```

- [ ] **Step 8: Create nodes/index.ts**

```ts
// src/components/nodes/index.ts
import { ResistorNode  } from './ResistorNode'
import { CapacitorNode } from './CapacitorNode'
import { OpAmpNode     } from './OpAmpNode'
import { PowerNode     } from './PowerNode'
import { GroundNode    } from './GroundNode'
import { InputNode     } from './InputNode'
import { OutputNode    } from './OutputNode'

export const nodeTypes = {
  resistor:  ResistorNode,
  capacitor: CapacitorNode,
  opamp:     OpAmpNode,
  power:     PowerNode,
  ground:    GroundNode,
  input:     InputNode,
  output:    OutputNode,
}
```

- [ ] **Step 9: Verify TypeScript compiles with no errors**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 10: Commit**

```bash
git add src/components/nodes/
git commit -m "feat: add custom schematic SVG node components for react-flow"
```

---

## Task 7: Schematic canvas

**Files:**
- Create: `src/components/SchematicCanvas.tsx`

- [ ] **Step 1: Create SchematicCanvas.tsx**

```tsx
// src/components/SchematicCanvas.tsx
import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { nodeTypes } from './nodes'
import { useStore } from '../store'
import type { ComponentNode } from '../lib/types'

export function SchematicCanvas() {
  const { nodes, edges, setNodes, setEdges, selectNode } = useStore((s) => ({
    nodes: s.nodes,
    edges: s.edges,
    setNodes: s.setNodes,
    setEdges: s.setEdges,
    selectNode: s.selectNode,
  }))

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes(applyNodeChanges(changes, nodes) as ComponentNode[]),
    [nodes, setNodes]
  )

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  )

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges(addEdge(connection, edges)),
    [edges, setEdges]
  )

  const onPaneClick = useCallback(() => selectNode(null), [selectNode])

  return (
    <div className="flex-1 bg-gray-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        fitView
        defaultEdgeOptions={{
          style: { stroke: '#4b5563', strokeWidth: 1.5 },
          type: 'smoothstep',
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={0.8}
          color="#1f2937"
        />
        <Controls
          style={{ background: '#161b22', border: '1px solid #30363d' }}
        />
      </ReactFlow>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/SchematicCanvas.tsx
git commit -m "feat: add react-flow schematic canvas with custom node types"
```

---

## Task 8: Inspector panel

**Files:**
- Create: `src/components/Inspector.tsx`

The Inspector shows fields appropriate for the selected component type. For resistors: label + ohms. For capacitors: label + farads. For op-amps: label + model dropdown. For power: label + volts. Others: label only.

- [ ] **Step 1: Create Inspector.tsx**

```tsx
// src/components/Inspector.tsx
import { useStore } from '../store'
import type { ComponentNode } from '../lib/types'

function ResistorInspector({ node }: { node: Extract<ComponentNode, { type: 'resistor' }> }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const { label, ohms } = node.data

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value, ohms })}
        />
      </Field>
      <Field label="Resistance (Ω)">
        <input
          type="number"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={ohms}
          min={1}
          onChange={(e) => updateNodeData(node.id, { label, ohms: Number(e.target.value) })}
        />
      </Field>
    </>
  )
}

function CapacitorInspector({ node }: { node: Extract<ComponentNode, { type: 'capacitor' }> }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const { label, farads } = node.data

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value, farads })}
        />
      </Field>
      <Field label="Capacitance (F)">
        <input
          type="number"
          step="1e-9"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={farads}
          min={1e-12}
          onChange={(e) => updateNodeData(node.id, { label, farads: Number(e.target.value) })}
        />
      </Field>
    </>
  )
}

function OpAmpInspector({ node }: { node: Extract<ComponentNode, { type: 'opamp' }> }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const { label, model } = node.data

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value, model })}
        />
      </Field>
      <Field label="Model">
        <select
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={model}
          onChange={(e) =>
            updateNodeData(node.id, { label, model: e.target.value as 'TL072' | 'LM741' })
          }
        >
          <option value="TL072">TL072</option>
          <option value="LM741">LM741</option>
        </select>
      </Field>
    </>
  )
}

function PowerInspector({ node }: { node: Extract<ComponentNode, { type: 'power' }> }) {
  const updateNodeData = useStore((s) => s.updateNodeData)
  const { label, volts } = node.data

  return (
    <>
      <Field label="Label">
        <input
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) => updateNodeData(node.id, { label: e.target.value, volts })}
        />
      </Field>
      <Field label="Voltage (V)">
        <input
          type="number"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={volts}
          onChange={(e) => updateNodeData(node.id, { label, volts: Number(e.target.value) })}
        />
      </Field>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      {children}
    </div>
  )
}

export function Inspector() {
  const { nodes, selectedNodeId } = useStore((s) => ({
    nodes: s.nodes,
    selectedNodeId: s.selectedNodeId,
  }))

  const selected = nodes.find((n) => n.id === selectedNodeId)

  if (!selected) {
    return (
      <div className="p-3 text-gray-600 text-xs">
        Click a component to inspect
      </div>
    )
  }

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Inspector · {selected.type}
      </div>
      {selected.type === 'resistor'  && <ResistorInspector  node={selected} />}
      {selected.type === 'capacitor' && <CapacitorInspector node={selected} />}
      {selected.type === 'opamp'     && <OpAmpInspector     node={selected} />}
      {selected.type === 'power'     && <PowerInspector     node={selected} />}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Inspector.tsx
git commit -m "feat: add Inspector panel for editing component values"
```

---

## Task 9: Toolbar and StatusBar

**Files:**
- Create: `src/components/Toolbar.tsx`
- Create: `src/components/StatusBar.tsx`

- [ ] **Step 1: Create Toolbar.tsx**

Each palette button creates a new node at a default position and adds it to the store. IDs are generated with `crypto.randomUUID()`.

```tsx
// src/components/Toolbar.tsx
import { useStore } from '../store'
import type { ComponentNode } from '../lib/types'

const PALETTE: Array<{
  label: string
  type: ComponentNode['type']
  defaultData: ComponentNode['data']
}> = [
  { label: 'R',   type: 'resistor',  defaultData: { label: 'R1', ohms: 10000 } },
  { label: 'C',   type: 'capacitor', defaultData: { label: 'C1', farads: 47e-9 } },
  { label: 'U',   type: 'opamp',     defaultData: { label: 'U1', model: 'TL072' } },
  { label: 'V+',  type: 'power',     defaultData: { label: 'VCC', volts: 9 } },
  { label: 'GND', type: 'ground',    defaultData: { label: 'GND' } },
  { label: 'IN',  type: 'input',     defaultData: { label: 'IN' } },
  { label: 'OUT', type: 'output',    defaultData: { label: 'OUT' } },
]

type ToolbarProps = {
  onSimulate: () => void
}

export function Toolbar({ onSimulate }: ToolbarProps) {
  const { addNode, simulationStatus } = useStore((s) => ({
    addNode: s.addNode,
    simulationStatus: s.simulationStatus,
  }))

  function handleAdd(item: (typeof PALETTE)[number]) {
    // Stagger positions so new components don't overlap
    const offset = Math.random() * 100
    addNode({
      id: crypto.randomUUID(),
      type: item.type,
      position: { x: 200 + offset, y: 150 + offset },
      data: item.defaultData,
    } as ComponentNode)
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-800 flex-shrink-0">
      <span className="text-blue-400 font-bold text-sm mr-2">⚡ solder</span>
      <div className="w-px h-5 bg-gray-700" />
      {PALETTE.map((item) => (
        <button
          key={item.type}
          onClick={() => handleAdd(item)}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
        >
          {item.label}
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={onSimulate}
        disabled={simulationStatus === 'running'}
        className="bg-green-800 hover:bg-green-700 disabled:opacity-50 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
      >
        {simulationStatus === 'running' ? '⏳ Simulating…' : '▶ Simulate'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create StatusBar.tsx**

```tsx
// src/components/StatusBar.tsx
import { useStore } from '../store'

export function StatusBar() {
  const { nodes, simulationStatus, simulationError } = useStore((s) => ({
    nodes: s.nodes,
    simulationStatus: s.simulationStatus,
    simulationError: s.simulationError,
  }))

  const statusColor =
    simulationStatus === 'error'   ? 'text-red-400' :
    simulationStatus === 'running' ? 'text-yellow-400' :
                                     'text-green-400'

  const statusLabel =
    simulationStatus === 'error'   ? `● error: ${simulationError ?? 'unknown'}` :
    simulationStatus === 'running' ? '● simulating…' :
                                     '● ready'

  return (
    <div className="flex gap-4 px-3 py-1 bg-gray-900 border-t border-gray-800 text-xs font-mono text-gray-500 flex-shrink-0">
      <span className={statusColor}>{statusLabel}</span>
      <span>components: {nodes.length}</span>
      <span>ngspice · WASM</span>
      <div className="flex-1" />
      <span>44100 Hz · 2048 samples/buffer</span>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Toolbar.tsx src/components/StatusBar.tsx
git commit -m "feat: add Toolbar with component palette and StatusBar"
```

---

## Task 10: Waveform display and audio controls

**Files:**
- Create: `src/components/WaveformDisplay.tsx`
- Create: `src/components/AudioControls.tsx`

- [ ] **Step 1: Create WaveformDisplay.tsx**

Renders input and output Float32Arrays as overlapping waveforms on a Canvas.

```tsx
// src/components/WaveformDisplay.tsx
import { useEffect, useRef } from 'react'

type Props = {
  inputBuffer:  Float32Array | null
  outputBuffer: Float32Array | null
  height?: number
}

export function WaveformDisplay({ inputBuffer, outputBuffer, height = 60 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = '#0d1117'
    ctx.fillRect(0, 0, w, h)

    function drawBuffer(buf: Float32Array, color: string) {
      if (!ctx) return
      ctx.beginPath()
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      for (let i = 0; i < buf.length; i++) {
        const x = (i / buf.length) * w
        const y = h / 2 - (buf[i] * h) / 2.5
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.stroke()
    }

    if (inputBuffer)  drawBuffer(inputBuffer,  '#3b82f680')
    if (outputBuffer) drawBuffer(outputBuffer, '#22c55e')
  }, [inputBuffer, outputBuffer])

  return (
    <canvas
      ref={canvasRef}
      width={176}
      height={height}
      className="rounded border border-gray-800 w-full"
    />
  )
}
```

- [ ] **Step 2: Create AudioControls.tsx**

```tsx
// src/components/AudioControls.tsx
import { useStore } from '../store'

const SAMPLES = ['guitar', 'bass']

export function AudioControls() {
  const { audioSource, volume, playing, setAudioSource, setVolume, setPlaying } = useStore((s) => ({
    audioSource:    s.audioSource,
    volume:         s.volume,
    playing:        s.playing,
    setAudioSource: s.setAudioSource,
    setVolume:      s.setVolume,
    setPlaying:     s.setPlaying,
  }))

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Audio Source</div>
      <div className="flex flex-col gap-1.5 mb-3">
        {SAMPLES.map((name) => (
          <label key={name} className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
            <input
              type="radio"
              name="audio-source"
              checked={audioSource.type === 'sample' && audioSource.name === name}
              onChange={() => setAudioSource({ type: 'sample', name })}
              className="accent-blue-500"
            />
            Sample: {name}
          </label>
        ))}
        <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
          <input
            type="radio"
            name="audio-source"
            checked={audioSource.type === 'live'}
            onChange={() => setAudioSource({ type: 'live' })}
            className="accent-blue-500"
          />
          🎙 Live input
        </label>
      </div>

      <div className="mb-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Volume</div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full accent-green-500"
        />
      </div>

      <button
        onClick={() => setPlaying(!playing)}
        className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs py-1.5 rounded font-mono transition-colors"
      >
        {playing ? '⏹ Stop' : '▶ Play'}
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/WaveformDisplay.tsx src/components/AudioControls.tsx
git commit -m "feat: add WaveformDisplay canvas renderer and AudioControls panel"
```

---

## Task 11: App layout — wire all UI components together

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to assemble the full layout**

```tsx
// src/App.tsx
import { Toolbar }         from './components/Toolbar'
import { SchematicCanvas } from './components/SchematicCanvas'
import { Inspector }       from './components/Inspector'
import { WaveformDisplay } from './components/WaveformDisplay'
import { AudioControls }   from './components/AudioControls'
import { StatusBar }       from './components/StatusBar'
import { useStore }        from './store'

export default function App() {
  const { outputBuffer, nodes } = useStore((s) => ({
    outputBuffer: s.outputBuffer,
    nodes: s.nodes,
  }))

  // Placeholder simulate handler — wired to real worker in Task 12
  function handleSimulate() {
    console.log('Simulate clicked — worker not yet wired')
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar onSimulate={handleSimulate} />

      <div className="flex flex-1 overflow-hidden">
        <SchematicCanvas />

        {/* Right panel */}
        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Waveform</div>
            <WaveformDisplay
              inputBuffer={null}
              outputBuffer={outputBuffer}
            />
          </div>
          <div className="border-t border-gray-800" />
          <AudioControls />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
```

- [ ] **Step 2: Start dev server and verify layout renders**

```bash
npm run dev
```

Open http://localhost:5173. Expected:
- Toolbar at top with component palette buttons and ▶ Simulate
- Schematic canvas (dark with dot grid) fills the center
- Right panel shows Inspector / Waveform / Audio Controls
- Status bar at bottom

- [ ] **Step 3: Smoke-test by adding components**

Click "R" in toolbar — a resistor should appear on the canvas. Click it — Inspector should show label + resistance fields. Click "GND" — a ground symbol appears.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: assemble full app layout with all UI panels"
```

---

## Task 12: Audio pipeline

**Files:**
- Create: `src/audio/pipeline.ts`
- Create: `public/samples/` (manual step — user must provide WAV files)

- [ ] **Step 1: Source audio samples**

Place two short (2–4 second) looping audio samples in `public/samples/`. Recommended sources:
- https://freesound.org — search "clean electric guitar loop CC0"
- https://freesound.org — search "bass guitar loop CC0"

Save as `public/samples/guitar.wav` and `public/samples/bass.wav`.

- [ ] **Step 2: Create src/audio/pipeline.ts**

```ts
// src/audio/pipeline.ts

const SAMPLE_RATE = 44100
const BUFFER_SIZE = 2048

type OnInputBuffer = (buf: Float32Array) => void

export class AudioPipeline {
  private ctx: AudioContext | null = null
  private gainNode: GainNode | null = null
  private sampleBuffers = new Map<string, AudioBuffer>()
  private sampleOffset = 0
  private stream: MediaStream | null = null
  private scriptNode: ScriptProcessorNode | null = null
  private onInputBuffer: OnInputBuffer | null = null
  private outputQueue: Float32Array[] = []
  private nextPlayTime = 0

  async init(volume: number): Promise<void> {
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE })
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = volume
    this.gainNode.connect(this.ctx.destination)
  }

  setVolume(volume: number): void {
    if (this.gainNode) this.gainNode.gain.value = volume
  }

  async loadSample(name: string): Promise<void> {
    if (!this.ctx) throw new Error('Pipeline not initialized')
    if (this.sampleBuffers.has(name)) return
    const res = await fetch(`/samples/${name}.wav`)
    const arrayBuf = await res.arrayBuffer()
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf)
    this.sampleBuffers.set(name, audioBuf)
  }

  /**
   * Start capturing input from a pre-loaded sample in a loop.
   * Calls onInputBuffer each time a new 2048-sample chunk is ready.
   */
  startSampleCapture(name: string, onInputBuffer: OnInputBuffer): void {
    if (!this.ctx) throw new Error('Pipeline not initialized')
    const buf = this.sampleBuffers.get(name)
    if (!buf) throw new Error(`Sample "${name}" not loaded`)

    this.onInputBuffer = onInputBuffer
    this.sampleOffset = 0

    // Use a ScriptProcessorNode to drive the callback at buffer boundaries
    this.scriptNode = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1)
    this.scriptNode.onaudioprocess = () => {
      if (!buf || !this.onInputBuffer) return
      const chunk = new Float32Array(BUFFER_SIZE)
      const channelData = buf.getChannelData(0)
      for (let i = 0; i < BUFFER_SIZE; i++) {
        chunk[i] = channelData[this.sampleOffset % channelData.length]
        this.sampleOffset++
      }
      this.onInputBuffer(chunk)
    }
    // Connect to destination silently (script processor needs to be in graph)
    const silentGain = this.ctx.createGain()
    silentGain.gain.value = 0
    this.scriptNode.connect(silentGain)
    silentGain.connect(this.ctx.destination)
  }

  /** Start capturing from the microphone/live input. */
  async startLiveCapture(onInputBuffer: OnInputBuffer): Promise<void> {
    if (!this.ctx) throw new Error('Pipeline not initialized')
    this.onInputBuffer = onInputBuffer
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    const source = this.ctx.createMediaStreamSource(this.stream)
    this.scriptNode = this.ctx.createScriptProcessor(BUFFER_SIZE, 1, 1)
    this.scriptNode.onaudioprocess = (e) => {
      if (!this.onInputBuffer) return
      const chunk = new Float32Array(BUFFER_SIZE)
      chunk.set(e.inputBuffer.getChannelData(0))
      this.onInputBuffer(chunk)
    }
    source.connect(this.scriptNode)
    const silentGain = this.ctx.createGain()
    silentGain.gain.value = 0
    this.scriptNode.connect(silentGain)
    silentGain.connect(this.ctx.destination)
  }

  /** Queue a processed output buffer for playback. */
  scheduleOutput(outputBuffer: Float32Array): void {
    if (!this.ctx || !this.gainNode) return
    const audioBuffer = this.ctx.createBuffer(1, outputBuffer.length, SAMPLE_RATE)
    audioBuffer.copyToChannel(outputBuffer, 0)
    const source = this.ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(this.gainNode)

    const now = this.ctx.currentTime
    // Schedule ahead by one buffer to allow for simulation latency
    const bufferDuration = BUFFER_SIZE / SAMPLE_RATE
    if (this.nextPlayTime < now + bufferDuration) {
      this.nextPlayTime = now + bufferDuration
    }
    source.start(this.nextPlayTime)
    this.nextPlayTime += bufferDuration
  }

  stop(): void {
    this.scriptNode?.disconnect()
    this.scriptNode = null
    this.stream?.getTracks().forEach((t) => t.stop())
    this.stream = null
    this.onInputBuffer = null
    this.nextPlayTime = 0
  }

  destroy(): void {
    this.stop()
    this.ctx?.close()
    this.ctx = null
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/audio/pipeline.ts public/samples/
git commit -m "feat: add AudioPipeline class with sample and live-input capture"
```

---

## Task 13: Simulation Web Worker

**Files:**
- Create: `src/workers/simulation.worker.ts`

This task requires finding a working ngspice WASM build. The worker is written to a stable interface so the rest of the app doesn't need to change if the ngspice integration is swapped out.

- [ ] **Step 1: Research ngspice WASM availability**

```bash
npm search ngspice
```

Check npm for packages named `ngspice`, `@ngspice/ngspice`, or `ngspice-wasm`. If a stable package is available, install it. If not, proceed with the stub implementation in Step 3, which passes audio through unmodified (useful for testing the pipeline end-to-end).

If a package exists:
```bash
npm install <ngspice-package-name>
```

Note the package's API for loading the WASM module and running a netlist. The integration point in Step 4 is `runNgspice(netlist: string): Float64Array` — replace the stub with a real call.

- [ ] **Step 2: Create src/workers/simulation.worker.ts with stub**

```ts
// src/workers/simulation.worker.ts
// Stub implementation: passes input buffer through as output unchanged.
// Replace the runSimulation function with real ngspice WASM when available.
import type { SimulateRequest, SimulateResponse } from '../lib/types'

/**
 * Stub: returns the input buffer as the output.
 * Replace this with a real ngspice WASM call.
 * The real implementation should:
 *   1. Load ngspice WASM module (once, at worker startup)
 *   2. Pass the netlist string to ngspice
 *   3. Return V(out) as a Float32Array
 */
function runSimulation(netlist: string, inputBuffer: Float32Array): Float32Array {
  // TODO: replace with ngspice WASM call
  // The netlist already has PWL data injected by compileNetlist().
  // ngspice should return a voltage array for V(out_node).
  console.log('[worker] stub — running passthrough. Netlist length:', netlist.length)
  return new Float32Array(inputBuffer)
}

self.onmessage = (e: MessageEvent<SimulateRequest>) => {
  const { type, netlist, inputBuffer } = e.data
  if (type !== 'simulate') return

  try {
    const outputBuffer = runSimulation(netlist, inputBuffer)
    const response: SimulateResponse = { type: 'result', outputBuffer }
    self.postMessage(response, [outputBuffer.buffer])
  } catch (err) {
    const response: SimulateResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    }
    self.postMessage(response)
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/workers/simulation.worker.ts
git commit -m "feat: add simulation Web Worker with passthrough stub (ngspice WASM TBD)"
```

---

## Task 14: Integration — wire Simulate button to worker and audio pipeline

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to wire simulation end-to-end**

```tsx
// src/App.tsx
import { useEffect, useRef, useCallback } from 'react'
import { Toolbar }         from './components/Toolbar'
import { SchematicCanvas } from './components/SchematicCanvas'
import { Inspector }       from './components/Inspector'
import { WaveformDisplay } from './components/WaveformDisplay'
import { AudioControls }   from './components/AudioControls'
import { StatusBar }       from './components/StatusBar'
import { useStore }        from './store'
import { AudioPipeline }   from './audio/pipeline'
import { compileNetlist }  from './lib/netlist'
import type { SimulateResponse } from './lib/types'

export default function App() {
  const {
    nodes, edges, outputBuffer,
    audioSource, volume, playing,
    setSimulationStatus, setOutputBuffer, setSimulationError,
    setPlaying,
  } = useStore((s) => ({
    nodes:                s.nodes,
    edges:                s.edges,
    outputBuffer:         s.outputBuffer,
    audioSource:          s.audioSource,
    volume:               s.volume,
    playing:              s.playing,
    setSimulationStatus:  s.setSimulationStatus,
    setOutputBuffer:      s.setOutputBuffer,
    setSimulationError:   s.setSimulationError,
    setPlaying:           s.setPlaying,
  }))

  const workerRef   = useRef<Worker | null>(null)
  const pipelineRef = useRef<AudioPipeline | null>(null)
  // Keep a ref to the latest input buffer so Simulate can use it
  const inputBufRef = useRef<Float32Array>(new Float32Array(2048))

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data
      if (msg.type === 'result') {
        setSimulationStatus('idle')
        setOutputBuffer(msg.outputBuffer)
        pipelineRef.current?.scheduleOutput(msg.outputBuffer)
      } else {
        setSimulationStatus('error')
        setSimulationError(msg.message)
      }
    }
    return () => { workerRef.current?.terminate() }
  }, [setSimulationStatus, setOutputBuffer, setSimulationError])

  // Initialize audio pipeline
  useEffect(() => {
    const pipeline = new AudioPipeline()
    pipelineRef.current = pipeline
    pipeline.init(volume)
    return () => { pipeline.destroy() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync volume changes
  useEffect(() => {
    pipelineRef.current?.setVolume(volume)
  }, [volume])

  // Start/stop audio capture when playing state or source changes
  useEffect(() => {
    const pipeline = pipelineRef.current
    if (!pipeline) return

    pipeline.stop()
    if (!playing) return

    function onInputBuffer(buf: Float32Array) {
      inputBufRef.current = buf
    }

    if (audioSource.type === 'sample') {
      pipeline.loadSample(audioSource.name).then(() => {
        pipeline.startSampleCapture(audioSource.name, onInputBuffer)
      })
    } else {
      pipeline.startLiveCapture(onInputBuffer)
    }
  }, [playing, audioSource])

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) return
    try {
      const netlist = compileNetlist(nodes, edges, inputBufRef.current, 44100)
      setSimulationStatus('running')
      workerRef.current.postMessage(
        { type: 'simulate', netlist, inputBuffer: inputBufRef.current },
        [inputBufRef.current.buffer]
      )
      // Replace with a fresh buffer so we don't lose the next chunk
      inputBufRef.current = new Float32Array(2048)
    } catch (err) {
      setSimulationStatus('error')
      setSimulationError(err instanceof Error ? err.message : String(err))
    }
  }, [nodes, edges, setSimulationStatus, setSimulationError])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar onSimulate={handleSimulate} />

      <div className="flex flex-1 overflow-hidden">
        <SchematicCanvas />

        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Waveform</div>
            <WaveformDisplay
              inputBuffer={inputBufRef.current}
              outputBuffer={outputBuffer}
            />
          </div>
          <div className="border-t border-gray-800" />
          <AudioControls />
        </div>
      </div>

      <StatusBar />
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Smoke-test end-to-end**

```bash
npm run dev
```

1. Open http://localhost:5173
2. Add IN, R (10kΩ), C (47nF), OUT, GND components
3. Connect them: IN.out → R.a, R.b → C.a, R.b → OUT.in, C.b → GND.gnd
4. Select "guitar" sample and click ▶ Play (audio won't be heard yet since sample files are needed)
5. Click ▶ Simulate — status bar should briefly show "simulating…" then "ready"
6. No console errors

- [ ] **Step 4: Run the full test suite**

```bash
npx vitest run
```

Expected: all tests pass

- [ ] **Step 5: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: integrate simulation worker and audio pipeline end-to-end"
```

---

## Post-MVP: Replace stub with real ngspice WASM

Once ngspice WASM integration is confirmed (see Task 13 Step 1), replace the `runSimulation` stub in `src/workers/simulation.worker.ts` with the real ngspice call. The worker interface (`SimulateRequest` / `SimulateResponse`) and all surrounding code remains unchanged.

Key integration notes:
- ngspice WASM must be initialized once at worker startup (expensive), not per simulate call
- The netlist from `compileNetlist()` already includes the PWL audio data and `.tran` directive — pass it directly to ngspice
- Extract `V(out_node)` from the ngspice results and normalize to `[-1, 1]` Float32Array range before returning
