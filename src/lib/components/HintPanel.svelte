<script lang="ts">
  import { currentTask, gameStore } from '../stores/gameStore.js'
  import { getRiskLevel, getRiskColor, RISK_LABELS } from '../types/index.js'

  let riskLevel = $derived($currentTask ? getRiskLevel($currentTask.riskLevel) : 'low')
  let riskColor = $derived($currentTask ? getRiskColor($currentTask.riskLevel) : '#2A9D8F')
  let riskLabel = $derived(RISK_LABELS[riskLevel])

  let riskDescriptions: Record<string, string> = {
    low: '该器材风险较低，可按正常流程处理，但仍需完成全部步骤。',
    medium: '该器材存在中等风险，建议仔细执行每个步骤，避免跳过复核。',
    high: '该器材风险较高！务必严格执行清洁→复核→回架完整流程，不建议延后处理。',
    critical: '⚠ 极高风险器材！必须立即处理，不得延后。每个步骤都需格外谨慎。',
  }

  let thresholdWarning = $derived.by(() => {
    if (!$currentTask) return ''
    const risk = $currentTask.riskLevel
    const threshold = $gameStore.threshold
    if (risk > threshold) {
      return `该器材风险(${risk})超过当前阈值(${threshold})，安全评分将受损！`
    }
    return `该器材风险(${risk})在阈值(${threshold})范围内，安全评分不受影响。`
  })

  let isOverThreshold = $derived(
    $currentTask ? $currentTask.riskLevel > $gameStore.threshold : false
  )

  let warningStyle = $derived.by(() => {
    if (isOverThreshold) {
      return 'background:rgba(230,57,70,0.1);border-color:rgba(230,57,70,0.3);color:#E63946;'
    }
    return 'background:rgba(42,157,143,0.1);border-color:rgba(42,157,143,0.3);color:#2A9D8F;'
  })
</script>

{#if $gameStore.showHint && $currentTask}
  <div
    class="fixed right-4 top-1/2 -translate-y-1/2 w-72 bg-card rounded-2xl shadow-2xl border-2 p-5 z-50 transition-all"
    style="border-color: {riskColor};"
  >
    <div class="flex items-center gap-2 mb-4">
      <span
        class="w-3 h-3 rounded-full animate-pulse"
        style="background: {riskColor};"
      ></span>
      <span class="text-sm font-bold" style="color: {riskColor};">
        {riskLabel}
      </span>
      <span class="text-xs text-text-muted ml-auto">
        风险值: {$currentTask.riskLevel}
      </span>
    </div>

    <p class="text-sm text-text-secondary leading-relaxed mb-4">
      {riskDescriptions[riskLevel]}
    </p>

    <div
      class="text-xs p-3 rounded-lg border"
      style={warningStyle}
    >
      {thresholdWarning}
    </div>

    <div class="mt-4 text-xs text-text-muted text-center">
      按 H 关闭提示
    </div>
  </div>
{/if}
