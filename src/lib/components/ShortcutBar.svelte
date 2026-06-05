<script lang="ts">
  const shortcuts = [
    { key: '← →', desc: '切换任务' },
    { key: 'D', desc: '延后处理' },
    { key: '空格', desc: '完成步骤' },
    { key: 'H', desc: '查看提示' },
    { key: '← →', desc: '微调阈值', hint: true },
  ]
</script>

<div class="fixed bottom-0 left-0 right-0 bg-text/90 backdrop-blur-sm px-6 py-3 z-40">
  <div class="max-w-4xl mx-auto flex items-center justify-center gap-6">
    {#each shortcuts as s}
      <div class="flex items-center gap-1.5 text-white/70 text-xs">
        <kbd class="px-2 py-0.5 bg-white/15 rounded text-white font-mono text-xs border border-white/10">
          {s.key}
        </kbd>
        <span>{s.desc}</span>
      </div>
    {/each}
  </div>
</div>
