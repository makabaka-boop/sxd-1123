<script lang="ts">
  import { currentTask, gameStore, completedCount } from '../stores/gameStore.js'
  import { STEP_LABELS, STEP_ORDER, getRiskLevel, getRiskColor, RISK_LABELS } from '../types/index.js'

  let riskLevel = $derived($currentTask ? getRiskLevel($currentTask.riskLevel) : 'low')
  let riskColor = $derived($currentTask ? getRiskColor($currentTask.riskLevel) : '#2A9D8F')
  let riskLabel = $derived(RISK_LABELS[riskLevel])
  let stepIndex = $derived($currentTask ? STEP_ORDER.indexOf($currentTask.currentStep) : 0)

  function stepClass(i: number, si: number): string {
    const base = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all'
    if (i < si) return `${base} line-through`
    if (i === si) return `${base} bg-teal-primary text-white shadow-md`
    return `${base} text-text-muted`
  }

  function stepStyle(i: number, si: number): string {
    if (i < si) return 'background:rgba(42,157,143,0.15);color:#2A9D8F;'
    if (i === si) return ''
    return 'background:rgba(209,217,230,0.3);'
  }

  function connectorStyle(i: number, si: number): string {
    return i < si ? 'background:#2A9D8F;' : 'background:#D1D9E6;'
  }

  function delayStyle(): string {
    return 'background:rgba(244,162,97,0.2);color:#F4A261;'
  }
</script>

{#if $currentTask}
  <div class="bg-card rounded-2xl shadow-lg p-8 w-full max-w-lg mx-auto transition-all" style="border:1px solid rgba(209,217,230,0.5);">
    <div class="flex items-center justify-between mb-6">
      <span class="text-sm font-medium" style="color:#8B95A5;">
        任务 {$gameStore.currentIndex + 1} / {$gameStore.tasks.length}
      </span>
      <span class="text-sm" style="color:#8B95A5;">
        已完成 {$completedCount}
      </span>
    </div>

    <div class="mb-6">
      <h2 class="text-2xl font-bold mb-2" style="color:#1A2332;">
        {$currentTask.equipmentName}
      </h2>
      <div class="flex items-center gap-2">
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style="background: {riskColor};"
        >
          <span class="w-1.5 h-1.5 rounded-full" style="background:rgba(255,255,255,0.8);"></span>
          {riskLabel}
        </span>
        {#if $currentTask.isDelayed}
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={delayStyle()}>
            已延后
          </span>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-2 mb-6">
      {#each STEP_ORDER as step, i}
        <div class="flex items-center gap-2">
          <div class={stepClass(i, stepIndex)} style={stepStyle(i, stepIndex)}>
            {#if i < stepIndex}
              ✓
            {:else}
              {i + 1}
            {/if}
            {STEP_LABELS[step]}
          </div>
          {#if i < STEP_ORDER.length - 1}
            <div class="w-6 h-0.5 rounded" style={connectorStyle(i, stepIndex)}></div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="rounded-xl p-4" style="background:#F0F4F8;">
      <div class="text-sm mb-1" style="color:#5A6577;">当前操作</div>
      <div class="text-lg font-bold" style="color:#0D7377;">
        {STEP_LABELS[$currentTask.currentStep]}
      </div>
      <div class="text-xs mt-1" style="color:#8B95A5;">
        按 <kbd class="px-1.5 py-0.5 rounded font-mono text-xs" style="background:#fff;border:1px solid #D1D9E6;color:#1A2332;">空格</kbd> 完成此步骤
      </div>
    </div>
  </div>
{/if}
