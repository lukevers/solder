import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { Tab } from '../store';

const SAMPLE_TAB: Tab = {
  id: 'tab-1',
  name: 'My Circuit',
  nodes: [
    {
      id: 'n1',
      type: 'resistor',
      position: { x: 100, y: 100 },
      data: { label: 'R1', ohms: 10000 },
    },
  ],
  edges: [
    {
      id: 'e1',
      source: 'n1',
      sourceHandle: 'a',
      target: 'n2',
      targetHandle: 'b',
    } as Edge,
  ],
  selectedNodeId: null,
  past: [],
  future: [],
};

describe('exportCircuit', () => {
  it('returns valid JSON', () => {
    expect(() => JSON.parse(exportCircuit(SAMPLE_TAB))).not.toThrow();
  });

  it('includes version 1', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.version).toBe(1);
  });

  it('includes name from tab', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.name).toBe('My Circuit');
  });

  it('includes nodes and edges', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
  });
});

describe('importCircuit', () => {
  it('round-trips a tab', () => {
    const json = exportCircuit(SAMPLE_TAB);
    const result = importCircuit(json);
    expect(result.name).toBe('My Circuit');
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('n1');
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].id).toBe('e1');
  });

  it('throws on invalid JSON', () => {
    expect(() => importCircuit('not json')).toThrow('Invalid JSON file');
  });

  it('throws on non-object', () => {
    expect(() => importCircuit('42')).toThrow('expected an object');
  });

  it('throws when nodes missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ name: 'x', edges: [] })),
    ).toThrow('"nodes" array');
  });

  it('throws when edges missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ name: 'x', nodes: [] })),
    ).toThrow('"edges" array');
  });

  it('throws when name missing', () => {
    expect(() =>
      importCircuit(JSON.stringify({ nodes: [], edges: [] })),
    ).toThrow('"name" string');
  });

  it('returns name, nodes, edges on valid input', () => {
    const result = importCircuit(
      JSON.stringify({ version: 1, name: 'Test', nodes: [], edges: [] }),
    );
    expect(result).toEqual({ name: 'Test', nodes: [], edges: [] });
  });
});
