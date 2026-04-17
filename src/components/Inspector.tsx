// src/components/Inspector.tsx

import type { Edge } from '@xyflow/react';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  type BJTData,
  type BJTModel,
  type ComponentNode,
  type DiodeData,
  isEdgeDC,
  type JackData,
  type JFETData,
  type JFETModel,
  type MOSFETData,
  type MOSFETModel,
  type PotData,
  type StickyNoteColor,
} from '../lib/types';
import {
  CAP_MULTIPLIERS,
  type CapUnit,
  detectCapUnit,
  detectResUnit,
  RES_MULTIPLIERS,
  type ResUnit,
} from '../lib/units';
import { useStore } from '../store';

const INPUT_CLASS =
  'w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono';

function UnitInput<U extends string>({
  value,
  unit,
  units,
  min,
  onValueChange,
  onUnitChange,
}: {
  value: number;
  unit: U;
  units: Array<U>;
  min?: number;
  onValueChange: (v: number) => void;
  onUnitChange: (u: U) => void;
}) {
  return (
    <div className="flex rounded border border-gray-700 overflow-hidden">
      <input
        type="number"
        className="flex-1 min-w-0 bg-gray-950 text-gray-200 px-2 py-1 text-xs font-mono focus:outline-none"
        value={value}
        min={min}
        onChange={(e) => onValueChange(Number(e.target.value))}
      />
      {units.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onUnitChange(u)}
          className={[
            'px-2 py-1 text-xs font-mono border-l border-gray-700',
            u === unit
              ? 'bg-blue-950 text-blue-300'
              : 'bg-gray-950 text-gray-500 hover:text-gray-300',
          ].join(' ')}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

const RES_UNITS: Array<ResUnit> = ['Ω', 'kΩ', 'MΩ'];

function ResistorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'resistor' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, ohms } = node.data;
  const [unit, setUnit] = useState<ResUnit>(() => detectResUnit(ohms));

  const displayValue = +(ohms * RES_MULTIPLIERS[unit]).toPrecision(6);

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, ohms })
          }
        />
      </Field>
      <Field label="Resistance">
        <UnitInput
          value={displayValue}
          unit={unit}
          units={RES_UNITS}
          min={0}
          onValueChange={(v) =>
            updateNodeData(node.id, {
              label,
              ohms: v / RES_MULTIPLIERS[unit],
            })
          }
          onUnitChange={setUnit}
        />
      </Field>
    </>
  );
}

const CAP_UNITS: Array<CapUnit> = ['pF', 'nF', 'µF', 'mF'];

function CapacitorInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'capacitor' | 'cap_polar' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, farads } = node.data;
  const [unit, setUnit] = useState<CapUnit>(() => detectCapUnit(farads));

  const displayValue = +(farads * CAP_MULTIPLIERS[unit]).toPrecision(6);

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, farads })
          }
        />
      </Field>
      <Field label="Capacitance">
        <UnitInput
          value={displayValue}
          unit={unit}
          units={CAP_UNITS}
          min={0}
          onValueChange={(v) =>
            updateNodeData(node.id, {
              label,
              farads: v / CAP_MULTIPLIERS[unit],
            })
          }
          onUnitChange={setUnit}
        />
      </Field>
    </>
  );
}

function OpAmpInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'opamp' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, model } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className={INPUT_CLASS}
          value={model}
          onChange={(e) =>
            updateNodeData(node.id, {
              label,
              model: e.target.value as 'TL072' | 'LM741',
            })
          }
        >
          <option value="TL072">TL072</option>
          <option value="LM741">LM741</option>
        </select>
      </Field>
    </>
  );
}

function PowerInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'power' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, volts } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, volts })
          }
        />
      </Field>
      <Field label="Voltage (V)">
        <input
          type="number"
          className={INPUT_CLASS}
          value={volts}
          onChange={(e) =>
            updateNodeData(node.id, { label, volts: Number(e.target.value) })
          }
        />
      </Field>
    </>
  );
}

function DiodeInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'diode' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, model } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className={INPUT_CLASS}
          value={model}
          onChange={(e) =>
            updateNodeData(node.id, {
              label,
              model: e.target.value as DiodeData['model'],
            })
          }
        >
          <option value="1N914">1N914</option>
          <option value="1N4001">1N4001</option>
          <option value="1N270">1N270 (Ge)</option>
        </select>
      </Field>
    </>
  );
}

