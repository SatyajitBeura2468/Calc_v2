import { describe, expect, it } from 'vitest'
import { DEFAULT_STATE, exportHistoryCsv, migrateLegacyStorage, sanitizeState, validateImport } from '../core/persistence'

describe('versioned persistence', () => {
  it('migrates legacy history and settings', () => {
    const values: Record<string, string> = { 'calc-v2-history': JSON.stringify([{ expression: '2+2', result: '4', pinned: true }]), 'calc-v2-settings': JSON.stringify({ angleMode: 'RAD' }), 'calc-v2-memory': '9' }
    const migrated = migrateLegacyStorage({ getItem: (key) => values[key] ?? null })
    expect(migrated.version).toBe(3); expect(migrated.history[0].formattedResult).toBe('4'); expect(migrated.settings.defaultAngle).toBe('RAD'); expect(migrated.memory).toBe(9)
  })
  it('repairs invalid workspace references', () => { const state = sanitizeState({ ...DEFAULT_STATE, activeWorkspaceId: 'missing' }); expect(state.activeWorkspaceId).toBe('general') })
  it('validates imports', () => { expect(validateImport(DEFAULT_STATE).version).toBe(3); expect(() => validateImport({ nonsense: true })).toThrow(/Calc V2 version 3/) })
  it('exports safe CSV', () => { expect(exportHistoryCsv([{ id:'1', expression:'2+2', rawResult:'4', formattedResult:'4', resultType:'real', mode:'calculate', angleMode:'DEG', precision:12, timestamp:0, workspaceId:'general', pinned:false }])).toContain('"2+2"') })
})
