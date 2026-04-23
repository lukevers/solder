import { useState } from 'react';
import { EXAMPLE_CATEGORY, EXAMPLES, type ExampleCategory } from '../examples';
import type { ComponentNode } from '../lib/types';
import { useExamplesState, useTabActions } from '../store/hooks';

const GRID = 10;

function snapNodes(nodes: Array<ComponentNode>): Array<ComponentNode> {
  return nodes.map((n) => {
    if (n.type === 'stickynote' || n.type === 'box') {
      return n;
    }
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
  { id: EXAMPLE_CATEGORY.pedals, label: 'Pedals' },
  { id: EXAMPLE_CATEGORY.circuits, label: 'Circuits' },
];

export function ExamplesPanel() {
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const { examplesActiveCategory } = useExamplesState();
  const { openExample, setExamplesActiveCategory } = useTabActions();

  const categoryExamples = EXAMPLES.filter(
    (ex) => ex.category === examplesActiveCategory,
  );

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
      if (next.has(tag)) {
        next.delete(tag);
      } else {
        next.add(tag);
      }
      return next;
    });
  };

  return (
    <div className="flex w-64 flex-shrink-0 flex-col overflow-y-auto border-gray-800 border-r bg-gray-900">
      <div className="flex border-gray-800 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setExamplesActiveCategory(tab.id);
              setActiveTags(new Set());
            }}
            className={`flex-1 py-2 font-mono text-xs transition-colors ${
              examplesActiveCategory === tab.id
                ? 'border-blue-500 border-b-2 text-gray-200'
                : 'border-transparent border-b-2 text-gray-500 hover:text-gray-400'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 border-gray-800 border-b px-3 py-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                activeTags.has(tag)
                  ? 'border border-blue-700 bg-blue-900 text-blue-300'
                  : 'border border-transparent bg-gray-800 text-gray-500 hover:text-gray-400'
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
              openExample({
                ...ex,
                nodes: snapNodes(ex.nodes),
              });
            }}
            className="group px-3 py-2.5 text-left transition-colors hover:bg-gray-800/50"
          >
            <div className="truncate font-bold font-mono text-gray-200 text-sm">
              {ex.name}
            </div>
            <div className="mt-0.5 truncate text-gray-500 text-xs">
              {ex.description}
            </div>
            <div className="mt-1 truncate font-mono text-[10px] text-gray-600">
              {ex.tags.join(' \u00b7 ')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
