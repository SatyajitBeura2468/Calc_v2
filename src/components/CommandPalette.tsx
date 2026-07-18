import { Calculator, Command, Eraser, MoonStar, Orbit, Palette, Ruler, Search, Sigma, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { CalculatorMode, ThemeName } from '../types'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onModeChange: (mode: CalculatorMode) => void
  onThemeChange: (theme: ThemeName) => void
  onClearHistory: () => void
}

const commands = [
  { id: 'basic', label: 'Switch to Basic', detail: 'Everyday arithmetic', icon: Calculator, action: 'mode', value: 'basic' },
  { id: 'scientific', label: 'Switch to Scientific', detail: 'Functions, constants, powers', icon: Sigma, action: 'mode', value: 'scientific' },
  { id: 'convert', label: 'Open Unit Converter', detail: 'Length, mass, temperature, time', icon: Ruler, action: 'mode', value: 'convert' },
  { id: 'graph', label: 'Open Graph Studio', detail: 'Plot a live function', icon: Orbit, action: 'mode', value: 'graph' },
  { id: 'obsidian', label: 'Use Obsidian atmosphere', detail: 'Deep mineral black', icon: MoonStar, action: 'theme', value: 'obsidian' },
  { id: 'paper', label: 'Use Paper atmosphere', detail: 'Warm drafting table', icon: Palette, action: 'theme', value: 'paper' },
  { id: 'clear', label: 'Clear calculation history', detail: 'Remove all unpinned and pinned results', icon: Eraser, action: 'clear', value: '' },
] as const

export function CommandPalette({ open, onClose, onModeChange, onThemeChange, onClearHistory }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => { if (open) window.setTimeout(() => inputRef.current?.focus(), 30) }, [open])
  const visible = useMemo(() => commands.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(query.toLowerCase())), [query])

  function execute(command: (typeof commands)[number]) {
    if (command.action === 'mode') onModeChange(command.value as CalculatorMode)
    if (command.action === 'theme') onThemeChange(command.value as ThemeName)
    if (command.action === 'clear') onClearHistory()
    setQuery('')
    onClose()
  }

  if (!open) return null
  return (
    <div className="command-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="command-search"><Search size={19} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What do you want to do?" onKeyDown={(event) => { if (event.key === 'Escape') onClose(); if (event.key === 'Enter' && visible[0]) execute(visible[0]) }} /><button onClick={onClose} aria-label="Close command palette"><X size={17} /></button></div>
        <div className="command-list">
          {visible.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => execute(item)}><Icon size={18} /><span><b>{item.label}</b><small>{item.detail}</small></span><Command size={13} /></button> })}
          {visible.length === 0 ? <p>No command found. Try “graph” or “paper”.</p> : null}
        </div>
      </section>
    </div>
  )
}
