import 'react-cmdk/dist/cmdk.css';
import { useMemo, useState } from 'react';
import cmdkPkg, { filterItems, getItemIndex } from 'react-cmdk';
import {
  PALETTE_BY_ID,
  PALETTE_CATEGORIES,
  PALETTE_ITEMS,
  type PaletteCategory,
  type PaletteItem,
  RECENTLY_USED_LIMIT,
} from '../lib/palette';

/**
 * Unwrap react-cmdk's default export.
 *
 * Vite 8 / Rolldown interops the CJS module by exporting the whole
 * `module.exports` object as the ESM default, so a plain
 * `import CommandPalette from 'react-cmdk'` hands us
 * `{ default: <fn>, filterItems, getItemIndex }` instead of the
 * component itself. Reach through to `.default` when that wrapper is
 * present, and fall through cleanly if a future Vite version starts
 * returning the function directly.
 */
type CommandPaletteComponent = typeof cmdkPkg;
const CommandPalette: CommandPaletteComponent = ((
  cmdkPkg as unknown as { default?: CommandPaletteComponent }
).default ?? cmdkPkg) as CommandPaletteComponent;

/**
 * KiCad-style "place symbol" command bar.
 *
 * Opens above the schematic when the user presses `a`, and shows two
 * sections backed by react-cmdk:
 *
 *   ┌──────────────────────────────────┐
 *   │  > search…                       │
 *   ├──────────────────────────────────┤
 *   │  Recently Used  (max 5)          │ ← most-recent-first
 *   │  All Symbols    (A → Z)          │ ← every item, always shown
 *   └──────────────────────────────────┘
 *
 * Selecting an entry calls `onSelect` with the chosen item; the parent
 * is responsible for placing the node and bumping the recents list.
 */
type CommandBarProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (item: PaletteItem) => void;
  recentIds: Array<string>;
};

/**
 * Delimiter used between the section prefix and the palette id in
 * cmdk item ids.
 *
 * Section headings can contain colons and dashes ("Diodes — Silicon"),
 * so we use a sentinel string that no palette id or heading is ever
 * going to contain. Keep this delimiter in sync with
 * `paletteIdFromCmdk` below.
 */
const CMDK_ID_DELIMITER = '@@';

/**
 * Convert palette items to the JsonStructureItem shape react-cmdk
 * expects.
 *
 * `keywords` feeds the built-in fuzzy filter so the search bar can
 * match aliases like "op-amp" → "TL072 Op-Amp" or "fet" → JFET model
 * numbers.
 */
function toCmdkItems(items: Array<PaletteItem>, prefix: string) {
  return items.map((item) => ({
    id: `${prefix}${CMDK_ID_DELIMITER}${item.id}`,
    children: item.label,
    keywords: [item.category, ...(item.searchTokens ?? [])],
    showType: false,
  }));
}

export function CommandBar({
  open,
  onClose,
  onSelect,
  recentIds,
}: CommandBarProps) {
  const [search, setSearch] = useState('');

  const recentItems = useMemo(() => {
    const seen = new Set<string>();
    const out: Array<PaletteItem> = [];

    for (const id of recentIds) {
      if (seen.has(id)) {
        continue;
      }

      const item = PALETTE_BY_ID[id];
      if (!item) {
        continue;
      }

      out.push(item);
      seen.add(id);

      if (out.length >= RECENTLY_USED_LIMIT) {
        break;
      }
    }

    return out;
  }, [recentIds]);

  /**
   * Pre-bucket the master catalog by category so each render only has
   * to walk the alphabetised list per heading. Buckets are computed
   * once because PALETTE_ITEMS is static.
   */
  const itemsByCategory = useMemo(() => {
    const buckets = new Map<PaletteCategory, Array<PaletteItem>>();

    for (const item of PALETTE_ITEMS) {
      const existing = buckets.get(item.category);
      if (existing) {
        existing.push(item);
        continue;
      }

      buckets.set(item.category, [item]);
    }

    for (const items of buckets.values()) {
      items.sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
      );
    }

    return buckets;
  }, []);

  const groups = useMemo(() => {
    const groupsRaw: Array<{
      heading: string;
      id: string;
      items: ReturnType<typeof toCmdkItems>;
    }> = [];

    if (recentItems.length > 0) {
      groupsRaw.push({
        heading: 'Recently Used',
        id: 'recent',
        items: toCmdkItems(recentItems, 'recent'),
      });
    }

    for (const category of PALETTE_CATEGORIES) {
      const items = itemsByCategory.get(category);
      if (!items || items.length === 0) {
        continue;
      }

      groupsRaw.push({
        heading: category,
        id: `cat:${category}`,
        items: toCmdkItems(items, `cat:${category}`),
      });
    }

    return groupsRaw;
  }, [recentItems, itemsByCategory]);

  const filteredGroups = useMemo(
    () => filterItems(groups, search),
    [groups, search],
  );

  /**
   * Decode a cmdk item id like `"recent@@bjt-2n3904"` back into the
   * palette id so we can route the click to the right `PaletteItem`.
   *
   * Splits on `CMDK_ID_DELIMITER` instead of a single character so
   * section headings that contain `:` or `-` (e.g. "Diodes — Silicon")
   * cannot corrupt the lookup.
   */
  function paletteIdFromCmdk(cmdkId: string): string {
    const idx = cmdkId.indexOf(CMDK_ID_DELIMITER);
    return idx === -1 ? cmdkId : cmdkId.slice(idx + CMDK_ID_DELIMITER.length);
  }

  function handleSelect(cmdkId: string) {
    const paletteId = paletteIdFromCmdk(cmdkId);
    const item = PALETTE_BY_ID[paletteId];
    if (!item) {
      return;
    }

    onSelect(item);
    setSearch('');
    onClose();
  }

  return (
    <CommandPalette
      onChangeSearch={setSearch}
      onChangeOpen={(next) => {
        if (!next) {
          setSearch('');
          onClose();
        }
      }}
      search={search}
      isOpen={open}
      page="root"
      placeholder="Place a component…"
    >
      <CommandPalette.Page id="root" onEscape={onClose}>
        {filteredGroups.length > 0 ? (
          filteredGroups.map((list) => (
            <CommandPalette.List key={list.id} heading={list.heading}>
              {list.items.map(({ id, ...rest }) => (
                <CommandPalette.ListItem
                  key={id}
                  index={getItemIndex(filteredGroups, id)}
                  closeOnSelect={false}
                  onClick={() => handleSelect(id)}
                  {...rest}
                />
              ))}
            </CommandPalette.List>
          ))
        ) : (
          <CommandPalette.FreeSearchAction />
        )}
      </CommandPalette.Page>
    </CommandPalette>
  );
}
