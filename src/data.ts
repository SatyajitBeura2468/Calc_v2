import type { Settings, UnitCategory, Workspace } from './types'

export const DEFAULT_SETTINGS: Settings = {
  theme: 'obsidian',
  accent: '#54d4c4',
  keyShape: 'sculpted',
  density: 'balanced',
  sound: false,
  haptics: true,
  motion: true,
  backgroundIntensity: 62,
  precision: 12,
  angleMode: 'DEG',
}

export const WORKSPACES: Workspace[] = [
  { id: 'today', name: 'Today', icon: 'clock' },
  { id: 'physics', name: 'Physics', icon: 'orbit' },
  { id: 'finance', name: 'Finances', icon: 'wallet' },
  { id: 'scratch', name: 'Scratchpad', icon: 'draft' },
]

export const ACCENTS = [
  '#54d4c4',
  '#73a8ff',
  '#b889ef',
  '#e86489',
  '#ff7657',
  '#f4b85f',
  '#8bcf8a',
]

export const UNIT_CATEGORIES: UnitCategory[] = [
  {
    id: 'length',
    label: 'Length',
    units: [
      { id: 'm', label: 'Metres', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
      { id: 'km', label: 'Kilometres', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'cm', label: 'Centimetres', symbol: 'cm', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'mi', label: 'Miles', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
      { id: 'ft', label: 'Feet', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
    ],
  },
  {
    id: 'mass',
    label: 'Mass',
    units: [
      { id: 'kg', label: 'Kilograms', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', label: 'Grams', symbol: 'g', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'lb', label: 'Pounds', symbol: 'lb', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { id: 'oz', label: 'Ounces', symbol: 'oz', toBase: (v) => v * 0.028349523125, fromBase: (v) => v / 0.028349523125 },
    ],
  },
  {
    id: 'temperature',
    label: 'Temperature',
    units: [
      { id: 'c', label: 'Celsius', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: 'Fahrenheit', symbol: '°F', toBase: (v) => (v - 32) * 5 / 9, fromBase: (v) => v * 9 / 5 + 32 },
      { id: 'k', label: 'Kelvin', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  {
    id: 'time',
    label: 'Time',
    units: [
      { id: 's', label: 'Seconds', symbol: 's', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', label: 'Minutes', symbol: 'min', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'hr', label: 'Hours', symbol: 'hr', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'day', label: 'Days', symbol: 'days', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
    ],
  },
]

export const BASIC_KEYS = [
  ['AC', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
]

export const SCIENTIFIC_KEYS = [
  ['x²', '(', ')', '%', '^', '√', '÷'],
  ['sin', 'cos', 'tan', '7', '8', '9', '×'],
  ['asin', 'acos', 'atan', '4', '5', '6', '−'],
  ['ln', 'log', 'π', '1', '2', '3', '+'],
  ['e', 'Ans', '±', '0', '.', '⌫', '='],
]
