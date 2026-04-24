// Circuit graph types — component data, node union,
// and circuit state.
//
// Data types are defined per-domain under
// src/lib/models/<component>/types.ts and
// re-exported here for backward compatibility.

import type { Edge, XYPosition } from '@xyflow/react';

export type { NodeColor, NodeColorOption } from './colors';
export type { NodeSize, NodeWidth } from './sizes';
export type { XYPosition };

// ── Re-exported component data types ────────────────────

export type { BJTData, BJTModel } from './models/bjt/types';
export type { BoxData, BoxVariant } from './models/box/types';
export type { CapacitorData } from './models/capacitor/types';
export type { DiodeData } from './models/diode/types';
export type { GroundData } from './models/ground/types';
export type { JackData } from './models/jack/types';
export type { JFETData, JFETModel } from './models/jfet/types';
export type { JunctionData } from './models/junction/types';
export type { LabelData } from './models/label/types';
export type { MOSFETData, MOSFETModel } from './models/mosfet/types';
export type { OpAmpData } from './models/opamp/types';
export type { PotData, PotTaper } from './models/pot/types';
export type { PowerData } from './models/power/types';
export type { ResistorData } from './models/resistor/types';
export type { StickyNoteData } from './models/stickynote/types';

// ── Imports for the discriminated union ─────────────────

import type { BJTData } from './models/bjt/types';
import type { BoxData } from './models/box/types';
import type { CapacitorData } from './models/capacitor/types';
import type { DiodeData } from './models/diode/types';
import type { GroundData } from './models/ground/types';
import type { JackData } from './models/jack/types';
import type { JFETData } from './models/jfet/types';
import type { JunctionData } from './models/junction/types';
import type { LabelData } from './models/label/types';
import type { MOSFETData } from './models/mosfet/types';
import type { OpAmpData } from './models/opamp/types';
import type { PotData } from './models/pot/types';
import type { PowerData } from './models/power/types';
import type { ResistorData } from './models/resistor/types';
import type { StickyNoteData } from './models/stickynote/types';

// ── Node union ──────────────────────────────────────────

/**
 * Shared fields present on every circuit node,
 * regardless of component type.
 */
type NodeBase = {
  id: string;
  position: XYPosition;
  rotation?: number;
  measured?: { width?: number; height?: number };
};

/**
 * Discriminated union of all circuit node types.
 *
 * Each variant pairs a `type` string tag with
 * the corresponding data payload. XYFlow uses
 * the `type` field to select the correct React
 * node renderer.
 *
 * Adding a new component type requires:
 *   1. A new data type in its domain directory
 *   2. A new variant here
 *   3. A new node renderer in its domain directory
 *   4. A new entry in COMPONENT_HANDLES
 *      (netlist.ts)
 */
export type ComponentNode =
  | (NodeBase & { type: 'resistor'; data: ResistorData })
  | (NodeBase & { type: 'capacitor'; data: CapacitorData })
  | (NodeBase & { type: 'opamp'; data: OpAmpData })
  | (NodeBase & { type: 'power'; data: PowerData })
  | (NodeBase & { type: 'ground'; data: GroundData })
  | (NodeBase & { type: 'jack'; data: JackData })
  | (NodeBase & { type: 'diode'; data: DiodeData })
  | (NodeBase & { type: 'pot'; data: PotData })
  | (NodeBase & { type: 'cap_polar'; data: CapacitorData })
  | (NodeBase & { type: 'label'; data: LabelData })
  | (NodeBase & { type: 'junction'; data: JunctionData })
  | (NodeBase & { type: 'bjt'; data: BJTData })
  | (NodeBase & { type: 'jfet'; data: JFETData })
  | (NodeBase & { type: 'mosfet'; data: MOSFETData })
  | (NodeBase & { type: 'stickynote'; data: StickyNoteData })
  | (NodeBase & {
      type: 'box';
      data: BoxData;
      style?: { width?: number; height?: number };
      dragHandle?: string;
      className?: string;
    });

// ── Circuit state ───────────────────────────────────────

/**
 * The complete state of a circuit: all nodes
 * and all edges (wires) between them.
 */
export type CircuitState = {
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};

// ── Utility functions ───────────────────────────────────

/**
 * Returns true if an edge connects to a power
 * or ground node.
 *
 * Used by SchematicCanvas to apply DC-specific
 * edge styling (dashed lines for power rails).
 */
export function isEdgeDC(
  srcType?: ComponentNode['type'],
  tgtType?: ComponentNode['type'],
): boolean {
  return (
    srcType === 'power' ||
    srcType === 'ground' ||
    tgtType === 'power' ||
    tgtType === 'ground'
  );
}
