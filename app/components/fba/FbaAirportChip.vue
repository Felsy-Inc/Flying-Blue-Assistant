<script setup lang="ts">
withDefaults(
  defineProps<{
    code: string
    /** Larger codes scan faster on result cards. */
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const sizeClass = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
} as const
</script>

<template>
  <span
    class="inline-flex items-center rounded-lg border border-default/70 bg-elevated/50 font-mono font-semibold tracking-wide text-highlighted"
    :class="sizeClass[size]"
  >
    {{ code.toUpperCase() }}
  </span>
</template>
