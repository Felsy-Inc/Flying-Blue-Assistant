<script setup lang="ts">
import type { NormalizedAwardOffer } from '~lib/availability/domain'

const props = defineProps<{
  offer: NormalizedAwardOffer
  passengers: number
}>()

const emit = defineEmits<{
  createAlert: [offer: NormalizedAwardOffer]
}>()

const { t } = useT()
const { formatMediumDate, formatEur, formatMiles, formatShortTimeUtc } = useLocaleFormatters()

const valueColor = computed(() => {
  switch (props.offer.valueLabel) {
    case 'promo':
    case 'strong_value':
      return 'success' as const
    case 'good':
      return 'primary' as const
    case 'fair':
      return 'neutral' as const
    default:
      return 'warning' as const
  }
})

const stopsLabel = (n: number) => {
  if (n <= 0) return t('search.stops0')
  if (n === 1) return t('search.stops1')
  return t('search.stopsN', { n })
}

const primaryAirline = computed(() => {
  const s = props.offer.segmentsOutbound[0]
  return s ? `${s.airlineName} (${s.airlineCode})` : '—'
})

const formatSegmentLine = (seg: (typeof props.offer.segmentsOutbound)[0]) =>
  `${seg.origin}→${seg.destination} · ${formatShortTimeUtc(seg.departureAt)}–${formatShortTimeUtc(seg.arrivalAt)}`

const outboundStopsLabel = computed(() => stopsLabel(props.offer.stopsOutbound))

const returnStopsSummary = computed(() => {
  if (props.offer.tripType !== 'round_trip' || props.offer.stopsReturn == null) return ''
  return `${stopsLabel(props.offer.stopsReturn)} · ${t('search.routeRt')}`
})

const tripIcon = computed(() =>
  props.offer.tripType === 'round_trip' ? 'i-lucide:repeat-2' : 'i-lucide:arrow-right',
)

const stopsIcon = computed(() =>
  props.offer.stopsOutbound <= 0 && (props.offer.stopsReturn ?? 0) <= 0
    ? 'i-lucide:navigation'
    : 'i-lucide:git-branch',
)
</script>

