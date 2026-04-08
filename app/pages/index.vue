<script setup lang="ts">
import { computed } from 'vue'
import { fbaMarketingAccordionUi } from '~lib/fbaMarketingUi'

definePageMeta({
  layout: 'marketing',
})

const { t } = useT()
const config = useRuntimeConfig()
const siteUrl = computed(() => String(config.public.appUrl ?? '').replace(/\/$/, '') || '')

const heroLinks = computed(() => [
  {
    label: t('home.ctaBrowse'),
    to: '/app/search',
    color: 'primary' as const,
    size: 'xl' as const,
  },
  {
    label: t('home.ctaPricing'),
    to: '/pricing',
    color: 'neutral' as const,
    variant: 'outline' as const,
    size: 'xl' as const,
  },
])

const midLinks = computed(() => [
  { label: t('home.ctaMidPrimary'), to: '/app/search', color: 'primary' as const, size: 'lg' as const },
  {
    label: t('home.ctaMidSecondary'),
    to: '/pricing',
    color: 'neutral' as const,
    variant: 'outline' as const,
    size: 'lg' as const,
  },
])

const bottomLinks = computed(() => [
  { label: t('home.ctaBottomPrimary'), to: '/pricing', color: 'primary' as const, size: 'lg' as const },
])

const howSteps = computed(() => [
  {
    icon: 'i-lucide:search',
    title: t('home.howStep1Title'),
    body: t('home.howStep1Body'),
  },
  {
    icon: 'i-lucide:bell',
    title: t('home.howStep2Title'),
    body: t('home.howStep2Body'),
  },
  {
    icon: 'i-lucide:mail',
    title: t('home.howStep3Title'),
    body: t('home.howStep3Body'),
  },
])

const valueProps = computed(() => [
  { icon: 'i-lucide:plane', title: t('home.prop1Title'), body: t('home.prop1Body') },
  { icon: 'i-lucide:shield-check', title: t('home.prop2Title'), body: t('home.prop2Body') },
  { icon: 'i-lucide:sliders-horizontal', title: t('home.prop3Title'), body: t('home.prop3Body') },
  { icon: 'i-lucide:globe-2', title: t('home.prop4Title'), body: t('home.prop4Body') },
])

const trustItems = computed(() => [
  { icon: 'i-lucide:shield-off', title: t('home.trust1Title'), body: t('home.trust1Body') },
  { icon: 'i-lucide:map-pin', title: t('home.trust2Title'), body: t('home.trust2Body') },
  { icon: 'i-lucide:eye', title: t('home.trust3Title'), body: t('home.trust3Body') },
  { icon: 'i-lucide:focus', title: t('home.trust4Title'), body: t('home.trust4Body') },
])

const useCases = computed(() => [
  { badge: t('home.case1Badge'), title: t('home.case1Title'), body: t('home.case1Body') },
  { badge: t('home.case2Badge'), title: t('home.case2Title'), body: t('home.case2Body') },
  { badge: t('home.case3Badge'), title: t('home.case3Title'), body: t('home.case3Body') },
])

const faqItems = computed(() => [
  { label: t('home.faq1q'), content: t('home.faq1a') },
  { label: t('home.faq2q'), content: t('home.faq2a') },
  { label: t('home.faq3q'), content: t('home.faq3a') },
  { label: t('home.faq4q'), content: t('home.faq4a') },
  { label: t('home.faq5q'), content: t('home.faq5a') },
  { label: t('home.faq6q'), content: t('home.faq6a') },
])

const jsonLd = computed(() =>
  JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('common.appName'),
    applicationCategory: 'TravelApplication',
    operatingSystem: 'Web',
    description: t('seo.defaultDescription'),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    ...(siteUrl.value ? { url: siteUrl.value } : {}),
  }),
)

useSeoMeta({
  title: () => t('seo.pageTitle.home'),
  ogTitle: () => t('seo.pageTitle.home'),
  description: () => t('seo.pageDescription.home'),
  ogDescription: () => t('seo.pageDescription.home'),
  ogType: 'website',
  twitterCard: 'summary_large_image',
  ogSiteName: () => t('common.appName'),
})

useHead(() => ({
  link: siteUrl.value ? [{ rel: 'canonical', href: `${siteUrl.value}/` }] : [],
  script: [
    {
      key: 'fba-software-jsonld',
      type: 'application/ld+json',
      innerHTML: jsonLd.value,
    },
  ],
}))
</script>

