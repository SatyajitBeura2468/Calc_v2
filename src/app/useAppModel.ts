import { useCallback, useEffect, useState } from 'react'
import { loadState, saveState } from '../core/persistence'
import type { AppMode, GraphFunction, GraphViewState, HistoryEntry, PersistedState, Settings } from '../types'

const uid = (prefix: string) => `${prefix}-${typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

export function useAppModel() {
  const [state, setState] = useState<PersistedState>(loadState)
  const [mode, setMode] = useState<AppMode>(() => {
    const hash = new URLSearchParams(location.hash.slice(1)).get('mode')
    return ['calculate', 'graph', 'convert', 'lab'].includes(hash ?? '') ? hash as AppMode : 'calculate'
  })
  const [storageHealthy, setStorageHealthy] = useState(true)

  useEffect(() => {
    setStorageHealthy(saveState(state))
  }, [state])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }, [])

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp' | 'workspaceId' | 'pinned'>) => {
    setState((current) => {
      const next: HistoryEntry = { ...entry, id: uid('history'), timestamp: Date.now(), workspaceId: current.activeWorkspaceId, pinned: false }
      const limit = current.settings.historyLimit
      const history = [next, ...current.history]
      return { ...current, history: limit ? history.slice(0, limit) : history }
    })
  }, [])

  const updateHistory = useCallback((id: string, patch: Partial<HistoryEntry>) => {
    setState((current) => ({ ...current, history: current.history.map((entry) => entry.id === id ? { ...entry, ...patch } : entry) }))
  }, [])

  const removeHistory = useCallback((ids: string[]) => {
    const selected = new Set(ids)
    setState((current) => ({ ...current, history: current.history.filter((entry) => !selected.has(entry.id)) }))
  }, [])

  const clearWorkspaceHistory = useCallback((workspaceId = state.activeWorkspaceId) => {
    setState((current) => ({ ...current, history: current.history.filter((entry) => entry.workspaceId !== workspaceId || entry.pinned) }))
  }, [state.activeWorkspaceId])

  const createWorkspace = useCallback((name?: string) => {
    const id = uid('workspace')
    setState((current) => ({ ...current, workspaces: [...current.workspaces, { id, name: name?.trim() || `Workspace ${current.workspaces.length + 1}`, createdAt: Date.now() }], activeWorkspaceId: id }))
    return id
  }, [])

  const renameWorkspace = useCallback((id: string, name: string) => {
    if (!name.trim()) return
    setState((current) => ({ ...current, workspaces: current.workspaces.map((workspace) => workspace.id === id ? { ...workspace, name: name.trim() } : workspace) }))
  }, [])

  const deleteWorkspace = useCallback((id: string) => {
    if (id === 'general') return
    setState((current) => ({
      ...current,
      activeWorkspaceId: current.activeWorkspaceId === id ? 'general' : current.activeWorkspaceId,
      workspaces: current.workspaces.filter((workspace) => workspace.id !== id),
      history: current.history.map((entry) => entry.workspaceId === id ? { ...entry, workspaceId: 'general' } : entry),
    }))
  }, [])

  const setActiveWorkspace = useCallback((id: string) => setState((current) => ({ ...current, activeWorkspaceId: id })), [])
  const setMemory = useCallback((value: number | ((current: number) => number)) => setState((current) => ({ ...current, memory: typeof value === 'function' ? value(current.memory) : value })), [])
  const setLastAnswer = useCallback((lastAnswer: string) => setState((current) => ({ ...current, lastAnswer })), [])
  const setGraphFunctions = useCallback((value: GraphFunction[] | ((current: GraphFunction[]) => GraphFunction[])) => setState((current) => ({ ...current, graphFunctions: typeof value === 'function' ? value(current.graphFunctions) : value })), [])
  const setGraphView = useCallback((value: Partial<GraphViewState> | ((current: GraphViewState) => GraphViewState)) => setState((current) => ({ ...current, graphView: typeof value === 'function' ? value(current.graphView) : { ...current.graphView, ...value } })), [])
  const recordCommand = useCallback((id: string) => setState((current) => ({ ...current, recentCommands: [id, ...current.recentCommands.filter((command) => command !== id)].slice(0, 6) })), [])
  const replaceState = useCallback((next: PersistedState) => setState(next), [])

  return {
    state, mode, storageHealthy, setMode, setState, updateSettings, addHistory, updateHistory, removeHistory,
    clearWorkspaceHistory, createWorkspace, renameWorkspace, deleteWorkspace, setActiveWorkspace, setMemory,
    setLastAnswer, setGraphFunctions, setGraphView, recordCommand, replaceState,
  }
}

export type AppModel = ReturnType<typeof useAppModel>
