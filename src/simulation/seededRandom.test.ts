import { describe, expect, it } from 'vitest'
import { seededRandom } from './seededRandom'

const sequence = (seed: string) => Array.from({ length: 100 }, seededRandom(seed))

describe('seededRandom', () => {
  it('reproduces an independent sequence for each same-seed generator', () => {
    expect(sequence('42')).toEqual(sequence('42'))
    expect(sequence('42')).not.toEqual(sequence('43'))
    expect(sequence('')).toEqual(sequence(''))
    expect(sequence('🌍')).toEqual(sequence('🌍'))
  })
  it('returns finite values in [0, 1) and advances state', () => {
    const values = sequence('range')
    expect(values.every(value => Number.isFinite(value) && value >= 0 && value < 1)).toBe(true)
    expect(new Set(values).size).toBe(values.length)
  })
})
