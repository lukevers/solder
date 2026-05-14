/**
 * Unified palette catalog for all placeable circuit elements.
 *
 * Both the toolbar buttons and the command bar (triggered by the `a`
 * hotkey) consume this list so we never have to define the same
 * defaults in two places. Each entry has a stable `id` used to track
 * recent selections in the store and a `searchTokens` array that
 * lets the command bar match on aliases like "op-amp" → "opamp".
 *
 *   PALETTE_ITEMS  ──┬──▶  Toolbar (existing grouped buttons)
 *                    └──▶  CommandBar (alphabetical + recents)
 */

import { DEFAULT_NODE_COLOR } from './colors';
import { CIRCUIT_LABEL } from './constants';
import { JACK_DIRECTION } from './models/components/jack/types';
import {
  DEFAULT_SYMBOL,
  resolveOpAmpSymbol,
  SYMBOLS,
} from './models/components/symbol-registry';
import { DEFAULT_BOX_VARIANT } from './models/ui/box/constants';
import type { ComponentNode } from './types';

/**
 * Display headings used by the command bar to group the catalog into
 * sections. Order here drives the on-screen order of the lists.
 *
 *   PALETTE_CATEGORIES
 *           │
 *           ▼
 *   Recently Used
 *   Power
 *   Passives
 *   Diodes — Silicon
 *   Diodes — Germanium
 *   Transistors — BJT (NPN)
 *   Transistors — BJT (PNP)
 *   ...
 *   Annotations
 *   IO
 */
export const PALETTE_CATEGORIES = [
  'Power',
  'Passives',
  'Diodes — Silicon',
  'Diodes — Germanium',
  'Transistors — BJT (NPN)',
  'Transistors — BJT (PNP)',
  'Transistors — JFET (N-channel)',
  'Transistors — JFET (P-channel)',
  'Transistors — MOSFET (N-channel)',
  'Transistors — MOSFET (P-channel)',
  'ICs — Op-Amps',
  'Annotations',
  'IO',
] as const;

export type PaletteCategory = (typeof PALETTE_CATEGORIES)[number];

/**
 * One placeable thing in the catalog.
 *
 * `id` is a stable key used to identify the item in persisted "recently
 * used" data — never reuse an id once it's been published. `category`
 * names a section displayed in the command bar.
 */
export type PaletteItem = {
  id: string;
  label: string;
  description: string;
  category: PaletteCategory;
  type: ComponentNode['type'];
  defaultData: ComponentNode['data'];
  searchTokens?: Array<string>;
};

/**
 * Master list of every placeable item, in stable display order.
 *
 * The command bar re-sorts these alphabetically by `label`, but tests
 * and code that map over the catalog (e.g. validation) can rely on
 * this order staying stable across renders.
 */
