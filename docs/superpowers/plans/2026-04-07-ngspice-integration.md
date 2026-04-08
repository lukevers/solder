# ngspice Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simulation worker stub with a real ngspice WASM engine (`eecircuit-engine`) so that clicking Simulate runs a transient SPICE analysis and produces playable audio output.

**Architecture:** A `SpiceEngine` interface decouples the worker from any concrete WASM implementation. `EECircuitEngine` wraps `eecircuit-engine` (lazy-loaded in the worker on first simulate). Model files (TL072, LM741) are inlined directly into the netlist as `.subckt` blocks — the `eecircuit-engine` virtual FS is private and cannot be written from outside. Simulation runs in batch mode: one call produces a full output buffer, which is stored in the Zustand store and played back via a one-shot `AudioBufferSourceNode`.

**Tech Stack:** React 19, Zustand 5, TypeScript 5, Vite 8, `eecircuit-engine` npm package, Web Workers, Web Audio API, Vitest

> **API note:** `eecircuit-engine`'s `sim.runSim()` returns a structured `ResultType` object (parsed binary), **not** stdout text. Use `result.data.find(d => d.type === 'time')` and `result.data.find(d => d.type === 'voltage')` to extract simulation output. The virtual FS (`module.FS`) is private — model subcircuits must be inlined in the netlist string, not written as files.

---

## Files

| File | Change |
|---|---|
| `src/lib/spice-engine.ts` | New — `SpiceEngine` interface, `SimulationOutput` type |
| `src/lib/engines/mock.ts` | New — `MockSpiceEngine` |
| `src/lib/engines/eecircuit.ts` | New — `EECircuitEngine`, `extractSimulationOutput` |
| `src/lib/spice-models.ts` | New — TL072 + LM741 subcircuit constants |
| `src/lib/audio-convert.ts` | New — `voltageToAudioBuffer` |
| `src/lib/netlist.ts` | Modify — drop `inputBuffer`/`sampleRate`, add `duration`/`frequency`/`amplitude`, inline subckts, use `SIN()`, use `.save` |
| `src/lib/types.ts` | Modify — update `SimulateRequest` |
| `src/workers/simulation.worker.ts` | Rewrite — use `SpiceEngine`, batch mode |
| `src/audio/pipeline.ts` | Modify — add `playBuffer`, `stopPlayback` |
| `src/store/index.ts` | Modify — add `simulationDuration`, `inputFrequency`, `inputAmplitude` |
| `src/App.tsx` | Modify — batch mode, remove streaming, add play/stop effect |
| `src/components/Toolbar.tsx` | Modify — Simulate/Play/Stop button states |
| `src/components/StatusBar.tsx` | Modify — show simulation duration |
| `src/test/spice-engine.test.ts` | New |
| `src/test/audio-convert.test.ts` | New |
| `src/test/eecircuit.test.ts` | New |
| `src/test/netlist.test.ts` | Modify — update for new signature |

---

## Task 1: `SpiceEngine` interface + `MockSpiceEngine`

**Files:**
- Create: `src/lib/spice-engine.ts`
- Create: `src/lib/engines/mock.ts`
- Create: `src/test/spice-engine.test.ts`

### Background

`SpiceEngine` is the abstraction that the worker uses. It has two methods: `init()` (lazy WASM load, safe to call multiple times) and `run(netlist)` (synchronous-feel async call that returns voltage time series). `MockSpiceEngine` returns a configurable sine wave — used for all unit tests that don't need real ngspice.

---

- [ ] **Step 1: Write the failing tests**

Create `src/test/spice-engine.test.ts`:

```ts
// src/test/spice-engine.test.ts
import { describe, expect, it } from 'vitest';
import { MockSpiceEngine } from '../lib/engines/mock';

describe('MockSpiceEngine', () => {
  it('init() resolves without error', async () => {
    const engine = new MockSpiceEngine();
    await expect(engine.init()).resolves.toBeUndefined();
  });

  it('init() is idempotent — safe to call twice', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    await expect(engine.init()).resolves.toBeUndefined();
  });

  it('run() returns SimulationOutput with correct shape', async () => {
    const engine = new MockSpiceEngine();
    await engine.init();
    const output = await engine.run('* dummy netlist\n.end');
    expect(output).toHaveProperty('timeValues');
    expect(output).toHaveProperty('voltageValues');
    expect(output.timeValues).toBeInstanceOf(Float64Array);
    expect(output.voltageValues).toBeInstanceOf(Float64Array);
  });

  it('run() returns same number of time and voltage points', async () => {
    const engine = new MockSpiceEngine();
    const output = await engine.run('');
    expect(output.timeValues.length).toBe(output.voltageValues.length);
  });

  it('run() returns timeValues starting at 0', async () => {
    const engine = new MockSpiceEngine();
    const output = await engine.run('');
    expect(output.timeValues[0]).toBe(0);
  });

  it('run() returns sampleRate points for 1 second by default', async () => {
    const sampleRate = 44100;
    const engine = new MockSpiceEngine(1000, 1.0, sampleRate);
    const output = await engine.run('');
    expect(output.timeValues.length).toBe(sampleRate);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/spice-engine.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../lib/engines/mock'`

- [ ] **Step 3: Create `src/lib/spice-engine.ts`**

```ts
// src/lib/spice-engine.ts

export type SimulationOutput = {
  timeValues: Float64Array;    // seconds, one entry per ngspice output step
  voltageValues: Float64Array; // volts at the probed output node, same length
};

export interface SpiceEngine {
  /** Initialise the engine. Safe to call multiple times; no-op after first. */
  init(): Promise<void>;
  /** Run a netlist string and return the output voltage time series. */
  run(netlist: string): Promise<SimulationOutput>;
}
```

- [ ] **Step 4: Create `src/lib/engines/mock.ts`**

```ts
// src/lib/engines/mock.ts
import type { SimulationOutput, SpiceEngine } from '../spice-engine';

export class MockSpiceEngine implements SpiceEngine {
  constructor(
    private readonly frequency = 1000,
    private readonly amplitude = 1.0,
    private readonly sampleRate = 44100,
  ) {}

  async init(): Promise<void> {}

  async run(_netlist: string): Promise<SimulationOutput> {
    const n = this.sampleRate;
    const timeValues = new Float64Array(n);
    const voltageValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      timeValues[i] = i / this.sampleRate;
      voltageValues[i] =
        this.amplitude * Math.sin(2 * Math.PI * this.frequency * timeValues[i]);
    }
    return { timeValues, voltageValues };
  }
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/spice-engine.test.ts 2>&1 | tail -10
```

Expected: all 6 tests pass.

