// src/lib/netlist.ts
import type { Edge } from '@xyflow/react';
import {
  BJT_2N3904,
  BJT_2N3906,
  BJT_AC128,
  JFET_2N5457,
  JFET_2N5460,
  JFET_J201,
  LM741_SUBCKT,
  MOSFET_BS170,
  MOSFET_IRF510,
  MOSFET_IRF9510,
  TL072_SUBCKT,
} from './spice-models';
import type { ComponentNode, PotTaper, WaveformType } from './types';

/**
 * Time-step rate used for SPICE transient analysis.
 * audio-convert.ts interpolates SPICE output back up to SAMPLE_RATE.
 * Nyquist of SPICE_SAMPLE_RATE/2 = 5 kHz — sufficient for most guitar effects.
 */
export const SPICE_SAMPLE_RATE = 10000;

/**
 * Builds a PWL (piecewise-linear) voltage source line by downsampling
 * inputBuffer from inputSampleRate to SPICE_SAMPLE_RATE.
 */
function buildPwlSource(
  nodePos: string,
  nodeNeg: string,
  inputBuffer: Float32Array,
  inputSampleRate: number,
  amplitude: number,
  duration: number,
): string {
  const numPoints = Math.round(duration * SPICE_SAMPLE_RATE) + 1;
  const ratio = inputSampleRate / SPICE_SAMPLE_RATE;
  const pairs: string[] = [];
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
  return `Vin ${nodePos} ${nodeNeg} PWL(${pairs.join(' ')})`;
}

/** All port handles for each component type */
const COMPONENT_HANDLES: Record<ComponentNode['type'], Array<string>> = {
  resistor: ['a', 'b'],
  capacitor: ['a', 'b'],
  opamp: ['in_pos', 'in_neg', 'out', 'vcc', 'gnd'],
  power: ['pos'],
  ground: ['gnd'],
  audiin: ['pos', 'neg'],
  audiout: ['pos', 'neg'],
  diode: ['a', 'k'],
  pot: ['ccw', 'wiper', 'cw'],
  cap_polar: ['pos', 'neg'],
  label: ['net'],
  bjt: ['b', 'c', 'e'],
  jfet: ['g', 'd', 's'],
  mosfet: ['g', 'd', 's'],
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

  // Merge power and label nodes with the same label into the same net
  // (KiCad-style global net labels / power flags). Users can place multiple
  // symbols and they share one net automatically without explicit wires.
  const globalByLabel = new Map<string, Array<Port>>();
  for (const n of nodes) {
    if (n.type === 'power') {
      const key = `pwr:${n.data.label}`;
      if (!globalByLabel.has(key)) globalByLabel.set(key, []);
      globalByLabel.get(key)!.push(`${n.id}|pos`);
    } else if (n.type === 'label') {
      const key = `lbl:${n.data.label}`;
      if (!globalByLabel.has(key)) globalByLabel.set(key, []);
      globalByLabel.get(key)!.push(`${n.id}|net`);
    }
  }
  for (const ports of globalByLabel.values()) {
    for (let i = 1; i < ports.length; i++) {
      if (!adj.has(ports[0])) adj.set(ports[0], new Set());
      if (!adj.has(ports[i])) adj.set(ports[i], new Set());
      adj.get(ports[0])!.add(ports[i]);
      adj.get(ports[i])!.add(ports[0]);
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

/** Format ohms as SPICE: 10000 → "10k", 1000000 → "1Meg", etc. */
export function formatResistance(ohms: number): string {
  if (ohms >= 1e6) return `${parseFloat((ohms / 1e6).toPrecision(10))}Meg`;
  if (ohms >= 1e3) return `${parseFloat((ohms / 1e3).toPrecision(10))}k`;
  return `${ohms}`;
}

/** Format farads as SPICE: 47e-9 → "47n", 100e-12 → "100p", etc. */
export function formatCapacitance(farads: number): string {
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

  // BJT model statements
  const usedBJTModels = new Set(
    nodes.filter((n) => n.type === 'bjt').map((n) => n.data.model),
  );
  if (usedBJTModels.has('2N3904')) lines.push(BJT_2N3904);
  if (usedBJTModels.has('2N3906')) lines.push(BJT_2N3906);
  if (usedBJTModels.has('AC128')) lines.push(BJT_AC128);

  // JFET model statements
  const usedJFETModels = new Set(
    nodes.filter((n) => n.type === 'jfet').map((n) => n.data.model),
  );
  if (usedJFETModels.has('2N5457')) lines.push(JFET_2N5457);
  if (usedJFETModels.has('J201')) lines.push(JFET_J201);
  if (usedJFETModels.has('2N5460')) lines.push(JFET_2N5460);

  // MOSFET model statements
  const usedMOSFETModels = new Set(
    nodes.filter((n) => n.type === 'mosfet').map((n) => n.data.model),
  );
  if (usedMOSFETModels.has('BS170')) lines.push(MOSFET_BS170);
  if (usedMOSFETModels.has('IRF510')) lines.push(MOSFET_IRF510);
  if (usedMOSFETModels.has('IRF9510')) lines.push(MOSFET_IRF9510);

  // Find input and output nodes
  const inputNode = nodes.find((n) => n.type === 'audiin');
  const outputNode = nodes.find((n) => n.type === 'audiout');

  if (!inputNode) throw new Error('Circuit has no input node');
  if (!outputNode) throw new Error('Circuit has no output node');

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
      lines.push(
        `X${node.data.label} ${inPos} ${inNeg} ${vcc} ${gnd} ${out} ${node.data.model}`,
      );
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
      const rLow = Math.max(node.data.ohms * (1 - effective), 1);
      const rHigh = Math.max(node.data.ohms * effective, 1);
      // Prefix R to guarantee resistor element regardless of label (e.g. "DIST" → "RDISTa")
      lines.push(
        `R${node.data.label}a ${nCcw} ${nWiper} ${formatResistance(rLow)}`,
      );
      lines.push(
        `R${node.data.label}b ${nWiper} ${nCw} ${formatResistance(rHigh)}`,
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
    // ground, audiin, audiout: no SPICE component line needed
  }

  // High-impedance probe at output: prevents degenerate floating-node circuits
  // and has negligible effect on real circuits
  lines.push(`Rprobe ${outputPos} ${outputNeg} 1000Meg`);

  return { lines, portToNode, inputPos, inputNeg, outputPos, outputNeg };
}

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

/** Builds a SPICE voltage source line for a given waveform type. */
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

  // Save all non-ground, non-unconnected node voltages
  const allNodes = [...new Set(portToNode.values())].filter(
    (n) => n !== '0' && n !== 'UNCONNECTED',
  );
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
    if (spiceNode === '0' || spiceNode === 'UNCONNECTED') continue;
    const [nodeId] = port.split('|');
    const component = nodes.find((n) => n.id === nodeId);
    if (!component) continue;
    // Skip types that don't contribute useful labels
    if (
      component.type === 'ground' ||
      component.type === 'audiin' ||
      component.type === 'audiout'
    )
      continue;
    const label = component.data.label;
    if (!nodeToLabels.has(spiceNode)) nodeToLabels.set(spiceNode, []);
    nodeToLabels.get(spiceNode)!.push(label);
  }

  const result = new Map<string, string>();
  for (const [spiceNode, labels] of nodeToLabels) {
    const unique = [...new Set(labels)];
    result.set(spiceNode, unique.slice(0, 3).join(' / '));
  }

  // Mark input/output nodes
  const inputNode = nodes.find((n) => n.type === 'audiin');
  const outputNode = nodes.find((n) => n.type === 'audiout');
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