<template>
  <FbaAppCard
    class="group/offer overflow-hidden transition-[box-shadow,transform,border-color] duration-200 motion-safe:hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lg focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 dark:hover:border-primary/30 dark:focus-within:ring-primary/25"
  >
    <!-- Top: route + deal — first glance -->
    <div class="fba-offer-cap px-5 py-4 sm:px-6 sm:py-5">
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
      >
        <div class="min-w-0 space-y-3">
          <FbaRouteChip
            size="lg"
            :from="offer.segmentsOutbound[0]?.origin ?? '—'"
            :to="offer.segmentsOutbound.at(-1)?.destination ?? '—'"
          />
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span class="inline-flex items-center gap-1.5 text-highlighted">
              <UIcon name="i-lucide:calendar-days" class="size-4 shrink-0 text-primary/80" aria-hidden="true" />
              <span class="font-semibold tabular-nums">{{ formatMediumDate(offer.outboundDate) }}</span>
            </span>
            <template v-if="offer.returnDate">
              <span class="text-dimmed" aria-hidden="true">→</span>
              <span class="inline-flex items-center gap-1.5 text-highlighted">
                <span class="font-semibold tabular-nums">{{ formatMediumDate(offer.returnDate) }}</span>
              </span>
            </template>
          </div>
        </div>
        <UBadge
          :color="valueColor"
          variant="subtle"
          size="lg"
          class="w-fit shrink-0 border border-current/15 font-semibold shadow-sm"
        >
          {{ t(`search.valueLabel.${offer.valueLabel}`) }}
        </UBadge>
      </div>
    </div>

    <div class="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-8">
        <!-- Trip context + operations -->
        <div class="min-w-0 flex-1 space-y-5">
          <!-- Meta pills: trip, cabin, stops -->
          <div class="flex flex-wrap gap-2">
            <span class="fba-offer-pill">
              <UIcon :name="tripIcon" class="size-3.5 text-primary" aria-hidden="true" />
              {{
                offer.tripType === 'round_trip' ? t('search.routeRt') : t('search.routeOw')
              }}
            </span>
            <span class="fba-offer-pill fba-offer-pill--cabin">
              <UIcon name="i-lucide:armchair" class="size-3.5" aria-hidden="true" />
              {{ t(`search.cabinOpt.${offer.cabin}`) }}
            </span>
            <span class="fba-offer-pill fba-offer-pill--muted">
              <UIcon :name="stopsIcon" class="size-3.5 text-dimmed" aria-hidden="true" />
              {{ outboundStopsLabel }}
            </span>
            <span v-if="returnStopsSummary" class="fba-offer-pill fba-offer-pill--muted">
              <UIcon name="i-lucide:corner-down-right" class="size-3.5 text-dimmed" aria-hidden="true" />
              {{ returnStopsSummary }}
            </span>
          </div>

          <!-- Airline + availability -->
          <div class="fba-offer-meta-panel sm:grid-cols-2">
            <div class="flex gap-3">
              <span class="fba-offer-icon-primary">
                <UIcon name="i-lucide:plane" class="size-5" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-dimmed">
                  {{ t('search.airline') }}
                </p>
                <p class="mt-0.5 text-sm font-semibold leading-snug text-highlighted sm:text-base">
                  {{ primaryAirline }}
                </p>
              </div>
            </div>
            <div v-if="offer.seatsLabel" class="fba-offer-seats-split flex gap-3">
              <span class="fba-offer-icon-muted">
                <UIcon name="i-lucide:ticket" class="size-5 text-muted" aria-hidden="true" />
              </span>
              <div class="min-w-0">
                <p class="text-[10px] font-bold uppercase tracking-widest text-dimmed">
                  {{ t('search.availability') }}
                </p>
                <p class="mt-0.5 text-sm font-semibold text-highlighted sm:text-base">
                  {{ t(`search.seats.${offer.seatsLabel}`) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Schedule -->
          <div>
            <div class="mb-2 flex items-center gap-2">
              <UIcon name="i-lucide:clock" class="size-4 text-dimmed" aria-hidden="true" />
              <p class="text-[10px] font-bold uppercase tracking-widest text-dimmed">
                {{ t('search.timing') }}
              </p>
            </div>
            <ul class="space-y-2" role="list">
              <li
                v-for="(seg, i) in offer.segmentsOutbound"
                :key="`o-${i}`"
                class="fba-offer-seg-out"
              >
                <UIcon
                  name="i-lucide:arrow-right-circle"
                  class="mt-0.5 size-4 shrink-0 text-primary/70"
                  aria-hidden="true"
                />
                <span>{{ formatSegmentLine(seg) }}</span>
              </li>
              <template v-if="offer.segmentsReturn?.length">
                <li
                  v-for="(seg, i) in offer.segmentsReturn"
                  :key="`r-${i}`"
                  class="fba-offer-seg-ret"
                >
                  <UIcon
                    name="i-lucide:undo-2"
                    class="mt-0.5 size-4 shrink-0 text-dimmed"
                    aria-hidden="true"
                  />
                  <span>{{ formatSegmentLine(seg) }}</span>
                </li>
              </template>
            </ul>
          </div>
        </div>

        <!-- Fare summary + action -->
        <div class="fba-offer-aside">
          <div class="fba-offer-fare-box">
            <div class="fba-offer-fare-divider grid grid-cols-2">
              <div class="px-4 py-4 text-center sm:px-5 sm:py-5">
                <p class="text-[10px] font-bold uppercase tracking-widest text-primary/85">
                  {{ t('search.miles') }}
                </p>
                <p
                  class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-highlighted sm:text-3xl"
                >
                  {{ formatMiles(offer.milesPerPassenger) }}
                </p>
                <p v-if="passengers > 1" class="mt-1 text-[11px] text-dimmed">
                  {{ t('search.forPassengers', { n: passengers }) }}
                </p>
              </div>
              <div class="px-4 py-4 text-center sm:px-5 sm:py-5">
                <p class="text-[10px] font-bold uppercase tracking-widest text-dimmed">
                  {{ t('search.taxes') }}
                </p>
                <p class="mt-1.5 text-xl font-bold tabular-nums text-highlighted sm:text-2xl">
                  {{ formatEur(offer.taxesPerPassenger.amount) }}
                </p>
              </div>
            </div>
          </div>

          <UButton
            color="primary"
            size="lg"
            leading-icon="i-lucide:bell-plus"
            class="w-full justify-center font-semibold shadow-sm transition-shadow group-hover/offer:shadow-md"
            @click="emit('createAlert', offer)"
          >
            {{ t('search.createAlert') }}
          </UButton>
        </div>
      </div>
    </div>
  </FbaAppCard>
</template>
