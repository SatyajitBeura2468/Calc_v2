import { Check, Clipboard, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { formatDisplay } from '../lib/calculator'
import type { CalculatorMode, Settings } from '../types'
import { GraphCanvas } from './GraphCanvas'
import { OrbitalField } from './OrbitalField'

interface ExpressionStageProps {
  expression: string
  result: string
  error: string
  mode: CalculatorMode
  graphExpression: string
  settings: Settings
  onExpressionChange: (value: string) => void
  onGraphExpressionChange: (value: string) => void
  onCalculate: () => void
}

export function ExpressionStage({ expression, result, error, mode, graphExpression, settings, onExpressionChange, onGraphExpressionChange, onCalculate }: ExpressionStageProps) {
  const [copied, setCopied] = useState(false)

  async function copyResult() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (mode === 'graph') {
    return (
      <section className="expression-stage graph-stage" aria-label="Graphing workspace">
        <div className="graph-editor">
          <label htmlFor="graph-expression">f(x)</label>
          <input
            id="graph-expression"
            value={graphExpression}
            onChange={(event) => onGraphExpressionChange(event.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
          <span>−2π → 2π</span>
        </div>
        <GraphCanvas expression={graphExpression} angleMode={settings.angleMode} accent={settings.accent} large />
        <div className="graph-caption"><Sparkles size={15} /> Drag-free, live plotting. Edit the function above.</div>
      </section>
    )
  }

  return (
    <section className="expression-stage" aria-label="Expression and result">
      <OrbitalField intensity={settings.backgroundIntensity} motion={settings.motion} />
      <div className="expression-input-wrap">
        <span className="prompt-dot" aria-hidden="true" />
        <input
          className="expression-input"
          value={expression}
          onChange={(event) => onExpressionChange(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') onCalculate() }}
          placeholder="Enter a calculation…"
          aria-label="Calculation expression"
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div className={`result-wrap ${error ? 'has-error' : ''}`} aria-live="polite">
        <span className="result-value">{error || formatDisplay(result)}</span>
        {!error ? (
          <button className="copy-result" onClick={copyResult} aria-label="Copy result">
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        ) : null}
      </div>
      <div className="result-meta">
        <span>{settings.angleMode} <i>Real</i></span>
        <b>•</b>
        <span>{settings.precision} significant digits</span>
      </div>
    </section>
  )
}
