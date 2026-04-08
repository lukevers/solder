// src/components/nodes/index.ts

import { CapacitorNode } from './CapacitorNode';
import { DiodeNode } from './DiodeNode';
import { GroundNode } from './GroundNode';
import { InputNode } from './InputNode';
import { LabelNode } from './LabelNode';
import { OpAmpNode } from './OpAmpNode';
import { OutputNode } from './OutputNode';
import { PotNode } from './PotNode';
import { PowerNode } from './PowerNode';
import { ResistorNode } from './ResistorNode';

export const nodeTypes = {
  resistor: ResistorNode,
  capacitor: CapacitorNode,
  opamp: OpAmpNode,
  power: PowerNode,
  ground: GroundNode,
  audiin: InputNode,
  audiout: OutputNode,
  diode: DiodeNode,
  pot: PotNode,
  label: LabelNode,
};
