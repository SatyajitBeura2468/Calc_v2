import { CheckSquare, ChevronRight, Download, FileJson, FolderPlus, Pencil, Pin, Search, Trash2, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { exportHistoryCsv, exportJson, validateImport } from '../../core/persistence'
import type { AppModel } from '../../app/useAppModel'
import type { HistoryEntry } from '../../types'

interface HistoryDrawerProps {
  open: boolean
  model: AppModel
  onClose: () => void
  onRecall: (entry: HistoryEntry) => void
  onToast: (message: string) => void
}

function download(name: string, value: string, type: string) {
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([value], { type }))
  link.download = name
  link.click()
  URL.revokeObjectURL(link.href)
}

export function HistoryDrawer({ open, model, onClose, onRecall, onToast }: HistoryDrawerProps) {
  const { state } = model
  const [query, setQuery] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selected, setSelected] = useState<string[]>([])
  const [renaming, setRenaming] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const active = state.workspaces.find((workspace) => workspace.id === state.activeWorkspaceId) ?? state.workspaces[0]
  const now = Date.now()
  const visible = useMemo(() => state.history.filter((entry) => {
    if (entry.workspaceId !== state.activeWorkspaceId) return false
    if (modeFilter !== 'all' && entry.mode !== modeFilter) return false
    if (dateFilter === 'today' && now - entry.timestamp > 86_400_000) return false
    if (dateFilter === 'week' && now - entry.timestamp > 604_800_000) return false
    return `${entry.title ?? ''} ${entry.expression} ${entry.formattedResult} ${entry.note ?? ''}`.toLowerCase().includes(query.toLowerCase())
  }), [dateFilter, modeFilter, now, query, state.activeWorkspaceId, state.history])

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement as HTMLElement
    requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus())
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') { onClose(); return }
      if (event.key !== 'Tab' || !drawerRef.current) return
      const items = [...drawerRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])')]
      const first = items[0]; const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', handleKey)
    return () => { document.removeEventListener('keydown', handleKey); previousFocus.current?.focus() }
  }, [onClose, open])

  async function importData(file?: File) {
    if (!file) return
    try {
      const next = validateImport(JSON.parse(await file.text()))
      model.replaceState(next)
      onToast('Calc V2 data imported')
    } catch (error) {
      onToast(error instanceof Error ? error.message : 'Import failed')
    }
  }

  return (
    <>
      <div className={`drawer-scrim ${open ? 'open' : ''}`} onClick={onClose} />
      <aside ref={drawerRef} className={`history-drawer ${open ? 'open' : ''}`} aria-label="Workspaces and history" aria-hidden={!open} inert={!open}>
        <header className="drawer-header"><div><strong>Workspaces</strong><span>{state.history.length} saved calculations</span></div><button className="icon-button" onClick={onClose} aria-label="Close history"><X size={19} /></button></header>
        <section className="workspace-section">
          <div className="workspace-tabs">
            {state.workspaces.map((workspace) => {
              const count = state.history.filter((entry) => entry.workspaceId === workspace.id).length
              return <button key={workspace.id} className={workspace.id === state.activeWorkspaceId ? 'active' : ''} onClick={() => model.setActiveWorkspace(workspace.id)}><span>{workspace.name}</span><small>{count}</small></button>
            })}
          </div>
          <div className="workspace-actions">
            <button onClick={() => model.createWorkspace()}><FolderPlus size={16} /> New</button>
            <button onClick={() => setRenaming((value) => !value)}><Pencil size={15} /> Rename</button>
            {active.id !== 'general' ? <button onClick={() => window.confirm(`Delete ${active.name}? Its history will move to General.`) && model.deleteWorkspace(active.id)}><Trash2 size={15} /> Delete</button> : null}
          </div>
          {renaming ? <input className="workspace-rename" defaultValue={active.name} autoFocus onBlur={(event) => { model.renameWorkspace(active.id, event.target.value); setRenaming(false) }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} aria-label="Workspace name" /> : null}
        </section>
        <section className="history-tools">
          <label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history" aria-label="Search history" /></label>
          <div className="filter-row">
            <select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} aria-label="Filter by mode"><option value="all">All modes</option><option value="calculate">Calculate</option><option value="graph">Graph</option><option value="convert">Convert</option><option value="lab">Lab</option></select>
            <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} aria-label="Filter by date"><option value="all">Any date</option><option value="today">Today</option><option value="week">Last 7 days</option></select>
          </div>
        </section>
        <section className="history-list" aria-label="Saved calculations">
          {visible.length ? visible.map((entry) => (
            <article className={selected.includes(entry.id) ? 'history-entry selected' : 'history-entry'} key={entry.id}>
              <button className="select-entry" onClick={() => setSelected((items) => items.includes(entry.id) ? items.filter((id) => id !== entry.id) : [...items, entry.id])} aria-label={`${selected.includes(entry.id) ? 'Unselect' : 'Select'} ${entry.expression}`}><CheckSquare size={16} /></button>
              <button className="recall-entry" onClick={() => onRecall(entry)}><span>{entry.title || entry.expression}</span><strong>{entry.formattedResult}</strong><small>{new Date(entry.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · {entry.mode}</small></button>
              <button className={entry.pinned ? 'pin active' : 'pin'} onClick={() => model.updateHistory(entry.id, { pinned: !entry.pinned })} aria-label={entry.pinned ? 'Unpin calculation' : 'Pin calculation'}><Pin size={15} /></button>
              <details><summary><ChevronRight size={14} /> Details</summary><label>Title<input value={entry.title ?? ''} onChange={(event) => model.updateHistory(entry.id, { title: event.target.value })} /></label><label>Note<textarea value={entry.note ?? ''} onChange={(event) => model.updateHistory(entry.id, { note: event.target.value })} /></label><label>Move to<select value={entry.workspaceId} onChange={(event) => model.updateHistory(entry.id, { workspaceId: event.target.value })}>{state.workspaces.map((workspace) => <option value={workspace.id} key={workspace.id}>{workspace.name}</option>)}</select></label></details>
            </article>
          )) : <div className="empty-state"><strong>No calculations here</strong><p>Committed results in this workspace will appear here.</p></div>}
        </section>
        <footer className="drawer-footer">
          {selected.length ? <button className="danger-button" onClick={() => { model.removeHistory(selected); setSelected([]) }}><Trash2 size={15} /> Delete selected ({selected.length})</button> : <button onClick={() => window.confirm(`Clear unpinned history in ${active.name}?`) && model.clearWorkspaceHistory()}><Trash2 size={15} /> Clear workspace</button>}
          <div><button onClick={() => download('calc-v2-history.csv', exportHistoryCsv(state.history), 'text/csv')}><Download size={15} /> CSV</button><button onClick={() => download('calc-v2-backup.json', exportJson(state), 'application/json')}><FileJson size={15} /> JSON</button><button onClick={() => importRef.current?.click()}><Upload size={15} /> Import</button></div>
          <input ref={importRef} hidden type="file" accept="application/json" onChange={(event) => void importData(event.target.files?.[0])} />
        </footer>
      </aside>
    </>
  )
}
