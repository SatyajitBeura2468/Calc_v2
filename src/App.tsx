import { ChevronUp, History, PanelRightClose, PanelRightOpen } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import './App.css'
import { AtmospherePanel } from './components/AtmospherePanel'
import { CommandPalette } from './components/CommandPalette'
import { Converter } from './components/Converter'
import { ExpressionStage } from './components/ExpressionStage'
import { Keypad } from './components/Keypad'
import { StatusBar } from './components/StatusBar'
import { TopBar } from './components/TopBar'
import { WorkspaceRail } from './components/WorkspaceRail'
import { DEFAULT_SETTINGS } from './data'
import { usePersistentState } from './hooks/usePersistentState'
import { calculateExpression } from './lib/calculator'
import type { CalculatorMode, HistoryEntry, Settings, ThemeName } from './types'

function createHistoryEntry(expression: string, result: string): HistoryEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    expression,
    result,
    createdAt: Date.now(),
    pinned: false,
  }
}

function App() {
  const [mode, setMode] = usePersistentState<CalculatorMode>('calc-v2-mode', 'scientific')
  const [settings, setSettings] = usePersistentState<Settings>('calc-v2-settings', DEFAULT_SETTINGS)
  const [history, setHistory] = usePersistentState<HistoryEntry[]>('calc-v2-history', [])
  const [memory, setMemory] = usePersistentState<number>('calc-v2-memory', 0)
  const [expression, setExpression] = useState('sin(30)^2 + cos(30)^2')
  const [graphExpression, setGraphExpression] = useState('sin(x) + cos(x / 2)')
  const [result, setResult] = useState('1')
  const [error, setError] = useState('')
  const [lastAnswer, setLastAnswer] = useState('1')
  const [activeWorkspace, setActiveWorkspace] = useState('today')
  const [atmosphereOpen, setAtmosphereOpen] = useState(() => window.innerWidth > 1060)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const tactileFeedback = useCallback(() => {
    if (settings.haptics && 'vibrate' in navigator) navigator.vibrate(8)
    if (settings.sound) {
      const AudioContextClass = window.AudioContext
      const context = new AudioContextClass()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(340, context.currentTime)
      gain.gain.setValueAtTime(0.025, context.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.035)
      oscillator.connect(gain).connect(context.destination)
      oscillator.start()
      oscillator.stop(context.currentTime + 0.04)
    }
  }, [settings.haptics, settings.sound])

  const calculate = useCallback(() => {
    try {
      const nextResult = calculateExpression(expression, lastAnswer, settings.precision, settings.angleMode)
      setResult(nextResult)
      setLastAnswer(nextResult)
      setError('')
      setHistory((entries) => [createHistoryEntry(expression, nextResult), ...entries].slice(0, 80))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check the expression and try again.')
    }
  }, [expression, lastAnswer, settings.angleMode, settings.precision, setHistory])

  const pressKey = useCallback((key: string) => {
    tactileFeedback()
    setError('')
    if (key === 'AC') {
      setExpression('')
      setResult('0')
      return
    }
    if (key === '⌫') {
      setExpression((value) => value.slice(0, -1))
      return
    }
    if (key === '=') {
      calculate()
      return
    }
    if (key === '±') {
      setExpression((value) => value ? `-(${value})` : '-')
      return
    }
    if (key === '%') {
      setExpression((value) => value ? `(${value})/100` : '')
      return
    }
    if (key === 'x²') {
      setExpression((value) => value ? `(${value})^2` : '')
      return
    }
    const mapped: Record<string, string> = {
      sin: 'sin(', cos: 'cos(', tan: 'tan(', asin: 'asin(', acos: 'acos(', atan: 'atan(',
      ln: 'ln(', log: 'log(', '√': '√(', '^': '^', 'π': 'π', e: 'e', Ans: 'Ans',
    }
    setExpression((value) => `${value}${mapped[key] ?? key}`)
  }, [calculate, tactileFeedback])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement
      const editing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT'
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandOpen(true)
        return
      }
      if (event.key === 'Escape') {
        setCommandOpen(false)
        setWorkspaceOpen(false)
        return
      }
      if (editing) return
      const keyMap: Record<string, string> = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Delete: 'AC' }
      const key = keyMap[event.key] ?? event.key
      if (/^[0-9.+()%]$/.test(key) || ['×', '÷', '−', '=', '⌫', 'AC'].includes(key)) {
        event.preventDefault()
        pressKey(key)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pressKey])

  function recall(entry: HistoryEntry) {
    setExpression(entry.expression)
    setResult(entry.result)
    setLastAnswer(entry.result)
    setError('')
    setWorkspaceOpen(false)
  }

  function setTheme(theme: ThemeName) {
    setSettings((current) => ({ ...current, theme }))
  }

  const numericResult = Number(result)

  return (
    <div
      className={`app-shell atmosphere-${settings.theme} density-${settings.density}`}
      data-theme={settings.theme}
      style={{ '--accent': settings.accent } as React.CSSProperties}
    >
      <TopBar
        mode={mode}
        onModeChange={setMode}
        onCommand={() => setCommandOpen(true)}
        onAtmosphere={() => setAtmosphereOpen((value) => !value)}
        onWorkspace={() => setWorkspaceOpen(true)}
      />
      <div className="app-body">
        <WorkspaceRail
          history={history}
          activeWorkspace={activeWorkspace}
          open={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
          onWorkspaceChange={setActiveWorkspace}
          onRecall={recall}
          onPin={(id) => setHistory((entries) => entries.map((entry) => entry.id === id ? { ...entry, pinned: !entry.pinned } : entry))}
        />
        <main className="calculation-studio">
          {mode === 'convert' ? (
            <Converter />
          ) : (
            <ExpressionStage
              expression={expression}
              result={result}
              error={error}
              mode={mode}
              graphExpression={graphExpression}
              settings={settings}
              onExpressionChange={setExpression}
              onGraphExpressionChange={setGraphExpression}
              onCalculate={calculate}
            />
          )}
          {mode !== 'convert' ? (
            <>
              <div className="utility-strip" aria-label="Calculator memory controls">
                <button onClick={() => setExpression((value) => `${value}Ans`)}>Ans</button>
                <span />
                <button onClick={() => setExpression((value) => `${value}(`)}>(</button>
                <button onClick={() => setExpression((value) => `${value})`)}>)</button>
                <button onClick={() => setMemory(0)}>MC</button>
                <button onClick={() => Number.isFinite(numericResult) && setMemory((value) => value + numericResult)}>M+</button>
                <button onClick={() => Number.isFinite(numericResult) && setMemory((value) => value - numericResult)}>M−</button>
                <button onClick={() => setExpression((value) => `${value}${memory}`)}>MR</button>
              </div>
              <Keypad mode={mode} keyShape={settings.keyShape} density={settings.density} onPress={pressKey} />
            </>
          ) : null}
          <button className="mobile-history-trigger" onClick={() => setWorkspaceOpen(true)}><History size={17} /> Recent history <ChevronUp size={17} /></button>
        </main>
        <button className="atmosphere-edge-toggle" onClick={() => setAtmosphereOpen((value) => !value)} aria-label={atmosphereOpen ? 'Hide Atmosphere panel' : 'Show Atmosphere panel'}>
          {atmosphereOpen ? <PanelRightClose size={17} /> : <PanelRightOpen size={17} />}
        </button>
        <AtmospherePanel settings={settings} open={atmosphereOpen} onChange={setSettings} onClose={() => setAtmosphereOpen(false)} />
      </div>
      <StatusBar settings={settings} memory={memory} onSettingsChange={setSettings} />
      {(workspaceOpen || atmosphereOpen) ? <div className="mobile-scrim" onClick={() => { setWorkspaceOpen(false); setAtmosphereOpen(false) }} /> : null}
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} onModeChange={setMode} onThemeChange={setTheme} onClearHistory={() => setHistory([])} />
    </div>
  )
}

export default App
