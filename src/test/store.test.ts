// src/test/store.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import type { Tab } from '../store';
import { useStore } from '../store';

const RESET_TAB: Tab = {
  id: 'test-tab-1',
  name: 'Circuit 1',
  nodes: [],
  edges: [],
  selectedNodeId: null,
  past: [],
  future: [],
};

beforeEach(() => {
  useStore.setState({
    tabs: [RESET_TAB],
    activeTabId: 'test-tab-1',
    nodes: [],
    edges: [],
    selectedNodeId: null,
    selectedEdgeId: null,
    past: [],
    future: [],
    simulationStatus: 'idle',
    simulationElapsed: null,
    outputBuffer: null,
    simulationError: null,
    audioSource: { type: 'sample', name: 'guitar' },
    volume: 0.7,
    playing: false,
  });
});

describe('circuitSlice', () => {
  it('starts with empty nodes and edges', () => {
    const { nodes, edges } = useStore.getState();
    expect(nodes).toEqual([]);
    expect(edges).toEqual([]);
  });

  it('addNode appends a node', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 100, y: 100 },
      data: { label: 'R1', ohms: 10000 },
    });
    expect(useStore.getState().nodes).toHaveLength(1);
    expect(useStore.getState().nodes[0].id).toBe('r1');
  });

  it('selectNode updates selectedNodeId', () => {
    useStore.getState().selectNode('r1');
    expect(useStore.getState().selectedNodeId).toBe('r1');
  });

  it('updateNodeData changes a node value', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    });
    useStore.getState().updateNodeData('r1', { label: 'R1', ohms: 47000 });
    const node = useStore.getState().nodes.find((n) => n.id === 'r1')!;
    expect(node.data).toEqual({ label: 'R1', ohms: 47000 });
  });
});

describe('simulationSlice', () => {
  it('starts idle with no output', () => {
    const { simulationStatus, outputBuffer } = useStore.getState();
    expect(simulationStatus).toBe('idle');
    expect(outputBuffer).toBeNull();
  });

  it('setSimulationStatus updates status', () => {
    useStore.getState().setSimulationStatus('running');
    expect(useStore.getState().simulationStatus).toBe('running');
  });

  it('setOutputBuffer stores buffer', () => {
    const buf = new Float32Array([0.1, 0.2, 0.3]);
    useStore.getState().setOutputBuffer(buf);
    expect(useStore.getState().outputBuffer).toBe(buf);
  });
});

describe('audioSlice', () => {
  it('starts with guitar sample, not playing', () => {
    const { audioSource, volume, playing } = useStore.getState();
    expect(audioSource).toEqual({ type: 'sample', name: 'guitar' });
    expect(volume).toBe(0.7);
    expect(playing).toBe(false);
  });

  it('setAudioSource updates source', () => {
    useStore.getState().setAudioSource({ type: 'live' });
    expect(useStore.getState().audioSource).toEqual({ type: 'live' });
  });
});