export const PALETTE_ITEMS: Array<PaletteItem> = [
  // ── IO ────────────────────────────────────────────────
  {
    id: 'jack-in',
    label: 'Input Jack',
    description: 'Audio input jack',
    category: 'IO',
    type: 'jack',
    defaultData: {
      label: CIRCUIT_LABEL.input,
      direction: JACK_DIRECTION.in,
    },
    searchTokens: ['in', 'input', 'jack', 'audio'],
  },
  {
    id: 'jack-out',
    label: 'Output Jack',
    description: 'Audio output jack',
    category: 'IO',
    type: 'jack',
    defaultData: {
      label: CIRCUIT_LABEL.output,
      direction: JACK_DIRECTION.out,
    },
    searchTokens: ['out', 'output', 'jack', 'audio'],
  },

  // ── Power ─────────────────────────────────────────────
  {
    id: 'power',
    label: 'Power Supply',
    description: 'VCC / V+ power rail',
    category: 'Power',
    type: 'power',
    defaultData: { label: CIRCUIT_LABEL.power, volts: 9 },
    searchTokens: ['v+', 'vcc', 'supply', 'rail'],
  },
  {
    id: 'ground',
    label: 'Ground',
    description: 'Ground reference',
    category: 'Power',
    type: 'ground',
    defaultData: { label: CIRCUIT_LABEL.ground },
    searchTokens: ['gnd', '0v'],
  },

  // ── Passives ──────────────────────────────────────────
  {
    id: 'resistor',
    label: 'Resistor',
    description: 'Fixed resistor (10 kΩ)',
    category: 'Passives',
    type: 'resistor',
    defaultData: { label: 'R1', ohms: 10000 },
    searchTokens: ['r', 'ohms', 'resistor'],
  },
  {
    id: 'capacitor',
    label: 'Capacitor',
    description: 'Non-polarised capacitor (47 nF)',
    category: 'Passives',
    type: 'capacitor',
    defaultData: { label: 'C1', farads: 47e-9 },
    searchTokens: ['c', 'cap', 'farads'],
  },
  {
    id: 'cap-polar',
    label: 'Polarised Capacitor',
    description: 'Electrolytic capacitor (1 µF)',
    category: 'Passives',
    type: 'cap_polar',
    defaultData: { label: 'C1', farads: 1e-6 },
    searchTokens: ['c+', 'electrolytic', 'polar', 'cap'],
  },
  {
    id: 'pot',
    label: 'Potentiometer',
    description: '3-terminal pot (100 kΩ linear)',
    category: 'Passives',
    type: 'pot',
    defaultData: { label: 'VR1', ohms: 100000, position: 0.5, taper: 'linear' },
    searchTokens: ['pot', 'vr', 'variable', 'knob'],
  },

  // ── Diodes ────────────────────────────────────────────
  {
    id: 'diode-1n914',
    label: '1N914',
    description: 'Small signal silicon diode',
    category: 'Diodes — Silicon',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N914' },
    searchTokens: ['d', 'diode', 'signal', 'silicon'],
  },
  {
    id: 'diode-1n4001',
    label: '1N4001',
    description: '50 V silicon rectifier',
    category: 'Diodes — Silicon',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N4001' },
    searchTokens: ['d', 'diode', 'rectifier', 'silicon'],
  },
  {
    id: 'diode-1n4002',
    label: '1N4002',
    description: '100 V silicon rectifier',
    category: 'Diodes — Silicon',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N4002' },
    searchTokens: ['d', 'diode', 'rectifier', 'silicon'],
  },
  {
    id: 'diode-1n270',
    label: '1N270',
    description: 'Germanium signal diode',
    category: 'Diodes — Germanium',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N270' },
    searchTokens: ['d', 'diode', 'germanium', 'fuzz'],
  },
  {
    id: 'diode-1n34a',
    label: '1N34A',
    description: 'Germanium signal diode',
    category: 'Diodes — Germanium',
    type: 'diode',
    defaultData: { label: 'D1', model: '1N34A' },
    searchTokens: ['d', 'diode', 'germanium', 'fuzz'],
  },

  // ── BJTs ──────────────────────────────────────────────
  {
    id: 'bjt-2n3904',
    label: '2N3904',
    description: 'General purpose NPN',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: '2N3904' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor'],
  },
  {
    id: 'bjt-2n5088',
    label: '2N5088',
    description: 'NPN, high gain',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: '2N5088' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor'],
  },
  {
    id: 'bjt-2n5089',
    label: '2N5089',
    description: 'NPN, very high gain',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: '2N5089' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor'],
  },
  {
    id: 'bjt-bc108',
    label: 'BC108',
    description: 'NPN, Fuzz Face silicon',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: 'BC108' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor', 'fuzz'],
  },
  {
    id: 'bjt-bc549',
    label: 'BC549',
    description: 'NPN, low noise',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: 'BC549' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor'],
  },
  {
    id: 'bjt-mpsa18',
    label: 'MPSA18',
    description: 'NPN, ultra high gain',
    category: 'Transistors — BJT (NPN)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'NPN', model: 'MPSA18' },
    searchTokens: ['q', 'bjt', 'npn', 'transistor'],
  },
  {
    id: 'bjt-2n3906',
    label: '2N3906',
    description: 'General purpose PNP',
    category: 'Transistors — BJT (PNP)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'PNP', model: '2N3906' },
    searchTokens: ['q', 'bjt', 'pnp', 'transistor'],
  },
  {
    id: 'bjt-ac128',
    label: 'AC128',
    description: 'PNP germanium',
    category: 'Transistors — BJT (PNP)',
    type: 'bjt',
    defaultData: { label: 'Q1', polarity: 'PNP', model: 'AC128' },
    searchTokens: ['q', 'bjt', 'pnp', 'germanium', 'fuzz'],
  },

  // ── JFETs ─────────────────────────────────────────────
  {
    id: 'jfet-2n5457',
    label: '2N5457',
    description: 'N-channel JFET',
    category: 'Transistors — JFET (N-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: '2N5457' },
    searchTokens: ['j', 'jfet', 'fet'],
  },
  {
    id: 'jfet-2n5458',
    label: '2N5458',
    description: 'N-channel JFET',
    category: 'Transistors — JFET (N-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: '2N5458' },
    searchTokens: ['j', 'jfet', 'fet'],
  },
  {
    id: 'jfet-j201',
    label: 'J201',
    description: 'N-channel JFET',
    category: 'Transistors — JFET (N-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: 'J201' },
    searchTokens: ['j', 'jfet', 'fet'],
  },
  {
    id: 'jfet-j113',
    label: 'J113',
    description: 'N-channel JFET',
    category: 'Transistors — JFET (N-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: 'J113' },
    searchTokens: ['j', 'jfet', 'fet'],
  },
  {
    id: 'jfet-mpf102',
    label: 'MPF102',
    description: 'N-channel JFET',
    category: 'Transistors — JFET (N-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'N', model: 'MPF102' },
    searchTokens: ['j', 'jfet', 'fet'],
  },
  {
    id: 'jfet-2n5460',
    label: '2N5460',
    description: 'P-channel JFET',
    category: 'Transistors — JFET (P-channel)',
    type: 'jfet',
    defaultData: { label: 'J1', polarity: 'P', model: '2N5460' },
    searchTokens: ['j', 'jfet', 'fet'],
  },

  // ── MOSFETs ───────────────────────────────────────────
  {
    id: 'mosfet-bs170',
    label: 'BS170',
    description: 'N-channel MOSFET',
    category: 'Transistors — MOSFET (N-channel)',
    type: 'mosfet',
    defaultData: { label: 'M1', polarity: 'N', model: 'BS170' },
    searchTokens: ['m', 'mosfet', 'fet'],
  },
  {
    id: 'mosfet-2n7000',
    label: '2N7000',
    description: 'N-channel MOSFET',
    category: 'Transistors — MOSFET (N-channel)',
    type: 'mosfet',
    defaultData: { label: 'M1', polarity: 'N', model: '2N7000' },
    searchTokens: ['m', 'mosfet', 'fet'],
  },
  {
    id: 'mosfet-irf510',
    label: 'IRF510',
    description: 'N-channel power MOSFET',
    category: 'Transistors — MOSFET (N-channel)',
    type: 'mosfet',
    defaultData: { label: 'M1', polarity: 'N', model: 'IRF510' },
    searchTokens: ['m', 'mosfet', 'fet', 'power'],
  },
  {
    id: 'mosfet-irf9510',
    label: 'IRF9510',
    description: 'P-channel power MOSFET',
    category: 'Transistors — MOSFET (P-channel)',
    type: 'mosfet',
    defaultData: { label: 'M1', polarity: 'P', model: 'IRF9510' },
    searchTokens: ['m', 'mosfet', 'fet', 'power'],
  },

  // ── ICs ───────────────────────────────────────────────
  {
    id: 'opamp-tl072',
    label: 'TL072',
    description: 'JFET dual op-amp',
    category: 'ICs — Op-Amps',
    type: 'opamp',
    defaultData: { label: 'U1', model: 'TL072' },
    searchTokens: ['u', 'opamp', 'op-amp', 'ic', 'tl072'],
  },
  {
    id: 'opamp-lm741',
    label: 'LM741',
    description: 'Classic single op-amp',
    category: 'ICs — Op-Amps',
    type: 'opamp',
    defaultData: { label: 'U1', model: 'LM741' },
    searchTokens: ['u', 'opamp', 'op-amp', 'ic', 'lm741'],
  },
  {
    id: 'opamp-lm308',
    label: 'LM308',
    description: 'Low input current op-amp (RAT)',
    category: 'ICs — Op-Amps',
    type: 'opamp',
    defaultData: { label: 'U1', model: 'LM308' },
    searchTokens: ['u', 'opamp', 'op-amp', 'ic', 'lm308', 'rat'],
  },

  // ── Annotations ───────────────────────────────────────
  {
    id: 'label',
    label: 'Net Label',
    description: 'Named net for cross-wire connections',
    category: 'Annotations',
    type: 'label',
    defaultData: { label: 'NET1' },
    searchTokens: ['net', 'label', 'name'],
  },
  {
    id: 'junction',
    label: 'Junction',
    description: 'T-junction for branching wires',
    category: 'Annotations',
    type: 'junction',
    defaultData: { label: '' },
    searchTokens: ['junction', 'tee', 'branch'],
  },
  {
    id: 'box',
    label: 'Schematic Box',
    description: 'Group/section box',
    category: 'Annotations',
    type: 'box',
    defaultData: {
      label: '',
      color: DEFAULT_NODE_COLOR,
      variant: DEFAULT_BOX_VARIANT,
    },
    searchTokens: ['box', 'group', 'section'],
  },
  {
    id: 'stickynote',
    label: 'Sticky Note',
    description: 'Free-form annotation note',
    category: 'Annotations',
    type: 'stickynote',
    defaultData: { label: 'Note', text: '' },
    searchTokens: ['note', 'sticky', 'comment'],
  },
];

