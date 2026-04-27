// Circuit graph types — component data, node union, and circuit state.
//
// Component-specific data types live under
// src/lib/models/components/<component>/types.ts and
// src/lib/models/ui/<component>/types.ts. This module acts as the shared
// public entry point for circuit graph types and re-exports commonly used
// component data types alongside the ComponentNode union.

import type { Edge, XYPosition } from '@xyflow/react';

export type { NodeColor, NodeColorOption } from './colors';
export type { NodeSize, NodeWidth } from './sizes';
export type { XYPosition };

// ── Re-exported component data types ────────────────────

export type { CapacitorData } from './models/components/capacitor/types';
export type { DiodeData } from './models/components/diode/types';
export type { GroundData } from './models/components/ground/types';
export type { JackData } from './models/components/jack/types';
export type { JunctionData } from './models/components/junction/types';
export type { LabelData } from './models/components/label/types';
export type { OpAmpData } from './models/components/opamp/types';
export type { PotData, PotTaper } from './models/components/pot/types';
export type { PowerData } from './models/components/power/types';
export type { ResistorData } from './models/components/resistor/types';
export type {
  BJTData,
  BJTModel,
} from './models/components/transistors/bjt/types';
export type {
  JFETData,
  JFETModel,
} from './models/components/transistors/jfet/types';
export type {
  MOSFETData,
  MOSFETModel,
} from './models/components/transistors/mosfet/types';
export type { BoxData, BoxVariant } from './models/ui/box/types';
export type { StickyNoteData } from './models/ui/stickynote/types';

// ── Imports for the discriminated union ─────────────────

import type { CapacitorData } from './models/components/capacitor/types';
import type { DiodeData } from './models/components/diode/types';
import type { GroundData } from './models/components/ground/types';
import type { JackData } from './models/components/jack/types';
import type { JunctionData } from './models/components/junction/types';
import type { LabelData } from './models/components/label/types';
import type { OpAmpData } from './models/components/opamp/types';
import type { PotData } from './models/components/pot/types';
import type { PowerData } from './models/components/power/types';
import type { ResistorData } from './models/components/resistor/types';
import type { BJTData } from './models/components/transistors/bjt/types';
import type { JFETData } from './models/components/transistors/jfet/types';
import type { MOSFETData } from './models/components/transistors/mosfet/types';
import type { BoxData } from './models/ui/box/types';
import type { StickyNoteData } from './models/ui/stickynote/types';

// ── Node union ──────────────────────────────────────────

/**
 * Shared fields present on every circuit node, regardless of component type.
 */
type NodeBase = {
  id: string;
  position: XYPosition;
  rotation?: number;
  measured?: { width?: number; height?: number };
  selected?: boolean;
};

/**
 * Discriminated union of all circuit node types.
 *
 * Each variant pairs a `type` string tag with the corresponding data payload.
 * XYFlow uses the `type` field to select the correct React node renderer.
 *
 * Adding a new component type requires:
 *
 *   1. A new data type in its domain directory
 *   2. A new variant here
 *   3. A new node renderer in its domain directory
 *   4. A new entry in COMPONENT_HANDLES (netlist.ts)
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
      zIndex?: number;
      dragHandle?: string;
      className?: string;
    });

// ── Circuit state ───────────────────────────────────────

/**
 * The complete state of a circuit: all nodes and all edges (wires) betweenthem.
 */
export type CircuitState = {
  nodes: Array<ComponentNode>;
  edges: Array<Edge>;
};