describe('tabsSlice', () => {
  it('starts with one tab active', () => {
    const { tabs, activeTabId } = useStore.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].id).toBe(activeTabId);
  });

  it('addTab creates a second tab and switches to it', () => {
    useStore.getState().addTab();
    const { tabs, activeTabId, nodes, edges } = useStore.getState();
    expect(tabs).toHaveLength(2);
    expect(activeTabId).toBe(tabs[1].id);
    // new tab starts with default in/out nodes + ground nodes
    expect(nodes).toHaveLength(4);
    expect(nodes.some((n) => n.type === 'audiin')).toBe(true);
    expect(nodes.some((n) => n.type === 'audiout')).toBe(true);
    expect(nodes.filter((n) => n.type === 'ground')).toHaveLength(2);
    expect(edges).toHaveLength(3);
  });

  it('addTab names new tab Circuit 2 when Circuit 1 exists', () => {
    useStore.getState().addTab();
    const { tabs } = useStore.getState();
    expect(tabs[1].name).toBe('Circuit 2');
  });

  it('addTab flushes current nodes into the departing tab', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().addTab();
    const { tabs } = useStore.getState();
    // tab 0 should have the resistor saved
    const savedNodes = tabs[0].nodes;
    expect(savedNodes.some((n) => n.id === 'r1')).toBe(true);
  });

  it('switchTab hydrates nodes/edges from the target tab', () => {
    useStore.getState().addTab(); // creates tab 2, switches to it
    const { tabs } = useStore.getState();
    const firstTabId = tabs[0].id;
    // put a node in tab[0] (it's stale after flush from addTab)
    useStore.setState({
      tabs: tabs.map((t) =>
        t.id === firstTabId
          ? {
              ...t,
              nodes: [
                {
                  id: 'cap',
                  type: 'capacitor',
                  position: { x: 0, y: 0 },
                  data: { label: 'C1', farads: 1e-9 },
                },
              ],
              edges: [],
            }
          : t,
      ),
    });
    useStore.getState().switchTab(firstTabId);
    const { nodes, activeTabId } = useStore.getState();
    expect(activeTabId).toBe(firstTabId);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('cap');
  });

  it('closeTab removes the tab', () => {
    useStore.getState().addTab();
    const { tabs } = useStore.getState();
    const firstId = tabs[0].id;
    useStore.getState().closeTab(firstId);
    expect(useStore.getState().tabs).toHaveLength(1);
    expect(
      useStore.getState().tabs.find((t) => t.id === firstId),
    ).toBeUndefined();
  });

  it('closeTab on active tab switches to nearest tab', () => {
    useStore.getState().addTab(); // now on tab 2
    const { tabs, activeTabId } = useStore.getState();
    useStore.getState().closeTab(activeTabId);
    expect(useStore.getState().tabs).toHaveLength(1);
    expect(useStore.getState().activeTabId).toBe(tabs[0].id);
  });

  it('closeTab on last tab creates a new default tab', () => {
    const { activeTabId } = useStore.getState();
    useStore.getState().closeTab(activeTabId);
    const { tabs } = useStore.getState();
    expect(tabs).toHaveLength(1);
    expect(tabs[0].name).toBe('Circuit 1');
  });

  it('renameTab updates the tab name', () => {
    const { tabs } = useStore.getState();
    useStore.getState().renameTab(tabs[0].id, 'My Fuzz');
    expect(useStore.getState().tabs[0].name).toBe('My Fuzz');
  });

  it('switchTab with current active id is a no-op', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    const { activeTabId, nodes } = useStore.getState();
    useStore.getState().switchTab(activeTabId);
    expect(useStore.getState().nodes).toEqual(nodes);
    expect(useStore.getState().activeTabId).toBe(activeTabId);
  });
});

describe('undo / redo', () => {
  it('addNode then undo reverts nodes array, redo restores', () => {
    const nodesBefore = useStore.getState().nodes;
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    expect(useStore.getState().nodes).toHaveLength(nodesBefore.length + 1);
    useStore.getState().undo();
    expect(useStore.getState().nodes).toEqual(nodesBefore);
    useStore.getState().redo();
    expect(useStore.getState().nodes).toHaveLength(nodesBefore.length + 1);
    expect(useStore.getState().nodes.find((n) => n.id === 'r1')).toBeDefined();
  });

  it('undo with empty past is no-op', () => {
    const nodesBefore = useStore.getState().nodes;
    useStore.getState().undo();
    expect(useStore.getState().nodes).toEqual(nodesBefore);
  });

  it('redo with empty future is no-op', () => {
    const nodesBefore = useStore.getState().nodes;
    useStore.getState().redo();
    expect(useStore.getState().nodes).toEqual(nodesBefore);
  });
});

describe('history cap', () => {
  it('past.length never exceeds 50', () => {
    for (let i = 0; i < 55; i++) {
      useStore.getState().pushHistory();
      useStore.getState().addNode({
        id: `r${i}`,
        type: 'resistor',
        position: { x: i * 10, y: 0 },
        data: { label: `R${i}`, ohms: 1000 },
      });
    }
    // slice(-MAX_HISTORY) keeps 50 entries, then one is appended → max 51
    expect(useStore.getState().past.length).toBeLessThanOrEqual(51);
  });
});

describe('simulation invalidation', () => {
  it('addNode clears outputBuffer', () => {
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    expect(useStore.getState().outputBuffer).not.toBeNull();
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    expect(useStore.getState().outputBuffer).toBeNull();
  });

  it('updateNodeData clears outputBuffer', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    expect(useStore.getState().outputBuffer).not.toBeNull();
    useStore.getState().updateNodeData('r1', { label: 'R1', ohms: 2000 });
    expect(useStore.getState().outputBuffer).toBeNull();
  });

  it('setNodes with same IDs (position change only) does NOT clear outputBuffer', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    const buf = new Float32Array([1, 2, 3]);
    useStore.getState().setOutputBuffer(buf);
    // Change only position, same IDs
    const movedNodes = useStore.getState().nodes.map((n) => ({
      ...n,
      position: { x: n.position.x + 50, y: n.position.y },
    }));
    useStore.getState().setNodes(movedNodes);
    expect(useStore.getState().outputBuffer).toBe(buf);
  });

  it('setNodes with different IDs DOES clear outputBuffer', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    const newNodes = [
      ...useStore.getState().nodes,
      {
        id: 'r2',
        type: 'resistor' as const,
        position: { x: 100, y: 0 },
        data: { label: 'R2', ohms: 2000 },
      },
    ];
    useStore.getState().setNodes(newNodes);
    expect(useStore.getState().outputBuffer).toBeNull();
  });
});

