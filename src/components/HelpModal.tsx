/**
 * @docs docs/ui-patterns.md (Global hotkeys and modal overlays)
 *
 * This modal is the source of truth for shortcuts the user can
 * discover. When you add a new global hotkey in `src/App.tsx`, also
 * add it to `buildSections` below so the `?` reference stays accurate.
 */
import { Keyboard, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

type HelpModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * One keyboard shortcut entry rendered in the help modal.
 *
 * `keys` is an array of label fragments rendered as individual pills and
 * joined with `+` separators to express a combo (e.g. `['⌘', 'Shift', 'Z']`
 * renders as `⌘ + Shift + Z`).
 *
 * `altKeys` is an optional alternative combo for shortcuts that have more
 * than one trigger (e.g. `/` and `?` both open the help modal). When set,
 * it renders to the right of the primary combo separated by an `or` token
 * so the two are not mistaken for keys that must be pressed together.
 */
type Shortcut = {
  keys: Array<string>;
  altKeys?: Array<string>;
  description: string;
};

/**
 * A logical grouping of shortcuts displayed as a labelled section in the
 * modal. Sections are rendered in the order listed in `SHORTCUT_SECTIONS`.
 */
type ShortcutSection = {
  title: string;
  shortcuts: Array<Shortcut>;
};

/**
 * Build the full list of shortcut sections.
 *
 * `mod` is the platform-appropriate label for the primary modifier key —
 * `⌘` on macOS, `Ctrl` everywhere else. We compute it once per render
 * inside the modal rather than hard-coding either flavour so the user
 * sees the symbols they actually press.
 */
function buildSections(mod: string): Array<ShortcutSection> {
  return [
    {
      title: 'Canvas',
      shortcuts: [
        { keys: ['A'], description: 'Open the place-symbol command bar' },
        { keys: ['R'], description: 'Rotate selected node 90° clockwise' },
        {
          keys: ['Shift', 'R'],
          description: 'Rotate selected node 90° counter-clockwise',
        },
      ],
    },
    {
      title: 'Edit',
      shortcuts: [
        { keys: [mod, 'Z'], description: 'Undo' },
        { keys: [mod, 'Shift', 'Z'], description: 'Redo' },
        { keys: [mod, 'Y'], description: 'Redo (alternate)' },
      ],
    },
    {
      title: 'Waveform',
      shortcuts: [
        { keys: ['Space'], description: 'Play / pause the waveform preview' },
        {
          keys: ['Delete'],
          description: 'Clear the current waveform selection',
        },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        {
          keys: ['/'],
          altKeys: ['?'],
          description: 'Open this keyboard shortcut reference',
        },
        { keys: ['Esc'], description: 'Close the active modal' },
      ],
    },
  ];
}

/**
 * Detect whether we should render the macOS `⌘` glyph or the cross-platform
 * `Ctrl` label for the primary modifier key.
 *
 * We sniff `navigator.platform` once at module load. SSR or non-browser
 * environments fall back to `Ctrl`, which is the safer default.
 */
function detectModLabel(): string {
  if (typeof navigator === 'undefined') {
    return 'Ctrl';
  }

  const platform = navigator.platform ?? '';
  const isMac = /Mac|iPhone|iPad|iPod/i.test(platform);

  return isMac ? '⌘' : 'Ctrl';
}

/**
 * Render a single key combo as a horizontal row of `kbd` pills joined by
 * `+` separators.
 *
 * Pulled out into a helper so the `keys` and `altKeys` arrays on a
 * `Shortcut` can share the exact same rendering. The `scope` argument is
 * mixed into each child's React `key` so primary/alt combos that happen
 * to share a fragment (e.g. both starting with `Shift`) do not collide.
 *
 *   keys = ['⌘', 'Shift', 'Z']  ──▶  [⌘] + [Shift] + [Z]
 */
function renderCombo(keys: Array<string>, scope: string) {
  return keys.flatMap((key, index) => {
    const elements = [
      <kbd
        key={`${scope}-key-${key}`}
        className="inline-flex min-w-[1.75rem] items-center justify-center rounded border border-gray-700 bg-gray-950 px-1.5 py-0.5 font-mono text-[11px] text-gray-200"
      >
        {key}
      </kbd>,
    ];

    if (index > 0) {
      elements.unshift(
        <span key={`${scope}-sep-${key}`} className="text-[10px] text-gray-600">
          +
        </span>,
      );
    }

    return elements;
  });
}

/**
 * Help overlay listing every keyboard shortcut the editor responds to.
 *
 * Triggered by the toolbar's keyboard icon or the `?` hotkey. The layout
 * mirrors the WelcomeModal so the two share a visual family:
 *
 *   ┌───────────────────────────────┐
 *   │ header  (icon + title + X)    │
 *   ├───────────────────────────────┤
 *   │ Canvas                        │
 *   │   A       Place symbol…       │
 *   │   R       Rotate 90°          │
 *   ├───────────────────────────────┤
 *   │ Edit                          │
 *   │   ⌘+Z     Undo                │
 *   │   …                           │
 *   └───────────────────────────────┘
 *
 * Sections come from `buildSections`, which receives the resolved primary
 * modifier label so users see the keys they actually have on their
 * keyboard rather than a generic `Mod+…` placeholder.
 */
export function HelpModal({ open, onClose }: HelpModalProps) {
  const modLabel = useMemo(detectModLabel, []);
  const sections = useMemo(() => buildSections(modLabel), [modLabel]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-stretch justify-stretch overflow-y-auto bg-gray-950/65 backdrop-blur-sm sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        aria-label="Close keyboard shortcuts"
      />

      <div className="relative z-[101] flex min-h-full w-full flex-col overflow-hidden bg-gray-900 font-sans sm:max-h-[calc(100vh-2rem)] sm:min-h-0 sm:max-w-xl sm:rounded sm:border sm:border-gray-700 sm:shadow-2xl">
        <div className="flex items-center justify-between border-gray-800 border-b bg-gray-950 px-4 py-2">
          <div className="flex items-center gap-2 text-gray-200">
            <Keyboard size={14} className="text-blue-300" />
            <span className="font-mono text-[11px] uppercase tracking-wider">
              Keyboard Shortcuts
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-gray-700 bg-gray-900 p-1.5 text-gray-500 transition-colors hover:text-gray-200"
            aria-label="Close keyboard shortcuts"
          >
            <X size={14} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sections.map((section) => (
            <section
              key={section.title}
              className="border-gray-800 border-b last:border-b-0"
            >
              <div className="bg-gray-950/40 px-4 py-2">
                <h3 className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>

              <ul className="divide-y divide-gray-800">
                {section.shortcuts.map((shortcut) => (
                  <li
                    key={`${section.title}-${shortcut.keys.join('+')}`}
                    className="flex items-center justify-between gap-4 px-4 py-2.5"
                  >
                    <span className="text-gray-300 text-sm">
                      {shortcut.description}
                    </span>
                    <div className="flex flex-shrink-0 items-center gap-1">
                      {renderCombo(shortcut.keys, 'primary')}
                      {shortcut.altKeys && (
                        <>
                          <span className="px-1 font-mono text-[10px] text-gray-500 uppercase">
                            or
                          </span>
                          {renderCombo(shortcut.altKeys, 'alt')}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex items-center justify-between border-gray-800 border-t bg-gray-950 px-4 py-2">
          <div className="font-sans text-[11px] text-gray-500">
            Shortcuts are disabled while typing in an input field.
          </div>
          <div className="flex items-center gap-1 font-sans text-[11px] text-gray-500">
            <span>Press</span>
            <kbd className="inline-flex items-center justify-center rounded border border-gray-700 bg-gray-900 px-1.5 py-0.5 font-mono text-[10px] text-gray-300">
              Esc
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
