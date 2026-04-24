import { describe, expect, it } from 'vitest';
import { EXAMPLES } from '../examples';
import { compileNetlist } from '../lib/netlist';

/**
 * Junction nodes expose these handle ids on every side.
 *
 * The renderer now mounts both `source` and `target` handles for each id so
 * saved example circuits no longer need to obey the older `s*`/`t*` direction
 * split. This set keeps the fixture test focused on valid junction handle ids
 * instead of an outdated direction convention.
 */
const JUNCTION_HANDLES = new Set([
  'st',
  'sr',
  'sb',
  'sl',
  'tt',
  'tr',
  'tb',
  'tl',
]);

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

      it('nodes include at least one input jack and one output jack', () => {
        const hasAudioIn = ex.nodes.some(
          (n) => n.type === 'jack' && n.data.direction === 'in',
        );
        const hasAudioOut = ex.nodes.some(
          (n) => n.type === 'jack' && n.data.direction === 'out',
        );
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

      it('junction edges reference valid junction handles', () => {
        const nodesById = new Map(ex.nodes.map((node) => [node.id, node]));

        for (const edge of ex.edges) {
          const sourceNode = nodesById.get(edge.source);
          const targetNode = nodesById.get(edge.target);

          if (sourceNode?.type === 'junction') {
            expect(JUNCTION_HANDLES.has(edge.sourceHandle ?? '')).toBe(true);
          }

          if (targetNode?.type === 'junction') {
            expect(JUNCTION_HANDLES.has(edge.targetHandle ?? '')).toBe(true);
          }
        }
      });
    });
  }
});
