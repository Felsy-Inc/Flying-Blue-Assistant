<script setup lang="ts">
defineProps<{
  /** Narrower reading column */
  narrow?: boolean
}>()
</script>

<template>
  <UContainer
    :class="narrow ? 'max-w-3xl' : 'max-w-6xl'"
    class="px-4 sm:px-6 lg:px-8"
  >
    <slot />
  </UContainer>
</template>
