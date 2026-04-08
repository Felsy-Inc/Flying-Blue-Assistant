<script setup lang="ts">
defineProps<{
  mode: 'search' | 'alerts'
}>()

const { t } = useT()
</script>

<template>
  <figure
    class="pointer-events-none select-none"
    :aria-label="mode === 'search' ? t('home.mock.searchAria') : t('home.mock.alertsAria')"
    role="img"
  >
    <div
      class="fba-mock-window overflow-hidden transition-transform duration-500"
    >
      <div class="fba-mock-chrome">
        <span class="flex gap-1" aria-hidden="true">
          <span class="size-2.5 rounded-full bg-red-400/80" />
          <span class="size-2.5 rounded-full bg-amber-400/80" />
          <span class="size-2.5 rounded-full bg-emerald-400/80" />
        </span>
        <span class="fba-mock-url-bar truncate text-center">
          {{ mode === 'search' ? t('home.mock.urlSearch') : t('home.mock.urlAlerts') }}
        </span>
      </div>

      <div v-if="mode === 'search'" class="space-y-3 p-3 sm:p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-dimmed">
            {{ t('home.mock.panelSearch') }}
          </p>
          <span
            class="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400"
          >
            {{ t('home.mock.badgeDemo') }}
          </span>
        </div>

        <div class="grid gap-2 sm:grid-cols-2">
          <div class="fba-mock-cell">
            <p class="text-[10px] font-medium text-dimmed">{{ t('home.mock.from') }}</p>
            <p class="text-sm font-semibold tabular-nums text-highlighted">AMS</p>
          </div>
          <div class="fba-mock-cell">
            <p class="text-[10px] font-medium text-dimmed">{{ t('home.mock.to') }}</p>
            <p class="text-sm font-semibold tabular-nums text-highlighted">JFK</p>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <span class="fba-mock-chip fba-muted-copy">
            {{ t('home.mock.dateOut') }}
          </span>
          <span class="fba-mock-chip fba-muted-copy">
            {{ t('home.mock.dateIn') }}
          </span>
          <span class="fba-mock-chip-primary">
            {{ t('home.mock.cabinBiz') }}
          </span>
        </div>

        <div class="fba-mock-divider flex justify-end pt-2">
          <span
            class="rounded-lg bg-primary px-3 py-1.5 text-[11px] font-semibold text-white shadow-sm"
          >
            {{ t('home.mock.searchCta') }}
          </span>
        </div>

        <div class="fba-mock-divider space-y-1.5 pt-3">
          <p class="text-[10px] font-semibold uppercase tracking-wider text-dimmed">
            {{ t('home.mock.results') }}
          </p>
          <div class="fba-mock-list-row">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-highlighted">
                {{ t('home.mock.row1Route') }}
              </p>
              <p class="fba-muted-copy text-[10px]">{{ t('home.mock.row1Sub') }}</p>
            </div>
            <p class="shrink-0 text-xs font-bold tabular-nums text-primary">
              {{ t('home.mock.row1Miles') }}
            </p>
          </div>
          <div class="fba-mock-list-row-dashed">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-highlighted">
                {{ t('home.mock.row2Route') }}
              </p>
              <p class="fba-muted-copy text-[10px]">{{ t('home.mock.row2Sub') }}</p>
            </div>
            <p class="shrink-0 text-xs font-bold tabular-nums text-highlighted">
              {{ t('home.mock.row2Miles') }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="space-y-3 p-3 sm:p-4">
        <div class="flex items-center justify-between gap-2">
          <p class="text-[11px] font-semibold uppercase tracking-wider text-dimmed">
            {{ t('home.mock.panelAlerts') }}
          </p>
          <span class="fba-muted-copy text-[10px]">{{ t('home.mock.alertsSub') }}</span>
        </div>

        <div class="space-y-2">
          <div class="fba-mock-alert-row">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-highlighted">
                {{ t('home.mock.alert1Route') }}
              </p>
              <p class="fba-muted-copy text-[10px]">{{ t('home.mock.alert1Dates') }}</p>
            </div>
            <span
              class="shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400"
            >
              {{ t('home.mock.statusOn') }}
            </span>
          </div>
          <div class="fba-mock-alert-row-dashed">
            <div class="min-w-0">
              <p class="truncate text-xs font-semibold text-highlighted">
                {{ t('home.mock.alert2Route') }}
              </p>
              <p class="fba-muted-copy text-[10px]">{{ t('home.mock.alert2Dates') }}</p>
            </div>
            <span
              class="fba-mock-chip fba-muted-copy shrink-0 px-1.5 py-0.5 text-[10px] font-medium"
            >
              {{ t('home.mock.statusPaused') }}
            </span>
          </div>
        </div>

        <p class="fba-mock-divider fba-muted-copy pt-2 text-[10px] leading-relaxed">
          {{ t('home.mock.alertFoot') }}
        </p>
      </div>
    </div>
  </figure>
</template>
