<script lang="ts">
  import { gameStore } from '../stores/gameStore.js'

  let hovered = $state(false)
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
        通过调整风险阈值平衡速度与安全评分
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
          💡 拖动风险阈值预警线调整安全策略：阈值越高越安全但速度评分越低，阈值越低速度评分高但安全风险增大。
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
  </div>
</div>
