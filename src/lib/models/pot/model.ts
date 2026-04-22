/**
 * Potentiometer symbol-domain model stub.
 *
 * Pots compile to two resistor elements whose
 * values are derived from position and taper, so
 * this domain does not use a standalone `.model`.
 *
 * There are no `.model` parameters to document for
 * this domain in this repo because the compiler
 * expands the pot into ordinary resistor instances.
 *
 * @see Ngspice User's Manual, `.MODEL`
 *   overview:
 *   https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 */
export {};
