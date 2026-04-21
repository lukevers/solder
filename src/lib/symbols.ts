// Symbol library — defines schematic symbols for circuit components,
// independent of the electrical model. Inspired by KiCad's symbol library.
//
// A SymbolDef describes how a component looks on the canvas:
//   - Overall bounding box (width × height, matches NodeShell)
//   - Body style (triangle, DIP rectangle, resistor zigzag, …)
//   - All pins: handle ID, physical number, name, position, electrical type
//
// Each component's data.symbol field names a SymbolDef by ID.
// When absent, DEFAULT_SYMBOL resolves the appropriate default for the model.

// ── Pin metadata ─────────────────────────────────────────────────────────────

/** Electrical category of a pin — drives visual style cues (colour, dash). */
export type PinKind = 'input' | 'output' | 'power' | 'passive' | 'nc';

/** Which edge of the symbol body the pin stub emerges from. */
export type PinSide = 'left' | 'right' | 'top' | 'bottom';

export type SymbolPin = {
  /** XYFlow handle ID — must match the IDs expected by the netlist compiler. */
  id: string;
  /** Physical pin number displayed on DIP-style bodies. */
  number: number;
  /** Functional label (IN+, V−, OUT, …). */
  name: string;
  /** Edge of the body this pin lives on. */
  side: PinSide;
  /**
   * Pixel offset along the edge (from top for left/right sides,
   * from left for top/bottom sides). Use '50%' to centre on the edge.
   */
  offset: number | '50%';
  /** Electrical type — controls stub colour and future DRC hints. */
  kind: PinKind;
  /** True → XYFlow handle is rendered and wirable; false → decorative only. */
  connectable: boolean;
  /** True → renders as a 'source' handle (output); defaults to 'target' (input). */
  source?: boolean;
};

// ── Symbol body styles ────────────────────────────────────────────────────────

/**
 * How the component body is drawn.
 * Node renderers switch on this value; pin data drives handle placement
 * for every style.
 */
export type SymbolStyle =
  | 'opamp-triangle' // standard triangular op-amp schematic symbol
  | 'dip' // rectangular DIP IC body with numbered pin stubs
  | 'resistor' // two-terminal zigzag/box body
  | 'capacitor' // two-terminal capacitor plate lines
  | 'cap-polar' // polarised capacitor (flat + curved plates)
  | 'diode' // triangle + bar
  | 'bjt' // bipolar junction transistor schematic
  | 'jfet' // junction FET schematic
  | 'mosfet' // MOSFET schematic
  | 'pot' // potentiometer (three terminals)
  | 'power-flag' // power-rail arrow (VCC / +V)
  | 'ground' // ground symbol (descending lines)
  | 'jack' // mono audio jack (in or out)
  | 'label'; // net label arrow

// ── Symbol definition ─────────────────────────────────────────────────────────

export type SymbolDef = {
  /** Unique library identifier, e.g. 'opamp/lm308-dip8'. */
  id: string;
  /** Human-readable name shown in pickers. */
  name: string;
  description?: string;
  /** Bounding box matching the NodeShell dimensions for this symbol. */
  width: number;
  height: number;
  /** Controls body drawing; see SymbolStyle. */
  style: SymbolStyle;
  /** Complete pin list — both connectable and decorative. */
  pins: Array<SymbolPin>;
};

// ── Op-amp symbols ────────────────────────────────────────────────────────────

