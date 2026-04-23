import type { ComponentNode } from '../lib/types';
import { clearSim, MAX_HISTORY } from './defaults';
import { ensureMeasured } from './helpers';
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
 * Circuit editing actions for the active workspace.
 *
 * These mutations own the rule that topology or component changes
 * invalidate simulation output, while pure layout changes such as
 * node movement should keep the last output intact.
 */
export const createCircuitSlice: StoreSlice<CircuitSlice> = (set) => ({
  addNode: (node) =>
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY),
        { nodes: state.nodes, edges: state.edges },
      ],
      future: [],
      nodes: [...state.nodes, node],
      ...clearSim,
    })),

  deleteNode: (id) =>
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY),
        { nodes: state.nodes, edges: state.edges },
      ],
      future: [],
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter(
        (edge) => edge.source !== id && edge.target !== id,
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      ...clearSim,
    })),

  deleteEdge: (id) =>
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY),
        { nodes: state.nodes, edges: state.edges },
      ],
      future: [],
      edges: state.edges.filter((edge) => edge.id !== id),
      selectedEdgeId: null,
      ...clearSim,
    })),

  setNodes: (nodes) =>
    set((state) => {
      const oldIds = new Set(state.nodes.map((node) => node.id));
      const topologyChanged =
        nodes.some((node) => !oldIds.has(node.id)) ||
        nodes.length !== state.nodes.length;

      return {
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
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY),
        { nodes: state.nodes, edges: state.edges },
      ],
      future: [],
      nodes: state.nodes.map((node) =>
        node.id === id ? ({ ...node, data } as ComponentNode) : node,
      ),
      ...clearSim,
    })),

  rotateNode: (id, rotation) =>
    set((state) => ({
      past: [
        ...state.past.slice(-MAX_HISTORY),
        { nodes: state.nodes, edges: state.edges },
      ],
      future: [],
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
              origin: { kind: 'custom' as const },
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
