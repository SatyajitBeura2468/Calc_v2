import { describe, expect, it } from 'vitest'
import { findIntersections, findRoots, graphValue, shouldBreakSegment } from '../core/graph'
import { determinant, inverse, matrixMultiply, parseDataset, programmerRepresentations, solveQuadratic, statistics } from '../core/lab'

describe('graph engine', () => {
  it('evaluates radians coherently', () => { expect(graphValue('sin(x)', Math.PI / 2)).toBeCloseTo(1) })
  it('finds roots and intersections', () => { expect(findRoots('x^2-4', -3, 3)).toEqual(expect.arrayContaining([expect.closeTo(-2, 3), expect.closeTo(2, 3)])); expect(findIntersections('x', '2-x', -1, 3)[0].x).toBeCloseTo(1, 3) })
  it('breaks lines at discontinuities', () => { expect(shouldBreakSegment(-100, 100, 10)).toBe(true); expect(shouldBreakSegment(1, 1.1, 10)).toBe(false) })
})

describe('lab engines', () => {
  it('solves real and complex quadratics', () => { expect(solveQuadratic(1, -3, 2).roots).toEqual([2, 1]); expect(solveQuadratic(1, 0, 1).kind).toBe('complex') })
  it('performs matrix operations', () => { expect(determinant([[1,2],[3,4]])).toBe(-2); expect(matrixMultiply([[1,2]], [[3],[4]])).toEqual([[11]]); expect(inverse([[4,7],[2,6]])[0][0]).toBeCloseTo(.6) })
  it('computes sample statistics', () => { const result = statistics(parseDataset('1,2,2,3'), true); expect(result.mean).toBe(2); expect(result.modes).toEqual([2]); expect(result.variance).toBeCloseTo(2/3) })
  it('reports programmer overflow and bases', () => { const result = programmerRepresentations('FF', 16, 8, true); expect(result.value).toBe(-1); expect(result.binary).toBe('11111111') })
})
