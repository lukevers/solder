// src/test/netlist.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type { ComponentNode, CircuitState } from '../lib/types'

describe('types', () => {
  it('ComponentNode discriminated union compiles', () => {
    const r: ComponentNode = {
      id: 'r1',
      type: 'resistor',
      position: { x: 0, y: 0 },
      data: { label: 'R1', ohms: 10000 },
    }
    expectTypeOf(r.type).toEqualTypeOf<ComponentNode['type']>()
  })

  it('CircuitState contains nodes and edges', () => {
    expectTypeOf<CircuitState>().toHaveProperty('nodes')
    expectTypeOf<CircuitState>().toHaveProperty('edges')
  })
})
