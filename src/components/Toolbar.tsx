// src/components/Toolbar.tsx

import {
  Download,
  FolderOpen,
  Hourglass,
  Play,
  Plus,
  ScanLine,
  Square,
  Upload,
  X,
} from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useShallow } from 'zustand/react/shallow';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

function FlyoutButton({
  label,
  tooltip,
  active,
  items,
  onSelect,
}: {
  label: string;
  tooltip: string;
  active: boolean;
  items: Array<{ label: string }>;
  onSelect: (label: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left + r.width / 2 });
    }
    function onDown(e: MouseEvent) {
      if (
        !btnRef.current?.contains(e.target as Node) &&
        !flyRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  return (
    <div className="relative group flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`bg-gray-800 hover:bg-gray-700 border text-xs px-2 py-1 rounded font-mono transition-colors ${
          active || open
            ? 'border-blue-500 text-blue-300'
            : 'border-gray-700 text-gray-300'
        }`}
      >
        {label}
      </button>
      {!open && (
        <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
          {tooltip}
        </div>
      )}
      {open &&
        createPortal(
          <div
            ref={flyRef}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              zIndex: 9999,
              transform: 'translateX(-50%)',
            }}
            className="flex flex-col gap-1"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  onSelect(item.label);
                  setOpen(false);
                }}
                className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 text-xs px-2.5 py-1 rounded font-mono whitespace-nowrap transition-colors"
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

const PALETTE: Array<{
  label: string;
  tooltip: string;
  type: ComponentNode['type'];
  defaultData: ComponentNode['data'];
  unique?: boolean;
}> = [
  {
    label: 'V+',
    tooltip: 'Power Supply',
    type: 'power',
    defaultData: { label: 'VCC', volts: 9 },
  },
  {
    label: 'GND',
    tooltip: 'Ground',
    type: 'ground',
    defaultData: { label: 'GND' },
  },
  {
    label: 'R',
    tooltip: 'Resistor',
    type: 'resistor',
    defaultData: { label: 'R1', ohms: 10000 },
  },
  {
    label: 'C',
    tooltip: 'Capacitor',
    type: 'capacitor',
    defaultData: { label: 'C1', farads: 47e-9 },
  },
  {
    label: 'C+',
    tooltip: 'Polarized Capacitor',
    type: 'cap_polar',
    defaultData: { label: 'C1', farads: 1e-6 },
  },
  {
    label: 'POT',
    tooltip: 'Potentiometer',
    type: 'pot',
    defaultData: { label: 'VR1', ohms: 100000, position: 0.5, taper: 'linear' },
  },
  {
    label: 'D',
    tooltip: 'Diode',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N914' },
  },
  {
    label: 'U',
    tooltip: 'Op-Amp',
    type: 'opamp',
    defaultData: { label: 'U1', model: 'TL072' },
  },
  {
    label: 'NET',
    tooltip: 'Net Label',
    type: 'label',
    defaultData: { label: 'NET1' },
  },
];

type PaletteItem = (typeof PALETTE)[number];

const JACK_ITEMS: Array<{
  label: string;
  tooltip: string;
  type: ComponentNode['type'];
  defaultData: ComponentNode['data'];
}> = [
  {
    label: 'IN',
    tooltip: 'Audio Input Jack',
    type: 'jack',
    defaultData: { label: 'INPUT', direction: 'in' },
  },
  {
    label: 'OUT',
    tooltip: 'Audio Output Jack',
    type: 'jack',
    defaultData: { label: 'OUTPUT', direction: 'out' },
  },
];

const TRANSISTOR_ITEMS: Array<PaletteItem> = [
  {
    label: 'BJT',
    tooltip: 'BJT Transistor',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
  },
  {
    label: 'JFET',
    tooltip: 'JFET Transistor',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: '2N5457' },
  },
  {
    label: 'MOSFET',
    tooltip: 'MOSFET',
    type: 'mosfet',
    defaultData: { label: 'M1', polarity: 'N', model: 'BS170' },
  },
];

type ToolbarProps = {
  onSimulate: () => void;
  onToggleExamples: () => void;
  showExamples: boolean;
  onPlayOriginal: () => void;
  onPlayOutput: () => void;
  onStop: () => void;
  playingOriginal: boolean;
  hasSourceBuffer: boolean;
  onToggleAnalyzer: () => void;
  showAnalyzer: boolean;
};

export function Toolbar({
  onSimulate,
  onToggleExamples,
  showExamples,
  onPlayOriginal,
  onPlayOutput,
  onStop,
  playingOriginal,
  hasSourceBuffer,
  onToggleAnalyzer,
  showAnalyzer,
}: ToolbarProps) {
  const {
    addNode,
    simulationStatus,
    sweepStatus,
    tabs,
    activeTabId,
    nodes,
    edges,
    addTab,
    closeTab,
    switchTab,
    renameTab,
    loadCircuit,
    setSimulationError,
    outputBuffer,
    playing,
  } = useStore(
    useShallow((s) => ({
      addNode: s.addNode,
      simulationStatus: s.simulationStatus,
      sweepStatus: s.sweepStatus,
      tabs: s.tabs,
      activeTabId: s.activeTabId,
      nodes: s.nodes,
      edges: s.edges,
      addTab: s.addTab,
      closeTab: s.closeTab,
      switchTab: s.switchTab,
      renameTab: s.renameTab,
      loadCircuit: s.loadCircuit,
      setSimulationError: s.setSimulationError,
      outputBuffer: s.outputBuffer,
      playing: s.playing,
    })),
  );

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId) renameInputRef.current?.focus();
  }, [editingTabId]);

  function handleAdd(
    item: (typeof PALETTE)[number] | (typeof JACK_ITEMS)[number],
  ) {
    const offset = Math.random() * 100;
    addNode({
      id: crypto.randomUUID(),
      type: item.type,
      position: { x: 200 + offset, y: 150 + offset },
      data: item.defaultData,
    } as ComponentNode);
  }

  function startRename(id: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingTabId(id);
    setEditingName(currentName);
  }

  function commitRename(id: string) {
    if (editingName.trim()) renameTab(id, editingName.trim());
    setEditingTabId(null);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) return;
    // Use the live nodes/edges from the store, not the stale tab snapshot
    // (tabs only flush on tab-switch / add / close)
    const json = exportCircuit({ ...activeTab, nodes, edges });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName =
      activeTab.name.replace(/\s+/g, '_').replace(/[^\w\-_.]/g, '') ||
      'circuit';
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const {
        name,
        nodes: importedNodes,
        edges: importedEdges,
      } = importCircuit(text);
      loadCircuit(importedNodes, importedEdges);
      renameTab(activeTabId, name);
    } catch (err) {
      setSimulationError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="flex flex-col flex-shrink-0 bg-gray-900 border-b border-gray-800">
      {/* Logo row: logo + tab strip */}
      <div className="flex items-stretch h-8 border-b border-gray-800 overflow-hidden overflow-x-auto">
        {/* Logo */}
        <div className="flex items-center px-3 border-r border-gray-800 flex-shrink-0">
          <span className="text-blue-400 font-bold text-sm">⚡ solder</span>
        </div>

        {/* Tab strip */}
        <div className="flex items-stretch flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 cursor-pointer text-xs font-sans transition-colors flex-shrink-0 ${
                  isActive
                    ? 'bg-gray-800 text-gray-100 border-b-2 border-blue-500 -mb-px'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`}
              >
                {editingTabId === tab.id ? (
                  <input
                    ref={renameInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(tab.id);
                      else if (e.key === 'Escape') setEditingTabId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-gray-700 text-gray-100 text-xs px-1 rounded w-24 outline-none border border-blue-500"
                  />
                ) : (
                  <span onDoubleClick={(e) => startRename(tab.id, tab.name, e)}>
                    {tab.name}
                  </span>
                )}
                {
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="text-gray-600 hover:text-gray-300 leading-none transition-colors"
                    aria-label={`Close ${tab.name}`}
                  >
                    <X size={10} />
                  </button>
                }
              </div>
            );
          })}

          {/* New tab button */}
          <button
            type="button"
            onClick={addTab}
            className="px-3 text-gray-500 hover:text-gray-200 hover:bg-gray-800 text-sm transition-colors flex-shrink-0"
            aria-label="New tab"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Examples / Export / Import — top-right of top bar */}
        <div className="flex items-stretch border-l border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 text-xs px-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors font-sans"
          >
            <Upload size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs px-2.5 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors font-sans"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={onToggleExamples}
            className={`flex items-center gap-1 text-xs px-2.5 transition-colors font-sans ${
              showExamples
                ? 'bg-indigo-950 text-indigo-300'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            <FolderOpen size={12} />
            Examples
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {/* On mobile: two rows (actions middle, palette bottom). On sm+: one row. */}
      <div className="flex flex-col sm:flex-row sm:items-center border-b border-gray-800 sm:border-b-0">
        {/* ── Actions row (middle on mobile, right on desktop) ── */}
        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-800 sm:border-b-0 sm:order-last sm:ml-auto flex-shrink-0 justify-between">
          {/* Input / Output button group */}
          <div className="flex rounded border border-gray-700 flex-shrink-0">
            {/* Input play/stop */}
            {hasSourceBuffer &&
              (playingOriginal ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
                >
                  <Square size={10} />
                  <span>Input</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPlayOriginal}
                  disabled={
                    simulationStatus === 'running' || sweepStatus === 'running'
                  }
                  className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-blue-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
                >
                  <Play size={10} />
                  <span>Input</span>
                </button>
              ))}

            {hasSourceBuffer && <div className="w-px bg-gray-700" />}

            {/* Simulate / Output play / Stop */}
            {simulationStatus === 'running' || sweepStatus === 'running' ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 bg-gray-800 disabled:opacity-50 text-amber-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
              >
                <Hourglass size={10} />
                <span>
                  {sweepStatus === 'running' ? 'Sweeping…' : 'Simulating…'}
                </span>
              </button>
            ) : outputBuffer && playing ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
              >
                <Square size={10} />
                <span>Stop</span>
              </button>
            ) : outputBuffer ? (
              <button
                type="button"
                onClick={onPlayOutput}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-green-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
              >
                <Play size={10} />
                <span>Output</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSimulate}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs px-3 py-1 font-mono font-bold whitespace-nowrap transition-colors"
              >
                <Play size={10} />
                <span>Simulate</span>
              </button>
            )}
          </div>

          {/* Analyzer toggle */}
          <button
            type="button"
            onClick={onToggleAnalyzer}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded font-mono transition-colors flex-shrink-0 ${
              showAnalyzer
                ? 'bg-green-950 border border-green-800 text-green-400'
                : 'bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
            }`}
          >
            <ScanLine size={12} />
            <span>Oscilloscope</span>
          </button>
        </div>

        {/* ── Palette row (bottom on mobile, left on desktop) ── */}
        <div className="flex items-center gap-2 px-2 py-1.5 overflow-x-auto sm:order-first sm:flex-1 overflow-y-hidden">
          {/* Component palette */}
          <FlyoutButton
            label="JACK"
            tooltip="Audio Jack"
            active={false}
            items={JACK_ITEMS}
            onSelect={(lbl) =>
              handleAdd(JACK_ITEMS.find((i) => i.label === lbl)!)
            }
          />

          {PALETTE.map((item) => {
            const transistorButton = item.type === 'diode' && (
              <FlyoutButton
                key="transistor"
                label="Q"
                tooltip="Transistor"
                active={false}
                items={TRANSISTOR_ITEMS}
                onSelect={(lbl) =>
                  handleAdd(TRANSISTOR_ITEMS.find((i) => i.label === lbl)!)
                }
              />
            );

            return (
              <Fragment key={item.type}>
                <div className="relative group flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
                  >
                    {item.label}
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                    {item.tooltip}
                  </div>
                </div>
                {transistorButton}
              </Fragment>
            );
          })}
        </div>
        {/* end palette row */}
      </div>
      {/* end flex col/row wrapper */}
    </div>
  );
}
