import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, Eye, EyeOff, Grid3X3, LocateFixed, MousePointer2, Plus, RotateCcw, Save, Trash2 } from 'lucide-react'
import type { AppModel } from '../../app/useAppModel'
import { derivativeAt, evaluateGraph, findExtrema, findIntersections, findRoots, integrate, niceTick, shouldBreakSegment } from '../../core/graph'
import type { GraphFunction, GraphViewState } from '../../types'

const COLORS = ['#62d7c6', '#e9a86d', '#a99cf2', '#ef7f88', '#7ab7ee', '#b2d86f']
const GRAPH_KEYS = ['sin(', 'cos(', 'tan(', 'sqrt(', 'abs(', '^', '(', ')', 'pi', 'e', 'x', 'Backspace']

interface Point { x: number; y: number }
interface GraphViewProps { model: AppModel; onToast: (message: string) => void }

function GraphCanvas({ functions, view, onViewChange, activeId, trace, onTrace }: {
  functions: GraphFunction[]
  view: GraphViewState
  onViewChange: (next: GraphViewState) => void
  activeId: string
  trace: Point | null
  onTrace: (point: Point | null) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef({ width: 1, height: 1 })
  const dragRef = useRef<{ x: number; y: number; view: GraphViewState } | null>(null)
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchRef = useRef<{ distance: number; view: GraphViewState } | null>(null)

  useEffect(() => {
    const element = wrapRef.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      sizeRef.current = { width: entry.contentRect.width, height: entry.contentRect.height }
      draw()
    })
    observer.observe(element)
    return () => observer.disconnect()
  })

  const worldToScreen = (x: number, y: number) => ({
    x: (x - view.xMin) / (view.xMax - view.xMin) * sizeRef.current.width,
    y: sizeRef.current.height - (y - view.yMin) / (view.yMax - view.yMin) * sizeRef.current.height,
  })
  const screenToWorld = (x: number, y: number) => ({
    x: view.xMin + x / sizeRef.current.width * (view.xMax - view.xMin),
    y: view.yMax - y / sizeRef.current.height * (view.yMax - view.yMin),
  })

  function draw() {
    const canvas = canvasRef.current
    if (!canvas) return
    const { width, height } = sizeRef.current
    if (width < 2 || height < 2) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const context = canvas.getContext('2d')
    if (!context) return
    context.setTransform(dpr, 0, 0, dpr, 0, 0)
    context.clearRect(0, 0, width, height)
    const style = getComputedStyle(canvas)
    const grid = style.getPropertyValue('--graph-grid').trim() || '#27302f'
    const axis = style.getPropertyValue('--graph-axis').trim() || '#77807e'
    const text = style.getPropertyValue('--muted').trim() || '#9aa3a1'
    context.font = '11px Inter, system-ui, sans-serif'
    context.lineWidth = 1

    const xTick = niceTick(view.xMax - view.xMin, Math.max(4, width / 100))
    const yTick = niceTick(view.yMax - view.yMin, Math.max(4, height / 80))
    if (view.grid) {
      context.strokeStyle = grid
      context.fillStyle = text
      for (let x = Math.ceil(view.xMin / xTick) * xTick; x <= view.xMax; x += xTick) {
        const screen = worldToScreen(x, 0)
        context.beginPath(); context.moveTo(screen.x, 0); context.lineTo(screen.x, height); context.stroke()
        if (Math.abs(x) > xTick / 100 && screen.x > 25 && screen.x < width - 25) context.fillText(Number(x.toPrecision(4)).toString(), screen.x + 4, Math.min(height - 6, Math.max(14, worldToScreen(0, 0).y - 6)))
      }
      for (let y = Math.ceil(view.yMin / yTick) * yTick; y <= view.yMax; y += yTick) {
        const screen = worldToScreen(0, y)
        context.beginPath(); context.moveTo(0, screen.y); context.lineTo(width, screen.y); context.stroke()
        if (Math.abs(y) > yTick / 100 && screen.y > 14 && screen.y < height - 8) context.fillText(Number(y.toPrecision(4)).toString(), Math.min(width - 45, Math.max(5, worldToScreen(0, 0).x + 6)), screen.y - 5)
      }
    }
    context.strokeStyle = axis
    context.lineWidth = 1.25
    const origin = worldToScreen(0, 0)
    if (origin.y >= 0 && origin.y <= height) { context.beginPath(); context.moveTo(0, origin.y); context.lineTo(width, origin.y); context.stroke() }
    if (origin.x >= 0 && origin.x <= width) { context.beginPath(); context.moveTo(origin.x, 0); context.lineTo(origin.x, height); context.stroke() }

    for (const fn of functions.filter((item) => item.visible)) {
      const samples = Math.max(320, Math.min(1400, Math.round(width * 1.35)))
      context.beginPath()
      context.strokeStyle = fn.color
      context.lineWidth = fn.id === activeId ? 2.5 : 1.8
      let previous: Point | null = null
      for (let index = 0; index <= samples; index += 1) {
          const x = view.xMin + index / samples * (view.xMax - view.xMin)
          try {
            const y = evaluateGraph(fn.expression, x)
            if (!Number.isFinite(y)) { previous = null; continue }
            const current = { x, y }
            const screen = worldToScreen(x, y)
          if (screen.y < -height * 5 || screen.y > height * 6 || (previous && shouldBreakSegment(previous.y, y, view.yMax - view.yMin))) context.moveTo(screen.x, screen.y)
          else if (!previous) context.moveTo(screen.x, screen.y)
          else context.lineTo(screen.x, screen.y)
          previous = current
        } catch { previous = null }
      }
      context.stroke()

      if (fn.integral?.enabled && Number.isFinite(fn.integral.from) && Number.isFinite(fn.integral.to)) {
        const from = Math.max(view.xMin, Math.min(fn.integral.from, fn.integral.to))
        const to = Math.min(view.xMax, Math.max(fn.integral.from, fn.integral.to))
        if (to > from) {
          context.beginPath(); context.fillStyle = `${fn.color}26`
          const start = worldToScreen(from, 0); context.moveTo(start.x, start.y)
          for (let i = 0; i <= 160; i += 1) { const x = from + i / 160 * (to - from); const p = worldToScreen(x, evaluateGraph(fn.expression, x)); context.lineTo(p.x, p.y) }
          const end = worldToScreen(to, 0); context.lineTo(end.x, end.y); context.closePath(); context.fill()
        }
      }

      if (fn.derivative) {
        context.beginPath(); context.strokeStyle = fn.color; context.globalAlpha = 0.46; context.setLineDash([5, 5])
        let started = false
        for (let i = 0; i <= samples; i += 1) { const x = view.xMin + i / samples * (view.xMax - view.xMin); const y = derivativeAt(fn.expression, x); if (!Number.isFinite(y)) { started = false; continue } const p = worldToScreen(x, y); if (started) context.lineTo(p.x, p.y); else { context.moveTo(p.x, p.y); started = true } }
        context.stroke(); context.setLineDash([]); context.globalAlpha = 1
      }
    }

    if (trace) {
      const p = worldToScreen(trace.x, trace.y)
      context.strokeStyle = text; context.lineWidth = 1; context.setLineDash([3, 4])
      context.beginPath(); context.moveTo(p.x, 0); context.lineTo(p.x, height); context.moveTo(0, p.y); context.lineTo(width, p.y); context.stroke(); context.setLineDash([])
      context.fillStyle = functions.find((item) => item.id === activeId)?.color || '#62d7c6'; context.beginPath(); context.arc(p.x, p.y, 4.5, 0, Math.PI * 2); context.fill()
    }
  }

  useEffect(draw)

  function zoomAt(clientX: number, clientY: number, factor: number, source = view) {
    const rect = canvasRef.current!.getBoundingClientRect()
    const pointer = screenToWorld(clientX - rect.left, clientY - rect.top)
    const xSpan = (source.xMax - source.xMin) * factor
    const ySpan = (source.yMax - source.yMin) * factor
    const xRatio = (pointer.x - source.xMin) / (source.xMax - source.xMin)
    const yRatio = (pointer.y - source.yMin) / (source.yMax - source.yMin)
    onViewChange({ ...source, xMin: pointer.x - xSpan * xRatio, xMax: pointer.x + xSpan * (1 - xRatio), yMin: pointer.y - ySpan * yRatio, yMax: pointer.y + ySpan * (1 - yRatio) })
  }

  return <div className="graph-canvas-wrap" ref={wrapRef}>
    <canvas ref={canvasRef} tabIndex={0} aria-label="Interactive graph. Drag to pan and use the mouse wheel or pinch gesture to zoom."
      onWheel={(event) => { event.preventDefault(); zoomAt(event.clientX, event.clientY, Math.exp(event.deltaY * 0.0012)) }}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY }); dragRef.current = { x: event.clientX, y: event.clientY, view }; if (pointers.current.size === 2) { const [a, b] = [...pointers.current.values()]; pinchRef.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), view } } }}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        const world = screenToWorld(event.clientX - rect.left, event.clientY - rect.top)
        const active = functions.find((item) => item.id === activeId && item.visible)
        if (view.trace && active) { const y = evaluateGraph(active.expression, world.x); onTrace(Number.isFinite(y) ? { x: world.x, y } : null) }
        if (!pointers.current.has(event.pointerId)) return
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
        if (pointers.current.size === 2 && pinchRef.current) { const [a, b] = [...pointers.current.values()]; const distance = Math.hypot(a.x - b.x, a.y - b.y); zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinchRef.current.distance / Math.max(10, distance), pinchRef.current.view); return }
        if (!dragRef.current) return
        const dx = (event.clientX - dragRef.current.x) / rect.width * (dragRef.current.view.xMax - dragRef.current.view.xMin)
        const dy = (event.clientY - dragRef.current.y) / rect.height * (dragRef.current.view.yMax - dragRef.current.view.yMin)
        onViewChange({ ...dragRef.current.view, xMin: dragRef.current.view.xMin - dx, xMax: dragRef.current.view.xMax - dx, yMin: dragRef.current.view.yMin + dy, yMax: dragRef.current.view.yMax + dy })
      }}
      onPointerUp={(event) => { pointers.current.delete(event.pointerId); dragRef.current = null; pinchRef.current = null }}
      onPointerCancel={(event) => { pointers.current.delete(event.pointerId); dragRef.current = null; pinchRef.current = null }}
      onPointerLeave={() => { if (!pointers.current.size && !view.trace) onTrace(null) }}
    />
    {trace ? <output className="trace-readout">x {trace.x.toPrecision(6)} · y {trace.y.toPrecision(6)}</output> : null}
  </div>
}

