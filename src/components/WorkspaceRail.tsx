import { Clock3, Folder, MoreHorizontal, Pin, Plus, Sparkles, WalletCards, X } from 'lucide-react'
import { WORKSPACES } from '../data'
import type { HistoryEntry } from '../types'

interface WorkspaceRailProps {
  history: HistoryEntry[]
  activeWorkspace: string
  open: boolean
  onClose: () => void
  onWorkspaceChange: (id: string) => void
  onRecall: (entry: HistoryEntry) => void
  onPin: (id: string) => void
}

const icons = {
  clock: Clock3,
  orbit: Sparkles,
  wallet: WalletCards,
  draft: Folder,
}

export function WorkspaceRail({ history, activeWorkspace, open, onClose, onWorkspaceChange, onRecall, onPin }: WorkspaceRailProps) {
  const pinned = history.filter((entry) => entry.pinned).slice(0, 4)
  const recent = history.filter((entry) => !entry.pinned).slice(0, Math.max(0, 4 - pinned.length))
  const visible = [...pinned, ...recent]

  return (
    <aside className={`workspace-rail ${open ? 'open' : ''}`} aria-label="Workspaces and calculation history">
      <div className="rail-mobile-header">
        <span>Workspaces</span>
        <button className="icon-button" onClick={onClose} aria-label="Close workspaces"><X size={18} /></button>
      </div>
      <div className="rail-section">
        <div className="section-heading"><span>Workspaces</span><button aria-label="New workspace"><Plus size={17} /></button></div>
        <div className="workspace-list">
          {WORKSPACES.map((workspace) => {
            const Icon = icons[workspace.icon]
            return (
              <button
                key={workspace.id}
                className={activeWorkspace === workspace.id ? 'active' : ''}
                onClick={() => onWorkspaceChange(workspace.id)}
              >
                <Icon size={16} />
                <span>{workspace.name}</span>
                <small>{workspace.id === 'today' ? history.length : '—'}</small>
              </button>
            )
          })}
          <button className="more-workspaces"><MoreHorizontal size={17} /><span>More</span></button>
        </div>
      </div>
      <div className="rail-section history-section">
        <div className="section-heading"><span>Recent calculations</span><Clock3 size={15} /></div>
        <div className="history-list">
          {visible.length === 0 ? (
            <div className="empty-history">
              <Sparkles size={18} />
              <p>Your calculations will gather here.</p>
            </div>
          ) : visible.map((entry) => (
            <div className="history-row" key={entry.id}>
              <button className="history-recall" onClick={() => onRecall(entry)}>
                <span>{entry.expression}</span>
                <strong>{entry.result}</strong>
              </button>
              <button
                className={entry.pinned ? 'pin active' : 'pin'}
                onClick={() => onPin(entry.id)}
                aria-label={entry.pinned ? 'Unpin calculation' : 'Pin calculation'}
              >
                <Pin size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rail-signature">Every answer leaves a trail.</div>
    </aside>
  )
}
