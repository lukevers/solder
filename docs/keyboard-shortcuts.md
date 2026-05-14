# Keyboard Shortcuts

Press `?` or `/` inside the editor to open this reference as a modal.
Shortcuts are disabled while typing in an input field or when any modal
is open, so they never conflict with the surface you are currently
using.

Modifier symbols follow your platform: `⌘` on macOS, `Ctrl` everywhere
else.

## Canvas

| Shortcut | Action |
|---|---|
| `a` | Open the place-symbol command bar (KiCad-style picker) |
| `r` | Rotate selected node 90° clockwise |
| `Shift+R` | Rotate selected node 90° counter-clockwise |

## Edit

| Shortcut | Action |
|---|---|
| `⌘+Z` / `Ctrl+Z` | Undo |
| `⌘+Shift+Z` / `Ctrl+Shift+Z` | Redo |
| `⌘+Y` / `Ctrl+Y` | Redo (alternate) |

## Waveform modal

| Shortcut | Action |
|---|---|
| `Space` | Play / pause the waveform preview |
| `Delete` | Clear the current waveform selection |

## General

| Shortcut | Action |
|---|---|
| `/` or `?` | Open this keyboard shortcut reference |
| `Esc` | Close the active modal |

## Implementation notes for contributors

When you add a new global shortcut you need to update **both**:

1. The window-level `keydown` handler in `src/App.tsx`.
2. `buildSections()` in `src/components/HelpModal.tsx` so the in-app `?`
   reference stays accurate.

See [`ui-patterns.md`](ui-patterns.md) for the focus-gating rules and
the modal opt-in pattern that prevents shortcuts firing through
overlays.