export function GraphView({ model, onToast }: GraphViewProps) {
  const { graphFunctions: functions, graphView: view } = model.state
  const [activeId, setActiveId] = useState(functions[0]?.id || '')
  const [trace, setTrace] = useState<Point | null>(null)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const active = functions.find((item) => item.id === activeId) || functions[0]
  const analysis = useMemo(() => {
    if (!active?.expression) return { roots: [], extrema: [], intersections: [], yIntercept: NaN }
    return {
      roots: findRoots(active.expression, view.xMin, view.xMax),
      extrema: findExtrema(active.expression, view.xMin, view.xMax),
      intersections: functions.filter((item) => item.id !== active.id && item.visible).flatMap((item) => findIntersections(active.expression, item.expression, view.xMin, view.xMax).map((point) => ({ ...point, with: item.expression }))),
      yIntercept: evaluateGraph(active.expression, 0),
    }
  }, [active, functions, view.xMin, view.xMax])

  function updateFunction(id: string, patch: Partial<GraphFunction>) { model.setGraphFunctions((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item)) }
  function addFunction() { const next = { id: crypto.randomUUID(), expression: 'cos(x)', color: COLORS[functions.length % COLORS.length], visible: true, derivative: false }; model.setGraphFunctions((items) => [...items, next]); setActiveId(next.id) }
  function insertGraph(value: string) {
    if (!active) return
    if (value === 'Backspace') updateFunction(active.id, { expression: active.expression.slice(0, -1) })
    else updateFunction(active.id, { expression: active.expression + value })
  }
  function resetView() { model.setGraphView({ xMin: -2 * Math.PI, xMax: 2 * Math.PI, yMin: -3, yMax: 3, grid: true, trace: true }) }
  async function copyExpression() { await navigator.clipboard.writeText(active?.expression || ''); onToast('Graph expression copied') }
  function exportPng() { const canvas = document.querySelector<HTMLCanvasElement>('.graph-canvas-wrap canvas'); if (!canvas) return; const link = document.createElement('a'); link.download = 'calc-v2-graph.png'; link.href = canvas.toDataURL('image/png'); link.click(); onToast('Graph exported as PNG') }
  function saveGraph() { model.addHistory({ expression: functions.filter((item) => item.visible).map((item) => `y=${item.expression}`).join('; '), rawResult: `${functions.filter((item) => item.visible).length} functions`, formattedResult: 'Saved graph', resultType: 'real', mode: 'graph', angleMode: 'RAD', precision: model.state.settings.precision, context: { functions, view } }); onToast('Graph saved to history') }

  return <section className="graph-view" aria-label="Graphing calculator">
    <aside className="function-panel">
      <header><div><span className="eyebrow">Functions</span><strong>{functions.length} plotted</strong></div><button className="icon-button" onClick={addFunction} aria-label="Add function"><Plus size={18} /></button></header>
      <div className="function-list">{functions.map((fn, index) => <article key={fn.id} className={fn.id === active?.id ? 'function-row active' : 'function-row'} onClick={() => setActiveId(fn.id)}>
        <span className="function-color" style={{ background: fn.color }} aria-label={`Function ${index + 1} colour`} />
        <label><span>f{index + 1}(x)</span><input value={fn.expression} onFocus={() => setActiveId(fn.id)} onChange={(event) => updateFunction(fn.id, { expression: event.target.value })} aria-label={`Function ${index + 1} expression`} /></label>
        <button onClick={(event) => { event.stopPropagation(); updateFunction(fn.id, { visible: !fn.visible }) }} aria-label={fn.visible ? 'Hide function' : 'Show function'}>{fn.visible ? <Eye size={17} /> : <EyeOff size={17} />}</button>
        <button onClick={(event) => { event.stopPropagation(); if (functions.length > 1) model.setGraphFunctions((items) => items.filter((item) => item.id !== fn.id)) }} disabled={functions.length === 1} aria-label="Delete function"><Trash2 size={16} /></button>
      </article>)}</div>
      <div className="graph-keypad" aria-label="Graph expression keypad">{GRAPH_KEYS.map((key) => <button key={key} onClick={() => insertGraph(key)}>{key === 'Backspace' ? '⌫' : key}</button>)}</div>
      {active ? <div className="graph-options">
        <label><input type="checkbox" checked={active.derivative} onChange={(event) => updateFunction(active.id, { derivative: event.target.checked })} /> Derivative curve</label>
        <label><input type="checkbox" checked={active.integral?.enabled || false} onChange={(event) => updateFunction(active.id, { integral: { enabled: event.target.checked, from: active.integral?.from ?? 0, to: active.integral?.to ?? Math.PI } })} /> Shade integral</label>
        {active.integral?.enabled ? <div className="inline-fields"><input type="number" value={active.integral.from} onChange={(event) => updateFunction(active.id, { integral: { ...active.integral!, from: Number(event.target.value) } })} aria-label="Integral lower bound" /><span>to</span><input type="number" value={active.integral.to} onChange={(event) => updateFunction(active.id, { integral: { ...active.integral!, to: Number(event.target.value) } })} aria-label="Integral upper bound" /></div> : null}
      </div> : null}
    </aside>
    <div className="graph-stage">
      <div className="graph-toolbar">
        <div><button className={view.trace ? 'active' : ''} onClick={() => model.setGraphView({ ...view, trace: !view.trace })}><MousePointer2 size={16} /> Trace</button><button className={view.grid ? 'active' : ''} onClick={() => model.setGraphView({ ...view, grid: !view.grid })}><Grid3X3 size={16} /> Grid</button><button onClick={resetView}><RotateCcw size={16} /> Reset</button></div>
        <div><button onClick={() => setAnalysisOpen(!analysisOpen)}><LocateFixed size={16} /> Analysis</button><button onClick={saveGraph}><Save size={16} /> Save</button><button onClick={() => void copyExpression()}><Copy size={16} /> Copy</button><button onClick={exportPng}><Download size={16} /> PNG</button></div>
      </div>
      <GraphCanvas functions={functions} view={view} onViewChange={model.setGraphView} activeId={active?.id || ''} trace={trace} onTrace={setTrace} />
      <div className="range-controls" aria-label="Visible graph range">{(['xMin', 'xMax', 'yMin', 'yMax'] as const).map((key) => <label key={key}>{key}<input type="number" step="any" value={Number(view[key].toPrecision(6))} onChange={(event) => { const value = Number(event.target.value); if (Number.isFinite(value)) model.setGraphView({ ...view, [key]: value }) }} /></label>)}</div>
      {analysisOpen && active ? <aside className="analysis-panel"><header><strong>Analysis · {active.expression}</strong><button onClick={() => setAnalysisOpen(false)} aria-label="Close analysis">×</button></header><dl><div><dt>Roots</dt><dd>{analysis.roots.length ? analysis.roots.map((x) => x.toPrecision(5)).join(', ') : 'None in view'}</dd></div><div><dt>y-intercept</dt><dd>{Number.isFinite(analysis.yIntercept) ? analysis.yIntercept.toPrecision(6) : 'Undefined'}</dd></div><div><dt>Local extrema</dt><dd>{analysis.extrema.length ? analysis.extrema.map((point) => `(${point.x.toPrecision(4)}, ${point.y.toPrecision(4)})`).join(', ') : 'None detected'}</dd></div><div><dt>Intersections</dt><dd>{analysis.intersections.length ? analysis.intersections.map((point) => `(${point.x.toPrecision(4)}, ${point.y.toPrecision(4)}) with ${point.with}`).join('; ') : 'None detected'}</dd></div>{active.integral?.enabled ? <div><dt>Integral</dt><dd>{integrate(active.expression, active.integral.from, active.integral.to).toPrecision(8)}</dd></div> : null}</dl></aside> : null}
      <p className="sr-only" aria-live="polite">Graphing {functions.filter((fn) => fn.visible).map((fn) => `y equals ${fn.expression}`).join(', ')}. Visible x range {view.xMin.toFixed(2)} to {view.xMax.toFixed(2)}, y range {view.yMin.toFixed(2)} to {view.yMax.toFixed(2)}. Trigonometric input uses radians.</p>
    </div>
  </section>
}
