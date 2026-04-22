/**
 * Shared symbol type definitions.
 *
 * These types describe the structure of a
 * schematic symbol: how it looks on the canvas,
 * where its pins live, and what electrical role
 * each pin serves.
 */

/**
 * Electrical category of a pin.
 *
 * Drives visual style cues (colour, dash pattern)
 * and future DRC (design rule check) hints.
 *
 *   input   — signal enters the component
 *   output  — signal leaves the component
 *   power   — supply rail (VCC, GND)
 *   passive — bidirectional (resistor legs, etc.)
 *   nc      — no-connect / decorative only
 */
export type PinKind = 'input' | 'output' | 'power' | 'passive' | 'nc';

/**
 * Which edge of the symbol body the pin stub
 * emerges from.
 */
export type PinSide = 'left' | 'right' | 'top' | 'bottom';

/**
 * A single pin on a schematic symbol.
 *
 * Pins map directly to XYFlow handles. The `id` field
 * must match the handle IDs expected by the netlist
 * compiler so that wiring produces valid SPICE nets.
 *
 * Layout reference (resistor example):
 *
 *         ┌──────────┐
 *   a ────┤  body    ├──── b
 *         └──────────┘
 *
 *   a.side = 'left',  a.offset = '50%'
 *   b.side = 'right', b.offset = '50%'
 */
export type SymbolPin = {
  /**
   * XYFlow handle ID — must match the IDs expected
   * by the netlist compiler.
   */
  id: string;

  /**
   * Physical pin number displayed on DIP-style
   * bodies.
   */
  number: number;

  /**
   * Functional label shown to the user, for
   * example IN+, V-, or OUT.
   */
  name: string;

  /**
   * Edge of the symbol body this pin lives on.
   */
  side: PinSide;

  /**
   * Pixel offset along the edge (from top for
   * left/right sides, from left for top/bottom
   * sides). Use '50%' to centre on the edge.
   */
  offset: number | '50%';

  /**
   * Electrical type — controls stub colour and
   * future DRC hints.
   */
  kind: PinKind;

  /**
   * True → XYFlow handle is rendered and wirable;
   * false → decorative only.
   */
  connectable: boolean;

  /**
   * True → renders as a 'source' handle (output);
   * defaults to 'target' (input).
   */
  source?: boolean;
};

/**
 * How the component body is drawn on the canvas.
 *
 * Node renderers switch on this value to choose
 * the appropriate SVG drawing. Pin data (SymbolPin)
 * drives handle placement for every style.
 *
 *   opamp-triangle — standard triangular op-amp
 *   dip            — rectangular DIP IC body
 *   resistor       — two-terminal zigzag/box
 *   capacitor      — two-terminal plate lines
 *   cap-polar      — polarised capacitor
 *   diode          — triangle + bar
 *   bjt            — bipolar junction transistor
 *   jfet           — junction FET
 *   mosfet         — MOSFET
 *   pot            — potentiometer (three terminals)
 *   power-flag     — power-rail arrow (VCC / +V)
 *   ground         — ground symbol
 *   jack           — mono audio jack (in or out)
 *   label          — net label arrow
 */
export type SymbolStyle =
  | 'opamp-triangle'
  | 'dip'
  | 'resistor'
  | 'capacitor'
  | 'cap-polar'
  | 'diode'
  | 'bjt'
  | 'jfet'
  | 'mosfet'
  | 'pot'
  | 'power-flag'
  | 'ground'
  | 'jack'
  | 'label';

/**
 * Complete definition of a schematic symbol.
 *
 * A SymbolDef describes how a component looks on
 * the canvas:
 *   - Overall bounding box (width × height)
 *   - Body style (triangle, DIP, zigzag, …)
 *   - All pins with positions and electrical types
 *
 * Each component's `data.symbol` field names a
 * SymbolDef by its `id`. When absent, DEFAULT_SYMBOL
 * in the index resolves the appropriate default for
 * the component's model.
 */
export type SymbolDef = {
  /**
   * Unique library identifier, for example
   * `opamp/lm308-dip8`.
   */
  id: string;

  /**
   * Human-readable name shown in pickers.
   */
  name: string;

  description?: string;

  /**
   * Bounding box matching the NodeShell dimensions
   * for this symbol.
   */
  width: number;
  height: number;

  /**
   * Controls body drawing; see SymbolStyle.
   */
  style: SymbolStyle;

  /**
   * Complete pin list, including connectable and
   * decorative pins.
   */
  pins: Array<SymbolPin>;
};
