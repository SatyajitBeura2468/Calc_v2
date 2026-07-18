import { useEffect, useMemo, useRef, useState } from 'react'
import { Calculator, Clock3, Command, Copy, FolderPlus, Grid3X3, Moon, Search, Settings2, Trash2 } from 'lucide-react'
import type { AppModel } from '../../app/useAppModel'
import { Modal } from '../../components/ui/Modal'
import type { AngleMode, AppMode, NumberFormat, Theme } from '../../types'

interface CommandItem { id: string; label: string; hint?: string; keywords: string; icon: React.ComponentType<{ size?: number }>; run: () => void }
interface CommandPaletteProps { model: AppModel; open: boolean; onClose: () => void; onHistory: (focusSearch?: boolean) => void; onSettings: () => void; onToast: (message: string) => void }

export function CommandPalette({ model, open, onClose, onHistory, onSettings, onToast }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const execute = (id: string, run: () => void) => { run(); model.recordCommand(id); onClose() }
  const items = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      ...(['calculate', 'graph', 'convert', 'lab'] as AppMode[]).map((mode) => ({ id: `mode-${mode}`, label: `Open ${mode[0].toUpperCase()}${mode.slice(1)}`, hint: mode === model.mode ? 'Current mode' : undefined, keywords: `switch navigate ${mode}`, icon: mode === 'graph' ? Grid3X3 : Calculator, run: () => model.setMode(mode) })),
      { id: 'history', label: 'Open history & workspaces', keywords: 'drawer calculations saved', icon: Clock3, run: () => onHistory() },
      { id: 'search-history', label: 'Search calculation history', keywords: 'find saved calculation', icon: Search, run: () => onHistory(true) },
      { id: 'settings', label: 'Open settings', keywords: 'customize preferences', icon: Settings2, run: onSettings },
      { id: 'workspace-create', label: 'Create a workspace', keywords: 'new folder project', icon: FolderPlus, run: () => { model.createWorkspace(); onToast('Workspace created') } },
      { id: 'calc-clear', label: 'Clear expression', keywords: 'calculator reset ac', icon: Trash2, run: () => window.dispatchEvent(new CustomEvent('calc-command', { detail: 'clear' })) },
      { id: 'calc-copy', label: 'Copy current result', keywords: 'clipboard calculator answer', icon: Copy, run: () => window.dispatchEvent(new CustomEvent('calc-command', { detail: 'copy-result' })) },
      { id: 'graph-reset', label: 'Reset graph view', keywords: 'axes zoom range', icon: Grid3X3, run: () => model.setGraphView({ xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -3, yMax: 3 }) },
      ...(['DEG', 'RAD', 'GRAD'] as AngleMode[]).map((angle) => ({ id: `angle-${angle}`, label: `Set angle mode to ${angle}`, keywords: 'degrees radians gradians', icon: Calculator, run: () => model.updateSettings({ defaultAngle: angle }) })),
      ...(['standard', 'scientific', 'engineering'] as NumberFormat[]).map((format) => ({ id: `format-${format}`, label: `Use ${format} notation`, keywords: 'number result display', icon: Calculator, run: () => model.updateSettings({ numberFormat: format }) })),
      ...(['carbon', 'light', 'contrast', 'paper'] as Theme[]).map((theme) => ({ id: `theme-${theme}`, label: `Switch to ${theme} theme`, keywords: 'appearance color', icon: Moon, run: () => model.updateSettings({ theme }) })),
      ...['temperature', 'length', 'data', 'energy'].map((category) => ({ id: `convert-${category}`, label: `Convert ${category}`, keywords: `units ${category}`, icon: Calculator, run: () => { model.setMode('convert'); window.setTimeout(() => window.dispatchEvent(new CustomEvent('converter-category', { detail: category })), 0) } })),
    ]
    return base
  }, [model, onHistory, onSettings, onToast])
  const filtered = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    const list = items.filter((item) => terms.every((term) => `${item.label} ${item.keywords}`.toLowerCase().includes(term)))
    if (!query && model.state.recentCommands.length) return [...list].sort((a, b) => {
      const ai = model.state.recentCommands.indexOf(a.id); const bi = model.state.recentCommands.indexOf(b.id)
      return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi)
    })
    return list
  }, [items, model.state.recentCommands, query])
  useEffect(() => { if (open) { setQuery(''); setActive(0); requestAnimationFrame(() => inputRef.current?.focus()) } }, [open])
  useEffect(() => setActive(0), [query])
  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive((value) => Math.min(filtered.length - 1, value + 1)) }
    if (event.key === 'ArrowUp') { event.preventDefault(); setActive((value) => Math.max(0, value - 1)) }
    if (event.key === 'Enter' && filtered[active]) { event.preventDefault(); execute(filtered[active].id, filtered[active].run) }
  }
  return <Modal open={open} onClose={onClose} title="Command palette" className="command-modal"><div className="command-search"><Command size={20} /><input ref={inputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={onKeyDown} placeholder="Type a command or search…" role="combobox" aria-expanded="true" aria-controls="command-list" aria-activedescendant={filtered[active] ? `command-${filtered[active].id}` : undefined} /></div><div id="command-list" className="command-list" role="listbox">{filtered.length ? filtered.map((item, index) => { const Icon = item.icon; return <button id={`command-${item.id}`} key={item.id} role="option" aria-selected={index === active} className={index === active ? 'active' : ''} onMouseEnter={() => setActive(index)} onClick={() => execute(item.id, item.run)}><Icon size={18} /><span>{item.label}</span>{item.hint ? <small>{item.hint}</small> : null}</button> }) : <p>No matching commands.</p>}</div><footer className="command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span><span><kbd>Enter</kbd> Run</span><span><kbd>Esc</kbd> Close</span></footer></Modal>
}