export const SYM_OPAMP_TRIANGLE: SymbolDef = {
  id: 'opamp/triangle',
  name: 'Op-amp (triangle)',
  description: 'Standard schematic triangle. Power pins on top/bottom edges.',
  width: 80,
  height: 80,
  style: 'opamp-triangle',
  pins: [
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 20,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 60,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'top',
      offset: '50%',
      kind: 'power',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'bottom',
      offset: '50%',
      kind: 'power',
      connectable: true,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: '50%',
      kind: 'output',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_LM741_DIP8: SymbolDef = {
  id: 'opamp/lm741-dip8',
  name: 'LM741 (DIP-8)',
  description: 'General-purpose single op-amp. Pins 1, 5, 8 are decorative.',
  width: 96,
  height: 80,
  style: 'dip',
  pins: [
    {
      id: 'null_neg',
      number: 1,
      name: 'Null−',
      side: 'left',
      offset: 10,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 30,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 50,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'left',
      offset: 70,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'null_pos',
      number: 5,
      name: 'Null+',
      side: 'right',
      offset: 70,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: 50,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'right',
      offset: 30,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'nc8',
      number: 8,
      name: 'NC',
      side: 'right',
      offset: 10,
      kind: 'nc',
      connectable: false,
    },
  ],
};

export const SYM_LM308_DIP8: SymbolDef = {
  id: 'opamp/lm308-dip8',
  name: 'LM308 (DIP-8)',
  description:
    'Precision slow op-amp. Pins 1 & 8 are connectable: wire a 47 pF cap between them for the classic RAT frequency-compensation network.',
  width: 96,
  height: 80,
  style: 'dip',
  pins: [
    {
      id: 'null_neg',
      number: 1,
      name: 'Null−',
      side: 'left',
      offset: 10,
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'in_neg',
      number: 2,
      name: 'IN−',
      side: 'left',
      offset: 30,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'in_pos',
      number: 3,
      name: 'IN+',
      side: 'left',
      offset: 50,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'gnd',
      number: 4,
      name: 'V−',
      side: 'left',
      offset: 70,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'null_pos',
      number: 5,
      name: 'Null+',
      side: 'right',
      offset: 70,
      kind: 'passive',
      connectable: false,
    },
    {
      id: 'out',
      number: 6,
      name: 'OUT',
      side: 'right',
      offset: 50,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'vcc',
      number: 7,
      name: 'V+',
      side: 'right',
      offset: 30,
      kind: 'power',
      connectable: true,
    },
    {
      id: 'comp',
      number: 8,
      name: 'Comp',
      side: 'right',
      offset: 10,
      kind: 'passive',
      connectable: true,
    },
  ],
};

// ── Passive component symbols ─────────────────────────────────────────────────

export const SYM_RESISTOR: SymbolDef = {
  id: 'resistor/standard',
  name: 'Resistor',
  width: 80,
  height: 40,
  style: 'resistor',
  pins: [
    {
      id: 'a',
      number: 1,
      name: 'A',
      side: 'left',
      offset: '50%',
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'b',
      number: 2,
      name: 'B',
      side: 'right',
      offset: '50%',
      kind: 'passive',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_CAPACITOR: SymbolDef = {
  id: 'capacitor/standard',
  name: 'Capacitor',
  width: 60,
  height: 40,
  style: 'capacitor',
  pins: [
    {
      id: 'a',
      number: 1,
      name: 'A',
      side: 'left',
      offset: '50%',
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'b',
      number: 2,
      name: 'B',
      side: 'right',
      offset: '50%',
      kind: 'passive',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_CAP_POLAR: SymbolDef = {
  id: 'capacitor/polar',
  name: 'Capacitor (polarised)',
  width: 60,
  height: 40,
  style: 'cap-polar',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: '+',
      side: 'left',
      offset: '50%',
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'neg',
      number: 2,
      name: '−',
      side: 'right',
      offset: '50%',
      kind: 'passive',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_POT: SymbolDef = {
  id: 'pot/standard',
  name: 'Potentiometer',
  width: 80,
  height: 60,
  style: 'pot',
  pins: [
    {
      id: 'ccw',
      number: 1,
      name: 'CCW',
      side: 'left',
      offset: 20,
      kind: 'passive',
      connectable: true,
    },
    {
      id: 'cw',
      number: 3,
      name: 'CW',
      side: 'right',
      offset: 20,
      kind: 'passive',
      connectable: true,
      source: true,
    },
    {
      id: 'wiper',
      number: 2,
      name: 'Wiper',
      side: 'bottom',
      offset: '50%',
      kind: 'output',
      connectable: true,
      source: true,
    },
  ],
};

// ── Diode symbols ─────────────────────────────────────────────────────────────

const _diodePins: Array<SymbolPin> = [
  {
    id: 'a',
    number: 1,
    name: 'A',
    side: 'left',
    offset: '50%',
    kind: 'passive',
    connectable: true,
  },
  {
    id: 'k',
    number: 2,
    name: 'K',
    side: 'right',
    offset: '50%',
    kind: 'passive',
    connectable: true,
    source: true,
  },
];

export const SYM_DIODE_1N914: SymbolDef = {
  id: 'diode/1n914',
  name: '1N914',
  description: 'Small-signal switching diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

export const SYM_DIODE_1N4001: SymbolDef = {
  id: 'diode/1n4001',
  name: '1N4001',
  description: 'General-purpose rectifier diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

export const SYM_DIODE_1N4002: SymbolDef = {
  id: 'diode/1n4002',
  name: '1N4002',
  description: '100V rectifier diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

export const SYM_DIODE_1N270: SymbolDef = {
  id: 'diode/1n270',
  name: '1N270',
  description: 'Germanium point-contact diode',
  width: 60,
  height: 40,
  style: 'diode',
  pins: _diodePins,
};

// ── Transistor symbols ────────────────────────────────────────────────────────

const _bjtPins: Array<SymbolPin> = [
  {
    id: 'b',
    number: 1,
    name: 'B',
    side: 'left',
    offset: '50%',
    kind: 'input',
    connectable: true,
  },
  {
    id: 'c',
    number: 2,
    name: 'C',
    side: 'right',
    offset: 10,
    kind: 'output',
    connectable: true,
    source: true,
  },
  {
    id: 'e',
    number: 3,
    name: 'E',
    side: 'right',
    offset: 50,
    kind: 'output',
    connectable: true,
    source: true,
  },
];

export const SYM_BJT_NPN: SymbolDef = {
  id: 'bjt/npn',
  name: 'NPN BJT',
  width: 60,
  height: 60,
  style: 'bjt',
  pins: _bjtPins,
};

export const SYM_BJT_PNP: SymbolDef = {
  id: 'bjt/pnp',
  name: 'PNP BJT',
  width: 60,
  height: 60,
  style: 'bjt',
  pins: _bjtPins,
};

const _fetPins: Array<SymbolPin> = [
  {
    id: 'g',
    number: 1,
    name: 'G',
    side: 'left',
    offset: '50%',
    kind: 'input',
    connectable: true,
  },
  {
    id: 'd',
    number: 2,
    name: 'D',
    side: 'right',
    offset: 10,
    kind: 'output',
    connectable: true,
    source: true,
  },
  {
    id: 's',
    number: 3,
    name: 'S',
    side: 'right',
    offset: 50,
    kind: 'output',
    connectable: true,
    source: true,
  },
];

export const SYM_JFET_N: SymbolDef = {
  id: 'jfet/n',
  name: 'N-channel JFET',
  width: 60,
  height: 60,
  style: 'jfet',
  pins: _fetPins,
};

export const SYM_JFET_P: SymbolDef = {
  id: 'jfet/p',
  name: 'P-channel JFET',
  width: 60,
  height: 60,
  style: 'jfet',
  pins: _fetPins,
};

export const SYM_MOSFET_N: SymbolDef = {
  id: 'mosfet/n',
  name: 'N-channel MOSFET',
  width: 60,
  height: 60,
  style: 'mosfet',
  pins: _fetPins,
};

export const SYM_MOSFET_P: SymbolDef = {
  id: 'mosfet/p',
  name: 'P-channel MOSFET',
  width: 60,
  height: 60,
  style: 'mosfet',
  pins: _fetPins,
};

// ── Power / ground ────────────────────────────────────────────────────────────

export const SYM_POWER: SymbolDef = {
  id: 'power/vcc',
  name: 'Power (VCC)',
  width: 40,
  height: 40,
  style: 'power-flag',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: '+',
      side: 'bottom',
      offset: '50%',
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_GROUND: SymbolDef = {
  id: 'ground/standard',
  name: 'Ground',
  width: 40,
  height: 36,
  style: 'ground',
  pins: [
    {
      id: 'gnd',
      number: 1,
      name: 'GND',
      side: 'top',
      offset: '50%',
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};

// ── Audio jacks ───────────────────────────────────────────────────────────────

export const SYM_JACK_IN: SymbolDef = {
  id: 'jack/in',
  name: 'Audio In',
  width: 80,
  height: 60,
  style: 'jack',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: 'Sig',
      side: 'right',
      offset: 20,
      kind: 'output',
      connectable: true,
      source: true,
    },
    {
      id: 'neg',
      number: 2,
      name: 'GND',
      side: 'right',
      offset: 44,
      kind: 'power',
      connectable: true,
      source: true,
    },
  ],
};

export const SYM_JACK_OUT: SymbolDef = {
  id: 'jack/out',
  name: 'Audio Out',
  width: 80,
  height: 60,
  style: 'jack',
  pins: [
    {
      id: 'pos',
      number: 1,
      name: 'Sig',
      side: 'left',
      offset: 20,
      kind: 'input',
      connectable: true,
    },
    {
      id: 'neg',
      number: 2,
      name: 'GND',
      side: 'left',
      offset: 44,
      kind: 'power',
      connectable: true,
    },
  ],
};

// ── Library registry ──────────────────────────────────────────────────────────

/** All known symbols, keyed by their ID. */
export const SYMBOLS: Record<string, SymbolDef> = {
  [SYM_OPAMP_TRIANGLE.id]: SYM_OPAMP_TRIANGLE,
  [SYM_LM741_DIP8.id]: SYM_LM741_DIP8,
  [SYM_LM308_DIP8.id]: SYM_LM308_DIP8,
  [SYM_RESISTOR.id]: SYM_RESISTOR,
  [SYM_CAPACITOR.id]: SYM_CAPACITOR,
  [SYM_CAP_POLAR.id]: SYM_CAP_POLAR,
  [SYM_POT.id]: SYM_POT,
  [SYM_DIODE_1N914.id]: SYM_DIODE_1N914,
  [SYM_DIODE_1N4001.id]: SYM_DIODE_1N4001,
  [SYM_DIODE_1N4002.id]: SYM_DIODE_1N4002,
  [SYM_DIODE_1N270.id]: SYM_DIODE_1N270,
  [SYM_BJT_NPN.id]: SYM_BJT_NPN,
  [SYM_BJT_PNP.id]: SYM_BJT_PNP,
  [SYM_JFET_N.id]: SYM_JFET_N,
  [SYM_JFET_P.id]: SYM_JFET_P,
  [SYM_MOSFET_N.id]: SYM_MOSFET_N,
  [SYM_MOSFET_P.id]: SYM_MOSFET_P,
  [SYM_POWER.id]: SYM_POWER,
  [SYM_GROUND.id]: SYM_GROUND,
  [SYM_JACK_IN.id]: SYM_JACK_IN,
  [SYM_JACK_OUT.id]: SYM_JACK_OUT,
};

// ── Default symbol resolution ─────────────────────────────────────────────────

/**
 * Default symbol ID for each component type + model/variant.
 * Used when data.symbol is absent.
 */
export const DEFAULT_SYMBOL = {
  opamp: {
    TL072: SYM_OPAMP_TRIANGLE.id,
    LM741: SYM_LM741_DIP8.id,
    LM308: SYM_LM308_DIP8.id,
  } as Record<string, string>,

  diode: {
    '1N914': SYM_DIODE_1N914.id,
    '1N4001': SYM_DIODE_1N4001.id,
    '1N4002': SYM_DIODE_1N4002.id,
    '1N270': SYM_DIODE_1N270.id,
  } as Record<string, string>,

  bjt: {
    NPN: SYM_BJT_NPN.id,
    PNP: SYM_BJT_PNP.id,
  } as Record<string, string>,

  jfet: {
    N: SYM_JFET_N.id,
    P: SYM_JFET_P.id,
  } as Record<string, string>,

  mosfet: {
    N: SYM_MOSFET_N.id,
    P: SYM_MOSFET_P.id,
  } as Record<string, string>,
} as const;

/**
 * Resolve a SymbolDef for an op-amp node.
 * Falls back through: data.symbol → model default → triangle.
 */
export function resolveOpAmpSymbol(
  model: string,
  symbolId?: string,
): SymbolDef {
  const defaultId = DEFAULT_SYMBOL.opamp[model] ?? SYM_OPAMP_TRIANGLE.id;
  const id = symbolId ?? defaultId;
  return SYMBOLS[id] ?? SYMBOLS[defaultId] ?? SYM_OPAMP_TRIANGLE;
}
