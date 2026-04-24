import { EXAMPLE_CATEGORY, type ExampleCategory } from '../examples';

/**
 * Default category assigned to circuits that do not declare one explicitly.
 *
 * The examples list already treats plain building-block circuits as a first
 * class category, so imported or newly created tabs fall back to that bucket
 * instead of inventing a separate "uncategorized" value.
 */
export const DEFAULT_CIRCUIT_CATEGORY = EXAMPLE_CATEGORY.circuits;

/**
 * Stable metadata persisted alongside a circuit schematic.
 *
 * These fields are the user-editable export/import metadata for a circuit.
 * They are intentionally separate from a tab's runtime `id`, which only
 * exists to track open workspaces in the editor.
 */
export type CircuitMetadata = {
  name: string;
  description: string;
  tags: Array<string>;
  category: ExampleCategory;
};

/**
 * Set of valid example-category ids accepted by circuit import and editing.
 *
 * Keeping the runtime membership test derived from `EXAMPLE_CATEGORY` avoids
 * repeating the raw strings in validation code.
 */
const CIRCUIT_CATEGORY_SET = new Set(Object.values(EXAMPLE_CATEGORY));

/**
 * Return true when a raw value is one of the supported circuit categories.
 *
 * Import validation accepts unknown JSON, so this runtime guard narrows the
 * category safely before we store it in tab metadata.
 */
export function isCircuitCategory(value: unknown): value is ExampleCategory {
  return (
    typeof value === 'string' &&
    CIRCUIT_CATEGORY_SET.has(value as ExampleCategory)
  );
}

/**
 * Normalize a raw tags input into the trimmed string array used by the app.
 *
 * Imports and modal form state may include empty strings or non-string
 * entries. Stripping that noise here keeps the rest of the codebase working
 * with a consistent `string[]`.
 */
export function normalizeCircuitTags(tags: unknown): Array<string> {
  if (!Array.isArray(tags)) {
    return [];
  }

  return tags
    .filter((tag): tag is string => typeof tag === 'string')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/**
 * Build a complete metadata object from partial or loosely typed input.
 *
 * This is used by tab creation, persisted-state hydration, and JSON import so
 * all of those entry points share the same defaults for missing description,
 * tags, and category.
 */
export function normalizeCircuitMetadata(input: {
  name?: unknown;
  description?: unknown;
  tags?: unknown;
  category?: unknown;
}): CircuitMetadata {
  const rawName = typeof input.name === 'string' ? input.name.trim() : '';
  const name = rawName || 'Circuit';

  return {
    name,
    description: typeof input.description === 'string' ? input.description : '',
    tags: normalizeCircuitTags(input.tags),
    category: isCircuitCategory(input.category)
      ? input.category
      : DEFAULT_CIRCUIT_CATEGORY,
  };
}
