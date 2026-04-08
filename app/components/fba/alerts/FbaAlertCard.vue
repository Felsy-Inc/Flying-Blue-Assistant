<script setup lang="ts">
import { computed } from 'vue'
import type { AlertRow } from '~lib/alerts/alert-schema'

const props = defineProps<{
  alert: AlertRow
}>()

const emit = defineEmits<{
  edit: [alert: AlertRow]
  pause: [alert: AlertRow]
  resume: [alert: AlertRow]
  delete: [alert: AlertRow]
}>()

const { t } = useT()
const { formatMediumDate } = useLocaleFormatters()

const dateSummary = computed(() => {
  const o = formatMediumDate(props.alert.outbound_date_start)
  const oe = props.alert.outbound_date_end && props.alert.outbound_date_end !== props.alert.outbound_date_start
    ? ` – ${formatMediumDate(props.alert.outbound_date_end)}`
    : ''
  if (props.alert.trip_type === 'one_way') return o + oe
  const r = props.alert.return_date_start ? formatMediumDate(props.alert.return_date_start) : ''
  const re =
    props.alert.return_date_end && props.alert.return_date_start && props.alert.return_date_end !== props.alert.return_date_start
      ? ` – ${formatMediumDate(props.alert.return_date_end)}`
      : ''
  return `${o + oe} · ${r + re}`
})
</script>

<template>
  <FbaAppCard
    class="fba-list-row-sync overflow-hidden border-l-[3px] border-l-primary/50 transition-[transform,border-color] duration-200 hover:-translate-y-px hover:border-primary/35 hover:border-l-primary/65 focus-within:border-primary/55 focus-within:ring-2 focus-within:ring-primary/15 dark:border-l-primary/45 dark:hover:border-primary/40 dark:hover:border-l-primary/55"
  >
    <!-- Route + status -->
    <div
      class="border-b border-default/40 bg-gradient-to-r from-elevated/50 to-transparent px-5 py-4 dark:border-default/35 dark:from-elevated/30 sm:px-6"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <FbaRouteChip size="md" :from="alert.origin_airport" :to="alert.destination_airport" />
        <div class="flex flex-wrap items-center gap-2">
          <UBadge
            :color="alert.status === 'active' ? 'success' : 'neutral'"
            variant="subtle"
            class="font-medium"
          >
            {{ alert.status === 'active' ? t('alerts.statusActive') : t('alerts.statusPaused') }}
          </UBadge>
          <UBadge v-if="alert.trip_type === 'round_trip'" color="neutral" variant="outline" class="font-medium">
            {{ t('search.routeRt') }}
          </UBadge>
        </div>
      </div>
    </div>

    <div class="space-y-4 px-5 py-5 sm:px-6">
      <div class="flex gap-3 rounded-xl border border-default/35 bg-default/40 p-3.5 dark:border-default/30 dark:bg-default/20">
        <UIcon name="i-lucide:calendar-range" class="mt-0.5 size-5 shrink-0 text-primary/80" aria-hidden="true" />
        <div>
          <p class="text-[10px] font-bold uppercase tracking-widest text-dimmed">
            {{ t('alerts.cardDatesLabel') }}
          </p>
          <p class="mt-1 text-sm font-medium leading-relaxed text-highlighted">
            {{ dateSummary }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 text-sm text-muted">
        <span
          class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary dark:bg-primary/15"
        >
          <UIcon name="i-lucide:armchair" class="size-3.5" aria-hidden="true" />
          {{ alert.cabin === 'first' ? t('alerts.cabinFirst') : t(`search.cabinOpt.${alert.cabin}`) }}
        </span>
        <span class="inline-flex items-center gap-1 text-dimmed">
          <UIcon name="i-lucide:users" class="size-3.5" aria-hidden="true" />
          {{ alert.passenger_count }}pax
        </span>
        <span
          v-if="alert.direct_only"
          class="inline-flex items-center gap-1 rounded-md border border-default/45 px-2 py-0.5 text-xs font-medium text-muted"
        >
          <UIcon name="i-lucide:navigation" class="size-3.5" aria-hidden="true" />
          {{ t('search.directOnly') }}
        </span>
      </div>

      <p
        v-if="alert.max_miles != null || alert.max_taxes_amount != null"
        class="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-default/35 pt-3 text-xs text-dimmed dark:border-default/25"
      >
        <span v-if="alert.max_miles != null" class="inline-flex items-center gap-1 font-mono tabular-nums">
          <UIcon name="i-lucide:gauge" class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
          {{ t('search.miles') }} ≤ {{ alert.max_miles }}
        </span>
        <span v-if="alert.max_taxes_amount != null" class="inline-flex items-center gap-1 font-mono tabular-nums">
          <UIcon name="i-lucide:coins" class="size-3.5 shrink-0 opacity-70" aria-hidden="true" />
          {{ t('search.taxes') }} ≤ {{ alert.max_taxes_amount }} {{ alert.max_taxes_currency ?? 'EUR' }}
        </span>
      </p>
    </div>

    <div
      class="flex flex-wrap gap-2 border-t border-default/40 bg-elevated/25 px-5 py-3.5 dark:border-default/35 dark:bg-elevated/15 sm:px-6"
    >
      <UButton color="neutral" variant="outline" size="sm" @click="emit('edit', alert)">
        {{ t('alerts.edit') }}
      </UButton>
      <UButton
        v-if="alert.status === 'active'"
        color="warning"
        variant="soft"
        size="sm"
        @click="emit('pause', alert)"
      >
        {{ t('alerts.pause') }}
      </UButton>
      <UButton
        v-else
        color="primary"
        variant="soft"
        size="sm"
        @click="emit('resume', alert)"
      >
        {{ t('alerts.resume') }}
      </UButton>
      <UButton color="error" variant="soft" size="sm" class="ms-auto" @click="emit('delete', alert)">
        {{ t('alerts.delete') }}
      </UButton>
    </div>
  </FbaAppCard>
</template>
