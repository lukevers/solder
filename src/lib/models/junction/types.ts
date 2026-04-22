/**
 * Data payload for a junction (wire splice) node.
 *
 * Junction nodes are wiring artifacts that merge multiple handles into one
 * electrical net. They do not emit device elements or `.model` cards.
 */
export type JunctionData = {
  label: string;
};
