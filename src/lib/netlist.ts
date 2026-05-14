/**
 * @docs docs/simulation.md
 *
 * Before editing this file: read `docs/simulation.md`. The eecircuit-engine
 * WASM is a trimmed ngspice build that does NOT support `POLY()`, the `1G`
 * suffix, or open circuits, and it requires `SharedArrayBuffer`. The doc
 * lists every workaround and the audiin/audiout grounding rule that this
 * compiler depends on.
 */
import type { Edge } from '@xyflow/react';
import {
  BJT_2N3904,
  BJT_2N3906,
  BJT_2N5088,
  BJT_2N5089,
  BJT_AC128,
  BJT_BC108,
  BJT_BC549,
  BJT_MPSA18,
  DIODE_1N34A,
  DIODE_1N270,
  DIODE_1N914,
  DIODE_1N4001,
  DIODE_1N4002,
  JFET_2N5457,
  JFET_2N5458,
  JFET_2N5460,
  JFET_J113,
  JFET_J201,
  JFET_MPF102,
  LM308_SUBCKT,
  LM741_SUBCKT,
  MOSFET_2N7000,
  MOSFET_BS170,
  MOSFET_IRF510,
  MOSFET_IRF9510,
  TL072_SUBCKT,
} from './models';
import { JACK_DIRECTION } from './models/components/jack/types';
import type { WaveformType } from './simulation-types';
import type { ComponentNode, PotTaper } from './types';

/**
 * Time-step rate used for SPICE transient analysis.
 *
 * `audio-convert.ts` interpolates SPICE output back up to `SAMPLE_RATE`.
 * Nyquist of SPICE_SAMPLE_RATE/2 = 5 kHz — sufficient for most guitar effects.
 */
export const SPICE_SAMPLE_RATE = 10000;

/**
 * Maximum PWL points in a single source.
 *
 * At SPICE_SAMPLE_RATE (10 kHz) this allows roughly 10 seconds of input audio.
 */
const MAX_PWL_POINTS = 100_001;

/**
 * Maximum number of time/value pairs we emit on a single SPICE continuation
 * line for PWL sources.
 *
 * Multi-second audio sources expand into tens of thousands of PWL breakpoints.
 * Emitting all of them on one line can exceed the parser's line length limit
 * and silently truncate the source after a few tenths of a second. We keep
 * each line short and rely on SPICE `+` continuations so the entire sample
 * survives parsing.
 */
const MAX_PWL_PAIRS_PER_LINE = 128;

/**
 * Maximum SPICE nodes to save in analysis mode.
 *
 * Limits memory usage when the circuit has many internal nodes. Only the first
 * 64 are captured.
 */
const MAX_ANALYSIS_NODES = 64;

/**
 * Convert a model or subcircuit object into the exact SPICE text to inline into
 * the netlist.
 */
function renderSpiceDefinition(definition: { toString(): string }): string {
  return definition.toString();
}

/**
 * Builds a PWL (piecewise-linear) voltage source line by downsampling
 * `inputBuffer` from `inputSampleRate` to `SPICE_SAMPLE_RATE`.
 */
function buildPwlSource(
  nodePos: string,
  nodeNeg: string,
  inputBuffer: Float32Array,
  inputSampleRate: number,
  amplitude: number,
  duration: number,
): string {
  const numPoints = Math.min(
    Math.round(duration * SPICE_SAMPLE_RATE) + 1,
    MAX_PWL_POINTS,
  );
  const ratio = inputSampleRate / SPICE_SAMPLE_RATE;
  const pairs: Array<string> = [];

  for (let i = 0; i < numPoints; i++) {
    const t = i / SPICE_SAMPLE_RATE;
    const srcIdx = i * ratio;
    const lo = Math.floor(srcIdx);
    const hi = Math.min(lo + 1, inputBuffer.length - 1);
    const frac = srcIdx - lo;
    const v =
      (inputBuffer[lo] ?? 0) * (1 - frac) + (inputBuffer[hi] ?? 0) * frac;
    pairs.push(`${t.toExponential(4)} ${(v * amplitude).toFixed(6)}`);
  }

  const lines = [`Vin ${nodePos} ${nodeNeg} PWL(`];

  for (let i = 0; i < pairs.length; i += MAX_PWL_PAIRS_PER_LINE) {
    const chunk = pairs.slice(i, i + MAX_PWL_PAIRS_PER_LINE).join(' ');
    const suffix = i + MAX_PWL_PAIRS_PER_LINE >= pairs.length ? ')' : '';
    lines.push(`+ ${chunk}${suffix}`);
  }

  return lines.join('\n');
}

