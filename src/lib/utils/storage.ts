import type { HistoryRecord, ReplayData } from '../types/index.js'

const HISTORY_KEY = 'clinic-game-history'
const REPLAY_KEY = 'clinic-game-replays'

export function saveHistory(record: HistoryRecord): void {
  const history = getHistory()
  history.unshift(record)
  if (history.length > 20) history.length = 20
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // storage full, ignore
  }
}

export function getHistory(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    const records: HistoryRecord[] = raw ? JSON.parse(raw) : []
    return records.map((r) => ({
      ...r,
      hasReplay: r.hasReplay ?? false,
    }))
  } catch {
    return []
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function exportHistory(records: HistoryRecord[]): void {
  const replays = getAllReplays()
  const enriched = records.map((r) => ({
    ...r,
    replay: r.hasReplay ? replays[r.id] || null : null,
  }))
  const json = JSON.stringify(enriched, null, 2)
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
  const replay = record.hasReplay ? getReplay(record.id) : null
  const enriched = { ...record, replay }
  const json = JSON.stringify(enriched, null, 2)
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

export function saveReplay(replay: ReplayData): void {
  const replays = getAllReplays()
  replays[replay.sessionId] = replay
  try {
    localStorage.setItem(REPLAY_KEY, JSON.stringify(replays))
  } catch {
    // storage full, try cleanup old replays
    const history = getHistory()
    const validIds = new Set(history.map((h) => h.id))
    let cleaned = false
    for (const key of Object.keys(replays)) {
      if (!validIds.has(key)) {
        delete replays[key]
        cleaned = true
      }
    }
    if (cleaned) {
      try {
        localStorage.setItem(REPLAY_KEY, JSON.stringify(replays))
      } catch {
        // still full, ignore
      }
    }
  }
}

export function getReplay(sessionId: string): ReplayData | null {
  const replays = getAllReplays()
  return replays[sessionId] || null
}

export function deleteReplay(sessionId: string): void {
  const replays = getAllReplays()
  delete replays[sessionId]
  try {
    localStorage.setItem(REPLAY_KEY, JSON.stringify(replays))
  } catch {
    // ignore
  }
}

function getAllReplays(): Record<string, ReplayData> {
  try {
    const raw = localStorage.getItem(REPLAY_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function exportReplay(replay: ReplayData): void {
  const json = JSON.stringify(replay, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `clinic-replay-${replay.sessionId}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
