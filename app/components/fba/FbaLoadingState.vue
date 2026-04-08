<script setup lang="ts">
const { t } = useT()

defineProps<{
  lines?: number
  /** Visible status line (e.g. search in progress). */
  caption?: string
}>()
</script>

<template>
  <div
    class="fba-inset-well rounded-2xl p-6"
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <div v-if="caption" class="mb-5 flex items-center gap-3">
      <span
        class="inline-flex size-2 shrink-0 animate-pulse rounded-full bg-primary shadow-[0_0_0_3px_color-mix(in_srgb,var(--ui-color-primary-500)_22%,transparent)]"
        aria-hidden="true"
      />
      <p class="text-sm font-medium text-highlighted">
        {{ caption }}
      </p>
    </div>
    <div class="space-y-3">
      <USkeleton
        v-for="i in (lines ?? 4)"
        :key="i"
        class="h-4 w-full rounded-lg"
        :class="i === 1 ? 'w-4/5' : i === 2 ? 'w-full' : i === 3 ? 'w-11/12' : 'w-2/3'"
      />
    </div>
    <span class="sr-only">{{ t('common.loading') }}</span>
  </div>
</template>
