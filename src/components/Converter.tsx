import { ArrowDownUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { UNIT_CATEGORIES } from '../data'

export function Converter() {
  const [categoryId, setCategoryId] = useState('length')
  const category = UNIT_CATEGORIES.find((item) => item.id === categoryId) ?? UNIT_CATEGORIES[0]
  const [fromId, setFromId] = useState(category.units[0].id)
  const [toId, setToId] = useState(category.units[1].id)
  const [value, setValue] = useState('1')

  function selectCategory(id: string) {
    const next = UNIT_CATEGORIES.find((item) => item.id === id) ?? UNIT_CATEGORIES[0]
    setCategoryId(id)
    setFromId(next.units[0].id)
    setToId(next.units[1].id)
  }

  const converted = useMemo(() => {
    const from = category.units.find((unit) => unit.id === fromId) ?? category.units[0]
    const to = category.units.find((unit) => unit.id === toId) ?? category.units[1]
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) return '—'
    return new Intl.NumberFormat('en-US', { maximumSignificantDigits: 12 }).format(to.fromBase(from.toBase(numeric)))
  }, [category, fromId, toId, value])

  return (
    <section className="converter" aria-label="Unit converter">
      <div className="converter-categories" role="tablist" aria-label="Conversion type">
        {UNIT_CATEGORIES.map((item) => (
          <button key={item.id} className={item.id === categoryId ? 'active' : ''} onClick={() => selectCategory(item.id)}>{item.label}</button>
        ))}
      </div>
      <div className="converter-stage">
        <div className="conversion-field">
          <span>From</span>
          <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" aria-label="Value to convert" />
          <select value={fromId} onChange={(event) => setFromId(event.target.value)} aria-label="From unit">
            {category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label} ({unit.symbol})</option>)}
          </select>
        </div>
        <button className="swap-units" onClick={() => { setFromId(toId); setToId(fromId) }} aria-label="Swap units"><ArrowDownUp size={20} /></button>
        <div className="conversion-field output">
          <span>To</span>
          <output>{converted}</output>
          <select value={toId} onChange={(event) => setToId(event.target.value)} aria-label="To unit">
            {category.units.map((unit) => <option key={unit.id} value={unit.id}>{unit.label} ({unit.symbol})</option>)}
          </select>
        </div>
      </div>
      <p className="conversion-equation">Live precision conversion · values stay on your device</p>
    </section>
  )
}