- [ ] **Step 6: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/lib/spice-engine.ts src/lib/engines/mock.ts src/test/spice-engine.test.ts
```

- [ ] **Step 7: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/lib/spice-engine.ts src/lib/engines/mock.ts src/test/spice-engine.test.ts && git commit -m "feat: add SpiceEngine interface and MockSpiceEngine"
```

---

## Task 2: `voltageToAudioBuffer`

**Files:**
- Create: `src/lib/audio-convert.ts`
- Create: `src/test/audio-convert.test.ts`

### Background

Takes `SimulationOutput` (variable-step ngspice time series) and resamples it to a fixed-rate `Float32Array` at `sampleRate` Hz, then normalises to `[-1, 1]`. The normalisation floor of `0.01` prevents division-by-near-zero on circuits that produce no output.

---

- [ ] **Step 1: Write the failing tests**

Create `src/test/audio-convert.test.ts`:

```ts
// src/test/audio-convert.test.ts
import { describe, expect, it } from 'vitest';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import type { SimulationOutput } from '../lib/spice-engine';

describe('voltageToAudioBuffer', () => {
  it('returns a Float32Array', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 1]),
      voltageValues: new Float64Array([0, 1]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result).toBeInstanceOf(Float32Array);
  });

  it('resamples to sampleRate * duration samples', () => {
    // 0.5 s at 44100 Hz = 22050 samples
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.5]),
      voltageValues: new Float64Array([0, 1]),
    };
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.length).toBe(Math.round(0.5 * 44100));
  });

  it('normalises peak absolute value to 1.0', () => {
    const n = 200;
    const timeValues = new Float64Array(n);
    const voltageValues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      timeValues[i] = i / n;
      voltageValues[i] = 2 * Math.sin(2 * Math.PI * (i / n));
    }
    const result = voltageToAudioBuffer({ timeValues, voltageValues }, n);
    const peak = Math.max(...Array.from(result).map(Math.abs));
    expect(peak).toBeCloseTo(1.0, 2);
  });

  it('does not divide by zero on silent output', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.001]),
      voltageValues: new Float64Array([0, 0]),
    };
    expect(() => voltageToAudioBuffer(output, 44100)).not.toThrow();
    const result = voltageToAudioBuffer(output, 44100);
    expect(result.every((v) => Number.isFinite(v))).toBe(true);
  });

  it('returns empty array for empty input', () => {
    const output: SimulationOutput = {
      timeValues: new Float64Array(0),
      voltageValues: new Float64Array(0),
    };
    expect(voltageToAudioBuffer(output, 44100).length).toBe(0);
  });

  it('handles variable-step time axis (non-uniform spacing)', () => {
    // Coarse at start, fine at end — should still produce uniform output
    const output: SimulationOutput = {
      timeValues: new Float64Array([0, 0.1, 0.11, 0.12, 0.2]),
      voltageValues: new Float64Array([0, 1, 1, 1, 0]),
    };
    expect(() => voltageToAudioBuffer(output, 100)).not.toThrow();
    expect(voltageToAudioBuffer(output, 100).length).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/audio-convert.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../lib/audio-convert'`

- [ ] **Step 3: Create `src/lib/audio-convert.ts`**

```ts
// src/lib/audio-convert.ts
import type { SimulationOutput } from './spice-engine';

/**
 * Resamples a variable-step ngspice voltage time series to a fixed-rate
 * Float32Array at `sampleRate` Hz, then normalises to [-1, 1].
 */
export function voltageToAudioBuffer(
  output: SimulationOutput,
  sampleRate: number,
): Float32Array {
  const { timeValues, voltageValues } = output;
  if (timeValues.length === 0) return new Float32Array(0);

  const maxTime = timeValues[timeValues.length - 1];
  const n = Math.max(1, Math.round(maxTime * sampleRate));
  const result = new Float32Array(n);

  let j = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    // Advance j so that timeValues[j] <= t < timeValues[j+1]
    while (j < timeValues.length - 2 && timeValues[j + 1] <= t) j++;

    const t0 = timeValues[j];
    const t1 = timeValues[j + 1] ?? t0;
    const v0 = voltageValues[j];
    const v1 = voltageValues[j + 1] ?? v0;

    if (t1 === t0) {
      result[i] = v0;
    } else {
      const alpha = Math.min(1, Math.max(0, (t - t0) / (t1 - t0)));
      result[i] = v0 + alpha * (v1 - v0);
    }
  }

  // Normalise: divide by peak absolute value, floor at 0.01 to avoid ÷0
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(result[i]));
  const scale = 1 / Math.max(peak, 0.01);
  for (let i = 0; i < n; i++) result[i] *= scale;

  return result;
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/audio-convert.test.ts 2>&1 | tail -10
```

Expected: all 6 tests pass.

- [ ] **Step 5: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/lib/audio-convert.ts src/test/audio-convert.test.ts
```

- [ ] **Step 6: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/lib/audio-convert.ts src/test/audio-convert.test.ts && git commit -m "feat: add voltageToAudioBuffer with resampling and normalisation"
```

---

## Task 3: SPICE model constants + `netlist.ts` update + `types.ts` update

**Files:**
- Create: `src/lib/spice-models.ts`
- Modify: `src/lib/netlist.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/test/netlist.test.ts`

### Background

`compileNetlist` signature changes: drop `inputBuffer` and `sampleRate`, add `duration` (seconds, default 1.0), `frequency` (Hz, default 1000), `amplitude` (V, default 1.0). The `AudioIn` node emits `SIN(0 amplitude frequency)` instead of a PWL source. Op-amp model `.include` directives become inline `.subckt`/`.ends` blocks. `.probe` becomes `.save`.

`SimulateRequest` type drops `netlist` and `inputBuffer`, adds `nodes`, `edges`, `duration`, `frequency`, `amplitude` — the worker now compiles the netlist itself.

> **Note:** After this task `App.tsx` will have TypeScript errors (it still calls the old `compileNetlist` signature). This is expected and is fixed in Task 7.

---

- [ ] **Step 1: Create `src/lib/spice-models.ts`**

