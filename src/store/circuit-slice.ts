import type { ComponentNode } from '../lib/types';
import { TAB_ORIGIN_KIND } from './constants';
import { clearSim } from './defaults';
import { appendHistorySnapshot, ensureMeasured } from './helpers';
import type { StoreSlice, StoreState } from './types';

type CircuitSlice = Pick<
  StoreState,
  | 'addNode'
  | 'deleteNode'
  | 'deleteEdge'
  | 'setNodes'
  | 'setEdges'
  | 'selectNode'
  | 'selectEdge'
  | 'updateNodeData'
  | 'rotateNode'
  | 'loadCircuit'
>;

/**
 * Node types that are purely visual and never participate in the compiled
 * netlist.
 *
 * These nodes should behave like layout metadata: users can add, delete, move,
 * and edit them without invalidating the last simulation result because they
 * do not change circuit connectivity or component values.
 */
const NON_SIMULATION_NODE_TYPES = new Set<ComponentNode['type']>([
  'box',
  'stickynote',
]);

/**
 * Returns whether a node contributes to the simulated circuit.
 *
 * The store uses this gate to decide whether an edit should clear derived
 * simulation output. Decorative annotations are excluded so cosmetic changes do
 * not force a re-run.
 */
function affectsSimulation(node: ComponentNode): boolean {
  return !NON_SIMULATION_NODE_TYPES.has(node.type);
}

/**
 * Circuit editing actions for the active workspace.
 *
 * These mutations own the rule that topology or component changes
 * invalidate simulation output, while pure layout changes such as
 * node movement should keep the last output intact.
 */
export const createCircuitSlice: StoreSlice<CircuitSlice> = (set) => ({
  addNode: (node) =>
    set((state) => ({
      ...appendHistorySnapshot(state),
      nodes: [...state.nodes, node],
      ...(affectsSimulation(node) ? clearSim : {}),
    })),

  deleteNode: (id) =>
    set((state) => {
      const deletedNode = state.nodes.find((node) => node.id === id);

      return {
        ...appendHistorySnapshot(state),
        nodes: state.nodes.filter((node) => node.id !== id),
        edges: state.edges.filter(
          (edge) => edge.source !== id && edge.target !== id,
        ),
        selectedNodeId:
          state.selectedNodeId === id ? null : state.selectedNodeId,
        ...(deletedNode && affectsSimulation(deletedNode) ? clearSim : {}),
      };
    }),

  deleteEdge: (id) =>
    set((state) => ({
      ...appendHistorySnapshot(state),
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: null,
      ...clearSim,
    })),

  setNodes: (nodes) =>
    set((state) => {
      const previousIds = new Set(
        state.nodes
          .filter((node) => affectsSimulation(node))
          .map((node) => node.id),
      );
      const nextIds = new Set(
        nodes.filter((node) => affectsSimulation(node)).map((node) => node.id),
      );
      const topologyChanged =
        previousIds.size !== nextIds.size ||
        [...nextIds].some((id) => !previousIds.has(id));

      return {
        ...(topologyChanged ? appendHistorySnapshot(state) : {}),
        nodes,
        ...(topologyChanged ? clearSim : {}),
      };
    }),

  setEdges: (edges) =>
    set((state) => {
      const previousIds = new Set(state.edges.map((edge) => edge.id));
      const nextIds = new Set(edges.map((edge) => edge.id));
      const topologyChanged =
        previousIds.size !== nextIds.size ||
        [...nextIds].some((id) => !previousIds.has(id)) ||
        edges.some((edge) => {
          const previousEdge = state.edges.find((item) => item.id === edge.id);

          return (
            previousEdge &&
            (previousEdge.source !== edge.source ||
              previousEdge.target !== edge.target ||
              previousEdge.sourceHandle !== edge.sourceHandle ||
              previousEdge.targetHandle !== edge.targetHandle)
          );
        });

      return {
        edges,
        ...(topologyChanged ? clearSim : {}),
      };
    }),

  selectNode: (selectedNodeId) => set({ selectedNodeId, selectedEdgeId: null }),

  selectEdge: (selectedEdgeId) => set({ selectedEdgeId, selectedNodeId: null }),

  updateNodeData: (id, data) =>
    set((state) => {
      const previousNode = state.nodes.find((node) => node.id === id);

      return {
        ...appendHistorySnapshot(state),
        nodes: state.nodes.map((node) =>
          node.id === id ? ({ ...node, data } as ComponentNode) : node,
        ),
        ...(previousNode && affectsSimulation(previousNode) ? clearSim : {}),
      };
    }),

  rotateNode: (id, rotation) =>
    set((state) => ({
      ...appendHistorySnapshot(state),
      nodes: state.nodes.map((node) =>
        node.id === id ? ({ ...node, rotation } as ComponentNode) : node,
      ),
    })),

  loadCircuit: (nodes, edges) =>
    set((state) => {
      const measuredNodes = ensureMeasured(nodes);
      const updatedTabs = state.tabs.map((tab) =>
        tab.id === state.activeTabId
          ? {
              ...tab,
              origin: { kind: TAB_ORIGIN_KIND.custom },
              nodes: measuredNodes,
              edges,
              selectedNodeId: null,
              past: [],
              future: [],
            }
          : tab,
      );

      return {
        nodes: measuredNodes,
        edges,
        selectedNodeId: null,
        past: [],
        future: [],
        tabs: updatedTabs,
        viewResetKey: state.viewResetKey + 1,
        ...clearSim,
      };
    }),
});
