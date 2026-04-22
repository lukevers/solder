/**
 * Resistor symbol-domain model stub.
 *
 * Ideal resistors are emitted directly as `R...`
 * element lines in the netlist compiler, so this
 * domain does not need a separate `.model` card.
 *
 * There are no `.model` parameters to document for
 * this domain in this repo because resistance is
 * stored directly on the instance line.
 *
 * @see Ngspice User's Manual, `.MODEL`
 *   overview:
 *   https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 */
export {};
