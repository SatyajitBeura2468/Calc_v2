import { describe, expect, it } from 'vitest'
import { calculateExpression, graphValue, normalizeExpression } from './calculator'

describe('calculator engine', () => {
  it('normalizes calculator symbols', () => {
    expect(normalizeExpression('2×π−8÷4')).toBe('2*pi-8/4')
  })

  it('respects degree mode for trigonometry', () => {
    expect(calculateExpression('sin(30)^2 + cos(30)^2', '0', 12, 'DEG')).toBe('1')
  })

  it('respects radian mode for trigonometry', () => {
    expect(Number(calculateExpression('sin(π/2)', '0', 12, 'RAD'))).toBeCloseTo(1, 10)
  })

  it('recalls the previous answer', () => {
    expect(calculateExpression('Ans×4', '10', 12, 'DEG')).toBe('40')
  })

  it('returns values for graph expressions', () => {
    expect(graphValue('x^2', 3, 'RAD')).toBe(9)
  })

  it('blocks unsafe parser functions', () => {
    expect(() => calculateExpression('import(1)', '0', 12, 'DEG')).toThrow(/not available/i)
  })
})