/**
 * Lookup table for palette items by id.
 *
 * Used when the store carries forward a recently-used id and the UI
 * needs to render its label or rebuild the node defaults.
 */
export const PALETTE_BY_ID: Record<string, PaletteItem> = Object.fromEntries(
  PALETTE_ITEMS.map((item) => [item.id, item]),
);

/**
 * Maximum number of recently-used palette items the command bar
 * displays at the top, mirroring KiCad's "recent symbols" section.
 */
export const RECENTLY_USED_LIMIT = 5;

/**
 * Auto-increment a default reference designator like `R1`, `C1`, or
 * `Q1` so each placed node gets a unique label.
 *
 * Splits the default into its alphabetic prefix and numeric suffix,
 * scans the existing nodes for the highest used number with the same
 * prefix, and returns `<prefix><max+1>`. Labels that do not match the
 * `<letters><digits>` shape are returned unchanged.
 */
export function nextLabel(
  defaultLabel: string,
  nodes: Array<ComponentNode>,
): string {
  const match = defaultLabel.match(/^([A-Za-z]+)(\d+)$/);
  if (!match) {
    return defaultLabel;
  }

  const prefix = match[1];
  const re = new RegExp(`^${prefix}(\\d+)$`, 'i');

  let max = 0;
  for (const node of nodes) {
    const lbl = (node.data as { label?: string }).label;
    if (typeof lbl !== 'string') {
      continue;
    }

    const m = lbl.match(re);
    if (m) {
      max = Math.max(max, parseInt(m[1], 10));
    }
  }

  return `${prefix}${max + 1}`;
}

