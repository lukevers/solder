// src/components/nodes/index.ts

import { CapacitorNode } from './CapacitorNode';
import { GroundNode } from './GroundNode';
import { InputNode } from './InputNode';
import { OpAmpNode } from './OpAmpNode';
import { OutputNode } from './OutputNode';
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
};
