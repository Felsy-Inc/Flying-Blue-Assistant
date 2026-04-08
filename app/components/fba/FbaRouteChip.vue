<script setup lang="ts">
withDefaults(
  defineProps<{
    from: string
    to: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'sm' },
)

const arrowClass = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
} as const
</script>

<template>
  <span class="inline-flex items-center gap-1.5 sm:gap-2">
    <FbaAirportChip :code="from" :size="size" />
    <span class="font-medium text-dimmed" :class="arrowClass[size]" aria-hidden="true">→</span>
    <FbaAirportChip :code="to" :size="size" />
  </span>
</template>
