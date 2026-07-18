import { useEffect, useMemo, useState } from 'react'
import { ArrowDownUp, Check, Copy, Search, Star } from 'lucide-react'
import type { AppModel } from '../../app/useAppModel'
import { convertUnit, formatConverted, getCategory, unitCategories } from '../../core/converter'

interface ConverterViewProps { model: AppModel; onToast: (message: string) => void }

export function ConverterView({ model, onToast }: ConverterViewProps) {
  const [categoryId, setCategoryId] = useState('length')
  const [fromUnit, setFromUnit] = useState('m')
  const [toUnit, setToUnit] = useState('km')
  const [fromValue, setFromValue] = useState('1250')
  const [toValue, setToValue] = useState('1.25')
  const [lastEdited, setLastEdited] = useState<'from' | 'to'>('from')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [favourites, setFavourites] = useState<string[]>(() => JSON.parse(localStorage.getItem('calc-v2-converter-favourites') || '[]') as string[])
  const [recent, setRecent] = useState<string[]>(() => JSON.parse(localStorage.getItem('calc-v2-converter-recent') || '[]') as string[])
  const category = getCategory(categoryId)
  const filteredCategories = useMemo(() => unitCategories.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()) || item.units.some((unit) => `${unit.name} ${unit.symbol}`.toLowerCase().includes(search.toLowerCase()))), [search])

  useEffect(() => {
    const listener = (event: Event) => selectCategory((event as CustomEvent<string>).detail)
    window.addEventListener('converter-category', listener)
    return () => window.removeEventListener('converter-category', listener)
  })

  function remember(unit: string) {
    const next = [unit, ...recent.filter((item) => item !== unit)].slice(0, 6)
    setRecent(next); localStorage.setItem('calc-v2-converter-recent', JSON.stringify(next))
  }
  function apply(value: string, direction: 'from' | 'to', nextFrom = fromUnit, nextTo = toUnit) {
    if (direction === 'from') setFromValue(value)
    else setToValue(value)
    setLastEdited(direction)
    const numeric = Number(value)
    if (!value.trim() || !Number.isFinite(numeric)) { if (direction === 'from') setToValue(''); else setFromValue(''); setError(value.trim() ? 'Enter a valid number.' : ''); return }
    try {
      const result = direction === 'from' ? convertUnit(categoryId, numeric, nextFrom, nextTo) : convertUnit(categoryId, numeric, nextTo, nextFrom)
      if (direction === 'from') setToValue(formatConverted(result, model.state.settings.precision))
      else setFromValue(formatConverted(result, model.state.settings.precision))
      setError(''); remember(direction === 'from' ? nextFrom : nextTo)
    } catch (caught) { setError(caught instanceof Error ? caught.message : 'This conversion could not be completed.') }
  }
  function selectCategory(id: string) {
    const next = getCategory(id); setCategoryId(id); setFromUnit(next.units[0].id); setToUnit(next.units[1]?.id || next.units[0].id); setFromValue('1'); setSearch('')
    try { setToValue(formatConverted(convertUnit(id, 1, next.units[0].id, next.units[1]?.id || next.units[0].id), model.state.settings.precision)); setError('') } catch { setToValue('') }
  }
  function changeUnit(side: 'from' | 'to', value: string) {
    const nextFrom = side === 'from' ? value : fromUnit; const nextTo = side === 'to' ? value : toUnit
    if (side === 'from') setFromUnit(value); else setToUnit(value)
    apply(lastEdited === 'from' ? fromValue : toValue, lastEdited, nextFrom, nextTo); remember(value)
  }
  function swap() { const oldFrom = fromUnit; setFromUnit(toUnit); setToUnit(oldFrom); const oldValue = fromValue; setFromValue(toValue); setToValue(oldValue); setLastEdited(lastEdited === 'from' ? 'to' : 'from') }
  async function copy(side: 'from' | 'to') { const value = side === 'from' ? fromValue : toValue; await navigator.clipboard.writeText(value); setCopied(side); onToast(`${side === 'from' ? 'Input' : 'Result'} copied`); window.setTimeout(() => setCopied(''), 1200) }
  function toggleFavourite(id: string) { const next = favourites.includes(id) ? favourites.filter((item) => item !== id) : [...favourites, id]; setFavourites(next); localStorage.setItem('calc-v2-converter-favourites', JSON.stringify(next)) }
  function saveConversion() {
    if (error || !fromValue || !toValue) return
    model.addHistory({ expression: `${fromValue} ${category.units.find((u) => u.id === fromUnit)?.symbol} → ${toUnit}`, rawResult: toValue, formattedResult: `${toValue} ${category.units.find((u) => u.id === toUnit)?.symbol}`, mode: 'convert', resultType: 'real', angleMode: model.state.settings.defaultAngle, precision: model.state.settings.precision, context: { categoryId, fromUnit, toUnit } })
    onToast('Conversion saved to history')
  }
  const from = category.units.find((item) => item.id === fromUnit) || category.units[0]
  const to = category.units.find((item) => item.id === toUnit) || category.units[0]
  const currentFavourites = favourites.filter((id) => category.units.some((unit) => unit.id === id))
  const currentRecent = recent.filter((id) => category.units.some((unit) => unit.id === id))
  let formula = ''
  try { const zero = convertUnit(categoryId, 0, fromUnit, toUnit); const one = convertUnit(categoryId, 1, fromUnit, toUnit); const scale = one - zero; formula = Math.abs(zero) > 1e-12 ? `value × ${formatConverted(scale, 8)} ${zero >= 0 ? '+' : '−'} ${formatConverted(Math.abs(zero), 8)}` : `value × ${formatConverted(scale, 8)}` } catch { formula = 'Enter a valid value to see the formula.' }

  return <section className="converter-view" aria-label="Unit converter">
    <aside className="converter-categories">
      <label className="search-field"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search units" aria-label="Search conversion categories and units" /></label>
      <nav aria-label="Conversion categories">{filteredCategories.map((item) => <button key={item.id} className={item.id === categoryId ? 'active' : ''} onClick={() => selectCategory(item.id)}><span>{item.name}</span><small>{item.units.length} units</small></button>)}</nav>
    </aside>
    <div className="converter-stage">
      <header><span className="eyebrow">Convert</span><h1>{category.name}</h1><p>Both sides are editable. Results stay offline on this device.</p></header>
      <div className="conversion-fields">
        <article className={lastEdited === 'from' ? 'conversion-field active' : 'conversion-field'}>
          <div className="field-label"><span>From</span><button onClick={() => toggleFavourite(fromUnit)} aria-label={favourites.includes(fromUnit) ? 'Remove from favourites' : 'Add to favourites'}><Star size={17} fill={favourites.includes(fromUnit) ? 'currentColor' : 'none'} /></button></div>
          <input className="conversion-number" inputMode="decimal" value={fromValue} onChange={(event) => apply(event.target.value, 'from')} aria-label={`Value in ${from.name}`} />
          <div className="unit-select"><strong>{from.symbol}</strong><select value={fromUnit} onChange={(event) => changeUnit('from', event.target.value)} aria-label="Source unit">{category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>)}</select><button onClick={() => void copy('from')} aria-label="Copy source value">{copied === 'from' ? <Check size={18} /> : <Copy size={18} />}</button></div>
        </article>
        <button className="swap-units" onClick={swap} aria-label="Swap units"><ArrowDownUp size={21} /></button>
        <article className={lastEdited === 'to' ? 'conversion-field active' : 'conversion-field'}>
          <div className="field-label"><span>To</span><button onClick={() => toggleFavourite(toUnit)} aria-label={favourites.includes(toUnit) ? 'Remove from favourites' : 'Add to favourites'}><Star size={17} fill={favourites.includes(toUnit) ? 'currentColor' : 'none'} /></button></div>
          <input className="conversion-number" inputMode="decimal" value={toValue} onChange={(event) => apply(event.target.value, 'to')} aria-label={`Value in ${to.name}`} />
          <div className="unit-select"><strong>{to.symbol}</strong><select value={toUnit} onChange={(event) => changeUnit('to', event.target.value)} aria-label="Target unit">{category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.name} ({unit.symbol})</option>)}</select><button onClick={() => void copy('to')} aria-label="Copy result value">{copied === 'to' ? <Check size={18} /> : <Copy size={18} />}</button></div>
        </article>
      </div>
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <div className="conversion-formula"><div><span>Formula</span><code>1 {from.symbol} = {formatConverted(convertUnit(categoryId, 1, fromUnit, toUnit), 10)} {to.symbol}</code><small>{formula}</small></div><button onClick={saveConversion}>Save conversion</button></div>
      {(currentFavourites.length || currentRecent.length) ? <div className="unit-shortcuts">{currentFavourites.length ? <div><span>Favourites</span>{currentFavourites.map((id) => <button key={id} onClick={() => changeUnit('to', id)}>{id}</button>)}</div> : null}{currentRecent.length ? <div><span>Recent</span>{currentRecent.map((id) => <button key={id} onClick={() => changeUnit('from', id)}>{id}</button>)}</div> : null}</div> : null}
    </div>
  </section>
}
