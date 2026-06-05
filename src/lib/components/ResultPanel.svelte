<script lang="ts">
  import { gameStore } from '../stores/gameStore.js'
  import { getHistory, exportHistory, exportSingleRecord, clearHistory, getReplay } from '../utils/storage.js'
  import type { HistoryRecord } from '../types/index.js'

  let showHistory = $state(false)
  let historyRecords = $state<HistoryRecord[]>([])
  let showScoreDetail = $state(false)

  function loadHistory() {
    historyRecords = getHistory()
    showHistory = true
  }

  function handleExportAll() {
    const records = getHistory()
    exportHistory(records)
  }

  function handleExportSingle(record: HistoryRecord) {
    exportSingleRecord(record)
  }

  function handleClearHistory() {
    clearHistory()
    historyRecords = []
  }

  function handleViewReplay(record: HistoryRecord) {
    if (record.hasReplay) {
      gameStore.openReview(record.id)
    }
  }

  function handleViewCurrentReplay() {
    gameStore.openReview($gameStore.currentReplayId)
  }

  let gradeColor = $derived.by(() => {
    const g = $gameStore.grade
    if (g === 'S') return '#FFD700'
    if (g === 'A') return '#2A9D8F'
    if (g === 'B') return '#F4A261'
    return '#E63946'
  })

  let hasCurrentReplay = $derived($gameStore.currentReplayId !== null)

  let completedCount = $derived($gameStore.tasks.filter((t) => t.completed).length)
  let totalCount = $derived($gameStore.tasks.length)
  let completionRate = $derived(totalCount > 0 ? completedCount / totalCount : 0)
  let timeEfficiency = $derived($gameStore.totalTime > 0 ? $gameStore.remainingTime / $gameStore.totalTime : 0)

  let speedBaseScore = $derived(Math.round(completionRate * 60))
  let speedBonusScore = $derived(Math.round(timeEfficiency * 40))
</script>