```ts
// src/lib/spice-models.ts

/**
 * TL072 operational amplifier macromodel subcircuit.
 * Created using PARTS Release 4.01. Pin order: IN+, IN-, V+, V-, OUT.
 * Source: Texas Instruments / ngspice distribution.
 */
export const TL072_SUBCKT = `* TL072 OPERATIONAL AMPLIFIER "MACROMODEL" SUBCIRCUIT
* CONNECTIONS:   NON-INVERTING INPUT
*                | INVERTING INPUT
*                | | POSITIVE POWER SUPPLY
*                | | | NEGATIVE POWER SUPPLY
*                | | | | OUTPUT
*                | | | | |
.SUBCKT TL072    1 2 3 4 5
  C1   11 12 3.498E-12
  C2    6  7 15.00E-12
  DC    5 53 DX
  DE   54  5 DX
  DLP  90 91 DX
  DLN  92 90 DX
  DP    4  3 DX
  EGND 99  0 POLY(2) (3,0) (4,0) 0 .5 .5
  FB    7 99 POLY(5) VB VC VE VLP VLN 0 4.715E6 -5E6 5E6 5E6 -5E6
  GA    6  0 11 12 282.8E-6
  GCM   0  6 10 99 8.942E-9
  ISS   3 10 DC 195.0E-6
  HLIM 90  0 VLIM 1K
  J1   11  2 10 JX
  J2   12  1 10 JX
  R2    6  9 100.0E3
  RD1   4 11 3.536E3
  RD2   4 12 3.536E3
  RO1   8  5 150
  RO2   7 99 150
  RP    3  4 2.143E3
  RSS  10 99 1.026E6
  VB    9  0 DC 0
  VC    3 53 DC 2.200
  VE   54  4 DC 2.200
  VLIM  7  8 DC 0
  VLP  91  0 DC 25
  VLN   0 92 DC 25
.MODEL DX D(IS=800.0E-18)
.MODEL JX PJF(IS=15.00E-12 BETA=270.1E-6 VTO=-1)
.ENDS`;

/**
 * LM741 operational amplifier macromodel subcircuit.
 * National Semiconductor macro-model. Pin order: IN+, IN-, V+, V-, OUT.
 * Source: National Semiconductor / ngspice distribution.
 */
export const LM741_SUBCKT = `* LM741 OPERATIONAL AMPLIFIER MACRO-MODEL
* CONNECTIONS:   NON-INVERTING INPUT
*                | INVERTING INPUT
*                | | POSITIVE POWER SUPPLY
*                | | | NEGATIVE POWER SUPPLY
*                | | | | OUTPUT
*                | | | | |
.SUBCKT LM741    1 2 99 50 28
IOS 2 1 20N
R1 1 3 250K
R2 3 2 250K
I1 4 50 100U
R3 5 99 517
R4 6 99 517
Q1 5 2 4 QX
Q2 6 7 4 QX
C4 5 6 60.3614P
I2 99 50 1.6MA
EOS 7 1 POLY(1) 16 49 1E-3 1
R8 99 49 40K
R9 49 50 40K
V2 99 8 1.63
D1 9 8 DX
D2 10 9 DX
V3 10 50 1.63
EH 99 98 99 49 1
G1 98 9 5 6 2.1E-3
R5 98 9 95.493MEG
C3 98 9 333.33P
G3 98 15 9 49 1E-6
R12 98 15 1MEG
C5 98 15 5.3052E-15
G4 98 16 3 49 3.1623E-8
L2 98 17 530.5M
R13 17 16 1K
F6 50 99 POLY(1) V6 450U 1
E1 99 23 99 15 1
R16 24 23 25
D5 26 24 DX
V6 26 22 0.65V
R17 23 25 25
D6 25 27 DX
V7 22 27 0.65V
V5 22 21 0.18V
D4 21 15 DX
V4 20 22 0.18V
D3 15 20 DX
L3 22 28 100P
RL3 22 28 100K
.MODEL DX D(IS=1E-15)
.MODEL QX NPN(BF=625)
.ENDS`;
```

- [ ] **Step 2: Update `src/test/netlist.test.ts` for new signature**

Replace the existing `compileNetlist` describe block (lines 111–231) with the following. Keep the `types` and `buildPortGroups` describe blocks unchanged.

```ts
describe('compileNetlist', () => {
  // Minimal circuit: IN → R1 → OUT, with C1 to GND
  function makeRCCircuit() {
    const nodes: Array<ComponentNode> = [
      {
        id: 'in1',
        type: 'audiin',
        position: { x: 0, y: 0 },
        data: { label: 'IN' },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 100, y: 0 },
        data: { label: 'R1', ohms: 10000 },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 200, y: 0 },
        data: { label: 'C1', farads: 47e-9 },
      },
      {
        id: 'out1',
        type: 'audiout',
        position: { x: 300, y: 0 },
        data: { label: 'OUT' },
      },
      {
        id: 'gnd1',
        type: 'ground',
        position: { x: 200, y: 100 },
        data: { label: 'GND' },
      },
    ];
    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'in1',
        sourceHandle: 'out',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e3',
        source: 'r1',
        sourceHandle: 'b',
        target: 'out1',
        targetHandle: 'in',
      },
      {
        id: 'e4',
        source: 'c1',
        sourceHandle: 'b',
        target: 'gnd1',
        targetHandle: 'gnd',
      },
    ];
    return { nodes, edges };
  }

  it('emits a SIN Vin source line', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/^Vin \S+ 0 SIN\(/m);
  });

  it('uses the supplied frequency in the SIN source', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 1.0, 440, 1.0);
    expect(netlist).toContain('SIN(0 1 440)');
  });

  it('uses the supplied amplitude in the SIN source', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 1.0, 1000, 0.5);
    expect(netlist).toContain('SIN(0 0.5 1000)');
  });

  it('emits R1 with correct resistance in kΩ notation', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/R1 \S+ \S+ 10k/m);
  });

  it('emits C1 with correct capacitance in nF notation', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/C1 \S+ 0 47n/m);
  });

  it('emits .tran with step 1/44100 and supplied duration', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges, 2.0);
    expect(netlist).toMatch(/\.tran 2\.267574e-5 2\.000000e\+0/m);
  });

  it('emits .save V() for output node (not .probe)', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist).toMatch(/^\.save V\(\S+\)/m);
    expect(netlist).not.toMatch(/\.probe/);
  });

  it('contains .end', () => {
    const { nodes, edges } = makeRCCircuit();
    const netlist = compileNetlist(nodes, edges);
    expect(netlist.trim()).toMatch(/\.end$/);
  });

  it('inlines TL072_SUBCKT when a TL072 op-amp is present', () => {
    const nodes: Array<ComponentNode> = [
      { id: 'in1', type: 'audiin', position: { x: 0, y: 0 }, data: { label: 'IN' } },
      { id: 'u1', type: 'opamp', position: { x: 100, y: 0 }, data: { label: 'U1', model: 'TL072' } },
      { id: 'out1', type: 'audiout', position: { x: 200, y: 0 }, data: { label: 'OUT' } },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.SUBCKT TL072');
    expect(netlist).not.toContain('.include TL072.lib');
  });

  it('inlines LM741_SUBCKT when a LM741 op-amp is present', () => {
    const nodes: Array<ComponentNode> = [
      { id: 'in1', type: 'audiin', position: { x: 0, y: 0 }, data: { label: 'IN' } },
      { id: 'u1', type: 'opamp', position: { x: 100, y: 0 }, data: { label: 'U1', model: 'LM741' } },
      { id: 'out1', type: 'audiout', position: { x: 200, y: 0 }, data: { label: 'OUT' } },
    ];
    const netlist = compileNetlist(nodes, []);
    expect(netlist).toContain('.SUBCKT LM741');
    expect(netlist).not.toContain('.include LM741.lib');
  });

  it('throws when circuit has no AudioIn node', () => {
    const nodes: Array<ComponentNode> = [
      { id: 'out1', type: 'audiout', position: { x: 0, y: 0 }, data: { label: 'OUT' } },
    ];
    expect(() => compileNetlist(nodes, [])).toThrow('no input node');
  });

  it('throws when circuit has no AudioOut node', () => {
    const nodes: Array<ComponentNode> = [
      { id: 'in1', type: 'audiin', position: { x: 0, y: 0 }, data: { label: 'IN' } },
    ];
    expect(() => compileNetlist(nodes, [])).toThrow('no output node');
  });
});
```

