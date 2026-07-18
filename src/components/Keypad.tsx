import { BASIC_KEYS, SCIENTIFIC_KEYS } from '../data'
import type { CalculatorMode, Density, KeyShape } from '../types'

interface KeypadProps {
  mode: CalculatorMode
  keyShape: KeyShape
  density: Density
  onPress: (key: string) => void
}

function keyClass(key: string) {
  if (key === '=') return 'equals'
  if (['÷', '×', '−', '+'].includes(key)) return 'operator'
  if (['AC', '±', '%', '⌫', '2nd'].includes(key)) return 'utility'
  if (['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'π', 'e', '√', '^'].includes(key)) return 'scientific-key'
  if (key === '0') return 'zero'
  return ''
}

export function Keypad({ mode, keyShape, density, onPress }: KeypadProps) {
  const scientific = mode === 'scientific' || mode === 'graph'
  const rows = scientific ? SCIENTIFIC_KEYS : BASIC_KEYS
  return (
    <section className={`keypad ${scientific ? 'scientific' : 'basic'} shape-${keyShape} density-${density}`} aria-label="Calculator keypad">
      {rows.flat().map((key, index) => (
        <button
          key={`${key}-${index}`}
          className={`calc-key ${keyClass(key)}`}
          onClick={() => onPress(key)}
          aria-label={key === '=' ? 'Calculate result' : key}
        >
          {key}
        </button>
      ))}
    </section>
  )
}
