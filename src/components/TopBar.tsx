import { Menu, Palette, Search, Settings2 } from 'lucide-react'
import type { CalculatorMode } from '../types'
import { BrandMark } from './BrandMark'

interface TopBarProps {
  mode: CalculatorMode
  onModeChange: (mode: CalculatorMode) => void
  onCommand: () => void
  onAtmosphere: () => void
  onWorkspace: () => void
}

const MODES: CalculatorMode[] = ['basic', 'scientific', 'convert', 'graph']

export function TopBar({ mode, onModeChange, onCommand, onAtmosphere, onWorkspace }: TopBarProps) {
  return (
    <header className="topbar">
      <button className="mobile-menu icon-button" onClick={onWorkspace} aria-label="Open workspaces">
        <Menu size={20} />
      </button>
      <BrandMark />
      <nav className="mode-nav" aria-label="Calculator modes">
        {MODES.map((item) => (
          <button
            key={item}
            className={mode === item ? 'active' : ''}
            onClick={() => onModeChange(item)}
          >
            {item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
      </nav>
      <div className="top-actions">
        <button className="command-trigger" onClick={onCommand} aria-label="Open command palette">
          <Search size={17} />
          <span>Command</span>
          <kbd>Ctrl K</kbd>
        </button>
        <button className="icon-button palette-button" onClick={onAtmosphere} aria-label="Open Atmosphere settings">
          <Palette size={19} />
        </button>
        <button className="icon-button settings-button" onClick={onAtmosphere} aria-label="Open settings">
          <Settings2 size={19} />
        </button>
      </div>
    </header>
  )
}