- [ ] **Step 3: Run tests — confirm the updated tests fail**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/netlist.test.ts 2>&1 | tail -15
```

Expected: TypeScript/runtime errors about wrong number of arguments to `compileNetlist`.

- [ ] **Step 4: Rewrite `src/lib/netlist.ts`**

Replace the entire file:

```ts
// src/lib/netlist.ts
import type { Edge } from '@xyflow/react';
import { LM741_SUBCKT, TL072_SUBCKT } from './spice-models';
import type { ComponentNode } from './types';

const SAMPLE_RATE = 44100;

/** All port handles for each component type */
const COMPONENT_HANDLES: Record<ComponentNode['type'], Array<string>> = {
  resistor: ['a', 'b'],
  capacitor: ['a', 'b'],
  opamp: ['in_pos', 'in_neg', 'out', 'vcc', 'gnd'],
  power: ['pos'],
  ground: ['gnd'],
  audiin: ['out'],
  audiout: ['in'],
  diode: ['a', 'k'],
  pot: ['ccw', 'wiper', 'cw'],
};

/** Port identifier: "${nodeId}|${handleId}" */
type Port = string;

function allPorts(nodes: Array<ComponentNode>): Array<Port> {
  return nodes.flatMap((n) =>
    COMPONENT_HANDLES[n.type].map((h) => `${n.id}|${h}`),
  );
}

function buildAdjacency(edges: Array<Edge>): Map<Port, Set<Port>> {
  const adj = new Map<Port, Set<Port>>();
  const add = (p: Port) => {
    if (!adj.has(p)) adj.set(p, new Set());
  };
  for (const e of edges) {
    if (!e.sourceHandle || !e.targetHandle) continue;
    const src: Port = `${e.source}|${e.sourceHandle}`;
    const tgt: Port = `${e.target}|${e.targetHandle}`;
    add(src);
    add(tgt);
    adj.get(src)!.add(tgt);
    adj.get(tgt)!.add(src);
  }
  return adj;
}

function bfs(
  start: Port,
  nodeId: string,
  adj: Map<Port, Set<Port>>,
  visited: Set<Port>,
  portToNode: Map<Port, string>,
) {
  const queue = [start];
  visited.add(start);
  portToNode.set(start, nodeId);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const neighbor of adj.get(cur) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        portToNode.set(neighbor, nodeId);
        queue.push(neighbor);
      }
    }
  }
}

/**
 * Assigns each port a SPICE node ID string.
 * Ground ports → "0". Others → "n1", "n2", ...
 */
export function buildPortGroups(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
): Map<Port, string> {
  const adj = buildAdjacency(edges);
  const portToNode = new Map<Port, string>();
  const visited = new Set<Port>();

  for (const p of allPorts(nodes)) {
    if (!adj.has(p)) adj.set(p, new Set());
  }

  const groundPorts = nodes
    .filter((n) => n.type === 'ground')
    .map((n) => `${n.id}|gnd`);

  for (const gp of groundPorts) {
    if (!visited.has(gp)) {
      bfs(gp, '0', adj, visited, portToNode);
    }
  }

  let counter = 1;
  for (const [port] of adj) {
    if (!visited.has(port)) {
      bfs(port, `n${counter++}`, adj, visited, portToNode);
    }
  }

  return portToNode;
}

/** Format ohms as SPICE: 10000 → "10k", 1000000 → "1Meg", etc. */
function formatResistance(ohms: number): string {
  if (ohms >= 1e6) return `${parseFloat((ohms / 1e6).toPrecision(10))}Meg`;
  if (ohms >= 1e3) return `${parseFloat((ohms / 1e3).toPrecision(10))}k`;
  return `${ohms}`;
}

/** Format farads as SPICE: 47e-9 → "47n", 100e-12 → "100p", etc. */
function formatCapacitance(farads: number): string {
  if (farads >= 1e-3) return `${parseFloat((farads * 1e3).toPrecision(10))}m`;
  if (farads >= 1e-6) return `${parseFloat((farads * 1e6).toPrecision(10))}u`;
  if (farads >= 1e-9) return `${parseFloat((farads * 1e9).toPrecision(10))}n`;
  return `${parseFloat((farads * 1e12).toPrecision(10))}p`;
}

/**
 * Compiles a ReactFlow circuit graph into a SPICE netlist string.
 *
 * @param nodes     - ComponentNode array from the circuit store
 * @param edges     - Edge array from the circuit store
 * @param duration  - Simulation duration in seconds (default 1.0)
 * @param frequency - AudioIn sine source frequency in Hz (default 1000)
 * @param amplitude - AudioIn sine source amplitude in Volts (default 1.0)
 */
