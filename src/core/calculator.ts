import { evaluate } from 'mathjs/number'
import type { AngleMode, CalculationResult, NumberFormat } from '../types'

const BLOCKED = /\b(import|createUnit|evaluate|parse|simplify|derivative|resolve|typed|map|forEach)\b/i
const SAFE_IDENTIFIER = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g
const ALLOWED_IDENTIFIERS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh',
  'ln', 'log', 'log10', 'sqrt', 'cbrt', 'abs', 'floor', 'ceil', 'round',
  'min', 'max', 'mod', 'factorial', 'nCr', 'nPr', 'pi', 'e', 'Ans', 'Infinity',
])

export interface EvaluateOptions {
  answer?: string
  angleMode?: AngleMode
  precision?: number
  numberFormat?: NumberFormat
}

function toRadians(value: number, mode: AngleMode) {
  if (mode === 'DEG') return value * Math.PI / 180
  if (mode === 'GRAD') return value * Math.PI / 200
  return value
}

function fromRadians(value: number, mode: AngleMode) {
  if (mode === 'DEG') return value * 180 / Math.PI
  if (mode === 'GRAD') return value * 200 / Math.PI
  return value
}

export function factorial(value: number) {
  if (!Number.isInteger(value) || value < 0) throw new Error('Factorial requires a non-negative whole number.')
  if (value > 170) throw new Error('That factorial is too large to display safely.')
  let result = 1
  for (let n = 2; n <= value; n += 1) result *= n
  return result
}

export function combinations(n: number, r: number) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nCr requires whole numbers with 0 ≤ r ≤ n.')
  }
  const k = Math.min(r, n - r)
  let result = 1
  for (let i = 1; i <= k; i += 1) result = result * (n - k + i) / i
  return result
}

export function permutations(n: number, r: number) {
  if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n) {
    throw new Error('nPr requires whole numbers with 0 ≤ r ≤ n.')
  }
  let result = 1
  for (let i = 0; i < r; i += 1) result *= n - i
  return result
}

export function normalizeExpression(expression: string, answer = '0') {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'pi')
    .replaceAll('√', 'sqrt')
    .replaceAll('Ans', `(${answer})`)
    .replaceAll('°', '')
    .replace(/(\d|\))\s*\(/g, '$1*(')
    .replace(/\)\s*(\d|pi|e)/g, ')*$1')
    .replace(/(\d)\s*(pi|e)\b/g, '$1*$2')
    .trim()
}

function assertSafe(normalized: string) {
  if (BLOCKED.test(normalized)) throw new Error('That function is not available in Calc V2.')
  let balance = 0
  for (const character of normalized) {
    if (character === '(') balance += 1
    if (character === ')') balance -= 1
    if (balance < 0) throw new Error('There is a closing parenthesis without a matching opening parenthesis.')
  }
  if (balance > 0) throw new Error(`Add ${balance} closing parenthes${balance === 1 ? 'is' : 'es'} to finish the expression.`)
  for (const match of normalized.matchAll(SAFE_IDENTIFIER)) {
    if (!ALLOWED_IDENTIFIERS.has(match[1])) throw new Error(`“${match[1]}” is not a recognised function or constant.`)
  }
}

function contextualPercent(expression: string) {
  const additive = expression.match(/^(.*)([-+])\s*([-+]?\d+(?:\.\d+)?)%\s*$/)
  if (additive && additive[1].trim()) {
    return { expression: `${additive[1]}${additive[2]}((${additive[1]})*${additive[3]}/100)`, explanation: `${additive[3]}% is applied to the preceding value.` }
  }
  return { expression: expression.replace(/([-+]?\d+(?:\.\d+)?)%/g, '($1/100)') }
}

function scope(angleMode: AngleMode) {
  return {
    sin: (value: number) => Math.sin(toRadians(value, angleMode)),
    cos: (value: number) => Math.cos(toRadians(value, angleMode)),
    tan: (value: number) => Math.tan(toRadians(value, angleMode)),
    asin: (value: number) => fromRadians(Math.asin(value), angleMode),
    acos: (value: number) => fromRadians(Math.acos(value), angleMode),
    atan: (value: number) => fromRadians(Math.atan(value), angleMode),
    sinh: Math.sinh,
    cosh: Math.cosh,
    tanh: Math.tanh,
    ln: Math.log,
    log: Math.log10,
    log10: Math.log10,
    sqrt: (value: number) => {
      if (value < 0) throw new Error('The square root of a negative real number is complex. Use the Equation Solver for complex roots.')
      return Math.sqrt(value)
    },
    cbrt: Math.cbrt,
    abs: Math.abs,
    floor: Math.floor,
    ceil: Math.ceil,
    round: Math.round,
    min: Math.min,
    max: Math.max,
    mod: (a: number, b: number) => a % b,
    factorial,
    nCr: combinations,
    nPr: permutations,
  }
}

