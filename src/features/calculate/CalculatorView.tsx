import { Check, Clipboard, Copy, Redo2, Share2, Undo2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppModel } from '../../app/useAppModel'
import { evaluateExpression, insertAtSelection, repeatedEqualsExpression } from '../../core/calculator'
import { tactileFeedback } from '../../core/feedback'
import type { AngleMode, CalculatorKind, CalculationResult, HistoryEntry, NumberFormat, ResultView } from '../../types'

const PRIMARY_KEYS = ['AC', '±', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '(', '0', '.', ')', '⌫', 'Ans', 'π', '=']
const FUNCTIONS: Record<string, string[]> = {
  Common: ['x²', 'xʸ', '√', '∛', '|x|', 'x!', 'nCr', 'nPr'],
  Trig: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'],
  Logs: ['ln', 'log', 'eˣ', '10ˣ', 'e', 'π'],
  More: ['floor', 'ceil', 'round', 'min', 'max', 'mod'],
}

function tokenize(value: string) {
  return value.split(/(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|ln|log|sqrt|floor|ceil|round|min|max|mod|nCr|nPr|Ans|π|e|\d+(?:\.\d+)?|[+×÷−*/^%=(),])/g).filter(Boolean).map((token, index) => {
    const className = /^\d/.test(token) ? 'number' : /^[+×÷−*/^%=(),]$/.test(token) ? 'operator' : /^[A-Za-zπ]/.test(token) ? 'function' : ''
    return <span className={className} key={`${token}-${index}`}>{token}</span>
  })
}

interface CalculatorViewProps {
  model: AppModel
  recalled?: HistoryEntry | null
  onRecallConsumed: () => void
  onToast: (message: string) => void
}

