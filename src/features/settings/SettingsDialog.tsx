import { RotateCcw } from 'lucide-react'
import type { AppModel } from '../../app/useAppModel'
import { DEFAULT_SETTINGS } from '../../core/persistence'
import { Modal } from '../../components/ui/Modal'
import type { AngleMode, NumberFormat, ThemeName } from '../../types'

const themes: Array<{ id: ThemeName; label: string; description: string }> = [
  { id: 'carbon', label: 'Carbon', description: 'Neutral graphite' },
  { id: 'light', label: 'Light', description: 'Clear daylight' },
  { id: 'contrast', label: 'High Contrast', description: 'Maximum separation' },
  { id: 'paper', label: 'Paper', description: 'Warm notebook' },
]

const accents = ['#5dc6b3', '#72a7ff', '#d08bd5', '#e8b567']

export function SettingsDialog({ open, model, onClose }: { open: boolean; model: AppModel; onClose: () => void }) {
  const { settings } = model.state
  return (
    <Modal open={open} title="Settings" onClose={onClose} className="settings-modal">
      <div className="settings-content">
        <section><h3>Appearance</h3><div className="theme-options">{themes.map((theme) => <button key={theme.id} className={settings.theme === theme.id ? `theme-option ${theme.id} active` : `theme-option ${theme.id}`} onClick={() => model.updateSettings({ theme: theme.id })}><i /><span><strong>{theme.label}</strong><small>{theme.description}</small></span></button>)}</div><div className="accent-options" aria-label="Accent colour">{accents.map((accent) => <button key={accent} style={{ backgroundColor: accent }} className={settings.accent === accent ? 'active' : ''} onClick={() => model.updateSettings({ accent })} aria-label={`Use ${accent} accent`} />)}</div></section>
        <section><h3>Calculation defaults</h3><div className="settings-grid"><label>Angle mode<select value={settings.defaultAngle} onChange={(event) => model.updateSettings({ defaultAngle: event.target.value as AngleMode })}><option>DEG</option><option>RAD</option><option>GRAD</option></select></label><label>Precision<select value={settings.precision} onChange={(event) => model.updateSettings({ precision: Number(event.target.value) })}>{[6, 8, 10, 12, 14, 16].map((value) => <option key={value}>{value}</option>)}</select></label><label>Number format<select value={settings.numberFormat} onChange={(event) => model.updateSettings({ numberFormat: event.target.value as NumberFormat })}><option value="standard">Standard</option><option value="scientific">Scientific</option><option value="engineering">Engineering</option></select></label><label>History retention<select value={settings.historyLimit} onChange={(event) => model.updateSettings({ historyLimit: Number(event.target.value) as 50 | 200 | 0 })}><option value={50}>50 entries</option><option value={200}>200 entries</option><option value={0}>Unlimited</option></select></label></div></section>
        <section><h3>Feedback and accessibility</h3><div className="switch-list"><label><span><strong>Reduced motion</strong><small>Minimise panel and result movement</small></span><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => model.updateSettings({ reducedMotion: event.target.checked })} /></label><label><span><strong>Sound</strong><small>Reuse one quiet audio instrument</small></span><input type="checkbox" checked={settings.sound} onChange={(event) => model.updateSettings({ sound: event.target.checked })} /></label><label><span><strong>Haptics</strong><small>Short feedback on supported devices</small></span><input type="checkbox" checked={settings.haptics} onChange={(event) => model.updateSettings({ haptics: event.target.checked })} /></label></div></section>
      </div>
      <footer className="modal-footer"><button onClick={() => model.updateSettings(DEFAULT_SETTINGS)}><RotateCcw size={16} /> Reset defaults</button><button className="primary-button" onClick={onClose}>Done</button></footer>
    </Modal>
  )
}