/**
 * Maps each component type to its list of port handle IDs.
 *
 * The netlist compiler uses this to enumerate every connectable pin on every
 * node. Handle IDs must match the ones in the symbol library and the React
 * node renderers.
 */
const COMPONENT_HANDLES: Record<ComponentNode['type'], Array<string>> = {
  resistor: ['a', 'b'],
  capacitor: ['a', 'b'],
  opamp: ['in_pos', 'in_neg', 'out', 'vcc', 'gnd'],
  power: ['pos'],
  ground: ['gnd'],
  jack: ['pos', 'neg'],
  diode: ['a', 'k'],
  pot: ['ccw', 'wiper', 'cw'],
  cap_polar: ['pos', 'neg'],
  label: ['net'],
  junction: ['st', 'sr', 'sb', 'sl', 'tt', 'tr', 'tb', 'tl'],
  bjt: ['b', 'c', 'e'],
  jfet: ['g', 'd', 's'],
  mosfet: ['g', 'd', 's'],
  stickynote: [],
  box: [],
};

/**
 * Port identifier string.
 *
 * Format: "${nodeId}|${handleId}"
 *
 * Used as the key in adjacency maps to uniquely identify each connectable pin
 * in the circuit.
 */
type Port = string;

/**
 * Returns every port on every node in the circuit.
 *
 * Enumerates all handle IDs for each node using the COMPONENT_HANDLES lookup,
 * producing a flat array of Port strings.
 */
function allPorts(nodes: Array<ComponentNode>): Array<Port> {
  return nodes.flatMap((n) =>
    (COMPONENT_HANDLES[n.type] ?? []).map((h) => `${n.id}|${h}`),
  );
}

/**
 * Builds an undirected adjacency map from edges.
 *
 * Each port that appears as a source or target in an edge gets a set of its
 * directly-connected neighbors. This is the first step in merging connected
 * ports into shared SPICE net names.
 */
function buildAdjacency(edges: Array<Edge>): Map<Port, Set<Port>> {
  const adj = new Map<Port, Set<Port>>();
  const add = (p: Port) => {
    if (!adj.has(p)) {
      adj.set(p, new Set());
    }
  };
  for (const e of edges) {
    if (!e.sourceHandle || !e.targetHandle) {
      continue;
    }
    const src: Port = `${e.source}|${e.sourceHandle}`;
    const tgt: Port = `${e.target}|${e.targetHandle}`;
    add(src);
    add(tgt);
    adj.get(src)!.add(tgt);
    adj.get(tgt)!.add(src);
  }
  return adj;
}