<div class="min-h-screen bg-bg flex items-center justify-center p-6 pb-20">
  <div class="w-full max-w-2xl">
    <div class="text-center mb-10">
      <h1 class="text-4xl font-black text-text mb-2">结算报告</h1>
      <p class="text-text-muted">游戏结束，以下是你的表现</p>
    </div>

    <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-8 mb-6">
      <div class="flex items-center justify-center mb-8">
        <div
          class="w-28 h-28 rounded-2xl flex items-center justify-center text-5xl font-black text-white shadow-lg"
          style="background: linear-gradient(135deg, {gradeColor}, {gradeColor}dd);"
        >
          {$gameStore.grade}
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="text-center">
          <div class="text-3xl font-black text-teal-primary">{$gameStore.speedScore}</div>
          <div class="text-sm text-text-muted mt-1">速度评分</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-black text-orange-accent">{$gameStore.safetyScore}</div>
          <div class="text-sm text-text-muted mt-1">安全评分</div>
        </div>
        <div class="text-center">
          <div class="text-3xl font-black text-text">{$gameStore.totalScore}</div>
          <div class="text-sm text-text-muted mt-1">总分</div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm mb-4">
        <div class="bg-bg rounded-xl p-4">
          <div class="text-text-muted mb-1">完成任务</div>
          <div class="font-bold text-text">
            {completedCount} / {totalCount}
          </div>
        </div>
        <div class="bg-bg rounded-xl p-4">
          <div class="text-text-muted mb-1">风险阈值</div>
          <div class="font-bold text-text">{$gameStore.threshold}%</div>
        </div>
      </div>

      <button
        onclick={() => (showScoreDetail = !showScoreDetail)}
        class="w-full text-center text-xs text-teal-primary hover:text-teal-dark underline underline-offset-4 transition-colors py-2"
      >
        {showScoreDetail ? '收起分数来源' : '查看分数来源说明'}
      </button>

      {#if showScoreDetail}
        <div class="mt-3 bg-bg rounded-xl p-4 text-sm space-y-3">
          <div>
            <div class="font-bold text-teal-primary mb-1">速度评分（{$gameStore.speedScore}分）</div>
            <div class="text-text-secondary text-xs leading-relaxed">
              完成率 {Math.round(completionRate * 100)}%（{completedCount}/{totalCount}）贡献 {speedBaseScore} 分
              + 时间效率 {Math.round(timeEfficiency * 100)}% 贡献 {speedBonusScore} 分
            </div>
            <div class="text-text-muted text-xs mt-1">
              公式：完成率 × 60 + 时间效率 × 40
            </div>
          </div>
          <div>
            <div class="font-bold text-orange-accent mb-1">安全评分（{$gameStore.safetyScore}分）</div>
            <div class="text-text-secondary text-xs leading-relaxed">
              阈值内器材每项满分 10 分，超阈值器材扣减惩罚，阈值本身惩罚 {Math.round($gameStore.threshold * 0.3)} 分
            </div>
            <div class="text-text-muted text-xs mt-1">
              公式：(安全点数 / 完成任务满分) × 100 - 阈值 × 0.3
            </div>
          </div>
          <div class="pt-2 border-t border-border/30 text-text-muted text-xs">
            总分 = 速度评分 × 50% + 安全评分 × 50% = {Math.round($gameStore.speedScore * 0.5)} + {Math.round($gameStore.safetyScore * 0.5)} = {$gameStore.totalScore}
          </div>
        </div>
      {/if}
    </div>

    <div class="flex gap-3 justify-center mb-6 flex-wrap">
      <button
        onclick={() => gameStore.startGame()}
        class="px-6 py-3 bg-teal-primary text-white rounded-xl font-bold hover:bg-teal-dark transition-colors shadow-md"
      >
        再来一局
      </button>
      <button
        onclick={() => gameStore.goToStart()}
        class="px-6 py-3 bg-card text-text border border-border rounded-xl font-bold hover:bg-bg transition-colors"
      >
        返回首页
      </button>
      {#if hasCurrentReplay}
        <button
          onclick={handleViewCurrentReplay}
          class="px-6 py-3 bg-text text-white rounded-xl font-bold hover:bg-text-secondary transition-colors shadow-md"
        >
          查看复盘
        </button>
      {/if}
      <button
        onclick={handleExportAll}
        class="px-6 py-3 bg-orange-accent text-white rounded-xl font-bold hover:bg-orange-hover transition-colors shadow-md"
      >
        导出成绩
      </button>
    </div>

    <div class="text-center">
      <button
        onclick={loadHistory}
        class="text-sm text-teal-primary hover:text-teal-dark underline underline-offset-4 transition-colors"
      >
        查看历史记录
      </button>
    </div>

    {#if showHistory}
      <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6 mt-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-text">历史记录</h3>
          <div class="flex gap-2">
            <button
              onclick={handleClearHistory}
              class="text-xs text-red-warning hover:underline"
            >
              清空
            </button>
            <button
              onclick={() => (showHistory = false)}
              class="text-xs text-text-muted hover:text-text"
            >
              关闭
            </button>
          </div>
        </div>

        {#if historyRecords.length === 0}
          <p class="text-sm text-text-muted text-center py-4">暂无历史记录</p>
        {:else}
          <div class="space-y-3 max-h-64 overflow-y-auto">
            {#each historyRecords as record}
              <div class="flex items-center justify-between bg-bg rounded-xl p-3">
                <div class="flex items-center gap-3">
                  <span
                    class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black text-white"
                    class:bg-yellow-400={record.grade === 'S'}
                    class:bg-green-safe={record.grade === 'A'}
                    class:bg-yellow-caution={record.grade === 'B'}
                    class:bg-red-warning={record.grade === 'C' || record.grade === 'D'}
                  >
                    {record.grade}
                  </span>
                  <div>
                    <div class="text-sm font-bold text-text">{record.totalScore} 分</div>
                    <div class="text-xs text-text-muted">{record.date}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="text-xs text-text-muted">
                    速{record.speedScore} 安{record.safetyScore}
                  </span>
                  {#if record.hasReplay}
                    <button
                      onclick={() => handleViewReplay(record)}
                      class="text-xs text-teal-primary hover:underline font-medium"
                    >
                      复盘详情
                    </button>
                  {/if}
                  <button
                    onclick={() => handleExportSingle(record)}
                    class="text-xs text-orange-accent hover:underline"
                  >
                    导出
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