<template>
  <UPage>
    <!-- Custom hero: split layout + product mock (less generic than UPageHero) -->
    <div class="fba-hero-backdrop">
      <FbaPageContainer class="relative pt-10 pb-12 md:pt-14 md:pb-20">
        <div class="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-14">
          <div class="space-y-8">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge color="primary" variant="subtle" class="font-semibold tracking-tight">
                {{ t('home.kicker') }}
              </UBadge>
              <UBadge color="neutral" variant="outline">
                {{ t('home.heroTopic') }}
              </UBadge>
            </div>

            <div class="space-y-5">
              <h1
                class="fba-display text-4xl tracking-tight text-highlighted sm:text-5xl lg:text-[2.65rem] lg:leading-[1.08]"
              >
                <span class="block text-balance">{{ t('home.heroTitleTop') }}</span>
                <span class="mt-1 block text-balance text-primary">{{ t('home.heroTitleAccent') }}</span>
                <span class="mt-1 block text-balance text-default">{{ t('home.heroTitleBottom') }}</span>
              </h1>
              <p class="fba-muted-copy max-w-xl text-base leading-relaxed md:text-lg">
                {{ t('home.subtitle') }}
              </p>
            </div>

            <div class="flex flex-wrap gap-3">
              <UButton v-for="(link, i) in heroLinks" :key="i" v-bind="link" />
            </div>

            <p
              class="fba-muted-copy max-w-xl border-l-2 border-primary/35 pl-4 text-sm leading-relaxed"
            >
              {{ t('home.heroTrust') }}
            </p>
          </div>

          <div class="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
            <HomeProductMockup mode="search" />
          </div>
        </div>
      </FbaPageContainer>
    </div>

    <div class="fba-marketing-content border-t border-default/50">
      <FbaPageContainer class="space-y-4 pb-6 pt-4 md:space-y-6 md:pb-8 md:pt-6">
        <!-- Trust -->
        <section
          class="fba-landing-section-slab px-5 py-8 md:px-8 md:py-10"
          aria-labelledby="home-trust-heading"
        >
          <div class="mb-8 max-w-2xl space-y-2">
            <h2
              id="home-trust-heading"
              class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
            >
              {{ t('home.trustTitle') }}
            </h2>
            <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
              {{ t('home.trustSubtitle') }}
            </p>
          </div>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div v-for="(item, i) in trustItems" :key="i" class="fba-mkt-tile">
              <div class="fba-icon-well mb-3 size-10">
                <UIcon :name="item.icon" class="size-5" aria-hidden="true" />
              </div>
              <h3 class="text-sm font-semibold text-highlighted">
                {{ item.title }}
              </h3>
              <p class="fba-muted-copy mt-2 text-xs leading-relaxed sm:text-sm">
                {{ item.body }}
              </p>
            </div>
          </div>
        </section>

        <div class="fba-mkt-rule" aria-hidden="true" />

        <!-- How it works -->
        <section class="py-6 md:py-10" aria-labelledby="home-how-heading">
          <div class="mb-8 max-w-2xl space-y-2">
            <h2
              id="home-how-heading"
              class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
            >
              {{ t('home.howTitle') }}
            </h2>
            <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
              {{ t('home.howSubtitle') }}
            </p>
          </div>
          <div class="grid gap-6 md:grid-cols-3">
            <div v-for="(step, i) in howSteps" :key="i" class="fba-mkt-step-card relative">
              <span class="fba-orbit-step mb-4 size-8" aria-hidden="true">
                {{ i + 1 }}
              </span>
              <div class="fba-icon-well mb-4 size-12">
                <UIcon :name="step.icon" class="size-5" />
              </div>
              <h3 class="text-base font-semibold tracking-tight text-highlighted">
                {{ step.title }}
              </h3>
              <p class="fba-muted-copy mt-2 text-sm leading-relaxed md:text-[0.9375rem]">
                {{ step.body }}
              </p>
            </div>
          </div>
        </section>

        <div class="fba-mkt-rule" aria-hidden="true" />

        <!-- Highlights: bento-style grid -->
        <section class="py-6 md:py-10" aria-labelledby="home-props-heading">
          <div class="mb-8 max-w-2xl space-y-2">
            <h2
              id="home-props-heading"
              class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
            >
              {{ t('home.propsTitle') }}
            </h2>
            <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
              {{ t('home.propsSubtitle') }}
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-2 md:grid-rows-2">
            <div
              class="fba-landing-bento md:row-span-2 md:flex md:min-h-[280px] md:flex-col md:justify-between p-6 md:p-8"
            >
              <div>
                <UIcon
                  :name="valueProps[0]!.icon"
                  class="mb-4 size-6 text-primary"
                  aria-hidden="true"
                />
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ valueProps[0]!.title }}
                </h3>
                <p class="fba-muted-copy mt-3 max-w-md text-sm leading-relaxed md:text-base">
                  {{ valueProps[0]!.body }}
                </p>
              </div>
              <UBadge color="neutral" variant="subtle" class="mt-6 w-fit md:mt-0">
                {{ t('home.heroTopic') }}
              </UBadge>
            </div>
            <div v-for="(p, i) in valueProps.slice(1)" :key="i" class="fba-mkt-prop-row">
              <UIcon :name="p.icon" class="mt-0.5 size-5 shrink-0 text-primary opacity-90" />
              <div>
                <h3 class="font-semibold text-highlighted">
                  {{ p.title }}
                </h3>
                <p class="fba-muted-copy mt-1 text-sm leading-relaxed">
                  {{ p.body }}
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Use cases -->
        <section class="fba-mkt-cases-band" aria-labelledby="home-cases-heading">
          <div class="mb-6 max-w-2xl space-y-2">
            <h2
              id="home-cases-heading"
              class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
            >
              {{ t('home.casesTitle') }}
            </h2>
            <p class="fba-muted-copy text-sm md:text-base">
              {{ t('home.casesSubtitle') }}
            </p>
          </div>
          <div class="grid gap-4 md:grid-cols-3">
            <div v-for="(c, i) in useCases" :key="i" class="fba-mkt-case-card">
              <UBadge color="primary" variant="outline" class="mb-3 w-fit text-[10px]">
                {{ c.badge }}
              </UBadge>
              <h3 class="text-sm font-semibold text-highlighted">
                {{ c.title }}
              </h3>
              <p class="fba-muted-copy mt-2 text-sm leading-relaxed">
                {{ c.body }}
              </p>
            </div>
          </div>
        </section>

        <!-- Product preview: second mock -->
        <section class="py-6 md:py-10" aria-labelledby="home-preview-heading">
          <div class="mb-8 flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div class="space-y-2">
              <h2
                id="home-preview-heading"
                class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
              >
                {{ t('home.screenshotsTitle') }}
              </h2>
              <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
                {{ t('home.screenshotsSubtitle') }}
              </p>
            </div>
          </div>
          <div class="grid items-start gap-8 lg:grid-cols-2">
            <HomeProductMockup mode="alerts" class="max-w-md lg:max-w-none" />
            <div class="fba-mkt-aside-dashed space-y-4">
              <div class="flex items-center gap-2 text-primary">
                <UIcon name="i-lucide:layout-dashboard" class="size-5" />
                <span class="text-sm font-semibold text-highlighted">{{
                  t('home.screenshotSearchTitle')
                }}</span>
              </div>
              <p class="fba-muted-copy text-sm leading-relaxed">
                {{ t('home.screenshotSearchHint') }}
              </p>
              <div class="flex items-center gap-2 border-t border-default/40 pt-4 text-primary">
                <UIcon name="i-lucide:bell-ring" class="size-5" />
                <span class="text-sm font-semibold text-highlighted">{{
                  t('home.screenshotAlertsTitle')
                }}</span>
              </div>
              <p class="fba-muted-copy text-sm leading-relaxed">
                {{ t('home.screenshotAlertsHint') }}
              </p>
            </div>
          </div>
        </section>

        <!-- Primary CTA -->
        <section
          class="fba-cta-ribbon px-6 py-8 md:px-10 md:py-10"
          aria-labelledby="home-cta-primary-heading"
        >
          <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="max-w-xl space-y-2">
              <h2
                id="home-cta-primary-heading"
                class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
              >
                {{ t('home.ctaPrimaryTitle') }}
              </h2>
              <p class="fba-muted-copy text-sm leading-relaxed md:text-base">
                {{ t('home.ctaPrimaryBody') }}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <UButton v-for="(link, i) in midLinks" :key="i" v-bind="link" />
            </div>
          </div>
        </section>

        <!-- Pricing teaser -->
        <section class="py-6 md:py-10" aria-labelledby="home-pricing-teaser-heading">
          <div class="mb-8 max-w-2xl space-y-2">
            <h2
              id="home-pricing-teaser-heading"
              class="text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
            >
              {{ t('home.pricingTeaserTitle') }}
            </h2>
            <p class="fba-muted-copy text-sm md:text-base">
              {{ t('home.pricingTeaserSubtitle') }}
            </p>
          </div>
          <div class="grid gap-5 md:grid-cols-2">
            <div class="fba-mkt-teaser-free">
              <div class="flex items-baseline justify-between gap-2">
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ t('home.pricingTeaserFreeName') }}
                </h3>
                <p class="text-2xl font-bold tabular-nums text-highlighted">
                  {{ t('home.pricingTeaserFreePrice') }}
                </p>
              </div>
              <p class="fba-muted-copy mt-1 text-xs">{{ t('home.pricingTeaserFreeMeta') }}</p>
              <ul class="fba-muted-copy mt-4 space-y-2 text-sm">
                <li class="flex gap-2">
                  <UIcon name="i-lucide:check" class="mt-0.5 size-4 shrink-0 text-primary" />
                  {{ t('home.pricingTeaserFreeB1') }}
                </li>
                <li class="flex gap-2">
                  <UIcon name="i-lucide:check" class="mt-0.5 size-4 shrink-0 text-primary" />
                  {{ t('home.pricingTeaserFreeB2') }}
                </li>
              </ul>
            </div>
            <div class="fba-mkt-teaser-pro">
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <UBadge color="primary" variant="subtle">{{ t('pricing.badgePopular') }}</UBadge>
              </div>
              <div class="flex items-baseline justify-between gap-2">
                <h3 class="text-lg font-semibold text-highlighted">
                  {{ t('home.pricingTeaserProName') }}
                </h3>
                <p class="text-2xl font-bold tabular-nums text-primary">
                  {{ t('home.pricingTeaserProPrice') }}
                </p>
              </div>
              <p class="fba-muted-copy mt-1 text-xs">{{ t('home.pricingTeaserProMeta') }}</p>
              <ul class="fba-muted-copy mt-4 space-y-2 text-sm">
                <li class="flex gap-2">
                  <UIcon name="i-lucide:check" class="mt-0.5 size-4 shrink-0 text-primary" />
                  {{ t('home.pricingTeaserProB1') }}
                </li>
                <li class="flex gap-2">
                  <UIcon name="i-lucide:check" class="mt-0.5 size-4 shrink-0 text-primary" />
                  {{ t('home.pricingTeaserProB2') }}
                </li>
              </ul>
            </div>
          </div>
          <div class="mt-6">
            <UButton to="/pricing" color="primary" variant="soft" size="lg">
              {{ t('home.pricingTeaserCta') }}
            </UButton>
          </div>
        </section>

        <!-- FAQ -->
        <section class="fba-mkt-faq-shell" aria-labelledby="home-faq-heading">
          <h2
            id="home-faq-heading"
            class="mb-6 text-xl font-semibold tracking-tight text-highlighted md:text-2xl"
          >
            {{ t('home.faqTitle') }}
          </h2>
          <UAccordion type="multiple" :items="faqItems" class="max-w-3xl" :ui="fbaMarketingAccordionUi" />
        </section>

        <!-- Bottom CTA -->
        <section
          class="border-t border-default/40 pt-10 pb-4 md:pt-12"
          aria-labelledby="home-cta-bottom-heading"
        >
          <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div class="max-w-xl space-y-2">
              <h2
                id="home-cta-bottom-heading"
                class="text-lg font-semibold text-highlighted md:text-xl"
              >
                {{ t('home.ctaBottomTitle') }}
              </h2>
              <p class="fba-muted-copy text-sm">
                {{ t('home.ctaBottomBody') }}
              </p>
            </div>
            <div class="flex flex-wrap gap-3">
              <UButton v-for="(link, i) in bottomLinks" :key="i" v-bind="link" />
            </div>
          </div>
        </section>
      </FbaPageContainer>
    </div>
  </UPage>
</template>