/**
 * Breadth-first search that assigns a SPICE node name to every port reachable
 * from `start`.
 *
 * All ports in the same connected component end up with the same `nodeId` in
 * `portToNode`, which means they share one SPICE net.
 */
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
 *
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
    if (!adj.has(p)) {
      adj.set(p, new Set());
    }
  }

  // Merge power and label nodes with the same label into the same net
  // (KiCad-style global net labels / power flags).
  //
  // Users can place multiple symbols and they share one net automatically
  // without explicit wires.
  const globalByLabel = new Map<string, Array<Port>>();
  for (const n of nodes) {
    if (n.type === 'power') {
      const key = `pwr:${n.data.label}`;
      if (!globalByLabel.has(key)) {
        globalByLabel.set(key, []);
      }
      globalByLabel.get(key)!.push(`${n.id}|pos`);
    } else if (n.type === 'label') {
      const key = `lbl:${n.data.label}`;
      if (!globalByLabel.has(key)) {
        globalByLabel.set(key, []);
      }
      globalByLabel.get(key)!.push(`${n.id}|net`);
    }
  }
  for (const ports of globalByLabel.values()) {
    for (let i = 1; i < ports.length; i++) {
      if (!adj.has(ports[0])) {
        adj.set(ports[0], new Set());
      }

      if (!adj.has(ports[i])) {
        adj.set(ports[i], new Set());
      }

      adj.get(ports[0])!.add(ports[i]);
      adj.get(ports[i])!.add(ports[0]);
    }
  }

  // Junction nodes: all handles on the same junction share one net
  // (KiCad-style).
  for (const n of nodes) {
    if (n.type === 'junction') {
      const handles = COMPONENT_HANDLES.junction;
      const firstPort: Port = `${n.id}|${handles[0]}`;
      if (!adj.has(firstPort)) {
        adj.set(firstPort, new Set());
      }

      for (let i = 1; i < handles.length; i++) {
        const port: Port = `${n.id}|${handles[i]}`;
        if (!adj.has(port)) {
          adj.set(port, new Set());
        }

        adj.get(firstPort)!.add(port);
        adj.get(port)!.add(firstPort);
      }
    }
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

/**
 * Format an ohm value as a SPICE-compatible string.
 *
 *   10000   → "10k"
 *   1000000 → "1Meg"
 *   470     → "470"
 */
export function formatResistance(ohms: number): string {
  if (ohms >= 1e6) {
    return `${parseFloat((ohms / 1e6).toPrecision(10))}Meg`;
  }

  if (ohms >= 1e3) {
    return `${parseFloat((ohms / 1e3).toPrecision(10))}k`;
  }

  return `${ohms}`;
}

/**
 * Format a farad value as a SPICE-compatible string.
 *
 *   47e-9  → "47n"
 *   100e-12 → "100p"
 *   1e-6   → "1u"
 */
export function formatCapacitance(farads: number): string {
  if (farads >= 1e-3) {
    return `${parseFloat((farads * 1e3).toPrecision(10))}m`;
  }

  if (farads >= 1e-6) {
    return `${parseFloat((farads * 1e6).toPrecision(10))}u`;
  }

  if (farads >= 1e-9) {
    return `${parseFloat((farads * 1e9).toPrecision(10))}n`;
  }

  return `${parseFloat((farads * 1e12).toPrecision(10))}p`;
}

/**
 * Maps a linear wiper position (0–1) to an effective resistance ratio
 * based on the potentiometer taper curve.
 *
 * - **linear**: position maps directly (B taper)
 * - **log**: cubic curve — slow start, fast finish (A/audio taper).
 *   At 50% rotation ≈ 12.5% effective resistance.
 * - **antilog**: inverse cubic — fast start, slow finish (C/reverse audio taper).
 *   At 50% rotation ≈ 87.5% effective resistance.
 */
export function applyTaper(
  position: number,
  taper: PotTaper = 'linear',
): number {
  switch (taper) {
    case 'log':
      return position * position * position;
    case 'antilog':
      return 1 - (1 - position) * (1 - position) * (1 - position);
    default:
      return position;
  }
}

/**
 * Internal helper: builds the shared circuit body (models, components, probe)
 * used by both compileNetlist and compileAnalysisNetlist.
 */
function buildCircuitBody(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
): {
  lines: Array<string>;
  portToNode: Map<string, string>;
  inputPos: string;
  inputNeg: string;
  outputPos: string;
  outputNeg: string;
} {
  const portToNode = buildPortGroups(nodes, edges);

  const getNode = (nodeId: string, handle: string): string =>
    portToNode.get(`${nodeId}|${handle}`) ?? 'UNCONNECTED';

  const lines: Array<string> = ['* solder auto-generated netlist'];

  // Inline op-amp subcircuit definitions — only include models actually used
  const usedModels = new Set(
    nodes.filter((n) => n.type === 'opamp').map((n) => n.data.model),
  );
  if (usedModels.has('TL072')) {
    lines.push(renderSpiceDefinition(TL072_SUBCKT));
  }

  if (usedModels.has('LM741')) {
    lines.push(renderSpiceDefinition(LM741_SUBCKT));
  }

  if (usedModels.has('LM308')) {
    lines.push(renderSpiceDefinition(LM308_SUBCKT));
  }

  // Diode model statements — inline for standard models
  const usedDiodeModels = new Set(
    nodes.filter((n) => n.type === 'diode').map((n) => n.data.model),
  );

  if (usedDiodeModels.has('1N914')) {
    lines.push(renderSpiceDefinition(DIODE_1N914));
  }

  if (usedDiodeModels.has('1N4001')) {
    lines.push(renderSpiceDefinition(DIODE_1N4001));
  }

  if (usedDiodeModels.has('1N4002')) {
    lines.push(renderSpiceDefinition(DIODE_1N4002));
  }

  if (usedDiodeModels.has('1N270')) {
    lines.push(renderSpiceDefinition(DIODE_1N270));
  }

  if (usedDiodeModels.has('1N34A')) {
    lines.push(renderSpiceDefinition(DIODE_1N34A));
  }

  // BJT model statements
  const usedBJTModels = new Set(
    nodes.filter((n) => n.type === 'bjt').map((n) => n.data.model),
  );

  if (usedBJTModels.has('2N3904')) {
    lines.push(renderSpiceDefinition(BJT_2N3904));
  }

  if (usedBJTModels.has('2N3906')) {
    lines.push(renderSpiceDefinition(BJT_2N3906));
  }

  if (usedBJTModels.has('AC128')) {
    lines.push(renderSpiceDefinition(BJT_AC128));
  }

  if (usedBJTModels.has('2N5088')) {
    lines.push(renderSpiceDefinition(BJT_2N5088));
  }

  if (usedBJTModels.has('2N5089')) {
    lines.push(renderSpiceDefinition(BJT_2N5089));
  }

  if (usedBJTModels.has('BC108')) {
    lines.push(renderSpiceDefinition(BJT_BC108));
  }

  if (usedBJTModels.has('BC549')) {
    lines.push(renderSpiceDefinition(BJT_BC549));
  }

  if (usedBJTModels.has('MPSA18')) {
    lines.push(renderSpiceDefinition(BJT_MPSA18));
  }

  // JFET model statements
  const usedJFETModels = new Set(
    nodes.filter((n) => n.type === 'jfet').map((n) => n.data.model),
  );
  if (usedJFETModels.has('2N5457')) {
    lines.push(renderSpiceDefinition(JFET_2N5457));
  }
  if (usedJFETModels.has('2N5458')) {
    lines.push(renderSpiceDefinition(JFET_2N5458));
  }

  if (usedJFETModels.has('J201')) {
    lines.push(renderSpiceDefinition(JFET_J201));
  }

  if (usedJFETModels.has('J113')) {
    lines.push(renderSpiceDefinition(JFET_J113));
  }

  if (usedJFETModels.has('MPF102')) {
    lines.push(renderSpiceDefinition(JFET_MPF102));
  }

  if (usedJFETModels.has('2N5460')) {
    lines.push(renderSpiceDefinition(JFET_2N5460));
  }

  // MOSFET model statements
  const usedMOSFETModels = new Set(
    nodes.filter((n) => n.type === 'mosfet').map((n) => n.data.model),
  );

  if (usedMOSFETModels.has('BS170')) {
    lines.push(renderSpiceDefinition(MOSFET_BS170));
  }

  if (usedMOSFETModels.has('IRF510')) {
    lines.push(renderSpiceDefinition(MOSFET_IRF510));
  }

  if (usedMOSFETModels.has('IRF9510')) {
    lines.push(renderSpiceDefinition(MOSFET_IRF9510));
  }

  if (usedMOSFETModels.has('2N7000')) {
    lines.push(renderSpiceDefinition(MOSFET_2N7000));
  }

  // Find input and output jack nodes
  const inputNode = nodes.find(
    (n) => n.type === 'jack' && n.data.direction === JACK_DIRECTION.in,
  );
  const outputNode = nodes.find(
    (n) => n.type === 'jack' && n.data.direction === JACK_DIRECTION.out,
  );

  if (!inputNode) {
    throw new Error('Circuit has no input jack');
  }
  if (!outputNode) {
    throw new Error('Circuit has no output jack');
  }

  const inputPos = getNode(inputNode.id, 'pos');
  const inputNeg = getNode(inputNode.id, 'neg');
  const outputPos = getNode(outputNode.id, 'pos');
  const outputNeg = getNode(outputNode.id, 'neg');

  // Track emitted power sources to deduplicate (multiple VCC symbols = one source)
  const emittedPower = new Set<string>();

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
    } else if (node.type === 'cap_polar') {
      const nPos = getNode(node.id, 'pos');
      const nNeg = getNode(node.id, 'neg');
      lines.push(
        `${node.data.label} ${nPos} ${nNeg} ${formatCapacitance(node.data.farads)}`,
      );
    } else if (node.type === 'opamp') {
      const inPos = getNode(node.id, 'in_pos');
      const inNeg = getNode(node.id, 'in_neg');
      const out = getNode(node.id, 'out');
      const vcc = getNode(node.id, 'vcc');
      const gnd = getNode(node.id, 'gnd');
      if (node.data.model === 'LM308') {
        // LM308 exposes 7 ports matching physical DIP-8 pins 1,2,3,4,6,7,8.
        // Pins 1 (null_neg) and 8 (comp) get unique NC net names when unconnected
        // so they don't short together via the shared 'UNCONNECTED' fallback.
        const nullNeg =
          portToNode.get(`${node.id}|null_neg`) ?? `NC_${node.id}_1`;
        const comp = portToNode.get(`${node.id}|comp`) ?? `NC_${node.id}_8`;
        lines.push(
          `X${node.data.label} ${nullNeg} ${inNeg} ${inPos} ${gnd} ${out} ${vcc} ${comp} LM308`,
        );
      } else {
        lines.push(
          `X${node.data.label} ${inPos} ${inNeg} ${vcc} ${gnd} ${out} ${node.data.model}`,
        );
      }
    } else if (node.type === 'power') {
      if (!emittedPower.has(node.data.label)) {
        emittedPower.add(node.data.label);
        const pos = getNode(node.id, 'pos');
        lines.push(`V${node.data.label} ${pos} 0 DC ${node.data.volts}`);
      }
    } else if (node.type === 'diode') {
      const na = getNode(node.id, 'a');
      const nk = getNode(node.id, 'k');
      lines.push(`${node.data.label} ${na} ${nk} ${node.data.model}`);
    } else if (node.type === 'pot') {
      const nCcw = getNode(node.id, 'ccw');
      const nWiper = getNode(node.id, 'wiper');
      const nCw = getNode(node.id, 'cw');
      const effective = applyTaper(node.data.position, node.data.taper);
      const rCcwToWiper = Math.max(node.data.ohms * effective, 1);
      const rWiperToCw = Math.max(node.data.ohms * (1 - effective), 1);
      // Prefix R to guarantee resistor element regardless of label (e.g. "DIST" → "RDISTa")
      lines.push(
        `R${node.data.label}a ${nCcw} ${nWiper} ${formatResistance(rCcwToWiper)}`,
      );
      lines.push(
        `R${node.data.label}b ${nWiper} ${nCw} ${formatResistance(rWiperToCw)}`,
      );
    } else if (node.type === 'bjt') {
      const nc = getNode(node.id, 'c');
      const nb = getNode(node.id, 'b');
      const ne = getNode(node.id, 'e');
      // Prefix Q to guarantee BJT element regardless of label
      lines.push(`Q${node.data.label} ${nc} ${nb} ${ne} ${node.data.model}`);
    } else if (node.type === 'jfet') {
      const nd = getNode(node.id, 'd');
      const ng = getNode(node.id, 'g');
      const ns = getNode(node.id, 's');
      // Prefix J to guarantee JFET element
      lines.push(`J${node.data.label} ${nd} ${ng} ${ns} ${node.data.model}`);
    } else if (node.type === 'mosfet') {
      const nd = getNode(node.id, 'd');
      const ng = getNode(node.id, 'g');
      const ns = getNode(node.id, 's');
      // Prefix M; bulk tied to source for discrete MOSFETs
      lines.push(
        `M${node.data.label} ${nd} ${ng} ${ns} ${ns} ${node.data.model}`,
      );
    }
    // ground, jack: no SPICE component line needed
  }

  // High-impedance probe at output: prevents degenerate floating-node circuits
  // and has negligible effect on real circuits
  lines.push(`Rprobe ${outputPos} ${outputNeg} 1000Meg`);

  return { lines, portToNode, inputPos, inputNeg, outputPos, outputNeg };
}

