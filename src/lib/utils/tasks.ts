import type { Task, Step } from '../types/index.js'
import { STEP_ORDER } from '../types/index.js'

const EQUIPMENT_NAMES = [
  '手术剪刀', '止血钳', '缝合针', '持针器', '组织镊',
  '探针', '牵开器', '骨膜剥离器', '吸引器头', '手术刀柄',
  '敷料钳', '布巾钳', '海绵钳', '卵圆钳', '阑尾钳',
  '胆石钳', '胃钳', '肠钳', '取石钳', '刮匙',
]

function randomId(): string {
  return Math.random().toString(36).substring(2, 10)
}

function randomRisk(): number {
  return Math.floor(Math.random() * 100) + 1
}

export function generateTasks(count: number = 8): Task[] {
  const shuffled = [...EQUIPMENT_NAMES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, Math.min(count, shuffled.length))

  return selected.map((name) => ({
    id: randomId(),
    equipmentName: name,
    currentStep: 'clean' as Step,
    riskLevel: randomRisk(),
    isDelayed: false,
    completed: false,
  }))
}

export function advanceStep(task: Task): Task {
  const currentIndex = STEP_ORDER.indexOf(task.currentStep)
  if (currentIndex < STEP_ORDER.length - 1) {
    return { ...task, currentStep: STEP_ORDER[currentIndex + 1] }
  }
  return { ...task, completed: true }
}
