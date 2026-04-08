// src/components/Inspector.tsx

import type { Edge } from '@xyflow/react';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  type ComponentNode,
  type DiodeData,
  isEdgeDC,
  type PotData,
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
  node: Extract<ComponentNode, { type: 'capacitor' }>;
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
        </select>
      </Field>
    </>
  );
}

function PotInspector({
  node,
}: {
  node: Extract<ComponentNode, { type: 'pot' }>;
}) {
  const updateNodeData = useStore((s) => s.updateNodeData);
  const { label, ohms, position } = node.data;
  const pct = Math.round(position * 100);

  return (
    <>
      <Field label="Label">
        <input
          className={INPUT_CLASS}
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, {
              label: e.target.value,
              ohms,
              position,
            } as PotData)
          }
        />
      </Field>
      <Field label="Resistance (Ω)">
        <input
          type="number"
          className={INPUT_CLASS}
          value={ohms}
          min={1}
          onChange={(e) =>
            updateNodeData(node.id, {
              label,
              ohms: Number(e.target.value),
              position,
            } as PotData)
          }
        />
      </Field>
      <Field label={`Position — ${pct}%`}>
        <input
          type="range"
          className="w-full accent-amber-400"
          min={0}
          max={1}
          step={0.01}
          value={position}
          onChange={(e) =>
            updateNodeData(node.id, {
              label,
              ohms,
              position: Number(e.target.value),
            } as PotData)
          }
        />
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

export function Inspector() {
  const { nodes, edges, selectedNodeId, selectedEdgeId } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeId: s.selectedNodeId,
      selectedEdgeId: s.selectedEdgeId,
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
      {selected.type === 'capacitor' && (
        <CapacitorInspector key={selected.id} node={selected} />
      )}
      {selected.type === 'opamp' && <OpAmpInspector node={selected} />}
      {selected.type === 'power' && <PowerInspector node={selected} />}
      {selected.type === 'diode' && <DiodeInspector node={selected} />}
      {selected.type === 'pot' && <PotInspector node={selected} />}
      {selected.type === 'label' && <LabelInspector node={selected} />}
    </div>
  );
}