/**
 * Compile a circuit graph into a SPICE netlist for audio simulation.
 *
 * High-level flow:
 *   1. Build shared circuit body (models + component lines + probe)
 *   2. Add input source (PWL from audio buffer, or SIN test tone if no buffer)
 *   3. Add .save for output node only
 *   4. Add .tran transient analysis command
 *
 * The resulting netlist string is ready to be passed to EECircuitEngine.run().
 */
export function compileNetlist(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
  duration = 1.0,
  frequency = 1000,
  amplitude = 1.0,
  inputBuffer?: Float32Array,
  inputSampleRate = 44100,
): string {
  const { lines, inputPos, inputNeg, outputPos } = buildCircuitBody(
    nodes,
    edges,
  );

  // Input source: PWL from real audio if provided, otherwise SIN test tone
  if (inputBuffer && inputBuffer.length > 0) {
    lines.push(
      buildPwlSource(
        inputPos,
        inputNeg,
        inputBuffer,
        inputSampleRate,
        amplitude,
        duration,
      ),
    );
  } else {
    lines.push(`Vin ${inputPos} ${inputNeg} SIN(0 ${amplitude} ${frequency})`);
  }

  // Save only the output voltage; without this ngspice may save all internal nodes
  lines.push(`.save V(${outputPos})`);

  // Transient analysis: step matches SPICE_SAMPLE_RATE; audio-convert.ts interpolates to SAMPLE_RATE
  const step = (1 / SPICE_SAMPLE_RATE).toExponential(6);
  const stop = duration.toExponential(6);
  lines.push(`.tran ${step} ${stop}`);
  lines.push('.end');

  return lines.join('\n');
}

