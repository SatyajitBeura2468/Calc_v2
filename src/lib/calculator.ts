import { evaluate, format } from 'mathjs/number'
import type { AngleMode } from '../types'
const BLOCKED = /\b(import|createUnit|evaluate|parse|simplify|derivative|resolve)\b/i

function angleInput(value: number, angleMode: AngleMode) {
  return angleMode === 'DEG' ? value * Math.PI / 180 : value
}

function angleOutput(value: number, angleMode: AngleMode) {
  return angleMode === 'DEG' ? value * 180 / Math.PI : value
}

export function normalizeExpression(expression: string, answer = '0') {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'pi')
    .replaceAll('√', 'sqrt')
    .replaceAll('Ans', `(${answer})`)
}

export function calculateExpression(
  expression: string,
  answer: string,
  precision: number,
  angleMode: AngleMode,
) {
  const normalized = normalizeExpression(expression, answer)
  if (!normalized.trim()) return '0'
  if (BLOCKED.test(normalized)) throw new Error('That function is not available in Calc V2.')

  const scope = {
    sin: (value: number) => Math.sin(angleInput(value, angleMode)),
    cos: (value: number) => Math.cos(angleInput(value, angleMode)),
    tan: (value: number) => Math.tan(angleInput(value, angleMode)),
    asin: (value: number) => angleOutput(Math.asin(value), angleMode),
    acos: (value: number) => angleOutput(Math.acos(value), angleMode),
    atan: (value: number) => angleOutput(Math.atan(value), angleMode),
    ln: (value: number) => Math.log(value),
    log: (value: number) => Math.log10(value),
  }

  const value = evaluate(normalized, scope)
  if (typeof value === 'number' && !Number.isFinite(value)) {
    throw new Error('This calculation does not have a finite result.')
  }
  return format(value, {
    precision,
    lowerExp: -9,
    upperExp: 15,
  })
}

export function formatDisplay(value: string) {
  const numeric = Number(value)
  if (!Number.isFinite(numeric) || value.trim() === '') return value
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 12 }).format(numeric)
}

export function graphValue(expression: string, x: number, angleMode: AngleMode) {
  const normalized = normalizeExpression(expression)
  if (BLOCKED.test(normalized)) return Number.NaN
  try {
    const scope = {
      x,
      sin: (value: number) => Math.sin(angleInput(value, angleMode)),
      cos: (value: number) => Math.cos(angleInput(value, angleMode)),
      tan: (value: number) => Math.tan(angleInput(value, angleMode)),
    }
    const value = evaluate(normalized, scope)
    return typeof value === 'number' ? value : Number(value)
  } catch {
    return Number.NaN
  }
}
