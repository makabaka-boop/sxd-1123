<script lang="ts">
  import { gameStore } from '../stores/gameStore.js'
  import { getReplay, exportReplay } from '../utils/storage.js'
  import { STEP_LABELS, STEP_ORDER, getRiskColor, getRiskLevel, RISK_LABELS } from '../types/index.js'
  import type { ReplayData, ReplayEvent, TaskReplaySummary } from '../types/index.js'

  let replay = $state<ReplayData | null>(null)
  let activeTab = $state<'timeline' | 'tasks' | 'threshold' | 'score'>('timeline')

  $effect(() => {
    const id = $gameStore.currentReplayId
    if (id) {
      replay = getReplay(id)
    }
  })

  let completedTasks = $derived(
    replay ? replay.taskSummaries.filter((t) => t.completedAt !== null).sort((a, b) => a.completionOrder - b.completionOrder) : []
  )

  let incompleteTasks = $derived(
    replay ? replay.taskSummaries.filter((t) => t.completedAt === null) : []
  )

  let significantEvents = $derived(
    replay ? replay.events.filter((e) => e.type !== 'task_switch' && e.type !== 'hint_toggle') : []
  )

  function eventIcon(type: ReplayEvent['type']): string {
    switch (type) {
      case 'game_start': return '🎮'
      case 'game_end': return '🏁'
      case 'step_complete': return '✓'
      case 'task_complete': return '★'
      case 'task_delay': return '⏸'
      case 'task_switch': return '↔'
      case 'threshold_change': return '⚙'
      case 'hint_toggle': return '💡'
      default: return '•'
    }
  }

  function eventColor(type: ReplayEvent['type']): string {
    switch (type) {
      case 'game_start': return '#0D7377'
      case 'game_end': return '#E63946'
      case 'step_complete': return '#2A9D8F'
      case 'task_complete': return '#FFD700'
      case 'task_delay': return '#F4A261'
      case 'task_switch': return '#8B95A5'
      case 'threshold_change': return '#FF6B35'
      case 'hint_toggle': return '#5A6577'
      default: return '#8B95A5'
    }
  }

  function stepDurationText(task: TaskReplaySummary): string {
    const timings = task.stepTimings
    const parts: string[] = []
    for (const t of timings) {
      if (t.startedAt >= 0 && t.completedAt !== null) {
        const dur = t.completedAt - t.startedAt
        parts.push(`${STEP_LABELS[t.step]}:${dur}s`)
      } else if (t.startedAt >= 0) {
        parts.push(`${STEP_LABELS[t.step]}:进行中`)
      }
    }
    return parts.length > 0 ? parts.join(' → ') : '无记录'
  }

  function totalStepTime(task: TaskReplaySummary): number {
    let total = 0
    for (const t of task.stepTimings) {
      if (t.startedAt >= 0 && t.completedAt !== null) {
        total += t.completedAt - t.startedAt
      }
    }
    return total
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function handleExport() {
    if (replay) exportReplay(replay)
  }

  let tabClass = (tab: string) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activeTab === tab
        ? 'bg-teal-primary text-white shadow-md'
        : 'text-text-secondary hover:bg-border/30'
    }`
</script>

<div class="min-h-screen bg-bg p-6 pb-20">
  <div class="w-full max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-black text-text">训练复盘中心</h1>
        <p class="text-sm text-text-muted mt-1">
          {#if replay}
            局次 #{replay.sessionId.slice(0, 6)} · 用时 {formatTime(replay.actualTimeUsed)} / {formatTime(replay.totalGameTime)}
          {/if}
        </p>
      </div>
      <div class="flex gap-2">
        <button
          onclick={handleExport}
          class="px-4 py-2 bg-orange-accent text-white rounded-xl text-sm font-bold hover:bg-orange-hover transition-colors shadow-md"
        >
          导出复盘
        </button>
        <button
          onclick={() => gameStore.goToStart()}
          class="px-4 py-2 bg-card text-text border border-border rounded-xl text-sm font-bold hover:bg-bg transition-colors"
        >
          返回首页
        </button>
      </div>
    </div>

    {#if !replay}
      <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-12 text-center">
        <p class="text-text-muted text-lg">未找到复盘数据</p>
        <button
          onclick={() => gameStore.goToStart()}
          class="mt-4 px-6 py-2 bg-teal-primary text-white rounded-xl font-bold hover:bg-teal-dark transition-colors"
        >
          返回首页
        </button>
      </div>
    {:else}
      <div class="flex gap-2 mb-6 overflow-x-auto">
        <button class={tabClass('timeline')} onclick={() => (activeTab = 'timeline')}>时间轴</button>
        <button class={tabClass('tasks')} onclick={() => (activeTab = 'tasks')}>任务轨迹</button>
        <button class={tabClass('threshold')} onclick={() => (activeTab = 'threshold')}>阈值调整</button>
        <button class={tabClass('score')} onclick={() => (activeTab = 'score')}>得分构成</button>
      </div>

      {#if activeTab === 'timeline'}
        <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
          <h3 class="font-bold text-text mb-4">操作时间轴</h3>
          <div class="space-y-0">
            {#each significantEvents as event, i}
              <div class="flex gap-4">
                <div class="flex flex-col items-center">
                  <div
                    class="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                    style="background: {eventColor(event.type)}20; color: {eventColor(event.type)};"
                  >
                    {eventIcon(event.type)}
                  </div>
                  {#if i < significantEvents.length - 1}
                    <div class="w-0.5 flex-1 min-h-[24px]" style="background: {eventColor(event.type)}30;"></div>
                  {/if}
                </div>
                <div class="pb-6 flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-sm font-bold text-text">{event.detail}</span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-text-muted">
                    <span>游戏时间 {formatTime(event.gameTime)}</span>
                    {#if event.taskName}
                      <span>· {event.taskName}</span>
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      {#if activeTab === 'tasks'}
        <div class="space-y-4">
          <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
            <h3 class="font-bold text-text mb-4">任务完成顺序</h3>
            {#if completedTasks.length === 0}
              <p class="text-sm text-text-muted">本局未完成任何任务</p>
            {:else}
              <div class="space-y-3">
                {#each completedTasks as task}
                  <div class="flex items-center gap-4 bg-bg rounded-xl p-4">
                    <div
                      class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                      style="background: {getRiskColor(task.riskLevel)};"
                    >
                      {task.completionOrder}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-text text-sm">{task.taskName}</span>
                        <span
                          class="text-xs px-2 py-0.5 rounded-full text-white"
                          style="background: {getRiskColor(task.riskLevel)};"
                        >
                          {RISK_LABELS[getRiskLevel(task.riskLevel)]}
                        </span>
                      </div>
                      <div class="text-xs text-text-muted">
                        完成于 {formatTime(task.completedAt || 0)} · 耗时 {totalStepTime(task)}s
                        {#if task.delayCount > 0}
                          · <span class="text-orange-accent font-medium">延后 {task.delayCount} 次</span>
                        {/if}
                      </div>
                      <div class="text-xs text-text-muted mt-1">
                        {stepDurationText(task)}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>

          {#if incompleteTasks.length > 0}
            <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
              <h3 class="font-bold text-text mb-4">未完成任务</h3>
              <div class="space-y-3">
                {#each incompleteTasks as task}
                  <div class="flex items-center gap-4 bg-bg rounded-xl p-4 opacity-60">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-black text-white bg-border flex-shrink-0">
                      ✕
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <span class="font-bold text-text text-sm">{task.taskName}</span>
                        <span
                          class="text-xs px-2 py-0.5 rounded-full text-white"
                          style="background: {getRiskColor(task.riskLevel)};"
                        >
                          {RISK_LABELS[getRiskLevel(task.riskLevel)]}
                        </span>
                      </div>
                      <div class="text-xs text-text-muted">
                        已完成 {task.stepsCompleted}/{STEP_ORDER.length} 步
                        {#if task.delayCount > 0}
                          · <span class="text-orange-accent font-medium">延后 {task.delayCount} 次</span>
                        {/if}
                      </div>
                      <div class="text-xs text-text-muted mt-1">
                        {stepDurationText(task)}
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'threshold'}
        <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
          <h3 class="font-bold text-text mb-4">风险阈值调整记录</h3>
          {#if replay.thresholdHistory.length <= 1}
            <p class="text-sm text-text-muted">本局未调整风险阈值</p>
            <div class="mt-3 flex items-center gap-2 text-sm">
              <span class="text-text-muted">最终阈值：</span>
              <span class="font-bold text-text">{replay.thresholdHistory[0]?.value ?? 50}%</span>
            </div>
          {:else}
            <div class="space-y-3">
              {#each replay.thresholdHistory as record, i}
                <div class="flex items-center gap-4 bg-bg rounded-xl p-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style="background: {record.value <= 30 ? '#2A9D8F' : record.value <= 60 ? '#F4A261' : '#E63946'}20; color: {record.value <= 30 ? '#2A9D8F' : record.value <= 60 ? '#F4A261' : '#E63946'};"
                  >
                    {i === 0 ? '起' : '→'}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-bold text-text">{record.value}%</span>
                      <span
                        class="text-xs px-2 py-0.5 rounded-full text-white"
                        style="background: {record.value <= 30 ? '#2A9D8F' : record.value <= 60 ? '#F4A261' : '#E63946'};"
                      >
                        {record.value <= 30 ? '宽松' : record.value <= 60 ? '适中' : record.value <= 80 ? '严格' : '极严'}
                      </span>
                    </div>
                    <span class="text-xs text-text-muted">游戏时间 {formatTime(record.time)}</span>
                  </div>
                </div>
              {/each}
            </div>

            <div class="mt-6 pt-4 border-t border-border/30">
              <h4 class="text-sm font-bold text-text mb-3">阈值变化趋势</h4>
              <div class="relative h-32 bg-bg rounded-xl p-4">
                <svg viewBox="0 0 100 60" class="w-full h-full" preserveAspectRatio="none">
                  <line x1="0" y1="15" x2="100" y2="15" stroke="#D1D9E6" stroke-width="0.5" stroke-dasharray="2,2" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#D1D9E6" stroke-width="0.5" stroke-dasharray="2,2" />
                  <line x1="0" y1="45" x2="100" y2="45" stroke="#D1D9E6" stroke-width="0.5" stroke-dasharray="2,2" />
                  <text x="1" y="14" font-size="4" fill="#8B95A5">75%</text>
                  <text x="1" y="29" font-size="4" fill="#8B95A5">50%</text>
                  <text x="1" y="44" font-size="4" fill="#8B95A5">25%</text>
                  <polyline
                    fill="none"
                    stroke="#FF6B35"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    points={replay.thresholdHistory.map((r, i) => {
                      const x = replay.totalGameTime > 0 ? (r.time / replay.totalGameTime) * 90 + 8 : 8
                      const y = 55 - (r.value / 100) * 50
                      return `${x},${y}`
                    }).join(' ')}
                  />
                  {#each replay.thresholdHistory as r, i}
                    <circle
                      cx={replay.totalGameTime > 0 ? (r.time / replay.totalGameTime) * 90 + 8 : 8}
                      cy={55 - (r.value / 100) * 50}
                      r="2"
                      fill="#FF6B35"
                    />
                  {/each}
                </svg>
              </div>
            </div>
          {/if}
        </div>
      {/if}

      {#if activeTab === 'score'}
        <div class="space-y-4">
          <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
            <h3 class="font-bold text-text mb-4">最终得分</h3>
            <div class="grid grid-cols-3 gap-6 mb-6">
              <div class="text-center">
                <div class="text-3xl font-black text-teal-primary">{replay.scoreBreakdown.speedScore}</div>
                <div class="text-sm text-text-muted mt-1">速度评分</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-black text-orange-accent">{replay.scoreBreakdown.safetyScore}</div>
                <div class="text-sm text-text-muted mt-1">安全评分</div>
              </div>
              <div class="text-center">
                <div class="text-3xl font-black text-text">{replay.scoreBreakdown.totalScore}</div>
                <div class="text-sm text-text-muted mt-1">总分</div>
              </div>
            </div>

            <div class="text-xs text-text-muted text-center">
              计算公式：总分 = 速度评分 × 50% + 安全评分 × 50%
            </div>
          </div>

          <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
            <h3 class="font-bold text-text mb-4">速度评分来源</h3>
            <div class="bg-bg rounded-xl p-4">
              <div class="text-sm text-text-secondary leading-relaxed">
                {replay.scoreBreakdown.speedDetail}
              </div>
              <div class="mt-3 text-xs text-text-muted">
                公式：速度评分 = 完成率 × 60 + 时间效率 × 40
              </div>
              <div class="mt-2 text-xs text-text-muted">
                完成率 = 完成任务数 / 总任务数 · 时间效率 = 剩余时间 / 总时间
              </div>
            </div>
          </div>

          <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
            <h3 class="font-bold text-text mb-4">安全评分来源</h3>
            <div class="bg-bg rounded-xl p-4">
              <div class="text-sm text-text-secondary leading-relaxed">
                {replay.scoreBreakdown.safetyDetail}
              </div>
              <div class="mt-3 text-xs text-text-muted">
                公式：安全评分 = (安全点数 / (完成任务数 × 10)) × 100 - 阈值 × 0.3
              </div>
              <div class="mt-2 text-xs text-text-muted">
                在阈值内：每项得 10 分 · 超阈值：每项扣减 (风险值 - 阈值) × 0.5
              </div>
            </div>

            {#if replay.taskSummaries.length > 0}
              <div class="mt-4 pt-4 border-t border-border/30">
                <h4 class="text-sm font-bold text-text mb-3">各任务安全评分明细</h4>
                <div class="space-y-2">
                  {#each replay.taskSummaries as task}
                    <div class="flex items-center justify-between text-sm bg-bg rounded-lg p-3">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-text">{task.taskName}</span>
                        <span
                          class="text-xs px-1.5 py-0.5 rounded-full text-white"
                          style="background: {getRiskColor(task.riskLevel)};"
                        >
                          风险{task.riskLevel}
                        </span>
                      </div>
                      <div class="text-xs">
                        {#if task.completedAt !== null}
                          {#if task.riskLevel > (replay.thresholdHistory[replay.thresholdHistory.length - 1]?.value ?? 50)}
                            <span class="text-red-warning">
                              超阈值 · 扣减 {((task.riskLevel - (replay.thresholdHistory[replay.thresholdHistory.length - 1]?.value ?? 50)) * 0.5).toFixed(1)}
                            </span>
                          {:else}
                            <span class="text-green-safe">在阈值内 · 满分</span>
                          {/if}
                        {:else}
                          <span class="text-text-muted">未完成</span>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
