import type { Edge } from '@xyflow/react';
import { describe, expect, it } from 'vitest';
import {
  buildNetVisualState,
  getEdgeNetVisualRole,
  NET_VISUAL_ROLE,
} from '../lib/net-visual';
import type { ComponentNode } from '../lib/types';

/**
 * Look up an edge by ID and return its computed visual role.
 */
function edgeRole(
  nodes: Array<ComponentNode>,
  edges: Array<Edge>,
  edgeId: string,
) {
  const edge = edges.find((candidate) => candidate.id === edgeId);

  if (!edge) {
    throw new Error(`missing edge: ${edgeId}`);
  }

  return getEdgeNetVisualRole(edge, buildNetVisualState(nodes, edges));
}

describe('buildNetVisualState', () => {
  it('keeps a rail colour through junctions on the same net', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'vcc1',
        type: 'power',
        position: { x: 0, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'j1',
        type: 'junction',
        position: { x: 80, y: 0 },
        data: { label: '' },
      },
      {
        id: 'out1',
        type: 'jack',
        position: { x: 160, y: 0 },
        data: { label: 'OUT', direction: 'out' },
      },
    ];

    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'vcc1',
        sourceHandle: 'pos',
        target: 'j1',
        targetHandle: 'tt',
      },
      {
        id: 'e2',
        source: 'j1',
        sourceHandle: 'sr',
        target: 'out1',
        targetHandle: 'pos',
      },
    ];

    expect(edgeRole(nodes, edges, 'e1')).toBe(NET_VISUAL_ROLE.rail);
    expect(edgeRole(nodes, edges, 'e2')).toBe(NET_VISUAL_ROLE.rail);
  });

  it('marks resistor-fed nets as biased instead of plain signal', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'vcc1',
        type: 'power',
        position: { x: 0, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 80, y: 0 },
        data: { label: 'R1', ohms: 100000 },
      },
      {
        id: 'j1',
        type: 'junction',
        position: { x: 160, y: 0 },
        data: { label: '' },
      },
      {
        id: 'out1',
        type: 'jack',
        position: { x: 240, y: 0 },
        data: { label: 'OUT', direction: 'out' },
      },
    ];

    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'vcc1',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'j1',
        targetHandle: 'tt',
      },
      {
        id: 'e3',
        source: 'j1',
        sourceHandle: 'sr',
        target: 'out1',
        targetHandle: 'pos',
      },
    ];

    expect(edgeRole(nodes, edges, 'e1')).toBe(NET_VISUAL_ROLE.rail);
    expect(edgeRole(nodes, edges, 'e2')).toBe(NET_VISUAL_ROLE.biased);
    expect(edgeRole(nodes, edges, 'e3')).toBe(NET_VISUAL_ROLE.biased);
  });

  it('treats capacitor-coupled nets after the cap as signal nets', () => {
    const nodes: Array<ComponentNode> = [
      {
        id: 'vcc1',
        type: 'power',
        position: { x: 0, y: 0 },
        data: { label: 'VCC', volts: 9 },
      },
      {
        id: 'r1',
        type: 'resistor',
        position: { x: 80, y: 0 },
        data: { label: 'R1', ohms: 100000 },
      },
      {
        id: 'j1',
        type: 'junction',
        position: { x: 160, y: 0 },
        data: { label: '' },
      },
      {
        id: 'c1',
        type: 'capacitor',
        position: { x: 240, y: 0 },
        data: { label: 'C1', farads: 47e-9 },
      },
      {
        id: 'out1',
        type: 'jack',
        position: { x: 320, y: 0 },
        data: { label: 'OUT', direction: 'out' },
      },
    ];

    const edges: Array<Edge> = [
      {
        id: 'e1',
        source: 'vcc1',
        sourceHandle: 'pos',
        target: 'r1',
        targetHandle: 'a',
      },
      {
        id: 'e2',
        source: 'r1',
        sourceHandle: 'b',
        target: 'j1',
        targetHandle: 'tt',
      },
      {
        id: 'e3',
        source: 'j1',
        sourceHandle: 'sr',
        target: 'c1',
        targetHandle: 'a',
      },
      {
        id: 'e4',
        source: 'c1',
        sourceHandle: 'b',
        target: 'out1',
        targetHandle: 'pos',
      },
    ];

    expect(edgeRole(nodes, edges, 'e3')).toBe(NET_VISUAL_ROLE.biased);
    expect(edgeRole(nodes, edges, 'e4')).toBe(NET_VISUAL_ROLE.signal);
  });
});
