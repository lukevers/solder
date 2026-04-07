import { describe, it, expect } from 'vitest'
import {
  detectCapUnit,
  detectResUnit,
  CAP_MULTIPLIERS,
  RES_MULTIPLIERS,
} from '../lib/units'

describe('detectCapUnit', () => {
  it('returns pF for values below 1 nF', () => {
    expect(detectCapUnit(1e-12)).toBe('pF')
    expect(detectCapUnit(999e-12)).toBe('pF')
  })
  it('returns nF for 1 nF to <1 µF', () => {
    expect(detectCapUnit(1e-9)).toBe('nF')
    expect(detectCapUnit(100e-9)).toBe('nF')
  })
  it('returns µF for 1 µF to <1 mF', () => {
    expect(detectCapUnit(1e-6)).toBe('µF')
    expect(detectCapUnit(47e-6)).toBe('µF')
  })
  it('returns mF for values ≥1 mF', () => {
    expect(detectCapUnit(1e-3)).toBe('mF')
  })
})

describe('detectResUnit', () => {
  it('returns Ω for values below 1 kΩ', () => {
    expect(detectResUnit(100)).toBe('Ω')
    expect(detectResUnit(999)).toBe('Ω')
  })
  it('returns kΩ for 1 kΩ to <1 MΩ', () => {
    expect(detectResUnit(1_000)).toBe('kΩ')
    expect(detectResUnit(10_000)).toBe('kΩ')
  })
  it('returns MΩ for values ≥1 MΩ', () => {
    expect(detectResUnit(1_000_000)).toBe('MΩ')
  })
})

describe('CAP_MULTIPLIERS', () => {
  it('converts 100 nF in farads to 100 for display', () => {
    expect(100e-9 * CAP_MULTIPLIERS['nF']).toBeCloseTo(100)
  })
  it('converts display value back to farads correctly', () => {
    expect(100 / CAP_MULTIPLIERS['nF']).toBeCloseTo(100e-9)
  })
})

describe('RES_MULTIPLIERS', () => {
  it('converts 10 kΩ in ohms to 10 for display', () => {
    expect(10_000 * RES_MULTIPLIERS['kΩ']).toBeCloseTo(10)
  })
  it('converts display value back to ohms correctly', () => {
    expect(10 / RES_MULTIPLIERS['kΩ']).toBeCloseTo(10_000)
  })
})
