<script setup lang="ts">
import { $fetch } from 'ofetch'
import {
  computed,
  definePageMeta,
  navigateTo,
  onMounted,
  ref,
  useHead,
  useRoute,
  useRuntimeConfig,
  useSeoMeta,
  useToast,
  useSupabaseUser,
  useT,
} from '#imports'
import { fbaMarketingAccordionUi } from '~lib/fbaMarketingUi'
import { messages } from '~lib/i18n'
import type { Locale } from '~lib/i18n/locales'
import { buildFaqPageJsonLd } from '~lib/seo/faq-jsonld'
import { absoluteUrlForLocale } from '~lib/seo/locale-urls'

definePageMeta({
  layout: 'marketing',
})

const { t, locale } = useT()
const localePath = useLocalePath()
const route = useRoute()
const config = useRuntimeConfig()
const siteUrl = computed(() => String(config.public.appUrl ?? '').replace(/\/$/, '') || '')
const toast = useToast()
const user = useSupabaseUser()

const billingEnabled = computed(() => Boolean(config.public.billingEnabled))
const isLoggedIn = computed(() => Boolean(user.value?.sub))

const freePlan = computed(() => messages[locale.value as Locale].pricing.plans.free)
const proPlan = computed(() => messages[locale.value as Locale].pricing.plans.pro)

useMarketingLocaleSeo('/pricing')

const checkoutLoading = ref(false)

const pFaqItems = computed(() => [
  { label: t('pricing.pFaq1q'), content: t('pricing.pFaq1a') },
  { label: t('pricing.pFaq2q'), content: t('pricing.pFaq2a') },
  { label: t('pricing.pFaq3q'), content: t('pricing.pFaq3a') },
])

const displayTitle = useSeoDisplayTitle('seo.pageTitle.pricing')

const pricingFaqJsonLd = computed(() =>
  buildFaqPageJsonLd(
    pFaqItems.value.map((item) => ({ question: item.label, answer: item.content })),
  ),
)

const heroTrustItems = computed(() => [
  t('pricing.billingPoint1'),
  t('pricing.billingPoint2'),
  t('pricing.billingPoint3'),
])

const billingHighlights = computed(() => [
  { icon: 'i-lucide:credit-card-off', text: t('pricing.billingPoint1') },
  { icon: 'i-lucide:shield-check', text: t('pricing.billingPoint2') },
  { icon: 'i-lucide:door-open', text: t('pricing.billingPoint3') },
])

async function startProCheckout() {
  if (!isLoggedIn.value) return
  checkoutLoading.value = true
  try {
    const res = await $fetch<{ url: string }>('/api/billing/checkout', { method: 'POST' })
    await navigateTo(res.url, { external: true })
  } catch (err: unknown) {
    const e = err as { statusCode?: number }
    if (e?.statusCode === 409) {
      toast.add({
        title: t('pricing.alreadySubscribedTitle'),
        description: t('pricing.alreadySubscribedBody'),
        color: 'warning',
      })
    } else {
      toast.add({ title: t('pricing.checkoutError'), color: 'error' })
    }
  } finally {
    checkoutLoading.value = false
  }
}

onMounted(() => {
  if (route.query.checkout === 'cancel') {
    toast.add({ title: t('pricing.checkoutCancelToast'), color: 'neutral' })
    const q = { ...route.query }
    delete q.checkout
    void navigateTo({ path: localePath('/pricing'), query: q, replace: true })
  }
})

