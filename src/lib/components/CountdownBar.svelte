<script lang="ts">
  import { gameStore, timePercent } from '../stores/gameStore.js'

  let color = $derived.by(() => {
    const p = $timePercent
    if (p > 60) return '#2A9D8F'
    if (p > 30) return '#F4A261'
    return '#E63946'
  })

  let formatted = $derived.by(() => {
    const mins = Math.floor($gameStore.remainingTime / 60)
    const secs = $gameStore.remainingTime % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  })
</script>

<div class="w-full bg-border/30 h-3 rounded-full overflow-hidden relative">
  <div
    class="h-full rounded-full transition-all duration-1000 ease-linear"
    style="width: {$timePercent}%; background: {color};"
  ></div>
  <div
    class="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold tabular-nums"
    style="color: {color};"
  >
    {formatted}
  </div>
</div>
