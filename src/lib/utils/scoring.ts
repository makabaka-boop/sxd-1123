import type { Task } from '../types/index.js'

export function calculateSpeedScore(
  completedTasks: number,
  totalTasks: number,
  totalTime: number,
  remainingTime: number
): number {
  if (totalTasks === 0) return 0
  const completionRate = completedTasks / totalTasks
  const timeEfficiency = remainingTime / totalTime
  const baseScore = completionRate * 60
  const bonusScore = timeEfficiency * 40
  return Math.round(baseScore + bonusScore)
}

export function calculateSafetyScore(
  tasks: Task[],
  threshold: number,
  completedTasks: number
): number {
  if (completedTasks === 0) return 0

  let safetyPoints = 0
  const completed = tasks.filter((t) => t.completed)

  for (const task of completed) {
    if (task.riskLevel > threshold) {
      const penalty = (task.riskLevel - threshold) * 0.5
      safetyPoints += Math.max(0, 10 - penalty)
    } else {
      safetyPoints += 10
    }
  }

  const rawScore = (safetyPoints / (completedTasks * 10)) * 100
  const thresholdPenalty = threshold * 0.3
  return Math.round(Math.max(0, rawScore - thresholdPenalty))
}

export function calculateTotalScore(speedScore: number, safetyScore: number): number {
  return Math.round(speedScore * 0.5 + safetyScore * 0.5)
}

export function getGrade(score: number): string {
  if (score >= 90) return 'S'
  if (score >= 75) return 'A'
  if (score >= 60) return 'B'
  if (score >= 40) return 'C'
  return 'D'
}
