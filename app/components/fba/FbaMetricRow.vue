<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  value: string
  /** 0–1 fill for usage-style rows; omit for plain metrics. */
  progress?: number
}>()

const pct = computed(() => {
  if (props.progress == null || Number.isNaN(props.progress)) return null
  return Math.round(Math.min(100, Math.max(0, props.progress * 100)))
})

const barClass = computed(() => {
  if (pct.value == null) return ''
  if (pct.value >= 100) return 'bg-amber-500 dark:bg-amber-400'
  if (pct.value >= 85) return 'bg-amber-500/90 dark:bg-amber-400/90'
  return 'bg-primary'
})
</script>

<template>
  <div class="py-3 first:pt-0 last:pb-0" :aria-label="`${label}: ${value}`">
    <div class="flex items-baseline justify-between gap-4">
      <span class="fba-muted-copy text-sm font-medium">{{ label }}</span>
      <span class="text-sm font-semibold tabular-nums text-highlighted">{{ value }}</span>
    </div>
    <div
      v-if="pct != null"
      class="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-default/55 ring-1 ring-default/38 dark:bg-elevated/40 dark:ring-default/20"
      role="presentation"
    >
      <div
        class="h-full rounded-full transition-[width] duration-300"
        :class="barClass"
        :style="{ width: `${pct}%` }"
      />
    </div>
  </div>
</template>
