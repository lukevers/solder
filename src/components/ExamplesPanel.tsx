// src/components/ExamplesPanel.tsx

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { EXAMPLES, type ExampleCategory } from '../lib/examples';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const GRID = 10;

function snapNodes(nodes: Array<ComponentNode>): Array<ComponentNode> {
  return nodes.map((n) => {
    if (n.type === 'stickynote' || n.type === 'box') return n;
    return {
      ...n,
      position: {
        x: Math.round(n.position.x / GRID) * GRID,
        y: Math.round(n.position.y / GRID) * GRID,
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
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const { loadCircuit, renameTab, activeTabId } = useStore(
    useShallow((s) => ({
      loadCircuit: s.loadCircuit,
      renameTab: s.renameTab,
      activeTabId: s.activeTabId,
    })),
  );

  const categoryExamples = EXAMPLES.filter((ex) => ex.category === activeTab);

  const allTags = Array.from(
    new Set(categoryExamples.flatMap((ex) => ex.tags)),
  ).sort();

  const filtered =
    activeTags.size === 0
      ? categoryExamples
      : categoryExamples.filter((ex) => ex.tags.some((t) => activeTags.has(t)));

  const toggleTag = (tag: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col overflow-y-auto flex-shrink-0">
      <div className="flex border-b border-gray-800">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id);
              setActiveTags(new Set());
            }}
            className={`flex-1 text-xs font-mono py-2 transition-colors ${
              activeTab === tab.id
                ? 'text-gray-200 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-400 border-b-2 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-800">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-colors ${
                activeTags.has(tag)
                  ? 'bg-blue-900 text-blue-300 border border-blue-700'
                  : 'bg-gray-800 text-gray-500 border border-transparent hover:text-gray-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-col divide-y divide-gray-800">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => {
              loadCircuit(snapNodes(ex.nodes), ex.edges);
              renameTab(activeTabId, ex.name);
            }}
            className="text-left px-3 py-2.5 hover:bg-gray-800/50 transition-colors group"
          >
            <div className="text-sm text-gray-200 font-mono font-bold truncate">
              {ex.name}
            </div>
            <div className="text-xs text-gray-500 truncate mt-0.5">
              {ex.description}
            </div>
            <div className="text-[10px] text-gray-600 font-mono mt-1 truncate">
              {ex.tags.join(' \u00b7 ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
