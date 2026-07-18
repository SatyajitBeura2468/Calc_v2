import { describe, expect, it } from 'vitest'
import { combinations, evaluateExpression, factorial, insertAtSelection, permutations, repeatedEqualsExpression } from '../core/calculator'

const value = (expression: string, angleMode: 'DEG' | 'RAD' | 'GRAD' = 'DEG') => Number(evaluateExpression(expression, { angleMode, precision: 14 }).raw)

describe('calculator engine', () => {
  it('respects precedence and parentheses', () => { expect(value('2 + 3 * 4')).toBe(14); expect(value('(2 + 3) * 4')).toBe(20) })
  it('uses calculator-style additive percentages', () => { expect(value('200 + 10%')).toBe(220); expect(value('200 - 10%')).toBe(180); expect(value('50%')).toBe(.5) })
  it('supports degree, radian, and gradian angles', () => { expect(value('sin(30)', 'DEG')).toBeCloseTo(.5); expect(value('sin(pi/6)', 'RAD')).toBeCloseTo(.5); expect(value('sin(100)', 'GRAD')).toBeCloseTo(1) })
  it('supports scientific notation and previous answer', () => { expect(value('1e3 + 2e2')).toBe(1200); expect(Number(evaluateExpression('Ans * 3', { answer: '7' }).raw)).toBe(21) })
  it('supports factorials, combinations, and permutations', () => { expect(factorial(5)).toBe(120); expect(combinations(5, 2)).toBe(10); expect(permutations(5, 2)).toBe(20) })
  it('returns exact fractions and alternate formats', () => { expect(evaluateExpression('1/3').exact).toBe('1/3'); expect(evaluateExpression('120000', { numberFormat: 'scientific', precision: 4 }).raw).toMatch(/e\+5/); expect(evaluateExpression('120000', { numberFormat: 'engineering' }).raw).toBe('120e+3') })
  it('reports human-readable errors', () => { expect(() => evaluateExpression('(2+3')).toThrow(/closing parenthesis/); expect(() => evaluateExpression('mystery(2)')).toThrow(/recognised/); expect(() => factorial(-1)).toThrow(/non-negative/) })
  it('inserts at the caret and replaces selections', () => { expect(insertAtSelection('12+34', '9', 2, 2).value).toBe('129+34'); expect(insertAtSelection('12+34', '9', 3, 5).value).toBe('12+9') })
  it('builds repeated-equals expressions', () => { expect(repeatedEqualsExpression('5', '2+3')).toBe('5+3') })
})
