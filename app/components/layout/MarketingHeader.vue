<script setup lang="ts">
import { ref, watch } from 'vue'

const route = useRoute()
const { t } = useT()
const session = useSessionState()

const mobileOpen = ref(false)

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false
  },
)

const navLinkClass =
  'fba-inline-link text-sm font-medium text-muted transition-colors hover:bg-elevated/60 hover:text-default'

const navPillActiveClass =
  'bg-default text-highlighted shadow-sm ring-1 ring-default/25 dark:ring-white/10'
</script>

<template>
  <header
    class="fba-header-bar sticky top-0 z-40 border-b border-default/50 bg-default/90 backdrop-blur-xl supports-[backdrop-filter]:bg-default/78"
  >
    <UContainer class="px-4 sm:px-6 lg:px-8">
      <div class="flex h-[3.25rem] md:h-[3.75rem] items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UButton
            class="lg:hidden"
            color="neutral"
            variant="ghost"
            square
            :aria-label="t('header.openMenu')"
            @click="mobileOpen = true"
          >
            <UIcon name="i-heroicons-bars-3" class="size-5" />
          </UButton>

          <UButton
            to="/"
            variant="ghost"
            color="neutral"
            class="-ms-1 gap-2.5 font-semibold tracking-wide lg:-ms-2"
            :aria-label="t('header.brandAria', { appName: t('common.appName') })"
          >
            <span class="fba-mark size-7 shrink-0 rounded-full" />
            <span class="hidden sm:inline">{{ t('common.appName') }}</span>
          </UButton>
        </div>

        <nav
          class="fba-nav-rail hidden items-center gap-0.5 rounded-full border border-default/40 bg-elevated/40 p-1 shadow-sm dark:border-default/30 dark:bg-elevated/25"
          :aria-label="t('header.mainNav')"
        >
          <UButton
            to="/"
            exact
            variant="ghost"
            color="neutral"
            size="sm"
            class="rounded-full px-3.5"
            :active-class="navPillActiveClass"
          >
            {{ t('nav.home') }}
          </UButton>
          <UButton
            to="/pricing"
            variant="ghost"
            color="neutral"
            size="sm"
            class="rounded-full px-3.5"
            :active-class="navPillActiveClass"
          >
            {{ t('nav.pricing') }}
          </UButton>
        </nav>

        <div class="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
          <FbaLocaleSwitcher />
          <FbaThemeToggle />

          <div v-if="session" class="hidden items-center gap-1.5 sm:flex">
            <UButton to="/app" color="primary" size="sm">
              {{ t('nav.dashboard') }}
            </UButton>
          </div>
          <div v-else class="hidden items-center gap-1.5 sm:flex">
            <UButton to="/login" variant="ghost" color="neutral" size="sm">
              {{ t('nav.login') }}
            </UButton>
            <UButton to="/signup" color="primary" size="sm">
              {{ t('nav.signup') }}
            </UButton>
          </div>

          <UButton
            v-if="session"
            class="sm:hidden"
            to="/app"
            color="primary"
            size="sm"
          >
            {{ t('nav.dashboard') }}
          </UButton>
          <UButton
            v-else
            class="sm:hidden"
            to="/login"
            color="primary"
            size="sm"
          >
            {{ t('nav.login') }}
          </UButton>
        </div>
      </div>
    </UContainer>

    <USlideover
      v-model:open="mobileOpen"
      side="left"
      :title="t('common.appName')"
    >
      <template #body>
        <nav class="flex flex-col gap-1 p-2" :aria-label="t('header.mainNav')">
          <NuxtLink
            to="/"
            class="rounded-lg px-3 py-2.5"
            :class="navLinkClass"
          >
            {{ t('nav.home') }}
          </NuxtLink>
          <NuxtLink
            to="/pricing"
            class="rounded-lg px-3 py-2.5"
            :class="navLinkClass"
          >
            {{ t('nav.pricing') }}
          </NuxtLink>
          <NuxtLink
            to="/app/search"
            class="rounded-lg px-3 py-2.5"
            :class="navLinkClass"
          >
            {{ t('nav.search') }}
          </NuxtLink>
          <hr class="my-2 border-default/60">
          <template v-if="session">
            <NuxtLink
              to="/app"
              class="fba-inline-link-primary rounded-lg px-3 py-2.5 text-sm hover:bg-primary/5"
            >
              {{ t('nav.dashboard') }}
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/login"
              class="rounded-lg px-3 py-2.5"
              :class="navLinkClass"
            >
              {{ t('nav.login') }}
            </NuxtLink>
            <NuxtLink
              to="/signup"
              class="fba-inline-link-primary rounded-lg px-3 py-2.5 text-sm hover:bg-primary/5"
            >
              {{ t('nav.signup') }}
            </NuxtLink>
          </template>
        </nav>
      </template>
    </USlideover>
  </header>
</template>
