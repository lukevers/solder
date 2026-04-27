/**
 * Power-symbol domain model stub.
 *
 * Power nodes compile to voltage-source elements
 * and act like global net labels. No separate
 * semiconductor `.model` card is required.
 *
 * There are no local `.model` parameters to
 * document for this domain because the compiler
 * emits independent source instances instead.
 *
 * @see Ngspice User's Manual, independent
 *   voltage/current sources and `.MODEL`
 *   overview:
 *   https://ngspice.sourceforge.io/docs/ngspice-manual.pdf
 */
export {};