function fractionApproximation(value: number, maxDenominator = 100_000) {
  if (!Number.isFinite(value)) return undefined
  if (Number.isInteger(value)) return String(value)
  let x = Math.abs(value)
  let previousNumerator = 0
  let numerator = 1
  let previousDenominator = 1
  let denominator = 0
  for (let iteration = 0; iteration < 24; iteration += 1) {
    const integer = Math.floor(x)
    const nextNumerator = integer * numerator + previousNumerator
    const nextDenominator = integer * denominator + previousDenominator
    if (nextDenominator > maxDenominator) break
    previousNumerator = numerator
    numerator = nextNumerator
    previousDenominator = denominator
    denominator = nextDenominator
    const remainder = x - integer
    if (remainder < 1e-12) break
    x = 1 / remainder
  }
  if (!denominator || Math.abs(numerator / denominator - Math.abs(value)) > 1e-10) return undefined
  return `${value < 0 ? '-' : ''}${numerator}/${denominator}`
}

export function formatNumber(value: number, precision: number, notation: NumberFormat) {
  if (!Number.isFinite(value)) return String(value)
  if (Object.is(value, -0)) value = 0
  if (notation === 'scientific') return value.toExponential(Math.max(0, precision - 1)).replace(/\.0+(?=e)/, '')
  if (notation === 'engineering') {
    if (value === 0) return '0'
    const exponent = Math.floor(Math.log10(Math.abs(value)) / 3) * 3
    const mantissa = value / 10 ** exponent
    return `${Number(mantissa.toPrecision(precision))}e${exponent >= 0 ? '+' : ''}${exponent}`
  }
  return Number(value.toPrecision(precision)).toString()
}

export function formatForDisplay(raw: string, notation: NumberFormat) {
  const value = Number(raw)
  if (!Number.isFinite(value)) return raw
  if (notation !== 'standard' || Math.abs(value) >= 1e15 || (Math.abs(value) > 0 && Math.abs(value) < 1e-9)) return raw
  const [integer, fraction] = raw.split('.')
  const grouped = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Number(integer))
  return fraction ? `${grouped}.${fraction}` : grouped
}

export function evaluateExpression(expression: string, options: EvaluateOptions = {}): CalculationResult {
  const angleMode = options.angleMode ?? 'DEG'
  const precision = options.precision ?? 12
  const numberFormat = options.numberFormat ?? 'standard'
  const normalized = normalizeExpression(expression, options.answer ?? '0')
  if (!normalized) return { raw: '0', formatted: '0', exact: '0', type: 'real' }
  assertSafe(normalized)
  const percent = contextualPercent(normalized)
  let value: unknown
  try {
    value = evaluate(percent.expression, scope(angleMode))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'The expression could not be evaluated.'
    if (/divide|division|zero/i.test(message)) throw new Error('Division by zero is undefined.')
    throw new Error(message.replace(/^Error:\s*/, ''))
  }
  if (typeof value === 'boolean') return { raw: String(value), formatted: String(value), type: 'boolean' }
  if (typeof value !== 'number') throw new Error('This expression did not produce a real numeric result.')
  if (!Number.isFinite(value)) throw new Error('This calculation does not have a finite result.')
  const raw = formatNumber(value, precision, numberFormat)
  const exact = fractionApproximation(value)
  return {
    raw,
    formatted: formatForDisplay(raw, numberFormat),
    exact: exact && exact !== raw ? exact : undefined,
    type: 'real',
    explanation: percent.explanation ? [percent.explanation, `Result: ${raw}`] : undefined,
  }
}

export function insertAtSelection(value: string, insertion: string, start: number, end: number, cursorOffset = 0) {
  const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`
  const cursor = start + insertion.length + cursorOffset
  return { value: next, selectionStart: cursor, selectionEnd: cursor }
}

export function repeatedEqualsExpression(result: string, previousExpression: string) {
  const normalized = normalizeExpression(previousExpression)
  const match = normalized.match(/([+\-*/])\s*(-?\d+(?:\.\d+)?)\s*$/)
  return match ? `${result}${match[1]}${match[2]}` : previousExpression
}