useSeoMeta({
  title: () => t('seo.pageTitle.pricing'),
  ogTitle: () => displayTitle.value,
  description: () => t('seo.pageDescription.pricing'),
  ogDescription: () => t('seo.pageDescription.pricing'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => displayTitle.value,
  twitterDescription: () => t('seo.pageDescription.pricing'),
  ogSiteName: () => t('common.appName'),
  ogUrl: () =>
    siteUrl.value
      ? absoluteUrlForLocale(siteUrl.value, locale.value as Locale, '/pricing')
      : undefined,
})

useHead(() => ({
  script: [
    {
      key: 'fba-pricing-faq-jsonld',
      type: 'application/ld+json',
      innerHTML: pricingFaqJsonLd.value,
    },
  ],
}))
</script>

<template>
  <UPage>
    <div
      class="fba-page-header-band fba-marketing-divider-b -mx-4 mb-2 border-b sm:-mx-6 lg:-mx-8"
    >
      <UPageHeader
        class="px-4 sm:px-6 lg:px-8"
        :headline="t('pricing.kicker')"
        :title="t('pricing.title')"
        :description="t('pricing.intro')"
      />
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 pb-2 text-xs font-medium text-muted sm:px-6 lg:px-8"
        role="presentation"
      >
        <template v-for="(item, i) in heroTrustItems" :key="i">
          <span v-if="i > 0" class="hidden text-dimmed sm:inline" aria-hidden="true">·</span>
          <span class="inline-flex items-center gap-1.5 rounded-full border border-default/40 bg-default/40 px-2.5 py-1 text-[0.7rem] uppercase tracking-wide text-dimmed dark:border-default/35 dark:bg-elevated/30">
            <UIcon
              :name="i === 0 ? 'i-lucide:sparkles' : i === 1 ? 'i-lucide:lock' : 'i-lucide:check'"
              class="size-3.5 shrink-0 text-primary/80"
              aria-hidden="true"
            />
            {{ item }}
          </span>
        </template>
      </div>
    </div>

    <FbaSection
      :title="t('pricing.pickPlanTitle')"
      :description="t('pricing.pickPlanDesc')"
    >
      <div class="grid gap-6 lg:grid-cols-2 lg:items-stretch lg:gap-8">
        <FbaAppCard class="fba-pricing-card-free flex h-full flex-col" variant="outline">
          <template #header>
            <div class="flex flex-col gap-3 border-b border-default/35 pb-4 dark:border-default/25">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-lg font-semibold tracking-tight text-highlighted">
                  {{ freePlan.name }}
                </p>
                <FbaPlanBadge plan="free" />
              </div>
              <div>
                <p class="flex items-baseline gap-2">
                  <span class="text-4xl font-bold tracking-tight tabular-nums text-highlighted">
                    {{ freePlan.price }}
                  </span>
                </p>
                <p class="mt-1 text-sm text-muted">
                  {{ freePlan.period }}
                </p>
              </div>
            </div>
          </template>

          <ul class="flex flex-1 flex-col gap-2.5 pt-1">
            <li
              v-for="(line, i) in freePlan.features"
              :key="i"
              class="flex gap-3 text-sm leading-snug text-muted"
            >
              <UIcon
                name="i-lucide:check"
                class="mt-0.5 size-4 shrink-0 text-dimmed"
                aria-hidden="true"
              />
              <span>{{ line }}</span>
            </li>
          </ul>

          <template #footer>
            <div class="space-y-3 border-t border-default/35 pt-4 dark:border-default/25">
              <div
                v-if="isLoggedIn"
                class="fba-inset-well rounded-xl px-4 py-3.5 text-center"
              >
                <p class="text-sm font-medium text-highlighted">
                  {{ t('pricing.ctaCurrentFree') }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-dimmed">
                  {{ billingEnabled ? t('pricing.freePlanUpgradeHint') : t('pricing.freePlanUpgradeHintBillingOff') }}
                </p>
              </div>
              <UButton v-else :to="localePath('/signup')" block color="neutral" variant="outline" size="lg">
                {{ t('pricing.ctaGetStartedFree') }}
              </UButton>
            </div>
          </template>
        </FbaAppCard>

        <div id="pricing-pro" class="scroll-mt-10 lg:flex lg:flex-col">
          <div
            class="relative flex flex-1 flex-col rounded-[var(--fba-radius-card)] p-px ring-2 ring-primary/35 ring-offset-2 ring-offset-default dark:ring-primary/40 dark:ring-offset-[var(--ui-color-neutral-950)]"
          >
            <span
              class="pointer-events-none absolute inset-x-6 top-0 z-10 h-0.5 rounded-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-90"
              aria-hidden="true"
            />
            <FbaAppCard
              class="fba-pricing-card-pro flex h-full min-h-0 flex-1 flex-col !shadow-none ring-0"
              variant="outline"
            >
              <template #header>
                <div class="flex flex-col gap-3 border-b border-primary/15 pb-4 dark:border-primary/20">
                  <UBadge color="primary" variant="subtle" size="sm" class="w-fit font-semibold">
                    {{ t('pricing.badgePopular') }}
                  </UBadge>
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-lg font-semibold tracking-tight text-highlighted">
                      {{ proPlan.name }}
                    </p>
                    <FbaPlanBadge plan="pro" />
                  </div>
                  <div>
                    <p class="flex items-baseline gap-2">
                      <span class="text-4xl font-bold tracking-tight tabular-nums text-highlighted">
                        {{ proPlan.price }}
                      </span>
                      <span class="text-sm font-medium text-muted">{{ proPlan.period }}</span>
                    </p>
                  </div>
                </div>
              </template>

              <ul class="flex flex-1 flex-col gap-2.5 pt-1">
                <li
                  v-for="(line, i) in proPlan.features"
                  :key="i"
                  class="flex gap-3 text-sm leading-snug text-default"
                >
                  <UIcon
                    name="i-lucide:check"
                    class="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{{ line }}</span>
                </li>
              </ul>

              <template #footer>
                <div class="space-y-3 border-t border-primary/15 pt-4 dark:border-primary/20">
                  <template v-if="billingEnabled">
                    <UButton v-if="!isLoggedIn" :to="localePath('/login')" block color="primary" size="lg">
                      {{ t('pricing.ctaUpgradeLogin') }}
                    </UButton>
                    <UButton
                      v-else
                      block
                      color="primary"
                      size="lg"
                      :loading="checkoutLoading"
                      @click="startProCheckout"
                    >
                      {{ t('pricing.ctaUpgrade') }}
                    </UButton>
                    <p class="text-center text-[0.7rem] font-medium uppercase tracking-wide text-dimmed">
                      {{ t('pricing.proCtaNote') }}
                    </p>
                  </template>
                  <template v-else>
                    <UButton
                      v-if="!isLoggedIn"
                      :to="localePath('/signup')"
                      block
                      color="primary"
                      size="lg"
                    >
                      {{ t('pricing.ctaProStart') }}
                    </UButton>
                    <UButton
                      v-else
                      :to="localePath('/app/account')"
                      block
                      color="primary"
                      size="lg"
                      variant="soft"
                    >
                      {{ t('pricing.ctaOpenAccount') }}
                    </UButton>
                    <p class="text-center text-xs leading-relaxed text-dimmed">
                      {{
                        isLoggedIn
                          ? t('pricing.ctaProBillingOffNoteSignedIn')
                          : t('pricing.ctaProBillingOffNoteGuest')
                      }}
                    </p>
                  </template>
                </div>
              </template>
            </FbaAppCard>
          </div>
        </div>
      </div>
    </FbaSection>

    <FbaSection
      :title="t('pricing.compareTitle')"
      :description="t('pricing.compareSubtitle')"
    >
      <div class="fba-pricing-compare-shell overflow-x-auto rounded-2xl">
        <table class="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr class="text-left">
              <th
                class="px-4 py-4 text-xs font-bold uppercase tracking-wider text-dimmed md:px-6"
              >
                {{ t('pricing.compareColFeature') }}
              </th>
              <th
                class="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-dimmed md:px-6"
              >
                {{ t('pricing.compareColFree') }}
              </th>
              <th
                class="fba-pricing-col-pro px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-primary md:px-6"
              >
                {{ t('pricing.compareColPro') }}
              </th>
            </tr>
          </thead>
          <tbody class="text-muted">
            <tr class="fba-table-row">
              <td class="px-4 py-3.5 font-medium text-highlighted md:px-6 md:py-4">
                {{ t('pricing.compareSearches') }}
              </td>
              <td
                class="px-4 py-3.5 text-center tabular-nums text-default md:px-6 md:py-4"
              >
                {{ t('pricing.compareSearchesFree') }}
              </td>
              <td
                class="fba-pricing-col-pro px-4 py-3.5 text-center text-base font-semibold tabular-nums text-highlighted md:px-6 md:py-4"
              >
                {{ t('pricing.compareSearchesPro') }}
              </td>
            </tr>
            <tr class="fba-table-row">
              <td class="px-4 py-3.5 font-medium text-highlighted md:px-6 md:py-4">
                {{ t('pricing.compareAlerts') }}
              </td>
              <td class="px-4 py-3.5 text-center tabular-nums text-default md:px-6 md:py-4">
                {{ t('pricing.compareAlertsFree') }}
              </td>
              <td
                class="fba-pricing-col-pro px-4 py-3.5 text-center text-base font-semibold tabular-nums text-highlighted md:px-6 md:py-4"
              >
                {{ t('pricing.compareAlertsPro') }}
              </td>
            </tr>
            <tr class="fba-table-row">
              <td class="px-4 py-3.5 font-medium text-highlighted md:px-6 md:py-4">
                {{ t('pricing.compareCadence') }}
              </td>
              <td class="px-4 py-3.5 text-center text-default md:px-6 md:py-4">
                {{ t('pricing.compareCadenceFree') }}
              </td>
              <td
                class="fba-pricing-col-pro px-4 py-3.5 text-center font-medium text-default md:px-6 md:py-4"
              >
                {{ t('pricing.compareCadencePro') }}
              </td>
            </tr>
            <tr class="fba-table-row">
              <td class="px-4 py-3.5 font-medium text-highlighted md:px-6 md:py-4">
                {{ t('pricing.compareEmail') }}
              </td>
              <td class="px-4 py-3.5 md:px-6 md:py-4">
                <span
                  class="flex items-center justify-center gap-2 text-center text-sm text-default"
                >
                  <UIcon name="i-lucide:check" class="size-4 shrink-0 text-success" aria-hidden="true" />
                  {{ t('pricing.compareEmailBoth') }}
                </span>
              </td>
              <td class="fba-pricing-col-pro px-4 py-3.5 md:px-6 md:py-4">
                <span
                  class="flex items-center justify-center gap-2 text-center text-sm font-medium text-highlighted"
                >
                  <UIcon name="i-lucide:check" class="size-4 shrink-0 text-primary" aria-hidden="true" />
                  {{ t('pricing.compareEmailBoth') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-4 max-w-3xl text-xs leading-relaxed text-dimmed">
        {{ t('pricing.compareFootnote') }}
      </p>
    </FbaSection>

    <FbaSection class="!py-8 md:!py-10" :title="t('pricing.ctaSectionTitle')">
      <div class="space-y-6">
        <p class="max-w-2xl text-sm leading-relaxed text-muted md:text-[0.9375rem]">
          {{ t('pricing.ctaSectionBody') }}
        </p>
        <div
          class="grid gap-3 sm:grid-cols-3 sm:gap-4"
        >
          <div
            v-for="(row, i) in billingHighlights"
            :key="i"
            class="fba-list-row flex gap-3 p-4"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15"
            >
              <UIcon :name="row.icon" class="size-5" aria-hidden="true" />
            </div>
            <p class="text-sm font-medium leading-snug text-highlighted">
              {{ row.text }}
            </p>
          </div>
        </div>
      </div>
    </FbaSection>

    <FbaSection
      section-id="pricing-faq"
      class="scroll-mt-24"
      :title="t('pricing.faqTitle')"
      :description="t('pricing.faqSubtitle')"
    >
      <UAccordion type="multiple" :items="pFaqItems" :ui="fbaMarketingAccordionUi" />
    </FbaSection>
  </UPage>
</template>
