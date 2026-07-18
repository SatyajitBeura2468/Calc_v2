import { evaluate } from 'mathjs/number'

const BLOCKED = /\b(import|createUnit|evaluate|parse|simplify|resolve|typed)\b/i

export function normalizeGraphExpression(expression: string) {
  return expression
    .replaceAll('×', '*')
    .replaceAll('÷', '/')
    .replaceAll('−', '-')
    .replaceAll('π', 'pi')
    .replaceAll('√', 'sqrt')
    .replace(/(\d|\))\s*\(/g, '$1*(')
    .replace(/(\d)\s*(x|pi|e)\b/g, '$1*$2')
}

export function graphValue(expression: string, x: number) {
  const normalized = normalizeGraphExpression(expression)
  if (!normalized || BLOCKED.test(normalized)) return Number.NaN
  try {
    const value = evaluate(normalized, {
      x,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      asin: Math.asin,
      acos: Math.acos,
      atan: Math.atan,
      sinh: Math.sinh,
      cosh: Math.cosh,
      tanh: Math.tanh,
      ln: Math.log,
      log: Math.log10,
      sqrt: Math.sqrt,
      abs: Math.abs,
      floor: Math.floor,
      ceil: Math.ceil,
      min: Math.min,
      max: Math.max,
    })
    return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN
  } catch {
    return Number.NaN
  }
}

export function derivativeValue(expression: string, x: number) {
  const h = Math.max(1e-5, Math.abs(x) * 1e-5)
  const left = graphValue(expression, x - h)
  const right = graphValue(expression, x + h)
  return Number.isFinite(left) && Number.isFinite(right) ? (right - left) / (2 * h) : Number.NaN
}

export const evaluateGraph = graphValue
export const derivativeAt = derivativeValue

export function integrate(expression: string, from: number, to: number, steps = 600) {
  if (!Number.isFinite(from) || !Number.isFinite(to) || from === to) return 0
  const count = Math.max(20, steps + (steps % 2))
  const h = (to - from) / count
  let sum = graphValue(expression, from) + graphValue(expression, to)
  if (!Number.isFinite(sum)) return Number.NaN
  for (let index = 1; index < count; index += 1) {
    const value = graphValue(expression, from + index * h)
    if (!Number.isFinite(value)) return Number.NaN
    sum += value * (index % 2 === 0 ? 2 : 4)
  }
  return sum * h / 3
}

export function findRoots(expression: string, min: number, max: number, samples = 700) {
  const roots: number[] = []
  let previousX = min
  let previousY = graphValue(expression, previousX)
  for (let index = 1; index <= samples; index += 1) {
    const x = min + (max - min) * index / samples
    const y = graphValue(expression, x)
    if (Number.isFinite(y) && Math.abs(y) < 1e-6) roots.push(x)
    if (Number.isFinite(previousY) && Number.isFinite(y) && previousY * y < 0) {
      let left = previousX
      let right = x
      for (let iteration = 0; iteration < 30; iteration += 1) {
        const middle = (left + right) / 2
        const middleY = graphValue(expression, middle)
        if (!Number.isFinite(middleY)) break
        if (previousY * middleY <= 0) right = middle
        else left = middle
      }
      roots.push((left + right) / 2)
    }
    previousX = x
    previousY = y
  }
  return dedupeNumbers(roots).slice(0, 12)
}

export function findExtrema(expression: string, min: number, max: number, samples = 500) {
  const points: Array<{ x: number; y: number; kind: 'min' | 'max' }> = []
  let previous = derivativeValue(expression, min)
  for (let index = 1; index <= samples; index += 1) {
    const x = min + (max - min) * index / samples
    const current = derivativeValue(expression, x)
    if (Number.isFinite(previous) && Number.isFinite(current) && previous * current < 0) {
      const candidateX = x - (max - min) / samples / 2
      const y = graphValue(expression, candidateX)
      if (Number.isFinite(y)) points.push({ x: candidateX, y, kind: previous < 0 ? 'min' : 'max' })
    }
    previous = current
  }
  return points.filter((point, index) => index === 0 || Math.abs(point.x - points[index - 1].x) > (max - min) / 100).slice(0, 10)
}

export function findIntersections(first: string, second: string, min: number, max: number) {
  return findRoots(`(${normalizeGraphExpression(first)})-(${normalizeGraphExpression(second)})`, min, max)
    .map((x) => ({ x, y: graphValue(first, x) }))
    .filter((point) => Number.isFinite(point.y))
}

function dedupeNumbers(values: number[]) {
  return values
    .sort((a, b) => a - b)
    .filter((value, index, array) => index === 0 || Math.abs(value - array[index - 1]) > 1e-4)
}

export function niceTick(span: number, targetTicks = 10) {
  const rough = Math.abs(span) / targetTicks
  if (!Number.isFinite(rough) || rough <= 0) return 1
  const power = 10 ** Math.floor(Math.log10(rough))
  const normalized = rough / power
  const nice = normalized < 1.5 ? 1 : normalized < 3 ? 2 : normalized < 7 ? 5 : 10
  return nice * power
}

export function shouldBreakSegment(previousY: number, nextY: number, visibleSpan: number) {
  return !Number.isFinite(previousY) || !Number.isFinite(nextY) || Math.abs(nextY - previousY) > visibleSpan * 1.5
}
