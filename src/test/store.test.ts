// src/test/store.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useStore } from '../store';

const RESET_TAB = {
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
    past: [],
    future: [],
    simulationStatus: 'idle',
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
    // new tab starts with default in/out nodes
    expect(nodes).toHaveLength(2);
    expect(nodes.some((n) => n.type === 'audiin')).toBe(true);
    expect(nodes.some((n) => n.type === 'audiout')).toBe(true);
    expect(edges).toHaveLength(1);
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
});
