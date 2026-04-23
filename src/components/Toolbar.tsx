import {
  Download,
  FolderOpen,
  Hourglass,
  MessageSquareText,
  Play,
  Plus,
  ScanLine,
  Square,
  Upload,
  X,
} from 'lucide-react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { exportCircuit, importCircuit } from '../lib/circuit-io';
import { CIRCUIT_LABEL } from '../lib/constants';
import { JACK_DIRECTION } from '../lib/models/jack/types';
import type { ComponentNode } from '../lib/types';
import { SIMULATION_STATUS, SWEEP_STATUS } from '../store/constants';
import {
  useAudioState,
  useCircuitActions,
  useCircuitState,
  useSimulationActions,
  useSimulationState,
  useSweepState,
  useTabActions,
  useTabBarState,
  useViewportState,
} from '../store/hooks';

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
    if (!open) {
      return;
    }
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
    <div className="group relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded border bg-gray-800 px-2 py-1 font-mono text-xs transition-colors hover:bg-gray-700 ${
          active || open
            ? 'border-blue-500 text-blue-300'
            : 'border-gray-700 text-gray-300'
        }`}
      >
        {label}
      </button>
      {!open && (
        <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2 py-1 font-sans text-gray-200 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
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
              maxHeight: `calc(100vh - ${pos.top}px - 16px)`,
              overflowY: 'auto',
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
                className="whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2.5 py-1 font-mono text-gray-200 text-xs transition-colors hover:bg-gray-700"
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

type TransistorGroup = { group: string; items: Array<PaletteItem> };

function TransistorFlyout({
  groups,
  onSelect,
}: {
  groups: Array<TransistorGroup>;
  onSelect: (item: PaletteItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const flyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      setActiveGroup(null);
      return;
    }
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

  const currentItems = activeGroup
    ? (groups.find((g) => g.group === activeGroup)?.items ?? [])
    : null;

  return (
    <div className="group relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`rounded border bg-gray-800 px-2 py-1 font-mono text-xs transition-colors hover:bg-gray-700 ${
          open
            ? 'border-blue-500 text-blue-300'
            : 'border-gray-700 text-gray-300'
        }`}
      >
        Q
      </button>
      {!open && (
        <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2 py-1 font-sans text-gray-200 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
          Transistor
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
              maxHeight: `calc(100vh - ${pos.top}px - 16px)`,
              overflowY: 'auto',
            }}
            className="flex flex-col gap-1"
          >
            {!activeGroup ? (
              groups.map((g) => (
                <button
                  key={g.group}
                  type="button"
                  onClick={() => setActiveGroup(g.group)}
                  className="flex items-center justify-between gap-3 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2.5 py-1 font-mono text-gray-200 text-xs transition-colors hover:bg-gray-700"
                >
                  {g.group}
                  <span className="text-gray-500">›</span>
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setActiveGroup(null)}
                  className="flex items-center gap-1 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2.5 py-1 font-mono text-gray-400 text-xs transition-colors hover:bg-gray-700"
                >
                  <span>‹</span> {activeGroup}
                </button>
                {(currentItems ?? []).map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      onSelect(item);
                      setOpen(false);
                    }}
                    className="whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2.5 py-1 font-mono text-gray-200 text-xs transition-colors hover:bg-gray-700"
                  >
                    {item.label}
                  </button>
                ))}
              </>
            )}
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
    defaultData: { label: CIRCUIT_LABEL.power, volts: 9 },
  },
  {
    label: CIRCUIT_LABEL.ground,
    tooltip: 'Ground',
    type: 'ground',
    defaultData: { label: CIRCUIT_LABEL.ground },
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
  {
    label: 'BOX',
    tooltip: 'Schematic Box',
    type: 'box',
    defaultData: { label: '', color: 'blue', variant: 'outline' },
  },
];

type PaletteItem = (typeof PALETTE)[number];

function nextLabel(defaultLabel: string, nodes: Array<ComponentNode>): string {
  const match = defaultLabel.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) {
    return defaultLabel;
  }
  const prefix = match[1];
  const re = new RegExp(`^${prefix}(\\d+)$`, 'i');
  let max = 0;
  for (const node of nodes) {
    const lbl = (node.data as { label?: string }).label;
    if (typeof lbl === 'string') {
      const m = lbl.match(re);
      if (m) {
        max = Math.max(max, parseInt(m[1], 10));
      }
    }
  }
  return `${prefix}${max + 1}`;
}

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
    defaultData: {
      label: CIRCUIT_LABEL.input,
      direction: JACK_DIRECTION.in,
    },
  },
  {
    label: 'OUT',
    tooltip: 'Audio Output Jack',
    type: 'jack',
    defaultData: {
      label: CIRCUIT_LABEL.output,
      direction: JACK_DIRECTION.out,
    },
  },
];

const TRANSISTOR_GROUPS: Array<TransistorGroup> = [
  {
    group: 'BJT',
    items: [
      {
        label: '2N3904',
        tooltip: '2N3904 NPN',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
      },
      {
        label: '2N5088',
        tooltip: '2N5088 NPN (high gain)',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: '2N5088' },
      },
      {
        label: '2N5089',
        tooltip: '2N5089 NPN (very high gain)',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: '2N5089' },
      },
      {
        label: 'BC108',
        tooltip: 'BC108 NPN (Fuzz Face Si)',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: 'BC108' },
      },
      {
        label: 'BC549',
        tooltip: 'BC549 NPN (low noise)',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: 'BC549' },
      },
      {
        label: 'MPSA18',
        tooltip: 'MPSA18 NPN (ultra high gain)',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'NPN', model: 'MPSA18' },
      },
      {
        label: '2N3906',
        tooltip: '2N3906 PNP',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'PNP', model: '2N3906' },
      },
      {
        label: 'AC128',
        tooltip: 'AC128 PNP Germanium',
        type: 'bjt',
        defaultData: { label: 'Q1', polarity: 'PNP', model: 'AC128' },
      },
    ],
  },
  {
    group: 'JFET',
    items: [
      {
        label: '2N5457',
        tooltip: '2N5457 N-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'N', model: '2N5457' },
      },
      {
        label: '2N5458',
        tooltip: '2N5458 N-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'N', model: '2N5458' },
      },
      {
        label: 'J201',
        tooltip: 'J201 N-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'N', model: 'J201' },
      },
      {
        label: 'J113',
        tooltip: 'J113 N-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'N', model: 'J113' },
      },
      {
        label: 'MPF102',
        tooltip: 'MPF102 N-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'N', model: 'MPF102' },
      },
      {
        label: '2N5460',
        tooltip: '2N5460 P-ch',
        type: 'jfet',
        defaultData: { label: 'J1', polarity: 'P', model: '2N5460' },
      },
    ],
  },
  {
    group: 'MOSFET',
    items: [
      {
        label: 'BS170',
        tooltip: 'BS170 N-ch',
        type: 'mosfet',
        defaultData: { label: 'M1', polarity: 'N', model: 'BS170' },
      },
      {
        label: '2N7000',
        tooltip: '2N7000 N-ch',
        type: 'mosfet',
        defaultData: { label: 'M1', polarity: 'N', model: '2N7000' },
      },
      {
        label: 'IRF510',
        tooltip: 'IRF510 N-ch power',
        type: 'mosfet',
        defaultData: { label: 'M1', polarity: 'N', model: 'IRF510' },
      },
      {
        label: 'IRF9510',
        tooltip: 'IRF9510 P-ch power',
        type: 'mosfet',
        defaultData: { label: 'M1', polarity: 'P', model: 'IRF9510' },
      },
    ],
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
  const { tabs, activeTabId } = useTabBarState();
  const { viewport } = useViewportState();
  const { addTab, closeTab, switchTab, renameTab } = useTabActions();
  const { nodes, edges } = useCircuitState();
  const { addNode, loadCircuit } = useCircuitActions();
  const { simulationStatus, outputBuffer } = useSimulationState();
  const { setSimulationError } = useSimulationActions();
  const { sweepStatus } = useSweepState();
  const { playing } = useAudioState();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTabId) {
      renameInputRef.current?.focus();
    }
  }, [editingTabId]);

  function handleAdd(
    item: (typeof PALETTE)[number] | (typeof JACK_ITEMS)[number],
  ) {
    const offset = (Math.random() - 0.5) * 40;
    const defaultLabel = (item.defaultData as { label?: string }).label ?? '';
    const label = nextLabel(defaultLabel, nodes);
    const isBox = item.type === 'box';
    // Convert screen center to flow coordinates using the stored viewport transform
    const cx = (window.innerWidth / 2 - viewport.x) / viewport.zoom + offset;
    const cy = (window.innerHeight / 2 - viewport.y) / viewport.zoom + offset;
    // Snap to 10px grid
    const x = Math.round(cx / 10) * 10;
    const y = Math.round(cy / 10) * 10;
    addNode({
      id: crypto.randomUUID(),
      type: item.type,
      position: { x, y },
      data: { ...item.defaultData, label },
      ...(isBox
        ? {
            zIndex: -1,
            style: { width: 200, height: 150 },
            dragHandle: '.box-drag-handle',
            className: 'box-node-wrapper',
          }
        : {}),
    } as ComponentNode);
  }

  function startRename(id: string, currentName: string, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingTabId(id);
    setEditingName(currentName);
  }

  function commitRename(id: string) {
    if (editingName.trim()) {
      renameTab(id, editingName.trim());
    }
    setEditingTabId(null);
  }

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (!activeTab) {
      return;
    }
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
    if (!file) {
      return;
    }
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
    <div className="flex flex-shrink-0 flex-col border-gray-800 border-b bg-gray-900">
      {/* Logo row: logo + tab strip */}
      <div className="flex h-8 items-stretch overflow-hidden overflow-x-auto border-gray-800 border-b">
        {/* Logo */}
        <div className="flex flex-shrink-0 items-center gap-1.5 border-gray-800 border-r px-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="-1 -1 34 34"
            className="flex-shrink-0"
          >
            <defs>
              <linearGradient id="bolt-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#2563eb" />
              </linearGradient>
            </defs>
            <rect
              width="32"
              height="32"
              rx="7"
              fill="#030712"
              stroke="#374151"
              strokeWidth="1.5"
            />
            <g transform="rotate(45 16 16)">
              <path
                d="M18 5.5L11 17h4.5L13 26.5 21 15h-5L18 5.5z"
                fill="url(#bolt-grad)"
                stroke="#93c5fd"
                strokeWidth="0.5"
                strokeLinejoin="round"
              />
            </g>
          </svg>
          <span className="font-bold text-blue-400 text-sm">solder</span>
        </div>

        {/* Tab strip */}
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => switchTab(tab.id)}
                className={`flex flex-shrink-0 cursor-pointer items-center gap-1.5 px-3 font-sans text-xs transition-colors ${
                  isActive
                    ? '-mb-px border-blue-500 border-b-2 bg-gray-800 text-gray-100'
                    : '-mb-px border-transparent border-b-2 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {editingTabId === tab.id ? (
                  <input
                    ref={renameInputRef}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => commitRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commitRename(tab.id);
                      } else if (e.key === 'Escape') {
                        setEditingTabId(null);
                      }
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 rounded border border-blue-500 bg-gray-700 px-1 text-gray-100 text-xs outline-none"
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
                    className="text-gray-600 leading-none transition-colors hover:text-gray-300"
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
            className="flex-shrink-0 px-3 text-gray-500 text-sm transition-colors hover:bg-gray-800 hover:text-gray-200"
            aria-label="New tab"
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Examples / Export / Import — top-right of top bar */}
        <div className="flex flex-shrink-0 items-stretch border-gray-800 border-l">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 font-sans text-gray-400 text-xs transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            <Upload size={12} />
            <span className="hidden sm:inline">Export</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 font-sans text-gray-400 text-xs transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            <Download size={12} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            type="button"
            onClick={onToggleExamples}
            className={`flex items-center gap-1 px-2.5 font-sans text-xs transition-colors ${
              showExamples
                ? 'bg-indigo-950 text-indigo-300'
                : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
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
      <div className="flex flex-col border-gray-800 border-b sm:flex-row sm:items-center sm:border-b-0">
        {/* ── Actions row (middle on mobile, right on desktop) ── */}
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-gray-800 border-b px-2 py-1.5 sm:order-last sm:ml-auto sm:border-b-0">
          {/* Input / Output button group */}
          <div className="flex flex-shrink-0 rounded border border-gray-700">
            {/* Input play/stop */}
            {hasSourceBuffer &&
              (playingOriginal ? (
                <button
                  type="button"
                  onClick={onStop}
                  className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-red-400 text-xs transition-colors hover:bg-gray-700"
                >
                  <Square size={10} />
                  <span>Input</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onPlayOriginal}
                  disabled={
                    simulationStatus === SIMULATION_STATUS.running ||
                    sweepStatus === SWEEP_STATUS.running
                  }
                  className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-blue-400 text-xs transition-colors hover:bg-gray-700 disabled:opacity-40"
                >
                  <Play size={10} />
                  <span>Input</span>
                </button>
              ))}

            {hasSourceBuffer && <div className="w-px bg-gray-700" />}

            {/* Simulate / Output play / Stop */}
            {simulationStatus === SIMULATION_STATUS.running ||
            sweepStatus === SWEEP_STATUS.running ? (
              <button
                type="button"
                disabled
                className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-amber-400 text-xs transition-colors disabled:opacity-50"
              >
                <Hourglass size={10} />
                <span>
                  {sweepStatus === SWEEP_STATUS.running
                    ? 'Sweeping…'
                    : 'Simulating…'}
                </span>
              </button>
            ) : outputBuffer && playing ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-red-400 text-xs transition-colors hover:bg-gray-700"
              >
                <Square size={10} />
                <span>Stop</span>
              </button>
            ) : outputBuffer ? (
              <button
                type="button"
                onClick={onPlayOutput}
                className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-green-400 text-xs transition-colors hover:bg-gray-700"
              >
                <Play size={10} />
                <span>Output</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSimulate}
                className="flex items-center gap-1 whitespace-nowrap bg-gray-800 px-3 py-1 font-bold font-mono text-amber-400 text-xs transition-colors hover:bg-gray-700"
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
            className={`flex flex-shrink-0 items-center gap-1 rounded px-2.5 py-1 font-mono text-xs transition-colors ${
              showAnalyzer
                ? 'border border-green-800 bg-green-950 text-green-400'
                : 'border border-gray-700 bg-transparent text-gray-400 hover:border-gray-500 hover:text-gray-200'
            }`}
          >
            <ScanLine size={12} />
            <span>Oscilloscope</span>
          </button>
        </div>

        {/* ── Palette row (bottom on mobile, left on desktop) ── */}
        <div className="flex items-center gap-2 overflow-x-auto overflow-y-hidden px-2 py-1.5 sm:order-first sm:flex-1">
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
              <TransistorFlyout
                key="transistor"
                groups={TRANSISTOR_GROUPS}
                onSelect={(t) => handleAdd(t)}
              />
            );

            return (
              <Fragment key={item.type}>
                <div className="group relative flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAdd(item)}
                    className="rounded border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-gray-300 text-xs transition-colors hover:bg-gray-700"
                  >
                    {item.label}
                  </button>
                  <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2 py-1 font-sans text-gray-200 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
                    {item.tooltip}
                  </div>
                </div>
                {transistorButton}
              </Fragment>
            );
          })}

          {/* Sticky Note */}
          <div className="group relative flex-shrink-0 self-stretch">
            <button
              type="button"
              onClick={() =>
                handleAdd({
                  label: 'NOTE',
                  tooltip: 'Sticky Note',
                  type: 'stickynote',
                  defaultData: { label: 'Note', text: '' },
                })
              }
              className="flex h-full items-center rounded border border-gray-700 bg-gray-800 px-2 py-1 font-mono text-gray-300 text-xs transition-colors hover:bg-gray-700"
            >
              <MessageSquareText size={14} />
            </button>
            <div className="pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded border border-gray-600 bg-gray-800 px-2 py-1 font-sans text-gray-200 text-xs opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-600" />
              Sticky Note
            </div>
          </div>
        </div>
        {/* end palette row */}
      </div>
      {/* end flex col/row wrapper */}
    </div>
  );
}
