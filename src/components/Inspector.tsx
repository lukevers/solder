// src/components/Inspector.tsx

import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { ComponentNode, DiodeData, PotData } from '../lib/types';
import { useStore } from '../store';
import {
  CAP_MULTIPLIERS,
  RES_MULTIPLIERS,
  detectCapUnit,
  detectResUnit,
  type CapUnit,
  type ResUnit,
} from '../lib/units';

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

const RES_UNITS: ResUnit[] = ['Ω', 'kΩ', 'MΩ'];

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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, ohms })
          }
        />
      </Field>
      <Field label="Resistance">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          <input
            type="number"
            className="flex-1 min-w-0 bg-gray-950 text-gray-200 px-2 py-1 text-xs font-mono focus:outline-none"
            value={displayValue}
            min={0}
            onChange={(e) =>
              updateNodeData(node.id, {
                label,
                ohms: Number(e.target.value) / RES_MULTIPLIERS[unit],
              })
            }
          />
          {RES_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
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
      </Field>
    </>
  );
}

const CAP_UNITS: CapUnit[] = ['pF', 'nF', 'µF', 'mF'];

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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, farads })
          }
        />
      </Field>
      <Field label="Capacitance">
        <div className="flex rounded border border-gray-700 overflow-hidden">
          <input
            type="number"
            className="flex-1 min-w-0 bg-gray-950 text-gray-200 px-2 py-1 text-xs font-mono focus:outline-none"
            value={displayValue}
            min={0}
            onChange={(e) =>
              updateNodeData(node.id, {
                label,
                farads: Number(e.target.value) / CAP_MULTIPLIERS[unit],
              })
            }
          />
          {CAP_UNITS.map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setUnit(u)}
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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, volts })
          }
        />
      </Field>
      <Field label="Voltage (V)">
        <input
          type="number"
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
          value={label}
          onChange={(e) =>
            updateNodeData(node.id, { label: e.target.value, model })
          }
        />
      </Field>
      <Field label="Model">
        <select
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
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
          className="w-full bg-gray-950 border border-gray-700 text-gray-200 px-2 py-1 rounded text-xs font-mono"
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
          className="w-full accent-purple-400"
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

export function Inspector() {
  const { nodes, selectedNodeId } = useStore(
    useShallow((s) => ({
      nodes: s.nodes,
      selectedNodeId: s.selectedNodeId,
    })),
  );

  const selected = nodes.find((n) => n.id === selectedNodeId);

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
      {selected.type === 'resistor' && <ResistorInspector key={selected.id} node={selected} />}
      {selected.type === 'capacitor' && <CapacitorInspector key={selected.id} node={selected} />}
      {selected.type === 'opamp' && <OpAmpInspector node={selected} />}
      {selected.type === 'power' && <PowerInspector node={selected} />}
      {selected.type === 'diode' && <DiodeInspector node={selected} />}
      {selected.type === 'pot' && <PotInspector node={selected} />}
    </div>
  );
}
