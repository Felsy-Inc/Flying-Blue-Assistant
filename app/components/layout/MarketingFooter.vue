<script setup lang="ts">
import { computed } from 'vue'

const year = new Date().getFullYear()
const { t } = useT()
const localePath = useLocalePath()

const copyright = computed(() =>
  t('footer.copyright', { year, appName: t('common.appName') }),
)
</script>

<template>
  <footer class="fba-site-footer">
    <UContainer class="px-4 sm:px-6 lg:px-8">
      <div
        class="grid gap-10 py-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12 lg:py-12"
      >
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="fba-mark size-8 shrink-0 rounded-full" aria-hidden="true" />
            <p class="text-sm font-semibold tracking-tight text-highlighted">
              {{ t('common.appName') }}
            </p>
          </div>
          <p class="text-sm leading-relaxed text-muted">
            {{ t('footer.tagline') }}
          </p>
          <p class="text-xs leading-relaxed text-muted">
            {{ copyright }}
          </p>
        </div>

        <div class="space-y-3">
          <p class="text-xs font-semibold uppercase tracking-wider text-dimmed">
            {{ t('footer.colProduct') }}
          </p>
          <nav class="flex flex-col gap-2 text-sm" :aria-label="t('footer.colProduct')">
            <NuxtLink :to="localePath('/')" class="fba-inline-link text-muted hover:text-default">
              {{ t('nav.home') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/pricing')" class="fba-inline-link text-muted hover:text-default">
              {{ t('nav.pricing') }}
            </NuxtLink>
            <NuxtLink :to="`${localePath('/')}#faq`" class="fba-inline-link text-muted hover:text-default">
              {{ t('nav.faq') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/app/search')" class="fba-inline-link text-muted hover:text-default">
              {{ t('nav.search') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/login')" class="fba-inline-link text-muted hover:text-default">
              {{ t('nav.login') }}
            </NuxtLink>
            <NuxtLink :to="localePath('/signup')" class="fba-inline-link-primary text-primary hover:text-primary/90">
              {{ t('nav.signup') }}
            </NuxtLink>
          </nav>
        </div>

        <div class="space-y-3 md:col-span-2 lg:col-span-1">
          <p class="text-xs font-semibold uppercase tracking-wider text-dimmed">
            {{ t('footer.colLegal') }}
          </p>
          <p class="text-xs leading-relaxed text-dimmed">
            {{ t('footer.legalShort') }}
          </p>
        </div>
      </div>
    </UContainer>
  </footer>
</template>
