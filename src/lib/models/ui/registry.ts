/**
 * UI registry for XYFlow node renderers and symbol metadata.
 *
 * @docs docs/component-library.md
 *
 * This file is intentionally separate from the worker-safe `models/index.ts`
 * barrel.
 *
 * Import this module only from the browser UI and store helpers. The
 * simulation workers should never depend on it because it pulls in React node
 * renderers and shared store hooks.
 *
 * Adding a new component touches THREE places: this registry, the symbol
 * registry, and `src/lib/palette.ts`. See the doc for the full procedure.
 */

import { CapPolarNode } from '../components/cap-polar/node';
import { CapacitorNode } from '../components/capacitor/node';
import { DiodeNode } from '../components/diode/node';
import { GroundNode } from '../components/ground/node';
import { JackNode } from '../components/jack/node';
import { JunctionNode } from '../components/junction/node';
import { LabelNode } from '../components/label/node';
import { OpAmpNode } from '../components/opamp/node';
import { PotNode } from '../components/pot/node';
import { PowerNode } from '../components/power/node';
import { ResistorNode } from '../components/resistor/node';
import { BJTNode } from '../components/transistors/bjt/node';
import { JFETNode } from '../components/transistors/jfet/node';
import { MOSFETNode } from '../components/transistors/mosfet/node';
import { BoxNode } from './box/node';
import { StickyNoteNode } from './stickynote/node';

export {
  DEFAULT_SYMBOL,
  resolveOpAmpSymbol,
  SYMBOLS,
} from '../components/symbol-registry';

/**
 * XYFlow node renderer map.
 *
 * This is browser-only because each entry is a React component. Keep it out of
 * worker import graphs so simulation startup does not evaluate UI modules.
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
