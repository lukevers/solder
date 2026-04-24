import type { Edge } from '@xyflow/react';
import type { Tab } from '../store';
import type { ComponentNode } from './types';

/**
 * Persisted edge fields that define schematic connectivity.
 *
 * Export intentionally omits every other edge property so future runtime-only
 * additions do not leak into saved circuit JSON.
 */
type SerializedEdge = Pick<
  Edge,
  'id' | 'source' | 'sourceHandle' | 'target' | 'targetHandle'
>;

/**
 * Persisted node shape used for exported circuit JSON.
 *
 * Export only emits these fields so runtime XYFlow metadata never becomes part
 * of the saved circuit format.
 */
type SerializedNode = Pick<ComponentNode, 'id' | 'type' | 'position' | 'data'> &
  Partial<Pick<ComponentNode, 'rotation'>> & {
    style?: { width?: number; height?: number };
  };

/**
 * Build the persisted JSON form for a node using an explicit allowlist.
 *
 * Position and component data define the schematic and are always preserved.
 * Rotation is persisted when present. Boxes also preserve width and height so a
 * resized annotation round-trips correctly, but no other style fields are
 * written.
 */
function serializeNode(node: ComponentNode): SerializedNode {
  const serialized: SerializedNode = {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
  };

  if (node.rotation !== undefined) {
    serialized.rotation = node.rotation;
  }

  if (node.type !== 'box' || !node.style) {
    if (node.type !== 'box') {
      return serialized;
    }
  }

  const runtimeWidth = 'width' in node ? node.width : undefined;
  const runtimeHeight = 'height' in node ? node.height : undefined;
  const styleWidth = node.type === 'box' ? node.style?.width : undefined;
  const styleHeight = node.type === 'box' ? node.style?.height : undefined;

  const width = runtimeWidth ?? styleWidth;
  const height = runtimeHeight ?? styleHeight;

  if (width === undefined && height === undefined) {
    return serialized;
  }

  serialized.style = { width, height };

  return serialized;
}

/**
 * Build the persisted JSON form for an edge using an explicit allowlist.
 *
 * Only connectivity-defining fields are written so runtime edge metadata stays
 * out of exported circuits.
 */
function serializeEdge(edge: Edge): SerializedEdge {
  return {
    id: edge.id,
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
  };
}

/**
 * Exports a circuit as a JSON string.
 */
export function exportCircuit(tab: Tab): string {
  return JSON.stringify(
    {
      version: 1,
      name: tab.name,
      nodes: tab.nodes.map(serializeNode),
      edges: tab.edges.map(serializeEdge),
    },
    null,
    2,
  );
}

/**
 * Imports a circuit from a JSON string, and does some basic validation on the
 * input.
 */
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
