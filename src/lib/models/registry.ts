/**
 * UI registry for XYFlow node renderers and
 * symbol metadata.
 *
 * This file is intentionally separate from the
 * worker-safe `models/index.ts` barrel.
 *
 * Import this module only from the browser UI
 * and store helpers. The simulation workers
 * should never depend on it because it pulls in
 * React node renderers and shared store hooks.
 */

import { BJTNode } from './bjt/node';
import { BoxNode } from './box/node';
import { CapPolarNode } from './cap-polar/node';
import { CapacitorNode } from './capacitor/node';
import { DiodeNode } from './diode/node';
import { GroundNode } from './ground/node';
import { JackNode } from './jack/node';
import { JFETNode } from './jfet/node';
import { JunctionNode } from './junction/node';
import { LabelNode } from './label/node';
import { MOSFETNode } from './mosfet/node';
import { OpAmpNode } from './opamp/node';
import { PotNode } from './pot/node';
import { PowerNode } from './power/node';
import { ResistorNode } from './resistor/node';
import { StickyNoteNode } from './stickynote/node';

export {
  DEFAULT_SYMBOL,
  resolveOpAmpSymbol,
  SYMBOLS,
} from './symbol-registry';

/**
 * XYFlow node renderer map.
 *
 * This is browser-only because each entry is a
 * React component. Keep it out of worker import
 * graphs so simulation startup does not evaluate
 * UI modules.
 */
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
