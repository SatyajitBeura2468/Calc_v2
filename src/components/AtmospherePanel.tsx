import { RotateCcw, X } from 'lucide-react'
import { ACCENTS, DEFAULT_SETTINGS } from '../data'
import type { Density, KeyShape, Settings, ThemeName } from '../types'

interface AtmospherePanelProps {
  settings: Settings
  open: boolean
  onChange: (settings: Settings) => void
  onClose: () => void
}

const themes: Array<{ id: ThemeName; label: string }> = [
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'eclipse', label: 'Eclipse' },
  { id: 'lunar', label: 'Lunar' },
  { id: 'paper', label: 'Paper' },
]

const shapes: Array<{ id: KeyShape; label: string }> = [
  { id: 'sharp', label: 'Sharp' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'sculpted', label: 'Sculpted' },
]

const densities: Array<{ id: Density; label: string }> = [
  { id: 'compact', label: 'Compact' },
  { id: 'balanced', label: 'Balanced' },
  { id: 'spacious', label: 'Spacious' },
]

export function AtmospherePanel({ settings, open, onChange, onClose }: AtmospherePanelProps) {
  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => onChange({ ...settings, [key]: value })

  return (
    <aside className={`atmosphere-panel ${open ? 'open' : ''}`} aria-label="Atmosphere customization">
      <div className="atmosphere-heading"><span>Atmosphere</span><button className="icon-button" onClick={onClose} aria-label="Close customization"><X size={18} /></button></div>
      <section className="setting-section">
        <h2>Theme</h2>
        <div className="theme-grid">
          {themes.map((theme) => (
            <button key={theme.id} className={settings.theme === theme.id ? `theme-swatch ${theme.id} active` : `theme-swatch ${theme.id}`} onClick={() => update('theme', theme.id)}>
              <i><span /></i><small>{theme.label}</small>
            </button>
          ))}
        </div>
      </section>
      <section className="setting-section">
        <h2>Accent color</h2>
        <div className="accent-row">
          {ACCENTS.map((accent) => (
            <button key={accent} className={settings.accent === accent ? 'accent-swatch active' : 'accent-swatch'} style={{ backgroundColor: accent }} onClick={() => update('accent', accent)} aria-label={`Use accent ${accent}`} />
          ))}
        </div>
      </section>
      <section className="setting-section">
        <h2>Key shape</h2>
        <div className="shape-row">
          {shapes.map((shape) => (
            <button key={shape.id} className={settings.keyShape === shape.id ? `shape-choice ${shape.id} active` : `shape-choice ${shape.id}`} onClick={() => update('keyShape', shape.id)}><b>Aa</b><small>{shape.label}</small></button>
          ))}
        </div>
      </section>
      <section className="setting-section">
        <h2>Density</h2>
        <div className="density-row">
          {densities.map((density) => (
            <button key={density.id} className={settings.density === density.id ? `density-choice ${density.id} active` : `density-choice ${density.id}`} onClick={() => update('density', density.id)}><i>{Array.from({ length: density.id === 'compact' ? 15 : density.id === 'balanced' ? 9 : 6 }).map((_, index) => <span key={index} />)}</i><small>{density.label}</small></button>
          ))}
        </div>
      </section>
      <section className="setting-section switches">
        <label><span><b>Sound feedback</b><small>Play an instrument click</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => update('sound', event.target.checked)} /><i /></label>
        <label><span><b>Haptic feedback</b><small>Vibrate on supported devices</small></span><input type="checkbox" checked={settings.haptics} onChange={(event) => update('haptics', event.target.checked)} /><i /></label>
        <label><span><b>Orbital motion</b><small>Animate the calculation field</small></span><input type="checkbox" checked={settings.motion} onChange={(event) => update('motion', event.target.checked)} /><i /></label>
      </section>
      <section className="setting-section slider-setting">
        <h2>Background intensity <span>{settings.backgroundIntensity}%</span></h2>
        <input type="range" min="0" max="100" value={settings.backgroundIntensity} onChange={(event) => update('backgroundIntensity', Number(event.target.value))} aria-label="Background intensity" />
      </section>
      <button className="reset-settings" onClick={() => onChange(DEFAULT_SETTINGS)}><RotateCcw size={15} /> Reset to defaults</button>
    </aside>
  )
}
