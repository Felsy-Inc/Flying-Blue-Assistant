<script setup lang="ts">
import type { AvailabilitySearchResponse } from '~lib/availability/domain'

const props = defineProps<{
  loading: boolean
  response: AvailabilitySearchResponse | null
  error: string | null
  /** Drives error alert title, icon, and tone. */
  errorKind?: 'quota' | 'validation' | 'network' | null
  passengers: number
}>()

const emit = defineEmits<{
  createAlert: [offer: import('~lib/availability/domain').NormalizedAwardOffer]
}>()

const { t } = useT()

const selectedOutboundDate = ref('')

watch(
  () => props.response?.outboundDatesInWindow,
  (dates) => {
    if (dates?.length && !dates.includes(selectedOutboundDate.value) && selectedOutboundDate.value !== '') {
      selectedOutboundDate.value = ''
    }
  },
)

const filteredOffers = computed(() => {
  if (!props.response?.offers.length) return []
  if (!selectedOutboundDate.value) return props.response.offers
  return props.response.offers.filter((o) => o.outboundDate === selectedOutboundDate.value)
})

const errorAlertTitle = computed(() => {
  const k = props.errorKind
  if (k === 'quota') return t('search.limitReached')
  if (k === 'validation') return t('search.validation.formInvalid')
  return t('search.loadError')
})

const errorAlertIcon = computed(() => {
  const k = props.errorKind
  if (k === 'quota') return 'i-heroicons-clock'
  if (k === 'validation') return 'i-heroicons-pencil-square'
  return 'i-heroicons-exclamation-triangle'
})

const errorAlertColor = computed(() => {
  if (props.errorKind === 'quota') return 'warning' as const
  if (props.errorKind === 'validation') return 'warning' as const
  return 'error' as const
})
</script>

<template>
  <div class="space-y-5">
    <FbaLoadingState v-if="loading" :lines="6" :caption="t('search.searching')" />

    <UAlert
      v-else-if="error"
      :color="errorAlertColor"
      variant="subtle"
      :icon="errorAlertIcon"
      :title="errorAlertTitle"
      :description="error"
    />

    <template v-else-if="response">
      <div
        class="fba-results-toolbar flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3.5 sm:px-5"
      >
        <p class="text-base font-semibold text-highlighted">
          {{ t('search.resultsCount', { count: filteredOffers.length }) }}
        </p>
        <UBadge v-if="response.cacheHit" color="neutral" variant="subtle" class="font-medium">
          {{ t('search.cacheHint') }}
        </UBadge>
      </div>

      <FbaDateCompareStrip
        v-model="selectedOutboundDate"
        :dates="response.outboundDatesInWindow"
      />

      <FbaEmptyState
        v-if="!filteredOffers.length"
        icon="i-heroicons-magnifying-glass"
        :title="t('search.noResultsTitle')"
        :description="t('search.noResultsBody')"
      />

      <ul v-else class="space-y-5" :aria-label="t('search.sectionResultsTitle')">
        <li v-for="offer in filteredOffers" :key="offer.id">
          <FbaSearchResultCard
            :offer="offer"
            :passengers="passengers"
            @create-alert="emit('createAlert', $event)"
          />
        </li>
      </ul>
    </template>

    <FbaEmptyState
      v-else
      icon="i-heroicons-paper-airplane"
      :title="t('search.placeholderTitle')"
      :description="t('search.placeholderBody')"
    />
  </div>
</template>
