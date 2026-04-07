# Capacitor & Resistor Inline Unit Picker

**Date:** 2026-04-07
**Scope:** `src/components/Inspector.tsx` only — no store, type, or netlist changes.

## Problem

The capacitor inspector exposes a raw number input in farads. Values like `1e-8` or `0.000000047` are impractical to type and read. Resistors have the same problem at high values (e.g. `100000` Ω). Both components benefit from a unit-aware input.

## Design

### UI

The number field and unit pills share a single border, forming one cohesive control (the "inline" pattern). The number field occupies the left portion; the unit pills are flush against its right edge, separated by internal dividers — no gap between field and pills.

```
┌──────────────────────────────────────────────┐
│  100        │ pF │ nF │ µF │ mF │
└──────────────────────────────────────────────┘
              ↑ active pill has blue tint
```

Active pill style: `bg-blue-950 border-blue-700 text-blue-300`
Inactive pill style: same as the input (`bg-gray-950 border-gray-700 text-gray-500`)

### State

Each inspector component holds local React `useState` for the active unit. This is purely a display concern — it never enters the store.

```ts
// Capacitor
type CapUnit = 'pF' | 'nF' | 'µF' | 'mF'
const [unit, setUnit] = useState<CapUnit>(() => detectCapUnit(farads))

// Resistor
type ResUnit = 'Ω' | 'kΩ' | 'MΩ'
const [unit, setUnit] = useState<ResUnit>(() => detectResUnit(ohms))
```

### Auto-detection

On mount, the unit is derived from the stored base-unit value:

**Capacitance:**
| Condition | Unit |
|-----------|------|
| `farads < 1e-9` | pF |
| `farads < 1e-6` | nF |
| `farads < 1e-3` | µF |
| else | mF |

**Resistance:**
| Condition | Unit |
|-----------|------|
| `ohms < 1_000` | Ω |
| `ohms < 1_000_000` | kΩ |
| else | MΩ |

### Conversion

**Display value** (base units → selected unit):

| Unit | Multiplier |
|------|-----------|
| pF | `× 1e12` |
| nF | `× 1e9` |
| µF | `× 1e6` |
| mF | `× 1e3` |
| Ω | `× 1` |
| kΩ | `× 1e-3` |
| MΩ | `× 1e-6` |

**On number change:** `updateNodeData` receives `displayValue / multiplier` (converted back to base units).

**On unit change:** The displayed number rescales automatically because it is always derived from the stored base value. No separate conversion needed — switching unit just changes the multiplier used for display.

### Files Changed

- `src/components/Inspector.tsx` — `CapacitorInspector` and `ResistorInspector` components only.

### Out of Scope

- Store shape (`farads`, `ohms`) — unchanged.
- `CapacitorData` / `ResistorData` types — unchanged.
- Netlist compiler — unchanged.
- Other inspector components (OpAmp, Diode, Power, Pot) — unchanged.
