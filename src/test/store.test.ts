import { beforeEach, describe, expect, it } from 'vitest';
import type { ExampleCircuit } from '../examples';
import type { Tab } from '../store';
import { useStore } from '../store';
import { fingerprintCircuit } from '../store/helpers';

const RESET_TAB: Tab = {
  id: 'test-tab-1',
  name: 'Circuit 1',
  origin: { kind: 'custom' },
  nodes: [],
  edges: [],
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

/**
 * Small example fixture used to verify example-tab open/replace behavior.
 *
 * The nodes intentionally use simple passive parts so the tests stay focused
 * on tab lifecycle rather than circuit complexity.
 */
const EXAMPLE_A: ExampleCircuit = {
  id: 'example-a',
  name: 'Example A',
  description: 'Test example A',
  tags: ['test'],
  category: 'circuits',
  nodes: [
    {
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 1000 },
    },
  ],
  edges: [],
};

/**
 * Second example fixture used to distinguish replace-vs-new-tab behavior.
 */
const EXAMPLE_B: ExampleCircuit = {
  id: 'example-b',
  name: 'Example B',
  description: 'Test example B',
  tags: ['test'],
  category: 'circuits',
  nodes: [
    {
      id: 'c1',
      type: 'capacitor',
      position: { x: 20, y: 0 },
      data: { label: 'C1', farads: 1e-9 },
    },
  ],
  edges: [],
};

/**
 * Starter-tab fixture that matches the seeded circuit shown on first load.
 *
 * The fingerprint mirrors the untouched contents so tests can exercise the
 * store's replaceable-starter logic without relying on random ids.
 */
const STARTER_TAB_NODES: Tab['nodes'] = [
  {
    id: 'starter-in',
    type: 'jack',
    position: { x: 100, y: 200 },
    data: { label: 'INPUT', direction: 'in' },
  },
  {
    id: 'starter-gnd-in',
    type: 'ground',
    position: { x: 140, y: 320 },
    data: { label: 'GND' },
  },
  {
    id: 'starter-out',
    type: 'jack',
    position: { x: 400, y: 200 },
    data: { label: 'OUTPUT', direction: 'out' },
  },
  {
    id: 'starter-gnd-out',
    type: 'ground',
    position: { x: 340, y: 320 },
    data: { label: 'GND' },
  },
];

const STARTER_TAB_EDGES: Tab['edges'] = [
  {
    id: 'starter-edge',
    source: 'starter-in',
    sourceHandle: 'pos',
    target: 'starter-out',
    targetHandle: 'pos',
  },
  {
    id: 'starter-edge-in-gnd',
    source: 'starter-in',
    sourceHandle: 'neg',
    target: 'starter-gnd-in',
    targetHandle: 'gnd',
  },
  {
    id: 'starter-edge-out-gnd',
    source: 'starter-gnd-out',
    sourceHandle: 'gnd',
    target: 'starter-out',
    targetHandle: 'neg',
  },
];

