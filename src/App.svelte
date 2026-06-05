<script lang="ts">
  import { gameStore } from './lib/stores/gameStore.js'
  import StartScreen from './lib/components/StartScreen.svelte'
  import CountdownBar from './lib/components/CountdownBar.svelte'
  import TaskCard from './lib/components/TaskCard.svelte'
  import ThresholdSlider from './lib/components/ThresholdSlider.svelte'
  import ShortcutBar from './lib/components/ShortcutBar.svelte'
  import HintPanel from './lib/components/HintPanel.svelte'
  import ResultPanel from './lib/components/ResultPanel.svelte'
  import { completedCount } from './lib/stores/gameStore.js'

  let phase = $derived($gameStore.phase)

  function handleKeydown(e: KeyboardEvent) {
    if (phase !== 'playing') return

    if (e.target instanceof HTMLElement && e.target.closest('#threshold-slider')) {
      return
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        gameStore.switchTask(-1)
        break
      case 'ArrowRight':
        e.preventDefault()
        gameStore.switchTask(1)
        break
      case ' ':
        e.preventDefault()
        gameStore.completeCurrentStep()
        break
      case 'd':
      case 'D':
        e.preventDefault()
        gameStore.delayTask()
        break
      case 'h':
      case 'H':
        e.preventDefault()
        gameStore.toggleHint()
        break
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if phase === 'start'}
  <StartScreen />
{:else if phase === 'playing'}
  <div class="min-h-screen bg-bg flex flex-col pb-16">
    <div class="p-4">
      <CountdownBar />
    </div>

    <div class="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-2">
      <div class="text-xs text-text-muted tabular-nums">
        剩余 {$gameStore.remainingTime}s · 已完成 {$completedCount}/{$gameStore.tasks.length}
      </div>

      <TaskCard />

      <ThresholdSlider />
    </div>

    <HintPanel />
    <ShortcutBar />
  </div>
{:else if phase === 'result'}
  <ResultPanel />
{/if}
