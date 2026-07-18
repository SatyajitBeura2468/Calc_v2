export type AppMode = 'calculate' | 'graph' | 'convert' | 'lab'
export type CalculatorKind = 'basic' | 'scientific'
export type AngleMode = 'DEG' | 'RAD' | 'GRAD'
export type NumberFormat = 'standard' | 'scientific' | 'engineering'
export type ResultView = 'exact' | 'decimal'
export type ThemeName = 'carbon' | 'light' | 'contrast' | 'paper'
export type Theme = ThemeName
export type HistoryMode = AppMode

export interface Settings {
  theme: ThemeName
  accent: string
  reducedMotion: boolean
  sound: boolean
  haptics: boolean
  defaultAngle: AngleMode
  precision: number
  numberFormat: NumberFormat
  historyLimit: 50 | 200 | 0
}

export interface Workspace {
  id: string
  name: string
  createdAt: number
}

export interface HistoryEntry {
  id: string
  expression: string
  rawResult: string
  formattedResult: string
  resultType: 'real' | 'complex' | 'boolean' | 'error'
  mode: HistoryMode
  angleMode: AngleMode
  precision: number
  timestamp: number
  workspaceId: string
  pinned: boolean
  title?: string
  note?: string
  context?: Record<string, unknown>
}

export interface GraphFunction {
  id: string
  expression: string
  color: string
  visible: boolean
  derivative: boolean
  integral?: { enabled: boolean; from: number; to: number }
}

export interface GraphViewState {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
  grid: boolean
  trace: boolean
  integralEnabled: boolean
  integralFrom: number
  integralTo: number
}

export interface PersistedState {
  version: 3
  settings: Settings
  workspaces: Workspace[]
  activeWorkspaceId: string
  history: HistoryEntry[]
  memory: number
  lastAnswer: string
  graphFunctions: GraphFunction[]
  graphView: GraphViewState
  recentCommands: string[]
}

export interface CalculationResult {
  raw: string
  formatted: string
  exact?: string
  type: HistoryEntry['resultType']
  explanation?: string[]
}

export interface UnitDefinition {
  id: string
  name: string
  symbol: string
  factor: number
  offset?: number
  minBase?: number
  toBase?: (value: number) => number
  fromBase?: (value: number) => number
}

export interface UnitCategory {
  id: string
  name: string
  baseUnitId: string
  units: UnitDefinition[]
}
