export function parseDataset(input: string) {
  const values = input.split(/[\s,;]+/).filter(Boolean).map(Number)
  if (!values.length) throw new Error('Enter at least one number.')
  if (values.some((value) => !Number.isFinite(value))) throw new Error('The dataset contains something that is not a number.')
  return values
}

export function statistics(values: number[], sample = true) {
  const sorted = [...values].sort((a, b) => a - b)
  const count = sorted.length
  const sum = sorted.reduce((total, value) => total + value, 0)
  const mean = sum / count
  const median = count % 2 ? sorted[(count - 1) / 2] : (sorted[count / 2 - 1] + sorted[count / 2]) / 2
  const frequencies = new Map<number, number>()
  sorted.forEach((value) => frequencies.set(value, (frequencies.get(value) ?? 0) + 1))
  const maxFrequency = Math.max(...frequencies.values())
  const modes = maxFrequency === 1 ? [] : [...frequencies].filter(([, frequency]) => frequency === maxFrequency).map(([value]) => value)
  const divisor = sample ? count - 1 : count
  const variance = divisor > 0 ? sorted.reduce((total, value) => total + (value - mean) ** 2, 0) / divisor : 0
  const quantile = (q: number) => {
    const position = (count - 1) * q
    const lower = Math.floor(position)
    const fraction = position - lower
    return sorted[lower + 1] === undefined ? sorted[lower] : sorted[lower] + fraction * (sorted[lower + 1] - sorted[lower])
  }
  return {
    count, sum, mean, median, modes, min: sorted[0], max: sorted[count - 1], range: sorted[count - 1] - sorted[0],
    variance, standardDeviation: Math.sqrt(variance), q1: quantile(.25), q3: quantile(.75), sorted,
  }
}

export function solveLinear(a: number, b: number) {
  if (a === 0 && b === 0) return { kind: 'infinite' as const, roots: [] as number[] }
  if (a === 0) return { kind: 'none' as const, roots: [] as number[] }
  return { kind: 'real' as const, roots: [-b / a], verification: a * (-b / a) + b }
}

export function solveQuadratic(a: number, b: number, c: number) {
  if (a === 0) return { ...solveLinear(b, c), discriminant: b * b }
  const discriminant = b * b - 4 * a * c
  if (discriminant >= 0) {
    const first = (-b + Math.sqrt(discriminant)) / (2 * a)
    const second = (-b - Math.sqrt(discriminant)) / (2 * a)
    return { kind: 'real' as const, discriminant, roots: [first, second], verification: [a * first ** 2 + b * first + c, a * second ** 2 + b * second + c] }
  }
  const real = -b / (2 * a)
  const imaginary = Math.sqrt(-discriminant) / (2 * Math.abs(a))
  return { kind: 'complex' as const, discriminant, roots: [`${real} + ${imaginary}i`, `${real} - ${imaginary}i`] }
}

export function solveSystem2(coefficients: [number, number, number, number, number, number]) {
  const [a, b, c, d, e, f] = coefficients
  const determinant = a * e - b * d
  if (Math.abs(determinant) < 1e-12) return { kind: 'singular' as const }
  const x = (c * e - b * f) / determinant
  const y = (a * f - c * d) / determinant
  return { kind: 'unique' as const, x, y, verification: [a * x + b * y, d * x + e * y] }
}

export type Matrix = number[][]

export function matrixAdd(a: Matrix, b: Matrix, direction = 1) {
  assertSameDimensions(a, b)
  return a.map((row, r) => row.map((value, c) => value + direction * b[r][c]))
}

export function matrixMultiply(a: Matrix, b: Matrix) {
  if (!a.length || !b.length || a[0].length !== b.length) throw new Error('For A × B, the columns of A must equal the rows of B.')
  return a.map((row) => b[0].map((_, column) => row.reduce((sum, value, index) => sum + value * b[index][column], 0)))
}

export function transpose(matrix: Matrix) {
  return matrix[0].map((_, column) => matrix.map((row) => row[column]))
}

