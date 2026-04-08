<script setup lang="ts">
const props = defineProps<{
  /** Which quota hit (controls copy). */
  kind: 'search' | 'activeAlerts'
  /** Show warning styling + upgrade CTA. */
  show: boolean
  /** When true, show upgrade button (typically free tier). */
  showUpgradeCta: boolean
}>()

const { t } = useT()
</script>

<template>
  <UAlert
    v-if="show"
    color="warning"
    variant="subtle"
    icon="i-heroicons-exclamation-triangle"
    class="rounded-2xl border border-amber-500/25 shadow-sm ring-1 ring-amber-500/10 dark:border-amber-400/20 dark:ring-amber-400/15"
    :title="kind === 'search' ? t('usage.bannerSearchTitle') : t('usage.bannerAlertsTitle')"
    :description="kind === 'search' ? t('usage.bannerSearchBody') : t('usage.bannerAlertsBody')"
    :ui="{ root: 'text-start' }"
  >
    <template v-if="showUpgradeCta" #actions>
      <UButton to="/pricing" color="primary" size="sm" variant="solid">
        {{ t('usage.upgradeCta') }}
      </UButton>
    </template>
  </UAlert>
</template>
