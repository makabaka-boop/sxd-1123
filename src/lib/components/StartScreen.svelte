<script lang="ts">
  import { gameStore } from '../stores/gameStore.js'
  import { getHistory } from '../utils/storage.js'
  import type { HistoryRecord } from '../types/index.js'

  let showHistory = $state(false)
  let historyRecords = $state<HistoryRecord[]>([])

  function loadHistory() {
    historyRecords = getHistory()
    showHistory = true
  }

  function handleViewReplay(record: HistoryRecord) {
    if (record.hasReplay) {
      gameStore.openReview(record.id)
    }
  }
</script>

<div class="min-h-screen bg-bg flex items-center justify-center p-6">
  <div class="text-center max-w-xl">
    <div class="mb-8">
      <div class="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-teal-primary/10 mb-6">
        <span class="text-4xl">🏥</span>
      </div>
      <h1 class="text-5xl font-black text-text mb-3 tracking-tight">
        诊室器材整理
      </h1>
      <p class="text-lg text-text-secondary leading-relaxed">
        在限定时间内完成器材的清洁、复核与回架操作<br />
        通过调整风险阈值平衡安全策略与评分惩罚
      </p>
    </div>

    <div class="bg-card rounded-2xl shadow-md border border-border/50 p-6 mb-8 text-left">
      <h3 class="font-bold text-text mb-4 text-center">操作说明</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="flex items-center gap-3 bg-bg rounded-xl p-3">
          <kbd class="px-2 py-1 bg-card rounded border border-border font-mono text-xs shadow-sm">← →</kbd>
          <span class="text-text-secondary">切换任务</span>
        </div>
        <div class="flex items-center gap-3 bg-bg rounded-xl p-3">
          <kbd class="px-2 py-1 bg-card rounded border border-border font-mono text-xs shadow-sm">空格</kbd>
          <span class="text-text-secondary">完成当前步骤</span>
        </div>
        <div class="flex items-center gap-3 bg-bg rounded-xl p-3">
          <kbd class="px-2 py-1 bg-card rounded border border-border font-mono text-xs shadow-sm">D</kbd>
          <span class="text-text-secondary">延后处理</span>
        </div>
        <div class="flex items-center gap-3 bg-bg rounded-xl p-3">
          <kbd class="px-2 py-1 bg-card rounded border border-border font-mono text-xs shadow-sm">H</kbd>
          <span class="text-text-secondary">查看风险提示</span>
        </div>
      </div>
      <div class="mt-4 p-3 bg-orange-accent/5 rounded-xl border border-orange-accent/20">
        <p class="text-xs text-orange-accent leading-relaxed">
          💡 拖动风险阈值预警线调整安全策略：阈值越高，高风险器材不易超标但阈值本身有惩罚；阈值越低，惩罚小但高风险器材容易拉低安全评分。
        </p>
      </div>
    </div>

    <button
      onclick={() => gameStore.startGame()}
      class="px-10 py-4 bg-teal-primary text-white rounded-2xl font-bold text-lg hover:bg-teal-dark transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
    >
      开始游戏
    </button>

    <div class="mt-6 text-xs text-text-muted">
      限时 120 秒 · 8 项器材任务
    </div>

    <div class="mt-4">
      <button
        onclick={loadHistory}
        class="text-sm text-teal-primary hover:text-teal-dark underline underline-offset-4 transition-colors"
      >
        历史记录与复盘
      </button>
    </div>

    {#if showHistory}
      <div class="bg-card rounded-2xl shadow-lg border border-border/50 p-6 mt-6 text-left">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-text">历史记录</h3>
          <button
            onclick={() => (showHistory = false)}
            class="text-xs text-text-muted hover:text-text"
          >
            关闭
          </button>
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
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
