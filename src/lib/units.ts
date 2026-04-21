// Unit formatting and detection for component values.
//
// Converts raw numeric values (ohms, farads) into
// human-readable strings with SI unit suffixes for
// display in the UI (inspector, node labels, etc.).

/**
 * SI unit suffix for capacitance display.
 */
export type CapUnit = 'pF' | 'nF' | 'µF' | 'mF';

/**
 * SI unit suffix for resistance display.
 */
export type ResUnit = 'Ω' | 'kΩ' | 'MΩ';

/**
 * Multipliers to convert farads into each
 * capacitance display unit.
 *
 *   farads × multiplier = display value
 *   e.g. 47e-9 × 1e9 = 47 (nF)
 */
export const CAP_MULTIPLIERS: Record<CapUnit, number> = {
  pF: 1e12,
  nF: 1e9,
  µF: 1e6,
  mF: 1e3,
};

/**
 * Multipliers to convert ohms into each
 * resistance display unit.
 *
 *   ohms × multiplier = display value
 *   e.g. 10000 × 1e-3 = 10 (kΩ)
 */
export const RES_MULTIPLIERS: Record<ResUnit, number> = {
  Ω: 1,
  kΩ: 1e-3,
  MΩ: 1e-6,
};

/**
 * Pick the best capacitance display unit for
 * a given farad value.
 *
 *   < 1 nF  → pF
 *   < 1 µF  → nF
 *   < 1 mF  → µF
 *   else    → mF
 */
export function detectCapUnit(farads: number): CapUnit {
  if (farads < 1e-9) {
    return 'pF';
  }

  if (farads < 1e-6) {
    return 'nF';
  }

  if (farads < 1e-3) {
    return 'µF';
  }

  return 'mF';
}

/**
 * Pick the best resistance display unit for
 * a given ohm value.
 *
 *   < 1 kΩ  → Ω
 *   < 1 MΩ  → kΩ
 *   else    → MΩ
 */
export function detectResUnit(ohms: number): ResUnit {
  if (ohms < 1_000) {
    return 'Ω';
  }

  if (ohms < 1_000_000) {
    return 'kΩ';
  }

  return 'MΩ';
}

/**
 * Format an ohm value for UI display.
 *
 *   10000   → "10kΩ"
 *   470     → "470Ω"
 *   2200000 → "2.2MΩ"
 */
export function formatOhms(ohms: number): string {
  const unit = detectResUnit(ohms);
  const display = +(ohms * RES_MULTIPLIERS[unit]).toPrecision(4);
  return `${display}${unit}`;
}

/**
 * Format a farad value for UI display.
 *
 *   47e-9   → "47nF"
 *   100e-12 → "100pF"
 *   1e-6    → "1µF"
 */
export function formatFarads(farads: number): string {
  const unit = detectCapUnit(farads);
  const display = +(farads * CAP_MULTIPLIERS[unit]).toPrecision(4);
  return `${display}${unit}`;
}
