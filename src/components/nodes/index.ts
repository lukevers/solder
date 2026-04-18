// src/components/nodes/index.ts

import { BJTNode } from './BJTNode';
import { BoxNode } from './BoxNode';
import { CapacitorNode } from './CapacitorNode';
import { CapPolarNode } from './CapPolarNode';
import { DiodeNode } from './DiodeNode';
import { GroundNode } from './GroundNode';
import { JackNode } from './JackNode';
import { JFETNode } from './JFETNode';
import { JunctionNode } from './JunctionNode';
import { LabelNode } from './LabelNode';
import { MOSFETNode } from './MOSFETNode';
import { OpAmpNode } from './OpAmpNode';
import { PotNode } from './PotNode';
import { PowerNode } from './PowerNode';
import { ResistorNode } from './ResistorNode';
import { StickyNoteNode } from './StickyNoteNode';

export const nodeTypes = {
  bjt: BJTNode,
  jfet: JFETNode,
  mosfet: MOSFETNode,
  resistor: ResistorNode,
  capacitor: CapacitorNode,
  cap_polar: CapPolarNode,
  opamp: OpAmpNode,
  power: PowerNode,
  ground: GroundNode,
  jack: JackNode,
  junction: JunctionNode,
  diode: DiodeNode,
  pot: PotNode,
  label: LabelNode,
  stickynote: StickyNoteNode,
  box: BoxNode,
};
