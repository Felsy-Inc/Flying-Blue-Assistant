<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'app',
  i18n: false,
})

const { t, locale } = useT()
const localePath = useLocalePath()
const route = useRoute()
const toast = useToast()
const config = useRuntimeConfig()
const { userEmail, configured, signOut } = useAuth()
const { data: overview, refresh } = useAppOverview()

const billingEnabled = computed(() => Boolean(config.public.billingEnabled))
const planForBadge = computed<'free' | 'pro'>(() =>
  overview.value?.planTier === 'pro' ? 'pro' : 'free',
)

const portalLoading = ref(false)
const signingOut = ref(false)

const subscriptionStatus = computed(() => overview.value?.billing.subscriptionStatus ?? 'inactive')
const statusTone = computed<'neutral' | 'success' | 'warning'>(() => {
  if (subscriptionStatus.value === 'active' || subscriptionStatus.value === 'trialing') return 'success'
  if (subscriptionStatus.value === 'past_due' || subscriptionStatus.value === 'unpaid') return 'warning'
  return 'neutral'
})
const statusLabel = computed(() => t(`dashboard.subscriptionStatusValues.${subscriptionStatus.value}`))

function formatEndDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(new Date(iso))
  } catch {
    return iso
  }
}

onMounted(() => {
  void (async () => {
    if (route.query.checkout !== 'success') return

    const rawSid = route.query.session_id
    const sessionId = Array.isArray(rawSid) ? rawSid[0] : rawSid
    if (typeof sessionId === 'string' && sessionId.length > 0) {
      try {
        await $fetch('/api/billing/sync-checkout', { method: 'POST', body: { sessionId } })
      } catch {
        toast.add({ title: t('dashboard.checkoutSyncError'), color: 'error' })
      }
    }

    await refresh()
    toast.add({ title: t('dashboard.checkoutSuccessToast'), color: 'success' })
    void navigateTo(localePath('/app/account'), { replace: true })
  })()
})

async function openBillingPortal() {
  portalLoading.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/billing/portal', { method: 'POST' })
    await navigateTo(res.url, { external: true })
  } catch {
    toast.add({ title: t('pricing.portalError'), color: 'error' })
  } finally {
    portalLoading.value = false
  }
}

async function onSignOut() {
  if (!configured.value) return
  signingOut.value = true
  try {
    await signOut()
  } finally {
    signingOut.value = false
  }
}

const displayTitle = useSeoDisplayTitle('seo.pageTitle.appAccount')

useSeoMeta({
  title: () => t('seo.pageTitle.appAccount'),
  ogTitle: () => displayTitle.value,
  description: () => t('seo.pageDescription.appAccount'),
  ogDescription: () => t('seo.pageDescription.appAccount'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => displayTitle.value,
  twitterDescription: () => t('seo.pageDescription.appAccount'),
  ogSiteName: () => t('common.appName'),
})
</script>

<template>
  <div class="space-y-6">
    <FbaSection variant="app">
      <div class="flex flex-wrap items-center gap-3">
        <h2 class="text-base font-semibold text-highlighted">
          {{ t('dashboard.accountEmptyTitle') }}
        </h2>
        <FbaPlanBadge :plan="planForBadge" />
      </div>
      <p class="mt-2 max-w-xl text-sm text-muted">
        {{ t('dashboard.accountEmptyBody') }}
      </p>
    </FbaSection>

    <FbaAppCard v-if="overview">
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-highlighted">
          {{ t('dashboard.planSectionTitle') }}
        </h3>
        <dl class="grid gap-2 text-sm">
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-muted">
              {{ t('alerts.planCardTitle') }}
            </dt>
            <dd class="font-medium text-highlighted">
              {{ planForBadge === 'pro' ? t('alerts.planPro') : t('alerts.planFree') }}
            </dd>
          </div>
          <div class="flex flex-wrap justify-between gap-2">
            <dt class="text-muted">
              {{ t('dashboard.subscriptionLabel') }}
            </dt>
            <dd class="flex items-center gap-2">
              <UBadge :color="statusTone" variant="subtle" class="capitalize">
                {{ statusLabel }}
              </UBadge>
            </dd>
          </div>
        </dl>
        <UAlert
          v-if="!billingEnabled"
          color="neutral"
          variant="subtle"
          class="text-sm"
          :title="t('dashboard.billingDisabledTitle')"
          :description="t('dashboard.billingDisabledBody')"
        />
        <UAlert
          v-if="overview.billing.proPriceMismatch"
          color="warning"
          variant="subtle"
          class="text-sm"
          :title="t('dashboard.proPriceMismatchTitle')"
          :description="t('dashboard.proPriceMismatchBody')"
        />
        <p
          v-if="overview.billing.currentPeriodEnd && planForBadge === 'pro'"
          class="text-sm text-muted"
        >
          {{ t('dashboard.renewsOn', { date: formatEndDate(overview.billing.currentPeriodEnd) }) }}
        </p>
        <p
          v-if="overview.billing.cancelAtPeriodEnd && planForBadge === 'pro'"
          class="text-sm text-muted"
        >
          {{ t('dashboard.cancelAtPeriodEnd') }}
        </p>
        <div class="flex flex-wrap gap-2 pt-1">
          <UButton v-if="billingEnabled && planForBadge === 'free'" :to="localePath('/pricing')" color="primary" size="lg">
            {{ t('pricing.ctaUpgrade') }}
          </UButton>
          <UButton
            v-if="billingEnabled && overview.billing.hasStripeCustomer"
            variant="outline"
            color="neutral"
            size="lg"
            :loading="portalLoading"
            @click="openBillingPortal"
          >
            {{ t('dashboard.manageBilling') }}
          </UButton>
        </div>
      </div>
    </FbaAppCard>

    <FbaAppCard>
      <div class="space-y-4">
        <div v-if="userEmail" class="fba-inset-well rounded-xl p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-dimmed">
            {{ t('dashboard.accountSignedInAs') }}
          </p>
          <p class="mt-1 font-mono text-sm text-highlighted">
            {{ userEmail }}
          </p>
        </div>

        <p class="text-sm text-muted">
          {{ t('dashboard.accountWorkspaceHint') }}
        </p>

        <UButton
          v-if="configured"
          color="error"
          variant="soft"
          size="lg"
          block
          :loading="signingOut"
          @click="onSignOut"
        >
          {{ t('dashboard.accountSignOut') }}
        </UButton>
      </div>
    </FbaAppCard>
  </div>
</template>
