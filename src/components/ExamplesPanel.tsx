// src/components/ExamplesPanel.tsx

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { EXAMPLES, type ExampleCategory } from '../lib/examples';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const GRID = 20;

function snapNodes(nodes: Array<ComponentNode>): Array<ComponentNode> {
  return nodes.map((n) => {
    // Junctions are 20×20 with handles at 10px offsets, so they need
    // half-grid precision to align their handles with the main grid.
    const g = n.type === 'junction' ? GRID / 2 : GRID;
    return {
      ...n,
      position: {
        x: Math.round(n.position.x / g) * g,
        y: Math.round(n.position.y / g) * g,
      },
    };
  });
}

const TABS: Array<{ id: ExampleCategory; label: string }> = [
  { id: 'pedals', label: 'Pedals' },
  { id: 'circuits', label: 'Circuits' },
];

export function ExamplesPanel() {
  const [activeTab, setActiveTab] = useState<ExampleCategory>('pedals');
  const { loadCircuit, renameTab, activeTabId } = useStore(
    useShallow((s) => ({
      loadCircuit: s.loadCircuit,
      renameTab: s.renameTab,
      activeTabId: s.activeTabId,
    })),
  );

  const filtered = EXAMPLES.filter((ex) => ex.category === activeTab);

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="px-3 py-2 border-b border-gray-800">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          Examples
        </span>
      </div>
      <div className="flex border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs font-mono py-2 transition-colors ${
              activeTab === tab.id
                ? 'text-gray-200 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2 p-3">
        {filtered.map((ex) => (
          <div
            key={ex.id}
            className="bg-gray-950 border border-gray-800 rounded p-3"
          >
            <div className="text-sm text-gray-200 font-mono font-bold mb-1">
              {ex.name}
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {ex.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded font-mono"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-xs text-gray-500 mb-3 leading-relaxed">
              {ex.description}
            </div>
            <button
              type="button"
              onClick={() => {
                loadCircuit(snapNodes(ex.nodes), ex.edges);
                renameTab(activeTabId, ex.name);
              }}
              className="w-full bg-blue-900 hover:bg-blue-800 border border-blue-700 text-blue-200 text-xs px-2 py-1.5 rounded font-mono transition-colors"
            >
              Load circuit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
