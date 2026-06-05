import { writable, derived } from 'svelte/store'
import type { Task, GamePhase } from '../types/index.js'
import { generateTasks, advanceStep } from '../utils/tasks.js'
import {
  calculateSpeedScore,
  calculateSafetyScore,
  calculateTotalScore,
  getGrade,
} from '../utils/scoring.js'
import { saveHistory } from '../utils/storage.js'

const TOTAL_TIME = 120

interface GameState {
  phase: GamePhase
  tasks: Task[]
  currentIndex: number
  remainingTime: number
  totalTime: number
  threshold: number
  showHint: boolean
  speedScore: number
  safetyScore: number
  totalScore: number
  grade: string
}

function createInitialState(): GameState {
  return {
    phase: 'start',
    tasks: [],
    currentIndex: 0,
    remainingTime: TOTAL_TIME,
    totalTime: TOTAL_TIME,
    threshold: 50,
    showHint: false,
    speedScore: 0,
    safetyScore: 0,
    totalScore: 0,
    grade: '',
  }
}

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(createInitialState())

  let timer: ReturnType<typeof setInterval> | null = null

  function startGame() {
    const tasks = generateTasks(8)
    update((s) => ({
      ...s,
      phase: 'playing',
      tasks,
      currentIndex: 0,
      remainingTime: TOTAL_TIME,
      totalTime: TOTAL_TIME,
      threshold: 50,
      showHint: false,
      speedScore: 0,
      safetyScore: 0,
      totalScore: 0,
      grade: '',
    }))
    startTimer()
  }

  function startTimer() {
    stopTimer()
    timer = setInterval(() => {
      update((s) => {
        if (s.phase !== 'playing') {
          stopTimer()
          return s
        }
        if (s.remainingTime <= 1) {
          return finishGame(s)
        }
        return { ...s, remainingTime: s.remainingTime - 1 }
      })
    }, 1000)
  }

  function stopTimer() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  function finishGame(state: GameState): GameState {
    if (state.phase === 'result') return state
    stopTimer()

    const completedTasks = state.tasks.filter((t) => t.completed).length
    const totalTasks = state.tasks.length
    const speedScore = calculateSpeedScore(
      completedTasks,
      totalTasks,
      state.totalTime,
      state.remainingTime
    )
    const safetyScore = calculateSafetyScore(
      state.tasks,
      state.threshold,
      completedTasks
    )
    const totalScore = calculateTotalScore(speedScore, safetyScore)
    const grade = getGrade(totalScore)

    const record = {
      id: Math.random().toString(36).substring(2, 10),
      date: new Date().toLocaleString('zh-CN'),
      totalScore,
      grade,
      speedScore,
      safetyScore,
      completedTasks,
      totalTasks,
    }
    saveHistory(record)

    return {
      ...state,
      phase: 'result',
      speedScore,
      safetyScore,
      totalScore,
      grade,
      remainingTime: 0,
    }
  }

  function completeCurrentStep() {
    update((s) => {
      if (s.phase !== 'playing') return s
      const tasks = [...s.tasks]
      const task = tasks[s.currentIndex]
      if (!task || task.completed) return s

      const advanced = advanceStep(task)
      tasks[s.currentIndex] = advanced

      const allDone = tasks.every((t) => t.completed)
      if (allDone) {
        return finishGame({ ...s, tasks })
      }

      if (advanced.completed) {
        const activeTasks = tasks
          .map((t, i) => ({ task: t, originalIndex: i }))
          .filter((item) => !item.task.completed)
        if (activeTasks.length > 0) {
          return { ...s, tasks, currentIndex: activeTasks[0].originalIndex }
        }
      }

      return { ...s, tasks }
    })
  }

  function switchTask(direction: number) {
    update((s) => {
      if (s.phase !== 'playing') return s
      const activeTasks = s.tasks
        .map((t, i) => ({ task: t, originalIndex: i }))
        .filter((item) => !item.task.completed)

      if (activeTasks.length === 0) return s

      const currentPos = activeTasks.findIndex(
        (item) => item.originalIndex === s.currentIndex
      )
      let nextPos: number
      if (currentPos === -1) {
        nextPos = direction > 0 ? 0 : activeTasks.length - 1
      } else {
        nextPos =
          (currentPos + direction + activeTasks.length) % activeTasks.length
      }
      return { ...s, currentIndex: activeTasks[nextPos].originalIndex }
    })
  }

  function delayTask() {
    update((s) => {
      if (s.phase !== 'playing') return s
      const tasks = [...s.tasks]
      const task = tasks[s.currentIndex]
      if (!task || task.completed) return s

      tasks[s.currentIndex] = { ...task, isDelayed: true }

      const activeTasks = tasks
        .map((t, i) => ({ task: t, originalIndex: i }))
        .filter((item) => !item.task.completed)

      if (activeTasks.length <= 1) return { ...s, tasks }

      const currentPos = activeTasks.findIndex(
        (item) => item.originalIndex === s.currentIndex
      )
      const nextPos =
        (currentPos + 1 + activeTasks.length) % activeTasks.length

      return {
        ...s,
        tasks,
        currentIndex: activeTasks[nextPos].originalIndex,
      }
    })
  }

  function toggleHint() {
    update((s) => ({ ...s, showHint: !s.showHint }))
  }

  function setThreshold(value: number) {
    update((s) => ({ ...s, threshold: Math.max(0, Math.min(100, value)) }))
  }

  function resetGame() {
    stopTimer()
    set(createInitialState())
  }

  function goToStart() {
    stopTimer()
    update((s) => ({
      ...createInitialState(),
    }))
  }

  return {
    subscribe,
    startGame,
    completeCurrentStep,
    switchTask,
    delayTask,
    toggleHint,
    setThreshold,
    resetGame,
    goToStart,
  }
}

export const gameStore = createGameStore()

export const currentTask = derived(gameStore, ($s) => {
  if ($s.tasks.length === 0) return null
  const task = $s.tasks[$s.currentIndex]
  if (task && !task.completed) return task
  const active = $s.tasks.find((t) => !t.completed)
  return active || null
})

export const completedCount = derived(gameStore, ($s) =>
  $s.tasks.filter((t) => t.completed).length
)

export const activeTasks = derived(gameStore, ($s) =>
  $s.tasks.filter((t) => !t.completed)
)

export const timePercent = derived(gameStore, ($s) =>
  $s.totalTime > 0 ? ($s.remainingTime / $s.totalTime) * 100 : 0
)
