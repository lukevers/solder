// src/components/nodes/index.ts
import { ResistorNode  } from './ResistorNode'
import { CapacitorNode } from './CapacitorNode'
import { OpAmpNode     } from './OpAmpNode'
import { PowerNode     } from './PowerNode'
import { GroundNode    } from './GroundNode'
import { InputNode     } from './InputNode'
import { OutputNode    } from './OutputNode'

export const nodeTypes = {
  resistor:  ResistorNode,
  capacitor: CapacitorNode,
  opamp:     OpAmpNode,
  power:     PowerNode,
  ground:    GroundNode,
  input:     InputNode,
  output:    OutputNode,
}
