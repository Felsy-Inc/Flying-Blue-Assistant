<script setup lang="ts">
definePageMeta({
  layout: 'app',
})

const { t } = useT()
const { formatMediumDate } = useLocaleFormatters()

useSeoMeta({
  title: () => `${t('seo.pageTitle.app')} — ${t('common.appName')}`,
  ogTitle: () => `${t('seo.pageTitle.app')} — ${t('common.appName')}`,
  description: () => t('seo.pageDescription.app'),
  ogDescription: () => t('seo.pageDescription.app'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  ogSiteName: () => t('common.appName'),
})

const { data: overview } = await useAppOverview()

const planLabel = computed(() => {
  const tier = overview.value?.planTier
  return tier === 'pro' ? t('alerts.planPro') : t('alerts.planFree')
})

const planForBadge = computed<'free' | 'pro'>(() =>
  overview.value?.planTier === 'pro' ? 'pro' : 'free',
)

const showSearchUpgrade = computed(() => overview.value?.planTier !== 'pro')
const showAlertsUpgrade = computed(() => overview.value?.planTier !== 'pro')

function usageLine(used: number, limit: number | null) {
  if (limit == null) return `${used} / ${t('alerts.unlimited')}`
  return `${used} / ${limit}`
}

function usageProgress(used: number, limit: number | null) {
  if (limit == null || limit <= 0) return undefined
  return used / limit
}
</script>

<template>
  <div class="space-y-8 md:space-y-10">
    <!-- Welcome: intentional hero strip + quick actions -->
    <div class="fba-surface-app-hero relative overflow-hidden p-6 md:p-8">
      <div
        class="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-3xl dark:bg-primary/20"
        aria-hidden="true"
      />
      <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-xl space-y-2">
          <p class="text-xs font-bold uppercase tracking-widest text-primary">
            {{ t('dashboard.titleHome') }}
          </p>
          <h1 class="text-2xl font-semibold tracking-tight text-highlighted md:text-3xl">
            {{ t('dashboard.welcomeTitle') }}
          </h1>
          <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
            {{ t('dashboard.welcomeBody') }}
          </p>
        </div>
        <div class="flex shrink-0 flex-wrap gap-3">
          <UButton to="/app/search" color="primary" size="lg" leading-icon="i-heroicons-magnifying-glass">
            {{ t('app.nav.search') }}
          </UButton>
          <UButton to="/app/alerts" color="neutral" variant="outline" size="lg" leading-icon="i-heroicons-bell">
            {{ t('app.nav.alerts') }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <FbaUsageLimitBanner
        kind="search"
        :show="Boolean(overview?.usage.searchQuotaExhausted)"
        :show-upgrade-cta="showSearchUpgrade"
      />
      <FbaUsageLimitBanner
        kind="activeAlerts"
        :show="Boolean(overview?.usage.activeAlertQuotaExhausted)"
        :show-upgrade-cta="showAlertsUpgrade"
      />
    </div>

    <!-- Plan + usage: grouped shell -->
    <div class="fba-surface-app-group rounded-2xl p-5 md:p-6">
      <p class="mb-5 text-xs font-bold uppercase tracking-widest text-dimmed md:mb-6">
        {{ t('dashboard.workspaceTitle') }}
      </p>
      <div class="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <FbaAppCard
          :class="
            planForBadge === 'pro'
              ? 'ring-2 ring-primary/25 dark:ring-primary/30'
              : ''
          "
        >
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="space-y-1.5">
              <p class="text-xs font-bold uppercase tracking-widest text-dimmed">
                {{ t('alerts.planCardTitle') }}
              </p>
              <div class="flex flex-wrap items-center gap-2.5">
                <p class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl">
                  {{ planLabel }}
                </p>
                <FbaPlanBadge :plan="planForBadge" />
              </div>
            </div>
            <UButton to="/pricing" color="neutral" variant="outline" size="sm" class="shrink-0">
              {{ t('nav.pricing') }}
            </UButton>
          </div>
        </FbaAppCard>

        <FbaAppCard>
          <div class="mb-4 space-y-1">
            <p class="text-xs font-bold uppercase tracking-widest text-dimmed">
              {{ t('alerts.usageCardTitle') }}
            </p>
            <p class="fba-muted-copy text-sm">
              {{ t('usage.resetsDailyUtc') }}
            </p>
          </div>
          <div class="-mx-1 divide-y divide-default/35 dark:divide-default/25">
            <FbaMetricRow
              :label="t('alerts.searchesLabel')"
              :value="usageLine(overview?.usage.searchesToday ?? 0, overview?.usage.searchesLimit ?? null)"
              :progress="usageProgress(overview?.usage.searchesToday ?? 0, overview?.usage.searchesLimit ?? null)"
            />
            <FbaMetricRow
              :label="t('alerts.activeAlertsLabel')"
              :value="usageLine(overview?.usage.activeAlertCount ?? 0, overview?.usage.activeAlertsLimit ?? null)"
              :progress="usageProgress(overview?.usage.activeAlertCount ?? 0, overview?.usage.activeAlertsLimit ?? null)"
            />
          </div>
        </FbaAppCard>
      </div>
    </div>

    <!-- Activity: alerts + matches in one framed group -->
    <div class="fba-surface-app-inset rounded-2xl p-5 md:p-6">
      <p class="mb-6 text-xs font-bold uppercase tracking-widest text-dimmed md:mb-7">
        {{ t('dashboard.activityShellTitle') }}
      </p>

      <div class="space-y-8 md:space-y-10">
        <div>
          <h2 class="mb-4 text-lg font-semibold tracking-tight text-highlighted md:mb-5 md:text-xl">
            {{ t('alerts.previewTitle') }}
          </h2>
          <FbaAppCard>
            <FbaEmptyState
              v-if="!(overview?.alertsPreview?.length)"
              icon="i-heroicons-bell"
              :title="t('dashboard.alertsEmptyTitle')"
              :description="t('dashboard.alertsEmptyBody')"
            >
              <template #action>
                <UButton to="/app/alerts?new=1" color="primary" size="sm">
                  {{ t('alerts.newAlert') }}
                </UButton>
              </template>
            </FbaEmptyState>
            <ul v-else class="space-y-2" role="list">
              <li v-for="a in overview?.alertsPreview" :key="a.id">
                <NuxtLink
                  class="fba-list-row fba-list-row--interactive flex min-w-0 flex-wrap items-center justify-between gap-3 px-4 py-3.5 text-left text-default no-underline hover:text-default focus-visible:outline-none"
                  :to="{ path: '/app/alerts', query: { edit: a.id } }"
                >
                  <div class="min-w-0">
                    <span class="font-mono text-sm font-semibold tabular-nums text-highlighted">
                      {{ a.origin_airport }}
                      <span class="mx-1 font-sans font-normal text-dimmed">→</span>
                      {{ a.destination_airport }}
                    </span>
                    <span class="fba-muted-copy mt-0.5 block text-sm sm:mt-0 sm:ml-3 sm:inline">
                      {{ formatMediumDate(a.outbound_date_start) }}
                    </span>
                  </div>
                  <UBadge color="success" variant="subtle" class="shrink-0 font-medium">
                    {{ t('alerts.statusActive') }}
                  </UBadge>
                </NuxtLink>
              </li>
              <li class="pt-1">
                <UButton to="/app/alerts" variant="link" color="primary" class="px-0 font-semibold">
                  {{ t('alerts.manageAll') }}
                </UButton>
              </li>
            </ul>
          </FbaAppCard>
        </div>

        <div>
          <h2 class="mb-4 text-lg font-semibold tracking-tight text-highlighted md:mb-5 md:text-xl">
            {{ t('alerts.recentMatchesTitle') }}
          </h2>
          <FbaAppCard>
            <FbaEmptyState
              icon="i-heroicons-inbox"
              :title="t('dashboard.recentMatchesEmptyTitle')"
              :description="t('dashboard.recentMatchesEmptyBody')"
            >
              <template #action>
                <UButton to="/app/alerts" color="neutral" variant="outline" size="sm">
                  {{ t('app.nav.alerts') }}
                </UButton>
                <UButton to="/app/search" color="primary" size="sm">
                  {{ t('app.nav.search') }}
                </UButton>
              </template>
            </FbaEmptyState>
          </FbaAppCard>
        </div>
      </div>
    </div>
  </div>
</template>
