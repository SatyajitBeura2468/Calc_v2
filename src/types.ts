export type CalculatorMode = 'basic' | 'scientific' | 'convert' | 'graph'

export type ThemeName = 'obsidian' | 'eclipse' | 'lunar' | 'paper'
export type KeyShape = 'sharp' | 'rounded' | 'sculpted'
export type Density = 'compact' | 'balanced' | 'spacious'
export type AngleMode = 'DEG' | 'RAD'

export interface Settings {
  theme: ThemeName
  accent: string
  keyShape: KeyShape
  density: Density
  sound: boolean
  haptics: boolean
  motion: boolean
  backgroundIntensity: number
  precision: number
  angleMode: AngleMode
}

export interface HistoryEntry {
  id: string
  expression: string
  result: string
  createdAt: number
  pinned: boolean
}

export interface Workspace {
  id: string
  name: string
  icon: 'clock' | 'orbit' | 'wallet' | 'draft'
}

export interface UnitDefinition {
  id: string
  label: string
  symbol: string
  toBase: (value: number) => number
  fromBase: (value: number) => number
}

export interface UnitCategory {
  id: string
  label: string
  units: UnitDefinition[]
}