const BJT_MODEL_POLARITY: Record<BJTModel, 'NPN' | 'PNP'> = {
  '2N3904': 'NPN',
  '2N3906': 'PNP',
  AC128: 'PNP',
};

function BJTInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'bjt' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, polarity, model } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, polarity, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className={INPUT_CLASS}
          value={model}
          onChange={(e) => {
            const m = e.target.value as BJTModel;
            updateNodeData(node.id, {
              label,
              polarity: BJT_MODEL_POLARITY[m],
              model: m,
            } as BJTData);
          }}
        >
          <option value="2N3904">2N3904 (NPN)</option>
          <option value="2N3906">2N3906 (PNP)</option>
          <option value="AC128">AC128 (PNP Ge)</option>
        </select>
      </Field>
      <Field label="Polarity">
        <div className="text-xs font-mono text-gray-200">{polarity}</div>
      </Field>
    </>
  );
}

const JFET_MODEL_POLARITY: Record<JFETModel, 'N' | 'P'> = {
  '2N5457': 'N',
  J201: 'N',
  '2N5460': 'P',
};

function JFETInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'jfet' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, polarity, model } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, polarity, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className={INPUT_CLASS}
          value={model}
          onChange={(e) => {
            const m = e.target.value as JFETModel;
            updateNodeData(node.id, {
              label,
              polarity: JFET_MODEL_POLARITY[m],
              model: m,
            } as JFETData);
          }}
        >
          <option value="2N5457">2N5457 (N-ch)</option>
          <option value="J201">J201 (N-ch)</option>
          <option value="2N5460">2N5460 (P-ch)</option>
        </select>
      </Field>
      <Field label="Channel">
        <div className="text-xs font-mono text-gray-200">
          {polarity}-channel
        </div>
      </Field>
    </>
  );
}

const MOSFET_MODEL_POLARITY: Record<MOSFETModel, 'N' | 'P'> = {
  BS170: 'N',
  IRF510: 'N',
  IRF9510: 'P',
};

function MOSFETInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'mosfet' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, polarity, model } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, polarity, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className={INPUT_CLASS}
          value={model}
          onChange={(e) => {
            const m = e.target.value as MOSFETModel;
            updateNodeData(node.id, {
              label,
              polarity: MOSFET_MODEL_POLARITY[m],
              model: m,
            } as MOSFETData);
          }}
        >
          <option value="BS170">BS170 (N-ch)</option>
          <option value="IRF510">IRF510 (N-ch)</option>
          <option value="IRF9510">IRF9510 (P-ch)</option>
        </select>
      </Field>
      <Field label="Channel">
        <div className="text-xs font-mono text-gray-200">
          {polarity}-channel
        </div>
      </Field>
    </>
  );
}

function PotInspector({
  node,
  onSweep,
}: {
  node: Extract<ComponentNode, { type: 'pot' }>;
  onSweep?: (nodeId: string) => void;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, ohms, position, taper = 'linear' } = node.data;
  const [unit, setUnit] = useState<ResUnit>(() => detectResUnit(ohms));
  const pct = Math.round(position * 100);

  const displayValue = +(ohms * RES_MULTIPLIERS[unit]).toPrecision(6);

  const update = (patch: Partial<PotData>) =>
    updateNodeData(node.id, {
      label,
      ohms,
      position,
      taper,
      ...patch,
    } as PotData);

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) => update({ label: e.target.value })}
        />
      </Field>
      <Field label="Resistance">
        <UnitInput
          value={displayValue}
          unit={unit}
          units={RES_UNITS}
          min={0}
          onValueChange={(v) => update({ ohms: v / RES_MULTIPLIERS[unit] })}
          onUnitChange={setUnit}
        />
      </Field>
      <Field label="Taper">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          {(
            [
              {
                value: 'log',
                label: 'A',
                tip: 'Logarithmic (audio) — slow start, fast finish',
              },
              {
                value: 'linear',
                label: 'B',
                tip: 'Linear — even response across full range',
              },
              {
                value: 'antilog',
                label: 'C',
                tip: 'Anti-log (reverse audio) — fast start, slow finish',
              },
            ] as const
          ).map(({ value, label: lbl, tip }) => (
            <button
              key={value}
              type="button"
              title={tip}
              onClick={() => update({ taper: value })}
              className={[
                'flex-1 px-2 py-1 text-xs font-mono font-bold border-r last:border-r-0 border-gray-700 transition-colors',
                value === taper
                  ? 'bg-blue-950 text-blue-300'
                  : 'bg-gray-950 text-gray-500 hover:text-gray-300',
              ].join(' ')}
            >
              {lbl}
            </button>
          ))}
        </div>
      </Field>
      <Field label={`Position — ${pct}%`}>
        <input
          type="range"
          className="w-full accent-amber-400"
          min={0}
          max={1}
          step={0.01}
          value={position}
          onChange={(e) => update({ position: Number(e.target.value) })}
        />
      </Field>
      {onSweep && <SweepButton nodeId={node.id} onSweep={onSweep} />}
    </>
  );
}

