export type CapUnit = 'pF' | 'nF' | 'µF' | 'mF';
export type ResUnit = 'Ω' | 'kΩ' | 'MΩ';

export const CAP_MULTIPLIERS: Record<CapUnit, number> = {
  pF: 1e12,
  nF: 1e9,
  µF: 1e6,
  mF: 1e3,
};

export const RES_MULTIPLIERS: Record<ResUnit, number> = {
  Ω: 1,
  kΩ: 1e-3,
  MΩ: 1e-6,
};

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

export function detectResUnit(ohms: number): ResUnit {
  if (ohms < 1_000) {
    return 'Ω';
  }

  if (ohms < 1_000_000) {
    return 'kΩ';
  }

  return 'MΩ';
}

export function formatOhms(ohms: number): string {
  const unit = detectResUnit(ohms);
  const display = +(ohms * RES_MULTIPLIERS[unit]).toPrecision(4);
  return `${display}${unit}`;
}

export function formatFarads(farads: number): string {
  const unit = detectCapUnit(farads);
  const display = +(farads * CAP_MULTIPLIERS[unit]).toPrecision(4);
  return `${display}${unit}`;
}
