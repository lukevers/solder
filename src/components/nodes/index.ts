// src/components/nodes/index.ts

import { BJTNode } from './BJTNode';
import { CapacitorNode } from './CapacitorNode';
import { CapPolarNode } from './CapPolarNode';
import { DiodeNode } from './DiodeNode';
import { GroundNode } from './GroundNode';
import { InputNode } from './InputNode';
import { JFETNode } from './JFETNode';
import { LabelNode } from './LabelNode';
import { MOSFETNode } from './MOSFETNode';
import { OpAmpNode } from './OpAmpNode';
import { OutputNode } from './OutputNode';
import { PotNode } from './PotNode';
import { PowerNode } from './PowerNode';
import { ResistorNode } from './ResistorNode';

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
  audiin: InputNode,
  audiout: OutputNode,
  diode: DiodeNode,
  pot: PotNode,
  label: LabelNode,
};