function SweepButton({
  nodeId,
  onSweep,
}: {
  nodeId: string;
  onSweep: (nodeId: string) => void;
}) {
  const { sweepStatus, simulationStatus } = useStore(
    useShallow((s) => ({
      sweepStatus: s.sweepStatus,
      simulationStatus: s.simulationStatus,
    })),
  );
  const busy = sweepStatus === 'running' || simulationStatus === 'running';

  return (
    <button
      type="button"
      onClick={() => onSweep(nodeId)}
      disabled={busy}
      className="w-full -mt-2 mb-3 text-xs py-1.5 rounded font-mono transition-colors bg-amber-950 border border-amber-700 text-amber-300 hover:bg-amber-900 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      {sweepStatus === 'running'
        ? 'Sweeping…'
        : simulationStatus === 'running'
          ? 'Simulating…'
          : 'Sweep 0–100%'}
    </button>
  );
}

function JackInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'jack' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, direction } = node.data;

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, {
              label: e.target.value,
              direction,
            } as JackData)
          }
        />
      </Field>
      <Field label="Direction">
        <div className="text-xs font-mono text-gray-200">
          {direction === 'in' ? 'Input' : 'Output'}
        </div>
      </Field>
    </>
  );
}

function LabelInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'label' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label } = node.data;

  return (
    <Field label="Net Name">
      <input
        className={INPUT_CLASS}
        value={label}
        onChange={(e) => updateNodeData(node.id, { label: e.target.value })}
      />
    </Field>
  );
}

const STICKY_COLOR_OPTIONS: Array<{ id: StickyNoteColor; swatch: string }> = [
  { id: 'yellow', swatch: '#fde047' },
  { id: 'blue', swatch: '#93c5fd' },
  { id: 'green', swatch: '#86efac' },
  { id: 'pink', swatch: '#f9a8d4' },
  { id: 'purple', swatch: '#c4b5fd' },
  { id: 'orange', swatch: '#fdba74' },
];

function StickyNoteInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'stickynote' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, text, color } = node.data;
  const current = color ?? 'yellow';

  return (
    <>
      <Field label="Title">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, {
              label: e.target.value,
              text,
              color: current,
            })
          }
        />
      </Field>
      <Field label="Text">
        <textarea
          className={`${INPUT_CLASS} resize-y min-h-[60px]`}
          rows={4}
          value={text}
          onChange={(e) =>
            updateNodeData(node.id, {
              label,
              text: e.target.value,
              color: current,
            })
          }
        />
      </Field>
      <Field label="Color">
        <div className="flex gap-1.5">
          {STICKY_COLOR_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() =>
                updateNodeData(node.id, { label, text, color: opt.id })
              }
              className={`w-5 h-5 rounded-full border-2 transition-colors ${
                current === opt.id
                  ? 'border-white scale-110'
                  : 'border-gray-600 hover:border-gray-400'
              }`}
              style={{ background: opt.swatch }}
              title={opt.id}
            />
          ))}
        </div>
      </Field>
    </>
  );
}