/**
 * Build a SPICE voltage source line for a given waveform type.
 *
 * Maps each waveform shape to the appropriate ngspice source directive:
 *
 *   sine     → SIN()
 *   square   → PULSE() with fast rise/fall
 *   triangle → PULSE() with symmetric ramps
 *   sawtooth → PULSE() with one-sided ramp
 */
function buildWaveformSource(
  nodePos: string,
  nodeNeg: string,
  waveform: WaveformType,
  frequency: number,
  amplitude: number,
): string {
  const period = 1 / frequency;
  switch (waveform) {
    case 'square':
      return `Vin ${nodePos} ${nodeNeg} PULSE(${-amplitude} ${amplitude} 0 1n 1n ${period / 2} ${period})`;
    case 'triangle':
      return `Vin ${nodePos} ${nodeNeg} PULSE(${-amplitude} ${amplitude} 0 ${period / 2} ${period / 2} 1n ${period})`;
    case 'sawtooth':
      return `Vin ${nodePos} ${nodeNeg} PULSE(${-amplitude} ${amplitude} 0 ${period} 1n 1n ${period})`;
    default:
      return `Vin ${nodePos} ${nodeNeg} SIN(0 ${amplitude} ${frequency})`;
  }
}

/**
 * Compiles a circuit for analysis: saves ALL node voltages and uses a
 * configurable test waveform instead of audio input.
 */
