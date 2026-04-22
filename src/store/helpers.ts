import {
  DEFAULT_SYMBOL,
  resolveOpAmpSymbol,
  SYMBOLS,
} from '../lib/models/symbol-registry';
import type { ComponentNode } from '../lib/types';
import type { PersistedTab, StoreState, Tab } from './types';

/**
 * Inject `measured` dimensions onto nodes that lack them so XYFlow
 * can resolve handle positions on the first render.
 *
 * Loaded circuits arrive from JSON without DOM measurements. By
 * precomputing dimensions from the symbol registry we avoid the
 * initial "floating edge" frame before React Flow measures nodes.
 */
export function ensureMeasured(
  nodes: Array<ComponentNode>,
): Array<ComponentNode> {
  return nodes.map((node) => {
    if (node.measured?.width && node.measured?.height) {
      return node;
    }

    let width: number | undefined;
    let height: number | undefined;
    const model = (node.data as { model?: string }).model;

    switch (node.type) {
      case 'opamp': {
        const symbol = resolveOpAmpSymbol(model ?? 'TL072');
        width = symbol.width;
        height = symbol.height;
        break;
      }
      case 'diode': {
        const symbolId =
          (model && DEFAULT_SYMBOL.diode[model]) ??
          Object.values(DEFAULT_SYMBOL.diode)[0];
        const symbol = SYMBOLS[symbolId];

        if (symbol) {
          width = symbol.width;
          height = symbol.height;
        }
        break;
      }
      case 'resistor': {
        width = 80;
        height = 40;
        break;
      }
      case 'capacitor':
      case 'cap_polar': {
        width = 60;
        height = 40;
        break;
      }
      case 'pot': {
        width = 80;
        height = 60;
        break;
      }
      case 'junction': {
        width = 20;
        height = 20;
        break;
      }
      case 'jack': {
        width = 80;
        height = 60;
        break;
      }
      case 'ground': {
        width = 40;
        height = 36;
        break;
      }
      case 'power': {
        width = 40;
        height = 40;
        break;
      }
      case 'bjt':
      case 'jfet':
      case 'mosfet': {
        width = 60;
        height = 60;
        break;
      }
    }

    if (!width || !height) {
      return node;
    }

    const rotation = node.rotation ?? 0;
    const is90or270 = rotation === 90 || rotation === 270;

    return {
      ...node,
      measured: {
        width: is90or270 ? height : width,
        height: is90or270 ? width : height,
      },
    };
  });
}

/**
 * Copy the live workspace fields back into the active tab snapshot.
 *
 * The app keeps a flat active workspace at the root of the store for
 * ergonomics, while inactive tabs retain their own snapshots inside
 * `tabs[]`. Any tab-level operation has to flush the active workspace
 * first so no in-memory edits are lost.
 */
export function flushActive(state: StoreState): Array<Tab> {
  return state.tabs.map((tab) =>
    tab.id === state.activeTabId
      ? {
          ...tab,
          nodes: state.nodes,
          edges: state.edges,
          selectedNodeId: state.selectedNodeId,
          past: state.past,
          future: state.future,
          outputBuffer: state.outputBuffer,
          simulationStatus: state.simulationStatus,
          simulationError: state.simulationError,
          simulationElapsed: state.simulationElapsed,
          simulatedInput: state.simulatedInput,
          sweepNodeId: state.sweepNodeId,
          sweepStatus: state.sweepStatus,
          sweepResults: state.sweepResults,
          sweepError: state.sweepError,
          sweepPlayingIndex: state.sweepPlayingIndex,
        }
      : tab,
  );
}

/**
 * Project a tab snapshot's runtime simulation fields into the shape
 * expected by the root store's active workspace.
 *
 * Tab switching uses this helper to hydrate the active workspace from
 * the chosen tab without repeating the same property list in every
 * action.
 */
export function simStateFromTab(tab: Tab) {
  return {
    outputBuffer: tab.outputBuffer,
    simulationStatus: tab.simulationStatus,
    simulationError: tab.simulationError,
    simulationElapsed: tab.simulationElapsed,
    simulatedInput: tab.simulatedInput,
    sweepNodeId: tab.sweepNodeId,
    sweepStatus: tab.sweepStatus,
    sweepResults: tab.sweepResults,
    sweepError: tab.sweepError,
    sweepPlayingIndex: tab.sweepPlayingIndex,
  };
}

/**
 * Remove runtime-only simulation fields before writing a tab into the
 * persisted storage payload.
 *
 * Audio buffers and sweep traces can be large and are derived from
 * circuit state anyway, so persistence keeps only the structural tab
 * data and restores the runtime state to defaults on boot.
 */
export function stripTabRuntimeState(tab: Tab): PersistedTab {
  const {
    outputBuffer: _outputBuffer,
    simulationStatus: _simulationStatus,
    simulationError: _simulationError,
    simulationElapsed: _simulationElapsed,
    simulatedInput: _simulatedInput,
    sweepNodeId: _sweepNodeId,
    sweepStatus: _sweepStatus,
    sweepResults: _sweepResults,
    sweepError: _sweepError,
    sweepPlayingIndex: _sweepPlayingIndex,
    ...persistedTab
  } = tab;

  return persistedTab;
}