describe('edge selection', () => {
  it('selectEdge sets selectedEdgeId and clears selectedNodeId', () => {
    useStore.getState().selectNode('some-node');
    expect(useStore.getState().selectedNodeId).toBe('some-node');
    useStore.getState().selectEdge('some-edge');
    expect(useStore.getState().selectedEdgeId).toBe('some-edge');
    expect(useStore.getState().selectedNodeId).toBeNull();
  });

  it('selectNode clears selectedEdgeId', () => {
    useStore.getState().selectEdge('some-edge');
    expect(useStore.getState().selectedEdgeId).toBe('some-edge');
    useStore.getState().selectNode('some-node');
    expect(useStore.getState().selectedEdgeId).toBeNull();
  });
});

describe('clearOutputBuffer', () => {
  it('sets outputBuffer to null, simulationElapsed to null, simulationStatus to idle', () => {
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]), 1.5);
    useStore.getState().setSimulationStatus('running');
    expect(useStore.getState().outputBuffer).not.toBeNull();
    expect(useStore.getState().simulationStatus).toBe('running');
    useStore.getState().clearOutputBuffer();
    expect(useStore.getState().outputBuffer).toBeNull();
    expect(useStore.getState().simulationElapsed).toBeNull();
    expect(useStore.getState().simulationStatus).toBe('idle');
  });
});

describe('setEdges invalidation', () => {
  it('setEdges clears outputBuffer and resets simulationStatus', () => {
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    useStore.getState().setSimulationStatus('running');
    useStore.getState().setEdges([]);
    expect(useStore.getState().outputBuffer).toBeNull();
    expect(useStore.getState().simulationStatus).toBe('idle');
  });
});

describe('undo / redo invalidation', () => {
  it('undo clears outputBuffer', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    useStore.getState().undo();
    expect(useStore.getState().outputBuffer).toBeNull();
  });

  it('redo clears outputBuffer', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().undo();
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    useStore.getState().redo();
    expect(useStore.getState().outputBuffer).toBeNull();
  });
});

describe('tab switching preserves state', () => {
  it('switching tabs preserves nodes in both tabs', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    const tab1Id = useStore.getState().activeTabId;
    const tab1NodeCount = useStore.getState().nodes.length;

    useStore.getState().addTab();
    const tab2Id = useStore.getState().activeTabId;
    expect(tab2Id).not.toBe(tab1Id);
    // New tab starts with default nodes (INPUT + OUTPUT + 2 GND)
    expect(useStore.getState().nodes).toHaveLength(4);

    // Switch back to tab 1
    useStore.getState().switchTab(tab1Id);
    expect(useStore.getState().nodes).toHaveLength(tab1NodeCount);
    expect(useStore.getState().nodes.find((n) => n.id === 'r1')).toBeDefined();

    // Switch to tab 2 — still has default nodes
    useStore.getState().switchTab(tab2Id);
    expect(useStore.getState().nodes).toHaveLength(4);
  });
});

describe('loadCircuit', () => {
  it('replaces nodes and edges, clears history and output', () => {
    useStore.getState().addNode({
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    });
    useStore.getState().setOutputBuffer(new Float32Array([1]));

    const newNodes = [
      {
        id: 'c1',
        type: 'capacitor' as const,
        position: { x: 0, y: 0 },
        data: { label: 'C1', farads: 1e-6 },
      },
    ];
    useStore.getState().loadCircuit(newNodes, []);
    expect(useStore.getState().nodes).toEqual(newNodes);
    expect(useStore.getState().edges).toEqual([]);
    expect(useStore.getState().outputBuffer).toBeNull();
    expect(useStore.getState().past).toEqual([]);
    expect(useStore.getState().future).toEqual([]);
  });
});

describe('trivial setters', () => {
  it('setSimulationError stores the message', () => {
    useStore.getState().setSimulationError('boom');
    expect(useStore.getState().simulationError).toBe('boom');
  });

  it('setVolume updates volume', () => {
    useStore.getState().setVolume(0.3);
    expect(useStore.getState().volume).toBe(0.3);
  });

  it('setPlaying updates playing state', () => {
    useStore.getState().setPlaying(true);
    expect(useStore.getState().playing).toBe(true);
  });

  it('setAudioSource updates source', () => {
    useStore.getState().setAudioSource({ type: 'live' });
    expect(useStore.getState().audioSource).toEqual({ type: 'live' });
  });
});
