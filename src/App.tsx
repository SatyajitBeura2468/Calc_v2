import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import './App.css'
import { AppHeader } from './app/AppHeader'
import { useAppModel } from './app/useAppModel'
import { Toast } from './components/ui/Toast'
import { CalculatorView } from './features/calculate/CalculatorView'
import { CommandPalette } from './features/command/CommandPalette'
import { ConverterView } from './features/convert/ConverterView'
import { GraphView } from './features/graph/GraphView'
import { HistoryDrawer } from './features/history/HistoryDrawer'
import { SettingsDialog } from './features/settings/SettingsDialog'
import type { AppMode, HistoryEntry } from './types'

const LabView = lazy(() => import('./features/lab/LabView').then((module) => ({ default: module.LabView })))

export default function App() {
  const model = useAppModel()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [commandsOpen, setCommandsOpen] = useState(false)
  const [recalled, setRecalled] = useState<HistoryEntry | null>(null)
  const [toast, setToast] = useState('')
  const showToast = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 1900) }, [])
  const closeHistory = useCallback(() => setHistoryOpen(false), [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])
  const closeCommands = useCallback(() => setCommandsOpen(false), [])

  useEffect(() => {
    document.documentElement.dataset.theme = model.state.settings.theme
    document.documentElement.style.setProperty('--accent', model.state.settings.accent)
    document.documentElement.dataset.reducedMotion = String(model.state.settings.reducedMotion)
  }, [model.state.settings.accent, model.state.settings.reducedMotion, model.state.settings.theme])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setCommandsOpen(true) }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'h') { event.preventDefault(); setHistoryOpen(true) }
      if ((event.ctrlKey || event.metaKey) && event.key === ',') { event.preventDefault(); setSettingsOpen(true) }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function changeMode(mode: AppMode) {
    model.setMode(mode)
    const parameters = new URLSearchParams(location.hash.slice(1))
    parameters.set('mode', mode)
    window.history.replaceState(null, '', `#${parameters}`)
  }
  function recall(entry: HistoryEntry) {
    if (entry.mode === 'graph' && entry.context) {
      const context = entry.context as { functions?: typeof model.state.graphFunctions; view?: typeof model.state.graphView }
      if (context.functions) model.setGraphFunctions(context.functions)
      if (context.view) model.setGraphView(context.view)
      changeMode('graph')
    } else if (entry.mode === 'convert') {
      changeMode('convert')
      const category = typeof entry.context?.categoryId === 'string' ? entry.context.categoryId : 'length'
      window.setTimeout(() => window.dispatchEvent(new CustomEvent('converter-category', { detail: category })), 0)
    } else {
      setRecalled(entry)
      changeMode('calculate')
    }
    setHistoryOpen(false)
    showToast('Calculation recalled')
  }

  return <div className="app-shell">
    <AppHeader mode={model.mode} onModeChange={changeMode} onHistory={() => setHistoryOpen(true)} onSettings={() => setSettingsOpen(true)} onCommands={() => setCommandsOpen(true)} />
    <main className={`workspace mode-${model.mode}`}>
      {model.mode === 'calculate' ? <CalculatorView model={model} recalled={recalled} onRecallConsumed={() => setRecalled(null)} onToast={showToast} /> : null}
      {model.mode === 'graph' ? <GraphView model={model} onToast={showToast} /> : null}
      {model.mode === 'convert' ? <ConverterView model={model} onToast={showToast} /> : null}
      {model.mode === 'lab' ? <Suspense fallback={<div className="loading-tool">Preparing the selected instrument…</div>}><LabView /></Suspense> : null}
    </main>
    <footer className="app-footer"><span>{model.state.workspaces.find((item) => item.id === model.state.activeWorkspaceId)?.name || 'General'}</span><span className={model.storageHealthy ? 'storage-status' : 'storage-status error'}>{model.storageHealthy ? 'Saved locally' : 'Local storage unavailable'}</span><span>Calc V2 · radians in Graph</span></footer>
    <HistoryDrawer open={historyOpen} model={model} onClose={closeHistory} onRecall={recall} onToast={showToast} />
    <SettingsDialog open={settingsOpen} model={model} onClose={closeSettings} />
    <CommandPalette model={model} open={commandsOpen} onClose={closeCommands} onHistory={() => setHistoryOpen(true)} onSettings={() => setSettingsOpen(true)} onToast={showToast} />
    <Toast message={toast} />
  </div>
}
