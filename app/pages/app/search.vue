<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import { isApiValidationFailed, parseFetchError } from '~lib/api/fetch-error'
import type { AvailabilitySearchBodyInput } from '~lib/availability/search-request.zod'
import type { AvailabilitySearchResponse, NormalizedAwardOffer } from '~lib/availability/domain'

definePageMeta({
  layout: 'app',
})

const { t } = useT()
const route = useRoute()
const toast = useToast()

useSeoMeta({
  title: () => `${t('seo.pageTitle.appSearch')} — ${t('common.appName')}`,
  ogTitle: () => `${t('seo.pageTitle.appSearch')} — ${t('common.appName')}`,
  description: () => t('seo.pageDescription.appSearch'),
  ogDescription: () => t('seo.pageDescription.appSearch'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  ogSiteName: () => t('common.appName'),
})

const { data: overview, refresh: refreshOverview } = await useAppOverview()

const formRef = ref<InstanceType<typeof FbaSearchForm> | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)
const searchErrorKind = ref<'quota' | 'validation' | 'network' | null>(null)
const response = ref<AvailabilitySearchResponse | null>(null)
const lastPassengers = ref(1)

function buildAlertQuery(offer: NormalizedAwardOffer, passengers: number) {
  const direct =
    offer.stopsOutbound === 0 && (offer.stopsReturn == null || offer.stopsReturn === 0)
  return {
    origin: offer.segmentsOutbound[0]?.origin ?? '',
    destination: offer.segmentsOutbound.at(-1)?.destination ?? '',
    tripType: offer.tripType,
    outbound: offer.outboundDate,
    return: offer.returnDate ?? '',
    cabin: offer.cabin,
    pax: String(passengers),
    maxMiles: String(offer.milesPerPassenger),
    maxTaxes: String(offer.taxesPerPassenger.amount),
    direct: direct ? '1' : '0',
  }
}

const searchQuotaBlocked = computed(() => overview.value?.usage.searchQuotaExhausted ?? false)
const showSearchUpgrade = computed(() => overview.value?.planTier !== 'pro')

function onCreateAlert(offer: NormalizedAwardOffer) {
  navigateTo({
    path: '/app/alerts',
    query: buildAlertQuery(offer, lastPassengers.value),
  })
}

async function runSearch(body: AvailabilitySearchBodyInput) {
  loading.value = true
  errorMessage.value = null
  searchErrorKind.value = null
  lastPassengers.value = Number(body.passengers) || 1
  try {
    const res = await $fetch<AvailabilitySearchResponse>('/api/app/search', {
      method: 'POST',
      body,
    })
    response.value = res
    await refreshOverview()
    await nextTick()
    const resultsEl = document.getElementById('fba-search-results')
    if (resultsEl) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      resultsEl.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    }
  } catch (e: unknown) {
    response.value = null
    const err = parseFetchError(e)
    if (err.statusCode === 429) {
      searchErrorKind.value = 'quota'
      errorMessage.value = t('usage.bannerSearchBody')
      toast.add({ title: t('search.limitReached'), description: t('usage.bannerSearchBody'), color: 'warning' })
    } else if (isApiValidationFailed(err)) {
      searchErrorKind.value = 'validation'
      formRef.value?.applyServerFieldErrors(err.fieldErrors)
      errorMessage.value = t('search.validation.reviewFields')
      toast.add({ title: t('search.validation.formInvalid'), color: 'warning' })
    } else {
      searchErrorKind.value = 'network'
      errorMessage.value = t('search.loadError')
      toast.add({ title: t('search.loadError'), color: 'error' })
    }
  } finally {
    loading.value = false
  }
}

function applyRoutePrefill() {
  const q = route.query
  if (!q.origin || typeof q.origin !== 'string') return
  formRef.value?.applyPrefill({
    origin: q.origin.toUpperCase(),
    destination: typeof q.destination === 'string' ? q.destination.toUpperCase() : '',
    tripType: q.tripType === 'round_trip' ? 'round_trip' : 'one_way',
    outboundDate: typeof q.outbound === 'string' ? q.outbound : '',
    returnDate: typeof q.return === 'string' ? q.return : '',
    cabin:
      q.cabin === 'premium_economy' || q.cabin === 'business' || q.cabin === 'economy'
        ? q.cabin
        : 'economy',
    passengers: typeof q.pax === 'string' ? Number.parseInt(q.pax, 10) || 1 : 1,
  })
}

onMounted(() => {
  applyRoutePrefill()
})

watch(
  () => route.query,
  () => applyRoutePrefill(),
)
</script>

<template>
  <div class="space-y-12 md:space-y-14">
    <FbaSection
      variant="app"
      :title="t('search.sectionFormTitle')"
      :description="t('search.sectionFormDesc')"
    >
      <FbaAppCard>
        <div class="mb-6 space-y-4">
          <FbaUsageLimitBanner
            kind="search"
            :show="searchQuotaBlocked"
            :show-upgrade-cta="showSearchUpgrade"
          />
        </div>
        <FbaSearchForm
          ref="formRef"
          :quota-blocked="searchQuotaBlocked"
          :submitting="loading"
          @submit="runSearch"
        />
      </FbaAppCard>
    </FbaSection>

    <FbaSection
      variant="app"
      :title="t('search.sectionResultsTitle')"
      :description="t('search.sectionResultsDesc')"
    >
      <div id="fba-search-results" class="scroll-mt-24 md:scroll-mt-28">
        <FbaSearchResults
          :loading="loading"
          :response="response"
          :error="errorMessage"
          :error-kind="searchErrorKind"
          :passengers="lastPassengers"
          @create-alert="onCreateAlert"
        />
        <div
          v-if="response"
          class="mt-5 flex gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm text-muted dark:border-amber-400/20 dark:bg-amber-400/10"
          role="note"
        >
          <UIcon
            name="i-heroicons-information-circle"
            class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <p class="leading-relaxed">
            {{ t('browse.demoNote') }}
          </p>
        </div>
      </div>
    </FbaSection>
  </div>
</template>
