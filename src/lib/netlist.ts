// src/lib/netlist.ts
import type { Edge } from '@xyflow/react';
import { LM741_SUBCKT, TL072_SUBCKT } from './spice-models';
import type { ComponentNode } from './types';

const SAMPLE_RATE = 44100;

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
  node: string,
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
  return `Vin ${node} 0 PWL(${pairs.join(' ')})`;
}

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

  // Merge power nodes with same label into the same net (KiCad-style power flags).
  // This lets users place multiple VCC/V+ symbols and they share one net automatically.
  const powerByLabel = new Map<string, Array<Port>>();
  for (const n of nodes) {
    if (n.type === 'power') {
      const port: Port = `${n.id}|pos`;
      const label = n.data.label;
      if (!powerByLabel.has(label)) powerByLabel.set(label, []);
      powerByLabel.get(label)!.push(port);
    }
  }
  for (const ports of powerByLabel.values()) {
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
  inputBuffer?: Float32Array,
  inputSampleRate = 44100,
): string {
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

  // Find input and output nodes
  const inputNode = nodes.find((n) => n.type === 'audiin');
  const outputNode = nodes.find((n) => n.type === 'audiout');

  if (!inputNode) throw new Error('Circuit has no input node');
  if (!outputNode) throw new Error('Circuit has no output node');

  const inputSpiceNode = getNode(inputNode.id, 'out');
  const outputSpiceNode = getNode(outputNode.id, 'in');

  // Input source: PWL from real audio if provided, otherwise SIN test tone
  if (inputBuffer && inputBuffer.length > 0) {
    lines.push(
      buildPwlSource(
        inputSpiceNode,
        inputBuffer,
        inputSampleRate,
        amplitude,
        duration,
      ),
    );
  } else {
    lines.push(`Vin ${inputSpiceNode} 0 SIN(0 ${amplitude} ${frequency})`);
  }

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
      const rLow = Math.max(node.data.ohms * (1 - node.data.position), 1);
      const rHigh = Math.max(node.data.ohms * node.data.position, 1);
      // Prefix R to guarantee resistor element regardless of label (e.g. "DIST" → "RDISTa")
      lines.push(
        `R${node.data.label}a ${nCcw} ${nWiper} ${formatResistance(rLow)}`,
      );
      lines.push(
        `R${node.data.label}b ${nWiper} ${nCw} ${formatResistance(rHigh)}`,
      );
    }
    // ground, audiin, audiout: no SPICE component line needed
  }

  // High-impedance probe at output: prevents degenerate floating-node circuits
  // and has negligible effect on real circuits
  lines.push(`Rprobe ${outputSpiceNode} 0 1000Meg`);

  // Save only the output voltage; without this ngspice may save all internal nodes
  lines.push(`.save V(${outputSpiceNode})`);

  // Transient analysis: step matches SPICE_SAMPLE_RATE; audio-convert.ts interpolates to SAMPLE_RATE
  const step = (1 / SPICE_SAMPLE_RATE).toExponential(6);
  const stop = duration.toExponential(6);
  lines.push(`.tran ${step} ${stop}`);

  lines.push('.end');

  return lines.join('\n');
}
