import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import { EXAMPLE_CATEGORY } from '../examples';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { Tab } from '../store';

const SAMPLE_TAB: Tab = {
  id: 'tab-1',
  name: 'My Circuit',
  description: 'Simple test circuit',
  tags: ['test', 'export'],
  category: EXAMPLE_CATEGORY.circuits,
  origin: { kind: 'custom' },
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
  outputBuffer: null,
  simulationStatus: 'idle',
  simulationError: null,
  simulationElapsed: null,
  simulatedInput: null,
  sweepNodeId: null,
  sweepStatus: 'idle',
  sweepResults: [],
  sweepError: null,
  sweepPlayingIndex: null,
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

  it('includes editable metadata from tab', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed).toMatchObject({
      description: 'Simple test circuit',
      tags: ['test', 'export'],
      category: EXAMPLE_CATEGORY.circuits,
    });
  });

  it('includes nodes and edges', () => {
    const parsed = JSON.parse(exportCircuit(SAMPLE_TAB));
    expect(parsed.nodes).toHaveLength(1);
    expect(parsed.edges).toHaveLength(1);
  });

  it('strips runtime-only node fields from exported JSON', () => {
    const boxTab: Tab = {
      ...SAMPLE_TAB,
      nodes: [
        {
          id: 'box-1',
          type: 'box',
          position: { x: 80, y: 120 },
          data: { label: 'gain stage', color: 'yellow', variant: 'outline' },
          style: { width: 240, height: 160 },
          measured: { width: 240, height: 160 },
          className: 'box-node-wrapper',
          dragHandle: '.box-drag-handle',
          zIndex: -1,
          selected: true,
        },
      ],
    };

    const parsed = JSON.parse(exportCircuit(boxTab));

    expect(parsed.nodes[0]).toEqual({
      id: 'box-1',
      type: 'box',
      position: { x: 80, y: 120 },
      data: { label: 'gain stage', color: 'yellow', variant: 'outline' },
      style: { width: 240, height: 160 },
    });
  });

  it('prefers live resized box dimensions over stale style defaults', () => {
    const resizedBoxTab: Tab = {
      ...SAMPLE_TAB,
      nodes: [
        {
          id: 'box-1',
          type: 'box',
          position: { x: 80, y: 120 },
          data: { label: 'gain stage', color: 'yellow', variant: 'outline' },
          style: { width: 200, height: 150 },
          measured: { width: 240, height: 160 },
          width: 240,
          height: 160,
        } as Tab['nodes'][number],
      ],
    };

    const parsed = JSON.parse(exportCircuit(resizedBoxTab));

    expect(parsed.nodes[0].style).toEqual({ width: 240, height: 160 });
  });

  it('strips transient edge fields from exported JSON', () => {
    const tabWithTransientEdge: Tab = {
      ...SAMPLE_TAB,
      edges: [
        {
          id: 'e1',
          source: 'n1',
          sourceHandle: 'a',
          target: 'n2',
          targetHandle: 'b',
          selected: true,
          zIndex: 2,
          reconnectable: true,
        } as Edge,
      ],
    };

    const parsed = JSON.parse(exportCircuit(tabWithTransientEdge));

    expect(parsed.edges[0]).toEqual({
      id: 'e1',
      source: 'n1',
      sourceHandle: 'a',
      target: 'n2',
      targetHandle: 'b',
    });
  });
});

describe('importCircuit', () => {
  it('round-trips a tab', () => {
    const json = exportCircuit(SAMPLE_TAB);
    const result = importCircuit(json);
    expect(result.metadata).toEqual({
      name: 'My Circuit',
      description: 'Simple test circuit',
      tags: ['test', 'export'],
      category: EXAMPLE_CATEGORY.circuits,
    });
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

  it('defaults missing metadata fields on valid input', () => {
    const result = importCircuit(
      JSON.stringify({ version: 1, name: 'Test', nodes: [], edges: [] }),
    );
    expect(result).toEqual({
      metadata: {
        name: 'Test',
        description: '',
        tags: [],
        category: EXAMPLE_CATEGORY.circuits,
      },
      nodes: [],
      edges: [],
    });
  });
});
