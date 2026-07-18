import { Clock3, Command, Menu, Settings2 } from 'lucide-react'
import type { AppMode } from '../types'

const MODES: Array<{ id: AppMode; label: string }> = [
  { id: 'calculate', label: 'Calculate' },
  { id: 'graph', label: 'Graph' },
  { id: 'convert', label: 'Convert' },
  { id: 'lab', label: 'Lab' },
]

interface AppHeaderProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  onHistory: () => void
  onSettings: () => void
  onCommands: () => void
}

export function AppHeader({ mode, onModeChange, onHistory, onSettings, onCommands }: AppHeaderProps) {
  return (
    <header className="app-header">
      <button className="icon-button mobile-only" onClick={onHistory} aria-label="Open workspaces and history"><Menu size={21} /></button>
      <button className="wordmark" onClick={() => onModeChange('calculate')} aria-label="Calc V2 home"><span>Calc</span><b>V2</b></button>
      <nav className="primary-nav" aria-label="Primary">
        {MODES.map((item) => <button key={item.id} className={mode === item.id ? 'active' : ''} onClick={() => onModeChange(item.id)}>{item.label}</button>)}
      </nav>
      <div className="header-actions">
        <button className="command-button" onClick={onCommands} aria-label="Open command palette"><Command size={17} /><span>Command</span><kbd>⌘ K</kbd></button>
        <button className="icon-button desktop-history" onClick={onHistory} aria-label="Open workspaces and history"><Clock3 size={19} /></button>
        <button className="icon-button" onClick={onSettings} aria-label="Open settings"><Settings2 size={19} /></button>
      </div>
    </header>
  )
}