function EdgeInspector({
  edgeId,
  nodes: allNodes,
  edges,
}: {
  edgeId: string;
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
}) {
  const edge = edges.find((e) => e.id === edgeId);
  if (!edge) return null;

  const src = allNodes.find((n) => n.id === edge.source);
  const tgt = allNodes.find((n) => n.id === edge.target);
  const isDC = isEdgeDC(src?.type, tgt?.type);

  return (
    <>
      <Field label="From">
        <div className="text-xs font-mono text-gray-200">
          {src?.data.label ?? src?.type ?? '?'}
          <span className="text-gray-500">.{edge.sourceHandle}</span>
        </div>
      </Field>
      <Field label="To">
        <div className="text-xs font-mono text-gray-200">
          {tgt?.data.label ?? tgt?.type ?? '?'}
          <span className="text-gray-500">.{edge.targetHandle}</span>
        </div>
      </Field>
      <Field label="Signal">
        <div className="text-xs font-mono text-gray-200">
          {isDC ? 'DC' : 'AC'}
        </div>
      </Field>
    </>
  );
}

const ROTATIONS = [0, 90, 180, 270];

function RotationControl({
  nodeId,
  rotation,
}: {
  nodeId: string;
  rotation: number;
}) {
  const rotateNode = useStore((s) => s.rotateNode);

  return (
    <Field label="Rotation">
      <div className="flex rounded border border-gray-700 overflow-hidden">
        {ROTATIONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => rotateNode(nodeId, r)}
            className={[
              'flex-1 px-1 py-1 text-xs font-mono border-r last:border-r-0 border-gray-700 transition-colors',
              r === rotation
                ? 'bg-blue-950 text-blue-300'
                : 'bg-gray-950 text-gray-500 hover:text-gray-300',
            ].join(' ')}
          >
            {r}°
          </button>
        ))}
      </div>
    </Field>
  );
}

export function Inspector({ onSweep }: { onSweep?: (nodeId: string) => void }) {
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedEdgeId,
    deleteNode,
    deleteEdge,
  } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeId: s.selectedNodeId,
      selectedEdgeId: s.selectedEdgeId,
      deleteNode: s.deleteNode,
      deleteEdge: s.deleteEdge,
    })),
  );

  const selected = nodes.find((n) => n.id === selectedNodeId);

  if (selectedEdgeId) {
    return (
      <div className="p-3">
        <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
          Inspector · trace
        </div>
        <EdgeInspector edgeId={selectedEdgeId} nodes={nodes} edges={edges} />
        <button
          type="button"
          onClick={() => deleteEdge(selectedEdgeId)}
          className="flex items-center justify-center gap-1.5 w-full mt-2 text-xs py-1.5 rounded font-mono transition-colors bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
        >
          <Trash2 size={11} />
          Delete
        </button>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="p-3 text-gray-600 text-xs">
        Click a component to inspect
      </div>
    );
  }

  return (
    <div className="p-3">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">
        Inspector · {selected.type}
      </div>
      {selected.type === 'resistor' && (
        <ResistorInspector key={selected.id} node={selected} />
      )}
      {(selected.type === 'capacitor' || selected.type === 'cap_polar') && (
        <CapacitorInspector key={selected.id} node={selected} />
      )}
      {selected.type === 'opamp' && <OpAmpInspector node={selected} />}
      {selected.type === 'power' && <PowerInspector node={selected} />}
      {selected.type === 'diode' && <DiodeInspector node={selected} />}
      {selected.type === 'bjt' && <BJTInspector node={selected} />}
      {selected.type === 'jfet' && <JFETInspector node={selected} />}
      {selected.type === 'mosfet' && <MOSFETInspector node={selected} />}
      {selected.type === 'pot' && (
        <PotInspector node={selected} onSweep={onSweep} />
      )}
      {selected.type === 'jack' && <JackInspector node={selected} />}
      {selected.type === 'label' && <LabelInspector node={selected} />}
      {selected.type === 'stickynote' && (
        <StickyNoteInspector node={selected} />
      )}
      {selected.type !== 'stickynote' && selected.type !== 'junction' && (
        <RotationControl
          nodeId={selected.id}
          rotation={selected.rotation ?? 0}
        />
      )}
      <button
        type="button"
        onClick={() => deleteNode(selected.id)}
        className="flex items-center justify-center gap-1.5 w-full mt-2 text-xs py-1.5 rounded font-mono transition-colors bg-red-950 border border-red-800 text-red-400 hover:bg-red-900 hover:text-red-300"
      >
        <Trash2 size={11} />
        Delete
      </button>
    </div>
  );
}
