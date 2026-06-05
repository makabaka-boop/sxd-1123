import type { HistoryRecord } from '../types/index.js'

const STORAGE_KEY = 'clinic-game-history'

export function saveHistory(record: HistoryRecord): void {
  const history = getHistory()
  history.unshift(record)
  if (history.length > 20) history.length = 20
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // storage full, ignore
  }
}

export function getHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function exportHistory(records: HistoryRecord[]): void {
  const json = JSON.stringify(records, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clinic-game-history-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportSingleRecord(record: HistoryRecord): void {
  const json = JSON.stringify(record, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clinic-game-${record.date}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