/**
 * Default box dimensions used when the toolbar / command bar drops a
 * fresh schematic box on the canvas. Kept here so the placement code
 * can centre the box on the cursor without duplicating literals.
 */
const DEFAULT_BOX_SIZE = { width: 200, height: 150 } as const;

/**
 * Anything carrying enough information to place a node — either a
 * full PaletteItem or one of the inline literals the toolbar still
 * defines for stickynote / jack handling.
 */
export type PlaceableSpec = {
  type: ComponentNode['type'];
  defaultData: ComponentNode['data'];
};

/**
 * Best-effort rendered size of a placeable spec before XYFlow has had
 * a chance to measure it.
 *
 * The schematic uses `ensureMeasured` to inject the same dimensions
 * onto loaded circuits, but at placement time the node does not yet
 * exist in the DOM. Returning the symbol-registry width/height (or a
 * sensible per-type fallback) lets the placement code centre the
 * cursor on the symbol body. Returns `null` for types we have no
 * reasonable default for, in which case the caller should fall back
 * to top-left placement.
 */
export function getPaletteItemDimensions(
  item: PlaceableSpec,
): { width: number; height: number } | null {
  const model = (item.defaultData as { model?: string }).model;

  switch (item.type) {
    case 'opamp': {
      const symbol = resolveOpAmpSymbol(model ?? 'TL072');
      return { width: symbol.width, height: symbol.height };
    }
    case 'diode': {
      const symbolId =
        (model && DEFAULT_SYMBOL.diode[model]) ??
        Object.values(DEFAULT_SYMBOL.diode)[0];
      const symbol = SYMBOLS[symbolId];

      if (symbol) {
        return { width: symbol.width, height: symbol.height };
      }
      return null;
    }
    case 'resistor':
      return { width: 80, height: 40 };
    case 'capacitor':
    case 'cap_polar':
      return { width: 60, height: 40 };
    case 'pot':
      return { width: 80, height: 60 };
    case 'junction':
      return { width: 20, height: 20 };
    case 'jack':
      return { width: 80, height: 60 };
    case 'ground':
      return { width: 40, height: 36 };
    case 'power':
      return { width: 40, height: 48 };
    case 'bjt':
    case 'jfet':
    case 'mosfet':
      return { width: 60, height: 60 };
    case 'box':
      return { ...DEFAULT_BOX_SIZE };
    case 'label':
    case 'stickynote':
      return null;
    default:
      return null;
  }
}

