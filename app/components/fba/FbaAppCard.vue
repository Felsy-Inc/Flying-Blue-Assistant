<script setup lang="ts">
defineProps<{
  variant?: 'outline' | 'subtle' | 'soft'
}>()
</script>

<template>
  <UCard
    :variant="variant ?? 'outline'"
    class="fba-panel fba-surface-card overflow-hidden ring-1 ring-default/[0.08] dark:ring-white/[0.06]"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </UCard>
</template>
