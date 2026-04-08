<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  tone: 'success' | 'warning' | 'error' | 'neutral' | 'info'
  label: string
}>()

const color = computed(() => {
  const m: Record<typeof props.tone, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    success: 'success',
    warning: 'warning',
    error: 'error',
    neutral: 'neutral',
    info: 'info',
  }
  return m[props.tone]
})
</script>

<template>
  <UBadge :color="color" variant="subtle" class="font-medium">
    {{ label }}
  </UBadge>
</template>
