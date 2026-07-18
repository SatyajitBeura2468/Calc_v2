import { Circle, Keyboard, MemoryStick } from 'lucide-react'
import type { Settings } from '../types'

interface StatusBarProps {
  settings: Settings
  memory: number
  onSettingsChange: (settings: Settings) => void
}

export function StatusBar({ settings, memory, onSettingsChange }: StatusBarProps) {
  return (
    <footer className="statusbar">
      <div className="ready-state"><Circle size={11} fill="currentColor" /> Ready</div>
      <div className="status-controls">
        <button onClick={() => onSettingsChange({ ...settings, angleMode: settings.angleMode === 'DEG' ? 'RAD' : 'DEG' })}>{settings.angleMode}</button>
        <label>Precision
          <select value={settings.precision} onChange={(event) => onSettingsChange({ ...settings, precision: Number(event.target.value) })}>
            {[6, 8, 10, 12, 14].map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <span>Format <b>Normal</b></span>
      </div>
      <div className="memory-state"><MemoryStick size={14} /> M: {memory ? memory.toLocaleString('en-US', { maximumSignificantDigits: 8 }) : 'empty'}</div>
      <div className="keyboard-state"><Keyboard size={15} /> Keyboard on</div>
    </footer>
  )
}