export function CalculatorView({ model, recalled, onRecallConsumed, onToast }: CalculatorViewProps) {
  const { settings } = model.state
  const [kind, setKind] = useState<CalculatorKind>('scientific')
  const [expression, setExpression] = useState('200 + 10%')
  const [preview, setPreview] = useState<CalculationResult>(() => evaluateExpression('200 + 10%', { answer: model.state.lastAnswer, angleMode: settings.defaultAngle, precision: settings.precision, numberFormat: settings.numberFormat }))
  const [error, setError] = useState('')
  const [resultView, setResultView] = useState<ResultView>('decimal')
  const [angleMode, setAngleMode] = useState<AngleMode>(settings.defaultAngle)
  const [numberFormat, setNumberFormat] = useState<NumberFormat>(settings.numberFormat)
  const [functionCategory, setFunctionCategory] = useState('Common')
  const [copied, setCopied] = useState('')
  const [undoStack, setUndoStack] = useState<string[]>([])
  const [redoStack, setRedoStack] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLPreElement>(null)
  const lastCommitted = useRef<{ expression: string; result: string } | null>(null)

  useEffect(() => {
    if (!recalled) return
    setExpression(recalled.expression)
    setAngleMode(recalled.angleMode)
    setPreview({ raw: recalled.rawResult, formatted: recalled.formattedResult, type: recalled.resultType })
    setError('')
    onRecallConsumed()
  }, [onRecallConsumed, recalled])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const next = evaluateExpression(expression, { answer: model.state.lastAnswer, angleMode, precision: settings.precision, numberFormat })
        setPreview(next)
        setError('')
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Check the expression and try again.')
      }
    }, 120)
    return () => window.clearTimeout(timer)
  }, [angleMode, expression, model.state.lastAnswer, numberFormat, settings.precision])

  const setWithHistory = useCallback((next: string) => {
    setExpression((current) => {
      if (current !== next) setUndoStack((stack) => [...stack.slice(-79), current])
      return next
    })
    setRedoStack([])
  }, [])

  function undo() {
    setUndoStack((stack) => {
      const previous = stack.at(-1)
      if (previous === undefined) return stack
      setRedoStack((items) => [...items, expression])
      setExpression(previous)
      return stack.slice(0, -1)
    })
  }

  function redo() {
    setRedoStack((stack) => {
      const next = stack.at(-1)
      if (next === undefined) return stack
      setUndoStack((items) => [...items, expression])
      setExpression(next)
      return stack.slice(0, -1)
    })
  }

  function insert(insertion: string, cursorBack = 0, wrap = false) {
    const input = inputRef.current
    const start = input?.selectionStart ?? expression.length
    const end = input?.selectionEnd ?? start
    const selected = expression.slice(start, end)
    const text = wrap && selected ? `${insertion.slice(0, -1)}${selected})` : insertion
    const next = insertAtSelection(expression, text, start, end, selected && wrap ? 0 : cursorBack)
    setWithHistory(next.value)
    requestAnimationFrame(() => { input?.focus(); input?.setSelectionRange(next.selectionStart, next.selectionEnd) })
    tactileFeedback(settings.sound, settings.haptics)
  }

  function pressKey(key: string) {
    if (key === '=') { commit(); return }
    if (key === 'AC') { setWithHistory(''); return }
    if (key === '⌫') {
      const input = inputRef.current
      const start = input?.selectionStart ?? expression.length
      const end = input?.selectionEnd ?? start
      const from = start === end ? Math.max(0, start - 1) : start
      const next = insertAtSelection(expression, '', from, end)
      setWithHistory(next.value)
      requestAnimationFrame(() => input?.setSelectionRange(from, from))
      return
    }
    if (key === '±') {
      const input = inputRef.current
      const start = input?.selectionStart ?? 0
      const end = input?.selectionEnd ?? expression.length
      if (start !== end) insert('-()', -1, true)
      else setWithHistory(expression ? `-(${expression})` : '-')
      return
    }
    const mapped: Record<string, [string, number?, boolean?]> = {
      'x²': ['^2'], 'xʸ': ['^'], '√': ['sqrt()', -1, true], '∛': ['cbrt()', -1, true], '|x|': ['abs()', -1, true], 'x!': ['!'],
      'eˣ': ['e^()' , -1, true], '10ˣ': ['10^()', -1, true],
      sin: ['sin()', -1, true], cos: ['cos()', -1, true], tan: ['tan()', -1, true], asin: ['asin()', -1, true], acos: ['acos()', -1, true], atan: ['atan()', -1, true],
      sinh: ['sinh()', -1, true], cosh: ['cosh()', -1, true], tanh: ['tanh()', -1, true], ln: ['ln()', -1, true], log: ['log()', -1, true],
      floor: ['floor()', -1, true], ceil: ['ceil()', -1, true], round: ['round()', -1, true], min: ['min(,)', -2], max: ['max(,)', -2], mod: ['mod(,)', -2], nCr: ['nCr(,)', -2], nPr: ['nPr(,)', -2],
    }
    const value = mapped[key] ?? [key]
    insert(value[0], value[1], value[2])
  }

  function commit() {
    let committedExpression = expression
    if (lastCommitted.current?.expression === expression) committedExpression = repeatedEqualsExpression(lastCommitted.current.result, expression)
    try {
      const result = evaluateExpression(committedExpression, { answer: model.state.lastAnswer, angleMode, precision: settings.precision, numberFormat })
      setPreview(result)
      setError('')
      setExpression(committedExpression)
      model.setLastAnswer(result.raw)
      model.addHistory({ expression: committedExpression, rawResult: result.raw, formattedResult: result.formatted, resultType: result.type, mode: 'calculate', angleMode, precision: settings.precision })
      lastCommitted.current = { expression: committedExpression, result: result.raw }
      onToast('Saved to history')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Check the expression and try again.')
    }
  }

  async function copy(kind: 'expression' | 'result') {
    await navigator.clipboard.writeText(kind === 'expression' ? expression : preview.raw)
    setCopied(kind)
    window.setTimeout(() => setCopied(''), 1200)
  }

  async function share() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify({ expression, angleMode, numberFormat }))))
    const url = `${location.origin}${location.pathname}#calc=${data}`
    await navigator.clipboard.writeText(url)
    history.replaceState(null, '', url)
    onToast('Share link copied')
  }

  useEffect(() => {
    const parameter = new URLSearchParams(location.hash.slice(1)).get('calc')
    if (!parameter) return
    try {
      const value = JSON.parse(decodeURIComponent(escape(atob(parameter)))) as { expression?: string; angleMode?: AngleMode; numberFormat?: NumberFormat }
      if (value.expression) setExpression(value.expression)
      if (value.angleMode) setAngleMode(value.angleMode)
      if (value.numberFormat) setNumberFormat(value.numberFormat)
    } catch { /* Invalid shared state is ignored safely. */ }
  }, [])

  const displayedResult = resultView === 'exact' && preview.exact ? preview.exact : preview.formatted
  const functions = useMemo(() => FUNCTIONS[functionCategory], [functionCategory])

  useEffect(() => {
    const listener = (event: Event) => {
      const command = (event as CustomEvent<string>).detail
      if (command === 'clear') setWithHistory('')
      if (command === 'copy-result' && !error) void copy('result')
    }
    window.addEventListener('calc-command', listener)
    return () => window.removeEventListener('calc-command', listener)
  })

  return (
    <section className="calculate-view" aria-label="Calculator">
      <div className="calculate-toolbar">
        <div className="segmented" aria-label="Calculator type"><button className={kind === 'basic' ? 'active' : ''} onClick={() => setKind('basic')}>Basic</button><button className={kind === 'scientific' ? 'active' : ''} onClick={() => setKind('scientific')}>Scientific</button></div>
        <div className="editor-actions"><button onClick={() => void copy('expression')} aria-label="Copy expression">{copied === 'expression' ? <Check size={17} /> : <Copy size={17} />}</button><button onClick={() => void share()} aria-label="Share calculation"><Share2 size={17} /></button><button onClick={undo} disabled={!undoStack.length} aria-label="Undo"><Undo2 size={18} /></button><button onClick={redo} disabled={!redoStack.length} aria-label="Redo"><Redo2 size={18} /></button></div>
      </div>
      <div className="expression-surface">
        <div className="expression-editor">
          <pre ref={mirrorRef} aria-hidden="true">{tokenize(expression)}<span className="editor-space"> </span></pre>
          <textarea ref={inputRef} value={expression} onChange={(event) => { setWithHistory(event.target.value); if (mirrorRef.current) mirrorRef.current.scrollLeft = event.currentTarget.scrollLeft }} onScroll={(event) => { if (mirrorRef.current) mirrorRef.current.scrollLeft = event.currentTarget.scrollLeft }} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); commit() } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); if (event.shiftKey) redo(); else undo() } if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo() } }} placeholder="Type a calculation" aria-label="Calculation expression" spellCheck={false} rows={2} />
        </div>
        <div className={error ? 'result-panel error' : 'result-panel'} aria-live="polite">
          <div><span className="result-type">{error ? 'Expression needs attention' : `${preview.type === 'real' ? 'Real number' : preview.type}`}</span><output>{error || displayedResult}</output></div>
          {!error ? <button className="copy-result" onClick={() => void copy('result')} aria-label="Copy result">{copied === 'result' ? <Check size={18} /> : <Clipboard size={18} />}</button> : null}
          <div className="result-controls"><div className="segmented compact"><button className={resultView === 'exact' ? 'active' : ''} onClick={() => setResultView('exact')} disabled={!preview.exact}>Exact</button><button className={resultView === 'decimal' ? 'active' : ''} onClick={() => setResultView('decimal')}>Decimal</button></div><select value={angleMode} onChange={(event) => setAngleMode(event.target.value as AngleMode)} aria-label="Angle mode"><option>DEG</option><option>RAD</option><option>GRAD</option></select><select value={settings.precision} onChange={(event) => model.updateSettings({ precision: Number(event.target.value) })} aria-label="Precision">{[6, 8, 10, 12, 14, 16].map((value) => <option key={value} value={value}>Precision {value}</option>)}</select><select value={numberFormat} onChange={(event) => setNumberFormat(event.target.value as NumberFormat)} aria-label="Number format"><option value="standard">Standard</option><option value="scientific">Scientific</option><option value="engineering">Engineering</option></select></div>
        </div>
        {preview.explanation && !error ? <details className="explanation"><summary>Show calculation explanation</summary>{preview.explanation.map((step) => <p key={step}>{step}</p>)}</details> : null}
      </div>
      <div className={kind === 'scientific' ? 'calculate-controls scientific-open' : 'calculate-controls'}>
        <div className="memory-row" aria-label="Memory controls"><button onClick={() => model.setMemory(0)}>MC</button><button onClick={() => model.setMemory((value) => value + Number(preview.raw || 0))}>M+</button><button onClick={() => model.setMemory((value) => value - Number(preview.raw || 0))}>M−</button><button onClick={() => insert(String(model.state.memory))}>MR</button><span>{model.state.memory ? `M ${model.state.memory}` : 'Memory empty'}</span></div>
        <div className="primary-keypad" aria-label="Primary keypad">{PRIMARY_KEYS.map((key) => <button key={key} className={key === '=' ? 'equals' : ['÷', '×', '−', '+'].includes(key) ? 'operator' : ['AC', '±', '%', '⌫'].includes(key) ? 'utility' : ''} onClick={() => pressKey(key)} aria-label={key === '=' ? 'Calculate result' : key}>{key}</button>)}</div>
        {kind === 'scientific' ? <aside className="function-library" aria-label="Scientific functions"><header><strong>Functions</strong><button onClick={() => setKind('basic')}>Collapse</button></header><div className="function-categories" role="tablist">{Object.keys(FUNCTIONS).map((category) => <button key={category} className={functionCategory === category ? 'active' : ''} onClick={() => setFunctionCategory(category)}>{category}</button>)}</div><div className="function-grid">{functions.map((item) => <button key={item} onClick={() => pressKey(item)}>{item}</button>)}</div></aside> : <button className="open-functions" onClick={() => setKind('scientific')}>Open scientific functions</button>}
      </div>
    </section>
  )
}