export function determinant(matrix: Matrix): number {
  if (matrix.length !== matrix[0]?.length) throw new Error('Determinant requires a square matrix.')
  if (matrix.length === 1) return matrix[0][0]
  if (matrix.length === 2) return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]
  return matrix[0].reduce((sum, value, column) => sum + (column % 2 ? -1 : 1) * value * determinant(matrix.slice(1).map((row) => row.filter((_, index) => index !== column))), 0)
}

export function inverse(matrix: Matrix) {
  if (matrix.length !== matrix[0]?.length) throw new Error('Inverse requires a square matrix.')
  const size = matrix.length
  const augmented = matrix.map((row, r) => [...row, ...Array.from({ length: size }, (_, c) => r === c ? 1 : 0)])
  for (let column = 0; column < size; column += 1) {
    let pivot = column
    for (let row = column + 1; row < size; row += 1) if (Math.abs(augmented[row][column]) > Math.abs(augmented[pivot][column])) pivot = row
    if (Math.abs(augmented[pivot][column]) < 1e-12) throw new Error('This matrix is singular and has no inverse.')
    ;[augmented[column], augmented[pivot]] = [augmented[pivot], augmented[column]]
    const divisor = augmented[column][column]
    augmented[column] = augmented[column].map((value) => value / divisor)
    for (let row = 0; row < size; row += 1) {
      if (row === column) continue
      const factor = augmented[row][column]
      augmented[row] = augmented[row].map((value, index) => value - factor * augmented[column][index])
    }
  }
  return augmented.map((row) => row.slice(size))
}

export function matrixRank(matrix: Matrix) {
  const copy = matrix.map((row) => [...row])
  let rank = 0
  let column = 0
  while (rank < copy.length && column < copy[0].length) {
    const pivot = copy.findIndex((row, index) => index >= rank && Math.abs(row[column]) > 1e-10)
    if (pivot < 0) { column += 1; continue }
    ;[copy[rank], copy[pivot]] = [copy[pivot], copy[rank]]
    const divisor = copy[rank][column]
    copy[rank] = copy[rank].map((value) => value / divisor)
    for (let row = 0; row < copy.length; row += 1) if (row !== rank) {
      const factor = copy[row][column]
      copy[row] = copy[row].map((value, index) => value - factor * copy[rank][index])
    }
    rank += 1
    column += 1
  }
  return rank
}

export function identity(size: number) {
  return Array.from({ length: size }, (_, row) => Array.from({ length: size }, (_, column) => row === column ? 1 : 0))
}

function assertSameDimensions(a: Matrix, b: Matrix) {
  if (a.length !== b.length || a.some((row, index) => row.length !== b[index]?.length)) throw new Error('Matrices must have the same dimensions.')
}

export function programmerRepresentations(input: string, radix: 2 | 8 | 10 | 16, width: 8 | 16 | 32, signed: boolean) {
  const parsed = Number.parseInt(input.trim() || '0', radix)
  if (!Number.isFinite(parsed)) throw new Error('Enter a valid number for the selected base.')
  const modulo = 2 ** width
  const unsigned = ((parsed % modulo) + modulo) % modulo
  const signedValue = signed && unsigned >= modulo / 2 ? unsigned - modulo : unsigned
  return {
    value: signed ? signedValue : unsigned,
    unsigned,
    overflow: parsed < (signed ? -(modulo / 2) : 0) || parsed > (signed ? modulo / 2 - 1 : modulo - 1),
    binary: unsigned.toString(2).padStart(width, '0'),
    octal: unsigned.toString(8),
    decimal: String(signed ? signedValue : unsigned),
    hexadecimal: unsigned.toString(16).toUpperCase(),
  }
}

export function bitwise(operation: 'AND' | 'OR' | 'XOR' | 'NOT' | 'SHL' | 'SHR', a: number, b: number, width: 8 | 16 | 32) {
  const mask = width === 32 ? 0xffffffff : 2 ** width - 1
  if (operation === 'AND') return (a & b) & mask
  if (operation === 'OR') return (a | b) & mask
  if (operation === 'XOR') return (a ^ b) & mask
  if (operation === 'NOT') return (~a) & mask
  if (operation === 'SHL') return (a << b) & mask
  return (a >>> b) & mask
}
