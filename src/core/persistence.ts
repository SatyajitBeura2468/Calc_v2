import type { GraphFunction, HistoryEntry, PersistedState, Settings, Workspace } from '../types'

export const STORAGE_KEY = 'calc-v2-state-v3'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'carbon',
  accent: '#5dc6b3',
  reducedMotion: false,
  sound: false,
  haptics: true,
  defaultAngle: 'DEG',
  precision: 12,
  numberFormat: 'standard',
  historyLimit: 200,
}

const GENERAL_WORKSPACE: Workspace = { id: 'general', name: 'General', createdAt: 0 }

export const DEFAULT_GRAPH_FUNCTIONS: GraphFunction[] = [
  { id: 'f-1', expression: 'sin(x)', color: '#5dc6b3', visible: true, derivative: false },
  { id: 'f-2', expression: '0.5x + 1', color: '#e8b567', visible: true, derivative: false },
  { id: 'f-3', expression: 'x^2 - 4', color: '#a78bdb', visible: true, derivative: false },
]

export const DEFAULT_STATE: PersistedState = {
  version: 3,
  settings: DEFAULT_SETTINGS,
  workspaces: [GENERAL_WORKSPACE],
  activeWorkspaceId: 'general',
  history: [],
  memory: 0,
  lastAnswer: '0',
  graphFunctions: DEFAULT_GRAPH_FUNCTIONS,
  graphView: { xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -3, yMax: 3, grid: true, trace: true, integralEnabled: false, integralFrom: 0, integralTo: Math.PI },
  recentCommands: [],
}

function safeJson<T>(value: string | null): T | undefined {
  if (!value) return undefined
  try { return JSON.parse(value) as T } catch { return undefined }
}

export function migrateLegacyStorage(storage: Pick<Storage, 'getItem'>): PersistedState {
  const current = safeJson<Partial<PersistedState>>(storage.getItem(STORAGE_KEY))
  if (current?.version === 3) return sanitizeState(current)

  const legacyHistory = safeJson<Array<{ id?: string; expression?: string; result?: string; createdAt?: number; pinned?: boolean }>>(storage.getItem('calc-v2-history')) ?? []
  const legacySettings = safeJson<Record<string, unknown>>(storage.getItem('calc-v2-settings'))
  const legacyMemory = safeJson<number>(storage.getItem('calc-v2-memory'))
  const history: HistoryEntry[] = legacyHistory
    .filter((entry) => typeof entry.expression === 'string' && typeof entry.result === 'string')
    .map((entry, index) => ({
      id: entry.id ?? `legacy-${index}`,
      expression: entry.expression ?? '',
      rawResult: entry.result ?? '0',
      formattedResult: entry.result ?? '0',
      resultType: 'real',
      mode: 'calculate',
      angleMode: legacySettings?.angleMode === 'RAD' ? 'RAD' : 'DEG',
      precision: typeof legacySettings?.precision === 'number' ? legacySettings.precision : 12,
      timestamp: entry.createdAt ?? Date.now(),
      workspaceId: 'general',
      pinned: Boolean(entry.pinned),
    }))
  return sanitizeState({
    ...DEFAULT_STATE,
    history,
    memory: typeof legacyMemory === 'number' ? legacyMemory : 0,
    settings: {
      ...DEFAULT_SETTINGS,
      defaultAngle: legacySettings?.angleMode === 'RAD' ? 'RAD' : 'DEG',
      precision: typeof legacySettings?.precision === 'number' ? legacySettings.precision : 12,
      sound: Boolean(legacySettings?.sound),
      haptics: legacySettings?.haptics !== false,
    },
  })
}

export function sanitizeState(input: Partial<PersistedState>): PersistedState {
  const workspaces = Array.isArray(input.workspaces) && input.workspaces.length
    ? input.workspaces.filter((item): item is Workspace => Boolean(item && typeof item.id === 'string' && typeof item.name === 'string'))
    : [GENERAL_WORKSPACE]
  if (!workspaces.some((workspace) => workspace.id === 'general')) workspaces.unshift(GENERAL_WORKSPACE)
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id))
  const settings = { ...DEFAULT_SETTINGS, ...(input.settings ?? {}) }
  if (!['carbon', 'light', 'contrast', 'paper'].includes(settings.theme)) settings.theme = 'carbon'
  if (!['DEG', 'RAD', 'GRAD'].includes(settings.defaultAngle)) settings.defaultAngle = 'DEG'
  if (![6, 8, 10, 12, 14, 16].includes(settings.precision)) settings.precision = 12
  const history = Array.isArray(input.history) ? input.history.filter((entry): entry is HistoryEntry => Boolean(entry && typeof entry.id === 'string' && typeof entry.expression === 'string')).map((entry) => ({ ...entry, workspaceId: workspaceIds.has(entry.workspaceId) ? entry.workspaceId : 'general' })) : []
  return {
    ...DEFAULT_STATE,
    ...input,
    version: 3,
    settings,
    workspaces,
    activeWorkspaceId: workspaceIds.has(input.activeWorkspaceId ?? '') ? input.activeWorkspaceId! : 'general',
    history,
    graphFunctions: Array.isArray(input.graphFunctions) && input.graphFunctions.length ? input.graphFunctions.slice(0, 8) : DEFAULT_GRAPH_FUNCTIONS,
    graphView: { ...DEFAULT_STATE.graphView, ...(input.graphView ?? {}) },
    recentCommands: Array.isArray(input.recentCommands) ? input.recentCommands.slice(0, 6) : [],
  }
}

export function loadState() {
  if (typeof window === 'undefined') return DEFAULT_STATE
  return migrateLegacyStorage(window.localStorage)
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function validateImport(value: unknown) {
  if (!value || typeof value !== 'object' || (value as { version?: unknown }).version !== 3) throw new Error('This is not a Calc V2 version 3 export.')
  return sanitizeState(value as Partial<PersistedState>)
}

export function exportJson(state: PersistedState) {
  return JSON.stringify(state, null, 2)
}

export function exportHistoryCsv(history: HistoryEntry[]) {
  const quote = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
  return [
    ['timestamp', 'workspace', 'mode', 'expression', 'raw_result', 'formatted_result', 'angle', 'precision', 'pinned', 'title', 'note'].join(','),
    ...history.map((entry) => [new Date(entry.timestamp).toISOString(), entry.workspaceId, entry.mode, entry.expression, entry.rawResult, entry.formattedResult, entry.angleMode, entry.precision, entry.pinned, entry.title, entry.note].map(quote).join(',')),
  ].join('\n')
}
