export type Step = 'clean' | 'review' | 'shelve'
export type GamePhase = 'start' | 'playing' | 'result'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  equipmentName: string
  currentStep: Step
  riskLevel: number
  isDelayed: boolean
  completed: boolean
}

export interface GameSession {
  id: string
  totalTime: number
  remainingTime: number
  threshold: number
  speedScore: number
  safetyScore: number
  totalScore: number
  grade: string
  tasks: Task[]
  completedTasks: number
  totalTasks: number
}

export interface HistoryRecord {
  id: string
  date: string
  totalScore: number
  grade: string
  speedScore: number
  safetyScore: number
  completedTasks: number
  totalTasks: number
}

export const STEP_LABELS: Record<Step, string> = {
  clean: '清洁',
  review: '复核',
  shelve: '回架',
}

export const STEP_ORDER: Step[] = ['clean', 'review', 'shelve']

export const RISK_LABELS: Record<RiskLevel, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
  critical: '极高风险',
}

export function getRiskLevel(riskLevel: number): RiskLevel {
  if (riskLevel <= 25) return 'low'
  if (riskLevel <= 50) return 'medium'
  if (riskLevel <= 75) return 'high'
  return 'critical'
}

export function getRiskColor(riskLevel: number): string {
  if (riskLevel <= 25) return '#2A9D8F'
  if (riskLevel <= 50) return '#F4A261'
  if (riskLevel <= 75) return '#E63946'
  return '#9D0208'
}