export function compileNetlist(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
  duration = 1.0,
  frequency = 1000,
  amplitude = 1.0,
): string {
  const portToNode = buildPortGroups(nodes, edges);

  const getNode = (nodeId: string, handle: string): string =>
    portToNode.get(`${nodeId}|${handle}`) ?? 'UNCONNECTED';

  const lines: Array<string> = ['* solder — auto-generated netlist'];

  // Inline op-amp subcircuit definitions — only include models actually used
  const usedModels = new Set(
    nodes.filter((n) => n.type === 'opamp').map((n) => n.data.model),
  );
  if (usedModels.has('TL072')) lines.push(TL072_SUBCKT);
  if (usedModels.has('LM741')) lines.push(LM741_SUBCKT);

  // Diode model statements — inline for standard models
  const usedDiodeModels = new Set(
    nodes.filter((n) => n.type === 'diode').map((n) => n.data.model),
  );
  if (usedDiodeModels.has('1N914'))
    lines.push('.model 1N914 D(Is=2.52n Rs=.568 N=1.752 Cjo=4p M=.4 tt=20n)');
  if (usedDiodeModels.has('1N4001'))
    lines.push(
      '.model 1N4001 D(Is=14.11n N=1.984 Rs=33.89m Cjo=25.89p M=.4 tt=5.7u)',
    );

  // Find input and output nodes
  const inputNode = nodes.find((n) => n.type === 'audiin');
  const outputNode = nodes.find((n) => n.type === 'audiout');

  if (!inputNode) throw new Error('Circuit has no input node');
  if (!outputNode) throw new Error('Circuit has no output node');

  const inputSpiceNode = getNode(inputNode.id, 'out');
  const outputSpiceNode = getNode(outputNode.id, 'in');

  // Vin: sinusoidal audio source SIN(offset amplitude frequency)
  lines.push(`Vin ${inputSpiceNode} 0 SIN(0 ${amplitude} ${frequency})`);

  // Emit each component
  for (const node of nodes) {
    if (node.type === 'resistor') {
      const na = getNode(node.id, 'a');
      const nb = getNode(node.id, 'b');
      lines.push(
        `${node.data.label} ${na} ${nb} ${formatResistance(node.data.ohms)}`,
      );
    } else if (node.type === 'capacitor') {
      const na = getNode(node.id, 'a');
      const nb = getNode(node.id, 'b');
      lines.push(
        `${node.data.label} ${na} ${nb} ${formatCapacitance(node.data.farads)}`,
      );
    } else if (node.type === 'opamp') {
      const inPos = getNode(node.id, 'in_pos');
      const inNeg = getNode(node.id, 'in_neg');
      const out = getNode(node.id, 'out');
      const vcc = getNode(node.id, 'vcc');
      const gnd = getNode(node.id, 'gnd');
      lines.push(
        `X${node.data.label} ${inPos} ${inNeg} ${vcc} ${gnd} ${out} ${node.data.model}`,
      );
    } else if (node.type === 'power') {
      const pos = getNode(node.id, 'pos');
      lines.push(`V${node.data.label} ${pos} 0 DC ${node.data.volts}`);
    } else if (node.type === 'diode') {
      const na = getNode(node.id, 'a');
      const nk = getNode(node.id, 'k');
      lines.push(`${node.data.label} ${na} ${nk} ${node.data.model}`);
    } else if (node.type === 'pot') {
      const nCcw = getNode(node.id, 'ccw');
      const nWiper = getNode(node.id, 'wiper');
      const nCw = getNode(node.id, 'cw');
      const rLow = Math.max(node.data.ohms * (1 - node.data.position), 1);
      const rHigh = Math.max(node.data.ohms * node.data.position, 1);
      lines.push(
        `${node.data.label}a ${nCcw} ${nWiper} ${formatResistance(rLow)}`,
      );
      lines.push(
        `${node.data.label}b ${nWiper} ${nCw} ${formatResistance(rHigh)}`,
      );
    }
    // ground, audiin, audiout: no SPICE component line needed
  }

  // Transient analysis: step = 1/SAMPLE_RATE, stop = duration
  const step = (1 / SAMPLE_RATE).toExponential(6);
  const stop = duration.toExponential(6);
  lines.push(`.tran ${step} ${stop}`);

  lines.push(`.save V(${outputSpiceNode})`);
  lines.push('.end');

  return lines.join('\n');
}
```

- [ ] **Step 5: Update `src/lib/types.ts` — replace `SimulateRequest`**

Find this block in `src/lib/types.ts`:

```ts
// Worker message types
export type SimulateRequest = {
  type: 'simulate';
  netlist: string;
  inputBuffer: Float32Array;
};
```

Replace it with:

```ts
// Worker message types
export type SimulateRequest = {
  type: 'simulate';
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
  duration: number;
  frequency: number;
  amplitude: number;
};
```

(Note: `ComponentNode` and `Edge` are already imported at the top of `types.ts`.)

- [ ] **Step 6: Run netlist tests — confirm they pass**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/netlist.test.ts 2>&1 | tail -15
```

Expected: all tests pass. If any test about `.tran` format fails, check the exact scientific notation output from `(1/44100).toExponential(6)` and `(2.0).toExponential(6)` — adjust the regex in the test to match.

- [ ] **Step 7: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -15
```

Expected: all existing tests pass. `App.tsx` will have TypeScript errors (it still calls the old `compileNetlist` signature) but Vitest does not type-check — tests still run.

- [ ] **Step 8: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/lib/spice-models.ts src/lib/netlist.ts src/lib/types.ts src/test/netlist.test.ts
```

- [ ] **Step 9: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/lib/spice-models.ts src/lib/netlist.ts src/lib/types.ts src/test/netlist.test.ts && git commit -m "feat: add spice models, update netlist to SIN source, update SimulateRequest type"
```

---

## Task 4: Install `eecircuit-engine` + `EECircuitEngine`

**Files:**
- Create: `src/lib/engines/eecircuit.ts`
- Create: `src/test/eecircuit.test.ts`

### Background

`eecircuit-engine` wraps ngspice compiled to WebAssembly. `runSim()` returns a structured `ResultType` object — not stdout text. We extract the time axis (`d.type === 'time'`) and the voltage trace (`d.type === 'voltage'`) from `result.data`.

The `Simulation` instance is created once and reused across calls. `init()` is idempotent.

The virtual FS (`module.FS`) is private inside the class — **you cannot call `sim.FS.writeFile()` from outside**. Op-amp model subcircuits are inlined directly in the netlist (done in Task 3), so no FS writes are needed.

The `extractSimulationOutput` function is exported separately so it can be unit-tested without loading the WASM binary.

---

- [ ] **Step 1: Install `eecircuit-engine`**

```bash
cd /Users/lukevers/code/solder && pnpm add eecircuit-engine
```

Expected: package added to `dependencies` in `package.json`.

- [ ] **Step 2: Write failing tests for `extractSimulationOutput`**

Create `src/test/eecircuit.test.ts`:

```ts
// src/test/eecircuit.test.ts
import type { ResultType } from 'eecircuit-engine';
import { describe, expect, it } from 'vitest';
import { extractSimulationOutput } from '../lib/engines/eecircuit';

function makeResult(overrides: Partial<ResultType> = {}): ResultType {
  return {
    header: '',
    numVariables: 2,
    variableNames: ['time', 'v(n1)'],
    numPoints: 3,
    dataType: 'real',
    data: [
      { name: 'time', type: 'time', values: [0, 1e-5, 2e-5] },
      { name: 'v(n1)', type: 'voltage', values: [0, 0.5, 1.0] },
    ],
    ...overrides,
  } as ResultType;
}

