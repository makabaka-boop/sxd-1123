<script lang="ts">
  import { gameStore } from '../stores/gameStore.js'

  let threshold = $derived($gameStore.threshold)
  let isDragging = $state(false)

  function handleMouseDown(e: MouseEvent) {
    isDragging = true
    updateFromMouse(e)
  }

  function handleMouseMove(e: MouseEvent) {
    if (!isDragging) return
    updateFromMouse(e)
  }

  function handleMouseUp() {
    isDragging = false
  }

  function updateFromMouse(e: MouseEvent) {
    const slider = document.getElementById('threshold-slider')
    if (!slider) return
    const rect = slider.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    gameStore.setThreshold(Math.round(percent))
  }

  function handleKeyAdjust(delta: number) {
    gameStore.setThreshold(threshold + delta)
  }

  let thresholdColor = $derived.by(() => {
    if (threshold <= 30) return '#2A9D8F'
    if (threshold <= 60) return '#F4A261'
    return '#E63946'
  })

  let thresholdLabel = $derived.by(() => {
    if (threshold <= 30) return '宽松'
    if (threshold <= 60) return '适中'
    if (threshold <= 80) return '严格'
    return '极严'
  })
</script>

<svelte:window
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
/>

<div class="bg-card rounded-xl border border-border/50 p-5 w-full max-w-lg mx-auto">
  <div class="flex items-center justify-between mb-3">
    <span class="text-sm font-bold text-text">风险阈值预警线</span>
    <div class="flex items-center gap-2">
      <span
        class="text-xs font-bold px-2 py-0.5 rounded-full text-white"
        style="background: {thresholdColor};"
      >
        {thresholdLabel}
      </span>
      <span class="text-xs text-text-muted tabular-nums">{threshold}%</span>
    </div>
  </div>

  <div
    id="threshold-slider"
    class="relative h-8 flex items-center cursor-pointer select-none"
    onmousedown={handleMouseDown}
    role="slider"
    aria-valuenow={threshold}
    aria-valuemin={0}
    aria-valuemax={100}
    tabindex={0}
    onkeydown={(e) => {
      if (e.key === 'ArrowLeft') handleKeyAdjust(-5)
      if (e.key === 'ArrowRight') handleKeyAdjust(5)
    }}
  >
    <div class="w-full h-2.5 bg-border/30 rounded-full relative overflow-visible">
      <div
        class="h-full rounded-full transition-colors duration-200"
        style="width: {threshold}%; background: linear-gradient(90deg, #2A9D8F, #F4A261, #E63946);"
      ></div>

      <div
        class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-white border-2 shadow-lg transition-transform duration-100"
        style="left: {threshold}%; border-color: {thresholdColor}; {isDragging ? 'transform: translate(-50%, -50%) scale(1.2);' : ''}"
      ></div>

      <div
        class="absolute top-full mt-1 -translate-x-1/2 text-xs font-bold tabular-nums transition-all duration-100"
        style="left: {threshold}%; color: {thresholdColor};"
      >
        ▲ {threshold}
      </div>
    </div>
  </div>

  <div class="flex justify-between mt-5 text-xs text-text-muted">
    <span>速度优先</span>
    <span class="text-text-secondary font-medium">← → 微调</span>
    <span>安全优先</span>
  </div>
</div>
