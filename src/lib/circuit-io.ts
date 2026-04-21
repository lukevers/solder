import type { Edge } from '@xyflow/react';
import type { Tab } from '../store';
import type { ComponentNode } from './types';

/**
 * Exports a circuit as a JSON string.
 */
export function exportCircuit(tab: Tab): string {
  return JSON.stringify(
    { version: 1, name: tab.name, nodes: tab.nodes, edges: tab.edges },
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