export function compileAnalysisNetlist(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
  duration: number,
  frequency: number,
  amplitude: number,
  waveform: WaveformType,
): { netlist: string; nodeNames: Array<string> } {
  const { lines, portToNode, inputPos, inputNeg } = buildCircuitBody(
    nodes,
    edges,
  );

  // Configurable waveform source
  lines.push(
    buildWaveformSource(inputPos, inputNeg, waveform, frequency, amplitude),
  );

  // Save all non-ground, non-unconnected node voltages (capped to limit memory)
  const allNodes = [...new Set(portToNode.values())]
    .filter((n) => n !== '0' && n !== 'UNCONNECTED')
    .slice(0, MAX_ANALYSIS_NODES);
  if (allNodes.length > 0) {
    lines.push(`.save ${allNodes.map((n) => `V(${n})`).join(' ')}`);
  }

  const step = (1 / SPICE_SAMPLE_RATE).toExponential(6);
  const stop = duration.toExponential(6);
  lines.push(`.tran ${step} ${stop}`);
  lines.push('.end');

  return { netlist: lines.join('\n'), nodeNames: allNodes };
}

/**
 * Returns human-readable labels for each SPICE node by listing the component
 * ports connected to it. Also flags input/output nodes.
 */
export function getNodeLabels(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
): Map<string, string> {
  const portToNode = buildPortGroups(nodes, edges);
  const nodeToLabels = new Map<string, Array<string>>();

  for (const [port, spiceNode] of portToNode) {
    if (spiceNode === '0' || spiceNode === 'UNCONNECTED') {
      continue;
    }

    const [nodeId] = port.split('|');
    const component = nodes.find((n) => n.id === nodeId);
    if (!component) {
      continue;
    }

    // Skip types that don't contribute useful labels
    if (component.type === 'ground' || component.type === 'jack') {
      continue;
    }

    const label = component.data.label;
    if (!nodeToLabels.has(spiceNode)) {
      nodeToLabels.set(spiceNode, []);
    }

    nodeToLabels.get(spiceNode)!.push(label);
  }

  const result = new Map<string, string>();
  for (const [spiceNode, labels] of nodeToLabels) {
    const unique = [...new Set(labels)];
    result.set(spiceNode, unique.slice(0, 3).join(' / '));
  }

  // Mark input/output nodes
  const inputNode = nodes.find(
    (n) => n.type === 'jack' && n.data.direction === JACK_DIRECTION.in,
  );

  const outputNode = nodes.find(
    (n) => n.type === 'jack' && n.data.direction === JACK_DIRECTION.out,
  );

  if (inputNode) {
    const pos = portToNode.get(`${inputNode.id}|pos`);
    if (pos && pos !== '0') {
      const existing = result.get(pos);
      result.set(pos, existing ? `${existing} [IN]` : 'Input');
    }
  }

  if (outputNode) {
    const pos = portToNode.get(`${outputNode.id}|pos`);
    if (pos && pos !== '0') {
      const existing = result.get(pos);
      result.set(pos, existing ? `${existing} [OUT]` : 'Output');
    }
  }

  return result;
}
