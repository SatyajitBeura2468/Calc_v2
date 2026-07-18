import { describe, expect, it } from 'vitest'
import { convertUnit, unitCategories } from '../core/converter'

describe('converter engine', () => {
  it('includes all promised offline categories', () => { expect(unitCategories).toHaveLength(16) })
  it('converts length and data units', () => { expect(convertUnit('length', 1, 'mi', 'km')).toBeCloseTo(1.609344); expect(convertUnit('data', 1, 'gib', 'byte')).toBe(1073741824) })
  it('handles affine temperatures', () => { expect(convertUnit('temperature', 0, 'c', 'f')).toBeCloseTo(32); expect(convertUnit('temperature', 32, 'f', 'c')).toBeCloseTo(0) })
  it('rejects temperatures below absolute zero', () => { expect(() => convertUnit('temperature', -1, 'k', 'c')).toThrow(/absolute zero/) })
  it('handles reciprocal fuel economy', () => { expect(convertUnit('fuel', 5, 'l100', 'mpg-us')).toBeCloseTo(47.0429166) })
})
