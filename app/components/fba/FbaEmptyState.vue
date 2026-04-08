<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  icon?: string
}>()
</script>

<template>
  <div
    class="fba-empty-surface flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center sm:px-8 sm:py-14"
  >
    <div
      v-if="icon"
      class="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15"
    >
      <UIcon :name="icon" class="size-7" aria-hidden="true" />
    </div>
    <p class="text-base font-semibold tracking-tight text-highlighted">
      {{ title }}
    </p>
    <p v-if="description" class="fba-muted-copy mt-2 max-w-md text-sm leading-relaxed">
      {{ description }}
    </p>
    <div
      v-if="$slots.action"
      class="mt-6 flex w-full max-w-sm flex-col items-stretch gap-3 sm:mt-7 sm:flex-row sm:justify-center"
    >
      <slot name="action" />
    </div>
  </div>
</template>