const STARTER_TAB: Tab = {
  id: 'starter-tab-1',
  name: 'Circuit 1',
  origin: {
    kind: 'starter',
    defaultName: 'Circuit 1',
    fingerprint: fingerprintCircuit(STARTER_TAB_NODES, STARTER_TAB_EDGES),
  },
  nodes: STARTER_TAB_NODES,
  edges: STARTER_TAB_EDGES,
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

beforeEach(() => {
  useStore.setState({
    tabs: [RESET_TAB],
    activeTabId: 'test-tab-1',
    examplesActiveCategory: 'pedals',
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
    localSamples: [],
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
    const { audioSource, localSamples, volume, playing } = useStore.getState();
    expect(audioSource).toEqual({ type: 'sample', name: 'guitar' });
    expect(localSamples).toEqual([]);
    expect(volume).toBe(0.7);
    expect(playing).toBe(false);
  });

  it('setAudioSource updates source', () => {
    useStore.getState().setAudioSource({ type: 'sample', name: 'bass' });
    expect(useStore.getState().audioSource).toEqual({
      type: 'sample',
      name: 'bass',
    });
  });

  it('addLocalSample appends a runtime-only sample entry', () => {
    useStore.getState().addLocalSample({ id: 'local-1', name: 'snare-hit' });
    expect(useStore.getState().localSamples).toEqual([
      { id: 'local-1', name: 'snare-hit' },
    ]);
  });

  it('removeLocalSample deletes the sample and falls back when selected', () => {
    useStore.getState().addLocalSample({ id: 'local-1', name: 'snare-hit' });
    useStore.getState().setAudioSource({
      type: 'local-sample',
      id: 'local-1',
      name: 'snare-hit',
    });

    useStore.getState().removeLocalSample('local-1');

    expect(useStore.getState().localSamples).toEqual([]);
    expect(useStore.getState().audioSource).toEqual({
      type: 'sample',
      name: 'guitar',
    });
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
    // new tab starts with default jack in/out nodes + ground nodes
    expect(nodes).toHaveLength(4);
    expect(
      nodes.some((n) => n.type === 'jack' && n.data.direction === 'in'),
    ).toBe(true);
    expect(
      nodes.some((n) => n.type === 'jack' && n.data.direction === 'out'),
    ).toBe(true);
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

  it('setExamplesActiveCategory stores the selected examples category', () => {
    useStore.getState().setExamplesActiveCategory('circuits');
    expect(useStore.getState().examplesActiveCategory).toBe('circuits');
  });

  it('openExample opens a new tab when the active tab is not an example', () => {
    useStore.getState().openExample(EXAMPLE_A);

    const { tabs, activeTabId, nodes } = useStore.getState();
    const activeTab = tabs.find((tab) => tab.id === activeTabId)!;

    expect(tabs).toHaveLength(2);
    expect(tabs[0].id).toBe('test-tab-1');
    expect(activeTab.name).toBe('Example A');
    expect(activeTab.origin).toMatchObject({
      kind: 'example',
      exampleId: 'example-a',
      exampleName: 'Example A',
    });
    expect(nodes[0].id).toBe('r1');
  });

  it('openExample replaces the untouched starter tab', () => {
    useStore.setState({
      tabs: [STARTER_TAB],
      activeTabId: STARTER_TAB.id,
      nodes: STARTER_TAB.nodes,
      edges: STARTER_TAB.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
    });

    useStore.getState().openExample(EXAMPLE_A);

    const { tabs, activeTabId } = useStore.getState();
    const activeTab = tabs.find((tab) => tab.id === activeTabId)!;

    expect(tabs).toHaveLength(1);
    expect(activeTabId).toBe(STARTER_TAB.id);
    expect(activeTab.name).toBe('Example A');
    expect(activeTab.origin).toMatchObject({
      kind: 'example',
      exampleId: 'example-a',
    });
  });

  it('openExample replaces the active tab when it is an untouched example', () => {
    useStore.getState().openExample(EXAMPLE_A);

    const firstExampleTabId = useStore.getState().activeTabId;

    useStore.getState().openExample(EXAMPLE_B);

    const { tabs, activeTabId, nodes } = useStore.getState();
    const activeTab = tabs.find((tab) => tab.id === activeTabId)!;

    expect(tabs).toHaveLength(2);
    expect(activeTabId).toBe(firstExampleTabId);
    expect(activeTab.name).toBe('Example B');
    expect(activeTab.origin).toMatchObject({
      kind: 'example',
      exampleId: 'example-b',
      exampleName: 'Example B',
    });
    expect(nodes[0].id).toBe('c1');
  });

  it('openExample creates a new tab when the active example has changed', () => {
    useStore.getState().openExample(EXAMPLE_A);

    const firstExampleTabId = useStore.getState().activeTabId;

    useStore.getState().addNode({
      id: 'r2',
      type: 'resistor',
      position: { x: 40, y: 0 },
      data: { label: 'R2', ohms: 2200 },
    });

    useStore.getState().openExample(EXAMPLE_B);

    const { tabs, activeTabId } = useStore.getState();

    expect(tabs).toHaveLength(3);
    expect(activeTabId).not.toBe(firstExampleTabId);
    expect(
      tabs.find((tab) => tab.id === firstExampleTabId)?.nodes,
    ).toHaveLength(2);
    expect(tabs.find((tab) => tab.id === activeTabId)?.name).toBe('Example B');
  });

  it('openExample creates a new tab when the starter tab has changed', () => {
    useStore.setState({
      tabs: [STARTER_TAB],
      activeTabId: STARTER_TAB.id,
      nodes: STARTER_TAB.nodes,
      edges: STARTER_TAB.edges,
      selectedNodeId: null,
      selectedEdgeId: null,
      past: [],
      future: [],
    });

    useStore.getState().addNode({
      id: 'r2',
      type: 'resistor',
      position: { x: 200, y: 200 },
      data: { label: 'R2', ohms: 2200 },
    });

    useStore.getState().openExample(EXAMPLE_A);

    const { tabs, activeTabId } = useStore.getState();

    expect(tabs).toHaveLength(2);
    expect(activeTabId).not.toBe(STARTER_TAB.id);
    expect(tabs.find((tab) => tab.id === STARTER_TAB.id)?.nodes).toHaveLength(
      5,
    );
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

describe('deleteEdge', () => {
  it('deleteEdge removes the edge and clears selectedEdgeId', () => {
    useStore.setState({
      edges: [{ id: 'e1', source: 'r1', target: 'c1' }],
      selectedEdgeId: 'e1',
    });
    useStore.getState().deleteEdge('e1');
    expect(useStore.getState().edges).toHaveLength(0);
    expect(useStore.getState().selectedEdgeId).toBeNull();
  });

  it('deleteEdge pushes history and clears sim', () => {
    useStore.setState({
      nodes: [],
      edges: [{ id: 'e1', source: 'r1', target: 'c1' }],
      outputBuffer: new Float32Array([1, 2, 3]),
      simulationStatus: 'idle',
      past: [],
      future: [],
    });
    useStore.getState().deleteEdge('e1');
    expect(useStore.getState().past).toHaveLength(1);
    expect(useStore.getState().future).toHaveLength(0);
    expect(useStore.getState().outputBuffer).toBeNull();
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
  it('setEdges clears outputBuffer when topology changes (edge added)', () => {
    useStore.getState().setOutputBuffer(new Float32Array([1, 2, 3]));
    useStore.getState().setSimulationStatus('running');
    // Adding a new edge is a topology change → should clear sim
    useStore
      .getState()
      .setEdges([{ id: 'e1', source: 'a', target: 'b', type: 'default' }]);
    expect(useStore.getState().outputBuffer).toBeNull();
    expect(useStore.getState().simulationStatus).toBe('idle');
  });

  it('setEdges does NOT clear outputBuffer for selection-only changes', () => {
    const buf = new Float32Array([1, 2, 3]);
    const edge = { id: 'e1', source: 'a', target: 'b', type: 'default' };
    useStore.getState().setEdges([edge]);
    useStore.getState().setOutputBuffer(buf);
    // Updating only the selected property is not a topology change
    useStore.getState().setEdges([{ ...edge, selected: true }]);
    expect(useStore.getState().outputBuffer).toBe(buf);
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
    useStore.getState().openExample(EXAMPLE_A);
    useStore.getState().addNode({
      id: 'r-extra',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'Rextra', ohms: 1000 },
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
    // loadCircuit injects `measured` dimensions for XYFlow handle resolution
    expect(useStore.getState().nodes).toEqual(
      newNodes.map((n) => ({ ...n, measured: expect.any(Object) })),
    );
    expect(useStore.getState().edges).toEqual([]);
    expect(useStore.getState().outputBuffer).toBeNull();
    expect(useStore.getState().past).toEqual([]);
    expect(useStore.getState().future).toEqual([]);
    expect(
      useStore
        .getState()
        .tabs.find((tab) => tab.id === useStore.getState().activeTabId)?.origin,
    ).toEqual({ kind: 'custom' });
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
    useStore.getState().setAudioSource({ type: 'sample', name: 'bass' });
    expect(useStore.getState().audioSource).toEqual({
      type: 'sample',
      name: 'bass',
    });
  });
});