describe('extractSimulationOutput', () => {
  it('extracts time and voltage from a real ResultType', () => {
    const output = extractSimulationOutput(makeResult());
    expect(output.timeValues).toEqual(new Float64Array([0, 1e-5, 2e-5]));
    expect(output.voltageValues).toEqual(new Float64Array([0, 0.5, 1.0]));
  });

  it('returns Float64Arrays', () => {
    const output = extractSimulationOutput(makeResult());
    expect(output.timeValues).toBeInstanceOf(Float64Array);
    expect(output.voltageValues).toBeInstanceOf(Float64Array);
  });

  it('throws when result has no time entry', () => {
    const result = makeResult({
      data: [{ name: 'v(n1)', type: 'voltage', values: [0, 0.5] }],
    });
    expect(() => extractSimulationOutput(result)).toThrow('missing time axis');
  });

  it('throws when result has no voltage entry', () => {
    const result = makeResult({
      data: [{ name: 'time', type: 'time', values: [0, 1e-5] }],
    });
    expect(() => extractSimulationOutput(result)).toThrow('missing voltage data');
  });

  it('throws on complex (AC) result', () => {
    const result = makeResult({ dataType: 'complex' });
    expect(() => extractSimulationOutput(result)).toThrow('Expected real');
  });
});
```

- [ ] **Step 3: Run tests — confirm they fail**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/eecircuit.test.ts 2>&1 | tail -10
```

Expected: `Cannot find module '../lib/engines/eecircuit'`

- [ ] **Step 4: Create `src/lib/engines/eecircuit.ts`**

```ts
// src/lib/engines/eecircuit.ts
import type { ResultType, Simulation } from 'eecircuit-engine';
import type { SimulationOutput, SpiceEngine } from '../spice-engine';

/**
 * Extracts time and voltage arrays from an eecircuit-engine ResultType.
 * Exported for unit testing without loading the WASM binary.
 */
export function extractSimulationOutput(result: ResultType): SimulationOutput {
  if (result.dataType !== 'real') {
    throw new Error('Expected real (transient) simulation result');
  }
  const timeEntry = result.data.find((d) => d.type === 'time');
  const voltageEntry = result.data.find((d) => d.type === 'voltage');
  if (!timeEntry) throw new Error('Simulation output missing time axis');
  if (!voltageEntry) throw new Error('Simulation output missing voltage data');
  return {
    timeValues: new Float64Array(timeEntry.values),
    voltageValues: new Float64Array(voltageEntry.values),
  };
}

export class EECircuitEngine implements SpiceEngine {
  private sim: Simulation | null = null;

  async init(): Promise<void> {
    if (this.sim) return;
    const { Simulation } = await import('eecircuit-engine');
    this.sim = new Simulation();
    await this.sim.start();
  }

  async run(netlist: string): Promise<SimulationOutput> {
    if (!this.sim) throw new Error('EECircuitEngine not initialised — call init() first');
    this.sim.setNetList(netlist);
    const result = await this.sim.runSim();
    return extractSimulationOutput(result);
  }
}
```

- [ ] **Step 5: Run tests — confirm they pass**

```bash
cd /Users/lukevers/code/solder && pnpm test src/test/eecircuit.test.ts 2>&1 | tail -10
```

Expected: all 5 tests pass.

- [ ] **Step 6: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 7: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/lib/engines/eecircuit.ts src/test/eecircuit.test.ts
```

- [ ] **Step 8: Commit**

```bash
cd /Users/lukevers/code/solder && git add package.json pnpm-lock.yaml src/lib/engines/eecircuit.ts src/test/eecircuit.test.ts && git commit -m "feat: add EECircuitEngine wrapping eecircuit-engine"
```

---

## Task 5: Worker rewrite

**Files:**
- Modify: `src/workers/simulation.worker.ts`

### Background

The worker now compiles the netlist itself (using `compileNetlist` from `netlist.ts`) and delegates simulation to `EECircuitEngine`. The `EECircuitEngine` instance is created once at the module level and reused across simulations — `init()` is idempotent and loads the WASM only once. The worker is an async module worker (`{ type: 'module' }` is set in `App.tsx`'s `new Worker(...)` call).

---

- [ ] **Step 1: Rewrite `src/workers/simulation.worker.ts`**

```ts
// src/workers/simulation.worker.ts
import { EECircuitEngine } from '../lib/engines/eecircuit';
import { voltageToAudioBuffer } from '../lib/audio-convert';
import { compileNetlist } from '../lib/netlist';
import type { SimulateRequest, SimulateResponse } from '../lib/types';
import type { SpiceEngine } from '../lib/spice-engine';

const SAMPLE_RATE = 44100;

// Engine is created once; WASM loads lazily on first init() call
const engine: SpiceEngine = new EECircuitEngine();

