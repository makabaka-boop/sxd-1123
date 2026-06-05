import { writable, derived } from 'svelte/store'
import type { Task, GamePhase, ReplayEvent, ReplayData, TaskReplaySummary, StepTiming, ThresholdRecord, ScoreBreakdown } from '../types/index.js'
import { STEP_ORDER } from '../types/index.js'
import { generateTasks, advanceStep } from '../utils/tasks.js'
import {
  calculateSpeedScore,
  calculateSafetyScore,
  calculateTotalScore,
  getGrade,
} from '../utils/scoring.js'
import { saveHistory, saveReplay } from '../utils/storage.js'

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
  replayEvents: ReplayEvent[]
  taskDelayCounts: Record<string, number>
  taskStepStartTimes: Record<string, Record<string, number>>
  taskCompletionTimes: Record<string, number>
  taskCompletionOrder: Record<string, number>
  thresholdHistory: ThresholdRecord[]
  gameStartTime: number
  currentReplayId: string | null
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
    replayEvents: [],
    taskDelayCounts: {},
    taskStepStartTimes: {},
    taskCompletionTimes: {},
    taskCompletionOrder: {},
    thresholdHistory: [],
    gameStartTime: 0,
    currentReplayId: null,
  }
}

function createGameStore() {
  const { subscribe, set, update } = writable<GameState>(createInitialState())

  let timer: ReturnType<typeof setInterval> | null = null

  function getElapsedTime(state: GameState): number {
    return state.totalTime - state.remainingTime
  }

  function recordEvent(
    state: GameState,
    type: ReplayEvent['type'],
    taskId: string,
    taskName: string,
    detail: string
  ): ReplayEvent {
    return {
      type,
      timestamp: Date.now(),
      gameTime: getElapsedTime(state),
      taskId,
      taskName,
      detail,
    }
  }

  function initTaskTracking(state: GameState, tasks: Task[]): Partial<GameState> {
    const taskDelayCounts: Record<string, number> = {}
    const taskStepStartTimes: Record<string, Record<string, number>> = {}
    const taskCompletionTimes: Record<string, number> = {}
    const taskCompletionOrder: Record<string, number> = {}

    for (const task of tasks) {
      taskDelayCounts[task.id] = 0
      taskStepStartTimes[task.id] = { clean: 0 }
      taskCompletionTimes[task.id] = -1
      taskCompletionOrder[task.id] = -1
    }

    return { taskDelayCounts, taskStepStartTimes, taskCompletionTimes, taskCompletionOrder }
  }

  function startGame() {
    const tasks = generateTasks(8)
    const sessionId = Math.random().toString(36).substring(2, 10)
    const now = Date.now()

    const tracking = initTaskTracking({ tasks } as GameState, tasks)

    const startEvent: ReplayEvent = {
      type: 'game_start',
      timestamp: now,
      gameTime: 0,
      taskId: '',
      taskName: '',
      detail: '游戏开始',
    }

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
      replayEvents: [startEvent],
      thresholdHistory: [{ time: 0, value: 50 }],
      gameStartTime: now,
      currentReplayId: sessionId,
      ...tracking,
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

  function buildReplayData(state: GameState): ReplayData {
    const taskSummaries: TaskReplaySummary[] = state.tasks.map((task) => {
      const stepTimings: StepTiming[] = STEP_ORDER.map((step) => {
        const startTimes = state.taskStepStartTimes[task.id] || {}
        const startedAt = startTimes[step] ?? -1
        let completedAt: number | null = null

        const stepIdx = STEP_ORDER.indexOf(step)
        const currentIdx = STEP_ORDER.indexOf(task.currentStep)

        if (task.completed || stepIdx < currentIdx) {
          const nextStep = stepIdx < STEP_ORDER.length - 1 ? STEP_ORDER[stepIdx + 1] : null
          if (nextStep && startTimes[nextStep] !== undefined) {
            completedAt = startTimes[nextStep]
          } else if (task.completed && stepIdx === STEP_ORDER.length - 1) {
            completedAt = state.taskCompletionTimes[task.id] >= 0
              ? state.taskCompletionTimes[task.id]
              : getElapsedTime(state)
          }
        }

        return { step, startedAt, completedAt }
      })

      const stepsCompleted = task.completed
        ? STEP_ORDER.length
        : STEP_ORDER.indexOf(task.currentStep)

      return {
        taskId: task.id,
        taskName: task.equipmentName,
        delayCount: state.taskDelayCounts[task.id] || 0,
        completedAt: state.taskCompletionTimes[task.id] >= 0
          ? state.taskCompletionTimes[task.id]
          : null,
        stepsCompleted,
        riskLevel: task.riskLevel,
        stepTimings,
        completionOrder: state.taskCompletionOrder[task.id] || 0,
      }
    })

    const completedCount = state.tasks.filter((t) => t.completed).length
    const completionRate = state.tasks.length > 0 ? completedCount / state.tasks.length : 0
    const timeEfficiency = state.totalTime > 0 ? state.remainingTime / state.totalTime : 0

    const scoreBreakdown: ScoreBreakdown = {
      speedScore: state.speedScore,
      safetyScore: state.safetyScore,
      totalScore: state.totalScore,
      speedDetail: `完成率 ${Math.round(completionRate * 100)}%（${completedCount}/${state.tasks.length}）贡献 ${Math.round(completionRate * 60)} 分，时间效率 ${Math.round(timeEfficiency * 100)}% 贡献 ${Math.round(timeEfficiency * 40)} 分`,
      safetyDetail: buildSafetyDetail(state),
    }

    return {
      sessionId: state.currentReplayId || '',
      events: [...state.replayEvents],
      taskSummaries,
      thresholdHistory: [...state.thresholdHistory],
      scoreBreakdown,
      totalGameTime: state.totalTime,
      actualTimeUsed: state.totalTime - state.remainingTime,
    }
  }

  function buildSafetyDetail(state: GameState): string {
    const completed = state.tasks.filter((t) => t.completed)
    if (completed.length === 0) return '无完成任务，安全评分为 0'

    const overThreshold = completed.filter((t) => t.riskLevel > state.threshold)
    const withinThreshold = completed.filter((t) => t.riskLevel <= state.threshold)

    let detail = `${withinThreshold.length} 项在阈值内（满分各10），`
    if (overThreshold.length > 0) {
      detail += `${overThreshold.length} 项超阈值（扣减惩罚），`
    }
    detail += `阈值惩罚 ${Math.round(state.threshold * 0.3)} 分`
    return detail
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

    const endEvent: ReplayEvent = {
      type: 'game_end',
      timestamp: Date.now(),
      gameTime: getElapsedTime(state),
      taskId: '',
      taskName: '',
      detail: `游戏结束，得分 ${totalScore}`,
    }

    const finalEvents = [...state.replayEvents, endEvent]
    const finalState = {
      ...state,
      phase: 'result',
      speedScore,
      safetyScore,
      totalScore,
      grade,
      remainingTime: 0,
      replayEvents: finalEvents,
    }

    const record = {
      id: state.currentReplayId || Math.random().toString(36).substring(2, 10),
      date: new Date().toLocaleString('zh-CN'),
      totalScore,
      grade,
      speedScore,
      safetyScore,
      completedTasks,
      totalTasks,
      hasReplay: true,
    }
    saveHistory(record)

    const replayData = buildReplayData(finalState)
    saveReplay(replayData)

    return finalState
  }

  function completeCurrentStep() {
    update((s) => {
      if (s.phase !== 'playing') return s
      const tasks = [...s.tasks]
      const task = tasks[s.currentIndex]
      if (!task || task.completed) return s

      const prevStep = task.currentStep
      const advanced = advanceStep(task)
      tasks[s.currentIndex] = advanced

      const event = recordEvent(
        s,
        advanced.completed ? 'task_complete' : 'step_complete',
        task.id,
        task.equipmentName,
        advanced.completed
          ? `任务完成（${prevStep}→完成）`
          : `${STEP_ORDER[STEP_ORDER.indexOf(prevStep)]}→${STEP_ORDER[STEP_ORDER.indexOf(prevStep) + 1]}`
      )

      const newStepStartTimes = { ...s.taskStepStartTimes }
      if (!advanced.completed) {
        const nextStep = STEP_ORDER[STEP_ORDER.indexOf(prevStep) + 1]
        const taskStarts = { ...(newStepStartTimes[task.id] || {}) }
        taskStarts[nextStep] = getElapsedTime(s)
        newStepStartTimes[task.id] = taskStarts
      }

      const newCompletionTimes = { ...s.taskCompletionTimes }
      const newCompletionOrder = { ...s.taskCompletionOrder }
      const completedSoFar = tasks.filter((t) => t.completed && t.id !== task.id).length
      if (advanced.completed) {
        newCompletionTimes[task.id] = getElapsedTime(s)
        newCompletionOrder[task.id] = completedSoFar + 1
      }

      const allDone = tasks.every((t) => t.completed)
      if (allDone) {
        return finishGame({
          ...s,
          tasks,
          replayEvents: [...s.replayEvents, event],
          taskStepStartTimes: newStepStartTimes,
          taskCompletionTimes: newCompletionTimes,
          taskCompletionOrder: newCompletionOrder,
        })
      }

      if (advanced.completed) {
        const activeTasks = tasks
          .map((t, i) => ({ task: t, originalIndex: i }))
          .filter((item) => !item.task.completed)
        if (activeTasks.length > 0) {
          return {
            ...s,
            tasks,
            currentIndex: activeTasks[0].originalIndex,
            replayEvents: [...s.replayEvents, event],
            taskStepStartTimes: newStepStartTimes,
            taskCompletionTimes: newCompletionTimes,
            taskCompletionOrder: newCompletionOrder,
          }
        }
      }

      return {
        ...s,
        tasks,
        replayEvents: [...s.replayEvents, event],
        taskStepStartTimes: newStepStartTimes,
        taskCompletionTimes: newCompletionTimes,
        taskCompletionOrder: newCompletionOrder,
      }
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

      const nextTask = activeTasks[nextPos].task
      const event = recordEvent(
        s,
        'task_switch',
        nextTask.id,
        nextTask.equipmentName,
        `切换到任务：${nextTask.equipmentName}`
      )

      return {
        ...s,
        currentIndex: activeTasks[nextPos].originalIndex,
        replayEvents: [...s.replayEvents, event],
      }
    })
  }

  function delayTask() {
    update((s) => {
      if (s.phase !== 'playing') return s
      const tasks = [...s.tasks]
      const task = tasks[s.currentIndex]
      if (!task || task.completed) return s

      tasks[s.currentIndex] = { ...task, isDelayed: true }

      const newDelayCounts = { ...s.taskDelayCounts }
      newDelayCounts[task.id] = (newDelayCounts[task.id] || 0) + 1

      const event = recordEvent(
        s,
        'task_delay',
        task.id,
        task.equipmentName,
        `延后处理（第 ${newDelayCounts[task.id]} 次）`
      )

      const activeTasks = tasks
        .map((t, i) => ({ task: t, originalIndex: i }))
        .filter((item) => !item.task.completed)

      if (activeTasks.length <= 1) {
        return {
          ...s,
          tasks,
          replayEvents: [...s.replayEvents, event],
          taskDelayCounts: newDelayCounts,
        }
      }

      const currentPos = activeTasks.findIndex(
        (item) => item.originalIndex === s.currentIndex
      )
      const nextPos =
        (currentPos + 1 + activeTasks.length) % activeTasks.length

      return {
        ...s,
        tasks,
        currentIndex: activeTasks[nextPos].originalIndex,
        replayEvents: [...s.replayEvents, event],
        taskDelayCounts: newDelayCounts,
      }
    })
  }

  function toggleHint() {
    update((s) => {
      const event = recordEvent(
        s,
        'hint_toggle',
        '',
        '',
        s.showHint ? '关闭提示' : '打开提示'
      )
      return {
        ...s,
        showHint: !s.showHint,
        replayEvents: [...s.replayEvents, event],
      }
    })
  }

  function setThreshold(value: number) {
    update((s) => {
      const newThreshold = Math.max(0, Math.min(100, value))
      if (newThreshold === s.threshold) return s

      const event = recordEvent(
        s,
        'threshold_change',
        '',
        '',
        `阈值 ${s.threshold}% → ${newThreshold}%`
      )

      return {
        ...s,
        threshold: newThreshold,
        replayEvents: [...s.replayEvents, event],
        thresholdHistory: [...s.thresholdHistory, { time: getElapsedTime(s), value: newThreshold }],
      }
    })
  }

  function openReview(replayId: string | null) {
    update((s) => ({
      ...s,
      phase: 'review',
      currentReplayId: replayId,
    }))
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
    openReview,
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
