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
import { useShallow } from 'zustand/react/shallow';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import type { ComponentNode } from '../lib/types';
import { useStore } from '../store';

const PALETTE: Array<{
  label: string;
  tooltip: string;
  type: ComponentNode['type'];
  defaultData: ComponentNode['data'];
  unique?: boolean;
}> = [
  {
    label: 'INPUT',
    tooltip: 'Audio Input',
    type: 'audiin',
    defaultData: { label: 'INPUT' },
    unique: true,
  },
  {
    label: 'OUTPUT',
    tooltip: 'Audio Output',
    type: 'audiout',
    defaultData: { label: 'OUTPUT' },
    unique: true,
  },
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
    nodes,
    tabs,
    activeTabId,
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
      nodes: s.nodes,
      tabs: s.tabs,
      activeTabId: s.activeTabId,
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
  const [transistorOpen, setTransistorOpen] = useState(false);
  const transistorRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId) renameInputRef.current?.focus();
  }, [editingTabId]);

  useEffect(() => {
    if (!transistorOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        transistorRef.current &&
        !transistorRef.current.contains(e.target as Node)
      ) {
        setTransistorOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [transistorOpen]);

  const hasAudiin = nodes.some((n) => n.type === 'audiin');
  const hasAudiout = nodes.some((n) => n.type === 'audiout');

  function handleAdd(item: (typeof PALETTE)[number]) {
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
    const json = exportCircuit(activeTab);
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
      <div className="flex items-stretch h-8 border-b border-gray-800">
        {/* Logo */}
        <div className="flex items-center px-3 border-r border-gray-800 flex-shrink-0">
          <span className="text-blue-400 font-bold text-sm">⚡ solder</span>
        </div>

        {/* Tab strip */}
        <div className="flex items-stretch flex-1 overflow-x-auto">
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
      </div>

      {/* Palette row: Examples + divider + components + Simulate */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          style={{ display: 'none' }}
        />

        {/* Examples button */}
        <button
          type="button"
          onClick={onToggleExamples}
          className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 ${
            showExamples
              ? 'bg-indigo-950 border border-indigo-700 text-indigo-300'
              : 'bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200'
          }`}
        >
          <FolderOpen size={12} />
          Examples
        </button>

        {/* Export button */}
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200"
        >
          <Download size={10} />
          Export
        </button>

        {/* Import button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs px-2.5 py-1 rounded transition-colors font-sans flex-shrink-0 bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-gray-200"
        >
          <Upload size={10} />
          Import
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

        {/* Component palette */}
        {PALETTE.map((item) => {
          const disabled =
            item.unique &&
            ((item.type === 'audiin' && hasAudiin) ||
              (item.type === 'audiout' && hasAudiout));

          // Insert transistor flyout after diode
          const transistorButton = item.type === 'diode' && (
            <div
              key="transistor"
              ref={transistorRef}
              className="relative group flex-shrink-0"
            >
              <button
                type="button"
                onClick={() => setTransistorOpen((o) => !o)}
                className={`bg-gray-800 hover:bg-gray-700 border text-xs px-2 py-1 rounded font-mono transition-colors ${
                  transistorOpen
                    ? 'border-blue-500 text-blue-300'
                    : 'border-gray-700 text-gray-300'
                }`}
              >
                Q
              </button>
              {/* Tooltip (hidden when flyout is open) */}
              {!transistorOpen && (
                <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                  Transistor
                </div>
              )}
              {/* Flyout sub-menu */}
              {transistorOpen && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 flex flex-col gap-1 z-50">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                  {TRANSISTOR_ITEMS.map((sub) => (
                    <button
                      key={sub.type}
                      type="button"
                      onClick={() => {
                        handleAdd(sub);
                        setTransistorOpen(false);
                      }}
                      className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-200 text-xs px-2.5 py-1 rounded font-mono whitespace-nowrap transition-colors"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );

          return (
            <Fragment key={item.type}>
              <div className="relative group flex-shrink-0">
                <button
                  type="button"
                  onClick={() => handleAdd(item)}
                  disabled={disabled}
                  className="bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-700 text-gray-300 text-xs px-2 py-1 rounded font-mono transition-colors"
                >
                  {item.label}
                </button>
                <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-200 text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                  {disabled ? `${item.tooltip} already placed` : item.tooltip}
                </div>
              </div>
              {transistorButton}
            </Fragment>
          );
        })}

        <div className="flex-1" />

        {/* Input / Output button group */}
        <div className="flex rounded border border-gray-700 overflow-hidden">
          {/* Input play/stop */}
          {hasSourceBuffer &&
            (playingOriginal ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
              >
                <Square size={10} /> Input
              </button>
            ) : (
              <button
                type="button"
                onClick={onPlayOriginal}
                disabled={
                  simulationStatus === 'running' || sweepStatus === 'running'
                }
                className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-blue-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
              >
                <Play size={10} /> Input
              </button>
            ))}

          {hasSourceBuffer && <div className="w-px bg-gray-700" />}

          {/* Simulate / Output play / Stop */}
          {simulationStatus === 'running' || sweepStatus === 'running' ? (
            <button
              type="button"
              disabled
              className="flex items-center gap-1 bg-gray-800 disabled:opacity-50 text-amber-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
            >
              <Hourglass size={10} />{' '}
              {sweepStatus === 'running' ? 'Sweeping…' : 'Simulating…'}
            </button>
          ) : outputBuffer && playing ? (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-red-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
            >
              <Square size={10} /> Stop
            </button>
          ) : outputBuffer ? (
            <button
              type="button"
              onClick={onPlayOutput}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-green-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
            >
              <Play size={10} /> Output
            </button>
          ) : (
            <button
              type="button"
              onClick={onSimulate}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs px-3 py-1 font-mono font-bold transition-colors"
            >
              <Play size={10} /> Simulate
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
          Oscilloscope
        </button>
      </div>
    </div>
  );
}