self.onmessage = async (e: MessageEvent<SimulateRequest>) => {
  if (e.data.type !== 'simulate') return;
  const { nodes, edges, duration, frequency, amplitude } = e.data;
  try {
    await engine.init();
    const netlist = compileNetlist(nodes, edges, duration, frequency, amplitude);
    const output = await engine.run(netlist);
    const audioBuffer = voltageToAudioBuffer(output, SAMPLE_RATE);
    const response: SimulateResponse = { type: 'result', outputBuffer: audioBuffer };
    self.postMessage(response, [audioBuffer.buffer]);
  } catch (err) {
    const response: SimulateResponse = {
      type: 'error',
      message: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
};
```

- [ ] **Step 2: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/workers/simulation.worker.ts
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/workers/simulation.worker.ts && git commit -m "feat: rewrite simulation worker to use EECircuitEngine in batch mode"
```

---

## Task 6: Audio pipeline batch playback

**Files:**
- Modify: `src/audio/pipeline.ts`

### Background

Add `playBuffer(buffer, onEnded?)` and `stopPlayback()` to `AudioPipeline`. `playBuffer` creates a one-shot `AudioBufferSourceNode`, connects it to the gain node, and starts it. `onEnded` is called when the buffer finishes playing naturally (used by `App.tsx` to reset `playing` state in the store). Update `stop()` to also call `stopPlayback()` so cleanup is complete.

No unit tests for this — `AudioContext` is not available in jsdom. Verified by manual smoke test after Task 8.

---

- [ ] **Step 1: Add `activeSource` field and `playBuffer`/`stopPlayback` methods to `src/audio/pipeline.ts`**

Read the file first, then make the following additions:

Add `private activeSource: AudioBufferSourceNode | null = null;` after `private nextPlayTime = 0;` (line 18).

Add the following two methods between `scheduleOutput` and `stop`:

```ts
  /** Play a pre-simulated output buffer once. Calls onEnded when playback finishes naturally. */
  playBuffer(buffer: Float32Array, onEnded?: () => void): void {
    if (!this.ctx || !this.gainNode) return;
    void this.ctx.resume();
    this.stopPlayback();
    const audioBuffer = this.ctx.createBuffer(1, buffer.length, this.ctx.sampleRate);
    audioBuffer.copyToChannel(buffer, 0);
    this.activeSource = this.ctx.createBufferSource();
    this.activeSource.buffer = audioBuffer;
    this.activeSource.connect(this.gainNode);
    if (onEnded) {
      this.activeSource.onended = () => {
        this.activeSource = null;
        onEnded();
      };
    }
    this.activeSource.start();
  }

  /** Stop batch playback if currently playing. */
  stopPlayback(): void {
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch {
        // Ignore if already stopped
      }
      this.activeSource = null;
    }
  }
```

Also update the existing `stop()` method to call `this.stopPlayback()` as its first line:

```ts
  stop(): void {
    this.stopPlayback();
    void this.ctx?.suspend();
    // ... rest of existing stop() body unchanged
```

- [ ] **Step 2: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/audio/pipeline.ts
```

- [ ] **Step 3: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/audio/pipeline.ts && git commit -m "feat: add playBuffer and stopPlayback to AudioPipeline for batch playback"
```

---

## Task 7: Store changes + `App.tsx` batch mode

**Files:**
- Modify: `src/store/index.ts`
- Modify: `src/App.tsx`

### Background

**Store:** Add three read-only simulation parameter fields to the simulation slice: `simulationDuration` (default 1.0 s), `inputFrequency` (default 1000 Hz), `inputAmplitude` (default 1.0 V). No setters for now — they are hardcoded defaults.

**App.tsx:** Remove the streaming pipeline (ScriptProcessorNode-based chunk capture loop). Replace `handleSimulate` with a batch mode version that posts `SimulateRequest` with `nodes`, `edges`, `duration`, `frequency`, `amplitude`. Add a `useEffect` that plays the output buffer via `pipelineRef` when `playing` becomes true, and stops it when `playing` becomes false.

---

- [ ] **Step 1: Add simulation params to `src/store/index.ts`**

In the `StoreState` type, add three fields to the simulation slice:

```ts
  // simulation slice
  simulationStatus: SimulationStatus;
  outputBuffer: Float32Array | null;
  simulationError: string | null;
  simulationDuration: number;
  inputFrequency: number;
  inputAmplitude: number;
  setSimulationStatus: (status: SimulationStatus) => void;
  setOutputBuffer: (buf: Float32Array) => void;
  setSimulationError: (msg: string) => void;
```

In `initialState`, add the three field values:

```ts
  // simulation slice
  simulationStatus: 'idle' as SimulationStatus,
  outputBuffer: null as Float32Array | null,
  simulationError: null as string | null,
  simulationDuration: 1.0,
  inputFrequency: 1000,
  inputAmplitude: 1.0,
```

No new actions needed.

- [ ] **Step 2: Run all tests to confirm store change doesn't break anything**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 3: Rewrite `src/App.tsx`**

Replace the entire file with:

```tsx
// src/App.tsx
import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { AudioPipeline } from './audio/pipeline';
import { AudioControls } from './components/AudioControls';
import { ExamplesPanel } from './components/ExamplesPanel';
import { Inspector } from './components/Inspector';
import { PedalPanel } from './components/PedalPanel';
import { SchematicCanvas } from './components/SchematicCanvas';
import { StatusBar } from './components/StatusBar';
import { Toolbar } from './components/Toolbar';
import { WaveformDisplay } from './components/WaveformDisplay';
import type { SimulateRequest, SimulateResponse } from './lib/types';
import { useStore } from './store';
import { useState } from 'react';

export default function App() {
  const {
    nodes,
    edges,
    outputBuffer,
    volume,
    playing,
    simulationDuration,
    inputFrequency,
    inputAmplitude,
    setSimulationStatus,
    setOutputBuffer,
    setSimulationError,
    setPlaying,
    undo,
    redo,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      outputBuffer: s.outputBuffer,
      volume: s.volume,
      playing: s.playing,
      simulationDuration: s.simulationDuration,
      inputFrequency: s.inputFrequency,
      inputAmplitude: s.inputAmplitude,
      setSimulationStatus: s.setSimulationStatus,
      setOutputBuffer: s.setOutputBuffer,
      setSimulationError: s.setSimulationError,
      setPlaying: s.setPlaying,
      undo: s.undo,
      redo: s.redo,
    })),
  );

  const [showExamples, setShowExamples] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === 'z' && e.shiftKey) || e.key === 'y') {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  const workerRef = useRef<Worker | null>(null);
  const pipelineRef = useRef<AudioPipeline | null>(null);

  // Refs so callbacks read current values without stale closures
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./workers/simulation.worker.ts', import.meta.url),
      { type: 'module' },
    );
    workerRef.current.onmessage = (e: MessageEvent<SimulateResponse>) => {
      const msg = e.data;
      if (msg.type === 'result') {
        setSimulationStatus('idle');
        setOutputBuffer(msg.outputBuffer);
      } else {
        setSimulationStatus('error');
        setSimulationError(msg.message);
      }
    };
    workerRef.current.onerror = (e: ErrorEvent) => {
      setSimulationStatus('error');
      setSimulationError(e.message ?? 'Worker crashed');
    };
    return () => {
      workerRef.current?.terminate();
    };
  }, [setSimulationStatus, setOutputBuffer, setSimulationError]);

  // Initialize audio pipeline
  // biome-ignore lint/correctness/useExhaustiveDependencies: init runs once on mount
  useEffect(() => {
    const pipeline = new AudioPipeline();
    pipelineRef.current = pipeline;
    pipeline.init(volume);
    return () => {
      pipeline.destroy();
    };
  }, []);

  // Sync volume changes
  useEffect(() => {
    pipelineRef.current?.setVolume(volume);
  }, [volume]);

  // Play/stop output buffer when `playing` state changes
  useEffect(() => {
    if (playing && outputBuffer) {
      pipelineRef.current?.playBuffer(outputBuffer, () => setPlaying(false));
    } else {
      pipelineRef.current?.stopPlayback();
    }
  }, [playing, outputBuffer, setPlaying]);

  const handleSimulate = useCallback(() => {
    if (!workerRef.current) return;
    try {
      setSimulationStatus('running');
      const request: SimulateRequest = {
        type: 'simulate',
        nodes: nodesRef.current,
        edges: edgesRef.current,
        duration: simulationDuration,
        frequency: inputFrequency,
        amplitude: inputAmplitude,
      };
      workerRef.current.postMessage(request);
    } catch (err) {
      setSimulationStatus('error');
      setSimulationError(err instanceof Error ? err.message : String(err));
    }
  }, [
    setSimulationStatus,
    setSimulationError,
    simulationDuration,
    inputFrequency,
    inputAmplitude,
  ]);

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar
        onSimulate={handleSimulate}
        onToggleExamples={() => setShowExamples((v) => !v)}
        showExamples={showExamples}
      />

      <div className="flex flex-1 overflow-hidden">
        {showExamples && <ExamplesPanel />}
        <SchematicCanvas />

        <div className="w-52 bg-gray-900 border-l border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
          <PedalPanel />
          <Inspector />
          <div className="border-t border-gray-800" />
          <div className="p-3">
            <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              Waveform
            </div>
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
  );
}
```

- [ ] **Step 4: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/store/index.ts src/App.tsx
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/lukevers/code/solder && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If there are errors in `App.tsx`, check that `SimulateRequest` import is correct and all store selectors match `StoreState`.

- [ ] **Step 6: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/store/index.ts src/App.tsx && git commit -m "feat: add simulation params to store, refactor App.tsx to batch mode"
```

---

## Task 8: Toolbar + StatusBar UI

**Files:**
- Modify: `src/components/Toolbar.tsx`
- Modify: `src/components/StatusBar.tsx`

### Background

**Toolbar:** The Simulate button becomes a four-state button driven by `simulationStatus`, `outputBuffer`, and `playing`:
- No output yet: `▶ Simulate` (green) → calls `onSimulate`
- Simulating: `⏳ Simulating…` (disabled)
- Output ready, not playing: `▶ Play` (blue) → calls `setPlaying(true)`
- Playing: `⏹ Stop` (red) → calls `setPlaying(false)`

Add `outputBuffer`, `playing`, `setPlaying` to the Toolbar's `useShallow` selector.

**StatusBar:** When `outputBuffer !== null` and status is idle, show `● ready · {duration} s`. Update the right-hand label from `44100 Hz · 2048 samples/buffer` to `44100 Hz · ngspice WASM`.

---

- [ ] **Step 1: Update the Toolbar `useShallow` selector**

In `src/components/Toolbar.tsx`, the current `useStore(useShallow(...))` call ends with `setSimulationError: s.setSimulationError`. Extend the destructured variable list and selector object to add:

```ts
    outputBuffer: s.outputBuffer,
    playing: s.playing,
    setPlaying: s.setPlaying,
```

So the full list becomes:
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
    outputBuffer,
    playing,
    setPlaying,
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
      outputBuffer: s.outputBuffer,
      playing: s.playing,
      setPlaying: s.setPlaying,
    })),
  );
```

- [ ] **Step 2: Replace the Simulate button JSX in `Toolbar.tsx`**

Find the current Simulate button:

```tsx
        {/* Simulate */}
        <button
          type="button"
          onClick={onSimulate}
          disabled={simulationStatus === 'running'}
          className="bg-green-800 hover:bg-green-700 disabled:opacity-50 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
        >
          {simulationStatus === 'running' ? '⏳ Simulating…' : '▶ Simulate'}
        </button>
```

Replace with:

```tsx
        {/* Simulate / Play / Stop */}
        {simulationStatus === 'running' ? (
          <button
            type="button"
            disabled
            className="bg-green-800 disabled:opacity-50 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
          >
            ⏳ Simulating…
          </button>
        ) : outputBuffer && playing ? (
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="bg-red-800 hover:bg-red-700 border border-red-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
          >
            ⏹ Stop
          </button>
        ) : outputBuffer ? (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="bg-blue-800 hover:bg-blue-700 border border-blue-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
          >
            ▶ Play
          </button>
        ) : (
          <button
            type="button"
            onClick={onSimulate}
            className="bg-green-800 hover:bg-green-700 border border-green-700 text-white text-xs px-3 py-1 rounded font-mono font-bold transition-colors"
          >
            ▶ Simulate
          </button>
        )}
```

- [ ] **Step 3: Update `src/components/StatusBar.tsx`**

Replace the entire file:

```tsx
// src/components/StatusBar.tsx
import { useShallow } from 'zustand/react/shallow';
import { useStore } from '../store';

export function StatusBar() {
  const { nodes, simulationStatus, simulationError, outputBuffer, simulationDuration } =
    useStore(
      useShallow((s) => ({
        nodes: s.nodes,
        simulationStatus: s.simulationStatus,
        simulationError: s.simulationError,
        outputBuffer: s.outputBuffer,
        simulationDuration: s.simulationDuration,
      })),
    );

  const statusColor =
    simulationStatus === 'error'
      ? 'text-red-400'
      : simulationStatus === 'running'
        ? 'text-yellow-400'
        : 'text-green-400';

  const statusLabel =
    simulationStatus === 'error'
      ? `● error: ${simulationError ?? 'unknown'}`
      : simulationStatus === 'running'
        ? '● simulating…'
        : outputBuffer
          ? `● ready · ${simulationDuration.toFixed(1)} s`
          : '● ready';

  return (
    <div className="flex gap-4 px-3 py-1 bg-gray-900 border-t border-gray-800 text-xs font-mono text-gray-500 flex-shrink-0">
      <span className={statusColor}>{statusLabel}</span>
      <span>components: {nodes.length}</span>
      <span>ngspice · WASM</span>
      <div className="flex-1" />
      <span>44100 Hz</span>
    </div>
  );
}
```

- [ ] **Step 4: Run biome check**

```bash
cd /Users/lukevers/code/solder && pnpm biome check --write src/components/Toolbar.tsx src/components/StatusBar.tsx
```

- [ ] **Step 5: TypeScript check**

```bash
cd /Users/lukevers/code/solder && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 6: Run all tests**

```bash
cd /Users/lukevers/code/solder && pnpm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 7: Manual smoke test**

Start the dev server:
```bash
cd /Users/lukevers/code/solder && pnpm dev
```

Verify:
1. The default circuit (IN → OUT) shows `▶ Simulate` button (green)
2. Click Simulate → button becomes `⏳ Simulating…`, status bar shows `● simulating…`
3. When ngspice finishes (may take several seconds on first run due to WASM load), button becomes `▶ Play` (blue), status bar shows `● ready · 1.0 s`
4. Click Play → button becomes `⏹ Stop` (red), audio plays
5. Click Stop → button returns to `▶ Play`
6. When audio finishes naturally → button returns to `▶ Play`
7. Add an op-amp (U), simulate → netlist should include TL072 inline subcircuit

If step 3 shows an error in the status bar, open the browser DevTools console to see the worker error message.

- [ ] **Step 8: Commit**

```bash
cd /Users/lukevers/code/solder && git add src/components/Toolbar.tsx src/components/StatusBar.tsx && git commit -m "feat: add Simulate/Play/Stop button states and simulation duration to StatusBar"
```
