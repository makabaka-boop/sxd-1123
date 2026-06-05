export type Step = 'clean' | 'review' | 'shelve'
export type GamePhase = 'start' | 'playing' | 'result' | 'review'
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

export interface ReplayEvent {
  type: 'game_start' | 'step_complete' | 'task_delay' | 'task_switch' | 'threshold_change' | 'task_complete' | 'hint_toggle' | 'game_end'
  timestamp: number
  gameTime: number
  taskId: string
  taskName: string
  detail: string
}

export interface StepTiming {
  step: Step
  startedAt: number
  completedAt: number | null
}

export interface TaskReplaySummary {
  taskId: string
  taskName: string
  delayCount: number
  completedAt: number | null
  stepsCompleted: number
  riskLevel: number
  stepTimings: StepTiming[]
  completionOrder: number
}

export interface ThresholdRecord {
  time: number
  value: number
}

export interface ScoreBreakdown {
  speedScore: number
  safetyScore: number
  totalScore: number
  speedDetail: string
  safetyDetail: string
}

export interface ReplayData {
  sessionId: string
  events: ReplayEvent[]
  taskSummaries: TaskReplaySummary[]
  thresholdHistory: ThresholdRecord[]
  scoreBreakdown: ScoreBreakdown
  totalGameTime: number
  actualTimeUsed: number
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
  hasReplay: boolean
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
