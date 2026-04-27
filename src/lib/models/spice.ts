/**
 * Shared helpers for building SPICE model definitions from typed parameter
 * objects.
 *
 * Compact semiconductor models in SPICE all serialize to the same basic shape:
 *
 *   .model NAME TYPE(P1=... P2=... P3=...)
 *
 * The domain-specific model files define the parameter interfaces and
 * subclasses. This file only handles common rendering mechanics.
 */

/**
 * Primitive value types accepted on a SPICE element or model line.
 *
 * We allow strings because many model cards use unit suffixes such as `p`,
 * `n`, `u`, `Meg`.
 */
export type SpiceParamValue = number | string;

/**
 * Generic record shape for a compact-model parameter bag.
 *
 * Undefined entries are omitted from the rendered `.model` line.
 */
export type SpiceParamRecord = Record<string, SpiceParamValue | undefined>;

/**
 * Object shape accepted by the generic compact model builder.
 *
 * Domain-specific interfaces usually enumerate a fixed set of optional fields
 * instead of using an open index signature, so the builder accepts any object
 * and only indexes keys from the explicit ordering array.
 */
type SpiceParamObject = object;

/**
 * Render a single SPICE token value.
 *
 * Numbers are stringified directly. Strings are assumed to already be valid
 * SPICE literals.
 */
function formatSpiceValue(value: SpiceParamValue): string {
  return String(value);
}

/**
 * Render a compact-model parameter list in a deterministic order.
 *
 * Keeping a stable order matters for readable diffs, snapshot-style tests, and
 * comparing model output against reference cards.
 */
function renderParamList<TParams extends SpiceParamObject>(
  params: TParams,
  order: ReadonlyArray<keyof TParams & string>,
): string {
  const tokens: Array<string> = [];

  for (const key of order) {
    const value = params[key] as SpiceParamValue | undefined;

    if (value === undefined) {
      continue;
    }

    tokens.push(`${key}=${formatSpiceValue(value)}`);
  }

  return tokens.join(' ');
}

/**
 * Base class for single-line SPICE `.model` definitions.
 *
 * Domain-specific subclasses choose the legal parameter set and device type,
 * such as `D`, `NPN`, `NJF`, or `NMOS`.
 */
export class SpiceCompactModel<TParams extends SpiceParamObject> {
  readonly name: string;
  readonly deviceType: string;
  readonly params: TParams;
  readonly order: ReadonlyArray<keyof TParams & string>;

  constructor(
    name: string,
    deviceType: string,
    params: TParams,
    order: ReadonlyArray<keyof TParams & string>,
  ) {
    this.name = name;
    this.deviceType = deviceType;
    this.params = params;
    this.order = order;
  }

  /**
   * Serialize the model into ngspice-compatible `.model` syntax.
   */
  toString(): string {
    const body = renderParamList(this.params, this.order);

    return `.model ${this.name} ${this.deviceType}(${body})`;
  }
}

/**
 * Wrapper for raw multi-line SPICE definitions such as `.SUBCKT` blocks.
 *
 * The current op-amp macromodels are already authored as explicit SPICE text,
 * so the main value here is giving them the same `toString()` interface as
 * compact models.
 */
export class SpiceSubcircuit {
  readonly body: string;

  constructor(body: string) {
    this.body = body;
  }

  /**
   * Return the raw `.SUBCKT` block exactly as it should appear in the compiled
   * netlist.
   */
  toString(): string {
    return this.body;
  }
}
