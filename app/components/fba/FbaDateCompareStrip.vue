<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  dates: string[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { t } = useT()
const { formatMediumDate } = useLocaleFormatters()

const items = computed(() => [
  { value: '', label: t('search.allDates') },
  ...props.dates.map((d) => ({ value: d, label: formatMediumDate(d) })),
])
</script>

<template>
  <div
    v-if="dates.length > 0"
    class="fba-inset-well rounded-2xl p-4"
  >
    <div class="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-xs font-semibold uppercase tracking-wider text-dimmed">
        {{ t('search.compareDates') }}
      </p>
      <p class="text-[11px] text-dimmed">
        {{ t('search.compareDatesHint') }}
      </p>
    </div>
    <div
      class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:thin]"
      role="tablist"
      :aria-label="t('search.compareDates')"
    >
      <UButton
        v-for="it in items"
        :key="it.value || 'all'"
        size="sm"
        :variant="modelValue === it.value ? 'solid' : 'outline'"
        :color="modelValue === it.value ? 'primary' : 'neutral'"
        class="shrink-0 rounded-full px-4 font-medium transition-colors hover:border-primary/40 hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        type="button"
        role="tab"
        :aria-selected="modelValue === it.value"
        @click="emit('update:modelValue', it.value)"
      >
        {{ it.label }}
      </UButton>
    </div>
  </div>
</template>
