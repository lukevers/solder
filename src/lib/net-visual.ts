import type { Edge } from '@xyflow/react';
import { buildPortGroups } from './netlist';
import type { ComponentNode } from './types';

/**
 * Visual roles we assign to schematic nets.
 *
 * `rail` means the wire is on the same net as a power or ground symbol.
 * `biased` means the wire is not itself a rail, but it is DC-reachable from a
 * rail through resistive parts such as resistors and potentiometers.
 * `signal` means we do not currently have enough evidence to call the net a DC
 * rail or a biased net, so we treat it as an AC/signal-style wire.
 */
export const NET_VISUAL_ROLE = {
  rail: 'rail',
  biased: 'biased',
  signal: 'signal',
} as const;

/**
 * Union of all supported wire-visual roles.
 */
export type NetVisualRole =
  (typeof NET_VISUAL_ROLE)[keyof typeof NET_VISUAL_ROLE];

/**
 * Snapshot of the graph data needed to style wires consistently.
 *
 * `portToNode` maps each concrete handle port to its collapsed wire net.
 * `netRoles` maps each collapsed wire net to the UI role used for styling.
 */
export type NetVisualState = {
  portToNode: Map<string, string>;
  netRoles: Map<string, NetVisualRole>;
};

/**
 * Join a node ID and handle ID into the port key used by `buildPortGroups()`.
 */
function makePortId(nodeId: string, handleId: string): string {
  return `${nodeId}|${handleId}`;
}

/**
 * Look up the collapsed net ID for a concrete node handle.
 */
function getPortNet(
  portToNode: Map<string, string>,
  nodeId: string,
  handleId: string,
): string | null {
  return portToNode.get(makePortId(nodeId, handleId)) ?? null;
}

/**
 * Ensure the given net exists in the adjacency map.
 */
function ensureNet(
  adjacency: Map<string, Set<string>>,
  netId: string,
): Set<string> {
  let neighbors = adjacency.get(netId);

  if (!neighbors) {
    neighbors = new Set();
    adjacency.set(netId, neighbors);
  }

  return neighbors;
}

/**
 * Connect two collapsed nets in the DC-reachability graph.
 *
 * This graph is separate from the raw wire graph. It lets the UI answer
 * questions like "is this net DC-biased through a resistor?" without
 * pretending that both sides of the resistor are literally the same wire net.
 */
function connectNets(
  adjacency: Map<string, Set<string>>,
  left: string | null,
  right: string | null,
) {
  if (!left || !right || left === right) {
    return;
  }

  ensureNet(adjacency, left).add(right);
  ensureNet(adjacency, right).add(left);
}

/**
 * Add all pairwise DC-reachability edges for the given component nets.
 *
 * A potentiometer can bias between any two of its three terminals through the
 * resistive element, so we connect all distinct nets pairwise here.
 */
function connectAllNets(
  adjacency: Map<string, Set<string>>,
  nets: Array<string | null>,
) {
  for (let i = 0; i < nets.length; i++) {
    for (let j = i + 1; j < nets.length; j++) {
      connectNets(adjacency, nets[i], nets[j]);
    }
  }
}

/**
 * Collect nets that are direct rails because they contain a power or ground
 * symbol handle.
 */
function collectRailNets(
  nodes: Array<ComponentNode>,
  portToNode: Map<string, string>,
): Set<string> {
  const rails = new Set<string>();

  for (const node of nodes) {
    if (node.type === 'power') {
      const netId = getPortNet(portToNode, node.id, 'pos');

      if (netId) {
        rails.add(netId);
      }

      continue;
    }

    if (node.type === 'ground') {
      const netId = getPortNet(portToNode, node.id, 'gnd');

      if (netId) {
        rails.add(netId);
      }
    }
  }

  return rails;
}

/**
 * Build a graph of nets that are DC-reachable through resistive components.
 */
function buildDcReachability(
  nodes: Array<ComponentNode>,
  portToNode: Map<string, string>,
): Map<string, Set<string>> {
  const adjacency = new Map<string, Set<string>>();

  for (const node of nodes) {
    if (node.type === 'resistor') {
      connectAllNets(adjacency, [
        getPortNet(portToNode, node.id, 'a'),
        getPortNet(portToNode, node.id, 'b'),
      ]);

      continue;
    }

    if (node.type === 'pot') {
      connectAllNets(adjacency, [
        getPortNet(portToNode, node.id, 'ccw'),
        getPortNet(portToNode, node.id, 'wiper'),
        getPortNet(portToNode, node.id, 'cw'),
      ]);
    }
  }

  return adjacency;
}

/**
 * Flood outward from true rails across the resistive DC-reachability graph.
 *
 * Nets visited during this walk are treated as `biased`: they are not rails
 * themselves, but they plausibly carry a DC operating point set by the power
 * supply through resistive parts.
 */
function collectBiasedNets(
  railNets: Set<string>,
  adjacency: Map<string, Set<string>>,
): Set<string> {
  const biased = new Set<string>();
  const visited = new Set<string>(railNets);
  const queue = Array.from(railNets);

  while (queue.length > 0) {
    const netId = queue.shift()!;

    for (const neighbor of adjacency.get(netId) ?? []) {
      if (visited.has(neighbor)) {
        continue;
      }

      visited.add(neighbor);
      biased.add(neighbor);
      queue.push(neighbor);
    }
  }

  return biased;
}

/**
 * Compute wire-visual roles for the whole circuit.
 *
 * The result is net-based rather than edge-endpoint-based, which means a wire
 * keeps the same visual role as it passes through labels and junctions.
 */
export function buildNetVisualState(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
): NetVisualState {
  const portToNode = buildPortGroups(nodes, edges);
  const netRoles = new Map<string, NetVisualRole>();
  const railNets = collectRailNets(nodes, portToNode);
  const dcReachability = buildDcReachability(nodes, portToNode);
  const biasedNets = collectBiasedNets(railNets, dcReachability);

  for (const netId of new Set(portToNode.values())) {
    if (railNets.has(netId)) {
      netRoles.set(netId, NET_VISUAL_ROLE.rail);
      continue;
    }

    if (biasedNets.has(netId)) {
      netRoles.set(netId, NET_VISUAL_ROLE.biased);
      continue;
    }

    netRoles.set(netId, NET_VISUAL_ROLE.signal);
  }

  return { portToNode, netRoles };
}

/**
 * Resolve the visual role for a specific edge.
 *
 * Every edge belongs to exactly one collapsed net as long as both handle IDs
 * are present. Missing handles fall back to `signal` so partially-constructed
 * edges do not crash the UI.
 */
export function getEdgeNetVisualRole(
  edge: Edge,
  state: NetVisualState,
): NetVisualRole {
  if (!edge.sourceHandle || !edge.targetHandle) {
    return NET_VISUAL_ROLE.signal;
  }

  const netId =
    state.portToNode.get(makePortId(edge.source, edge.sourceHandle)) ??
    state.portToNode.get(makePortId(edge.target, edge.targetHandle));

  if (!netId) {
    return NET_VISUAL_ROLE.signal;
  }

  return state.netRoles.get(netId) ?? NET_VISUAL_ROLE.signal;
}

/**
 * Convert a visual role to the short label shown in the inspector.
 */
export function formatNetVisualRole(role: NetVisualRole): string {
  switch (role) {
    case NET_VISUAL_ROLE.rail:
      return 'Rail';
    case NET_VISUAL_ROLE.biased:
      return 'Biased';
    case NET_VISUAL_ROLE.signal:
      return 'Signal';
  }
}
