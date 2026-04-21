// Circuit graph types — component data, node union,
// and circuit state.
//
// Data types are defined per-domain under
// src/lib/symbols/<component>/types.ts and
// re-exported here for backward compatibility.

import type { Edge, XYPosition } from '@xyflow/react';

export type { XYPosition };

// ── Re-exported component data types ────────────────────

export type { BJTData, BJTModel } from './symbols/bjt/types';
export type { BoxData, BoxVariant } from './symbols/box/types';
export type { CapacitorData } from './symbols/capacitor/types';
export type { DiodeData } from './symbols/diode/types';
export type { GroundData } from './symbols/ground/types';
export type { JackData } from './symbols/jack/types';
export type { JFETData, JFETModel } from './symbols/jfet/types';
export type { JunctionData } from './symbols/junction/types';
export type { LabelData } from './symbols/label/types';
export type { MOSFETData, MOSFETModel } from './symbols/mosfet/types';
export type { OpAmpData } from './symbols/opamp/types';
export type { PotData, PotTaper } from './symbols/pot/types';
export type { PowerData } from './symbols/power/types';
export type { ResistorData } from './symbols/resistor/types';
export type {
  StickyNoteColor,
  StickyNoteData,
  StickyNoteSize,
  StickyNoteWidth,
} from './symbols/stickynote/types';

// ── Imports for the discriminated union ─────────────────

import type { BJTData } from './symbols/bjt/types';
import type { BoxData } from './symbols/box/types';
import type { CapacitorData } from './symbols/capacitor/types';
import type { DiodeData } from './symbols/diode/types';
import type { GroundData } from './symbols/ground/types';
import type { JackData } from './symbols/jack/types';
import type { JFETData } from './symbols/jfet/types';
import type { JunctionData } from './symbols/junction/types';
import type { LabelData } from './symbols/label/types';
import type { MOSFETData } from './symbols/mosfet/types';
import type { OpAmpData } from './symbols/opamp/types';
import type { PotData } from './symbols/pot/types';
import type { PowerData } from './symbols/power/types';
import type { ResistorData } from './symbols/resistor/types';
import type { StickyNoteData } from './symbols/stickynote/types';

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