/**
 * Snap a coordinate to a 5 px grid biased toward the lower value.
 *
 * The schematic uses a 10 px snap for moves and connections, but
 * placement centred on a symbol body can land on a half-cell offset
 * (e.g. centring an 80×40 resistor on a cursor at x=125 puts the
 * top-left at x=85, which is still grid-aligned). Floor-snapping to
 * 5 px keeps every placement on a "0 or 5" boundary while preferring
 * the upper-left of any ambiguous pair, matching the user's request.
 */
function snapToFiveFloor(value: number): number {
  return Math.floor(value / 5) * 5;
}

/**
 * Build a fully-formed `ComponentNode` from a palette item and a
 * target flow-space position.
 *
 * `position` is treated as where the *centre* of the symbol body
 * should land. We look up the rendered dimensions (`getPaletteItem-
 * Dimensions`), shift the top-left so the body is centred on the
 * cursor, and snap to a 5 px grid biased toward the upper-left so
 * the result always sits on a "clean" coordinate.
 *
 *   cursor (x,y)
 *         │
 *         ▼
 *      ┌─────┐
 *      │  ●  │   ← node body, centred on (x, y)
 *      └─────┘
 *
 * Items with no known body size (labels, sticky notes) fall back to
 * using the cursor position as the top-left, since their visual
 * "centre" is poorly defined and any guess would feel arbitrary.
 */
export function buildPaletteNode(
  item: PlaceableSpec,
  position: { x: number; y: number },
  existingNodes: Array<ComponentNode>,
): ComponentNode {
  const defaultLabel = (item.defaultData as { label?: string }).label ?? '';
  const label = nextLabel(defaultLabel, existingNodes);

  const dims = getPaletteItemDimensions(item);
  const topLeftX = dims ? position.x - dims.width / 2 : position.x;
  const topLeftY = dims ? position.y - dims.height / 2 : position.y;

  const x = snapToFiveFloor(topLeftX);
  const y = snapToFiveFloor(topLeftY);

  const isBox = item.type === 'box';

  return {
    id: crypto.randomUUID(),
    type: item.type,
    position: { x, y },
    data: { ...item.defaultData, label },
    ...(isBox
      ? {
          zIndex: -1,
          style: { ...DEFAULT_BOX_SIZE },
          dragHandle: '.box-drag-handle',
          className: 'box-node-wrapper',
        }
      : {}),
  } as ComponentNode;
}
