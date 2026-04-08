// src/test/examples.test.ts

import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../lib/examples/rat';
import { compileNetlist } from '../lib/netlist';

describe('EXAMPLES', () => {
  it('is non-empty', () => {
    expect(EXAMPLES.length).toBeGreaterThan(0);
  });

  for (const ex of EXAMPLES) {
    describe(`example: ${ex.name}`, () => {
      it('has required fields', () => {
        expect(ex.id).toBeTruthy();
        expect(typeof ex.id).toBe('string');
        expect(ex.name).toBeTruthy();
        expect(typeof ex.name).toBe('string');
        expect(typeof ex.description).toBe('string');
        expect(Array.isArray(ex.tags)).toBe(true);
        expect(Array.isArray(ex.nodes)).toBe(true);
        expect(Array.isArray(ex.edges)).toBe(true);
      });

      it('nodes include at least one audiin and one audiout', () => {
        const hasAudioIn = ex.nodes.some((n) => n.type === 'audiin');
        const hasAudioOut = ex.nodes.some((n) => n.type === 'audiout');
        expect(hasAudioIn).toBe(true);
        expect(hasAudioOut).toBe(true);
      });

      it('compiles to a valid netlist without throwing', () => {
        expect(() => compileNetlist(ex.nodes, ex.edges)).not.toThrow();
        const netlist = compileNetlist(ex.nodes, ex.edges);
        expect(typeof netlist).toBe('string');
        expect(netlist.length).toBeGreaterThan(0);
      });

      it('each edge source and target node IDs exist in the nodes array', () => {
        const nodeIds = new Set(ex.nodes.map((n) => n.id));
        for (const edge of ex.edges) {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        }
      });

      it('each edge has valid sourceHandle and targetHandle', () => {
        for (const edge of ex.edges) {
          expect(typeof edge.sourceHandle).toBe('string');
          expect(edge.sourceHandle!.length).toBeGreaterThan(0);
          expect(typeof edge.targetHandle).toBe('string');
          expect(edge.targetHandle!.length).toBeGreaterThan(0);
        }
      });
    });
  }
});
