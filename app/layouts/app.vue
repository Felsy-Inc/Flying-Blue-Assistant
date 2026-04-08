<script setup lang="ts">
import { computed, ref } from 'vue'

const route = useRoute()
const { t } = useT()
const { nuxtUiLocale } = useAppShellHead()
const { configured, signOut } = useAuth()

const signingOut = ref(false)

async function onSignOut() {
  if (!configured.value) return
  signingOut.value = true
  try {
    await signOut()
  } finally {
    signingOut.value = false
  }
}

const sidebarItems = computed(() => [
  [
    {
      label: t('app.nav.dashboard'),
      icon: 'i-heroicons-squares-2x2',
      to: '/app',
    },
    {
      label: t('app.nav.search'),
      icon: 'i-heroicons-magnifying-glass',
      to: '/app/search',
    },
    {
      label: t('app.nav.alerts'),
      icon: 'i-heroicons-bell',
      to: '/app/alerts',
    },
    {
      label: t('app.nav.account'),
      icon: 'i-heroicons-user',
      to: '/app/account',
    },
  ],
])

const pageTitle = computed(() => {
  const p = route.path
  if (p === '/app' || p === '/app/') return t('dashboard.titleHome')
  if (p.startsWith('/app/search')) return t('dashboard.titleSearch')
  if (p.startsWith('/app/alerts')) return t('dashboard.titleAlerts')
  if (p.startsWith('/app/account')) return t('dashboard.titleAccount')
  return t('common.appName')
})
</script>

<template>
  <UApp :locale="nuxtUiLocale">
    <UDashboardGroup storage-key="fba-dash" class="min-h-screen">
      <UDashboardSidebar>
        <template #header="{ collapsed }">
          <div class="flex items-center gap-2 px-2" :class="collapsed ? 'justify-center' : ''">
            <span class="fba-mark size-8 shrink-0 rounded-full" />
            <NuxtLink
              v-if="!collapsed"
              to="/app"
              class="fba-inline-link truncate font-semibold tracking-tight text-highlighted hover:text-highlighted"
            >
              {{ t('common.appName') }}
            </NuxtLink>
          </div>
        </template>

        <UNavigationMenu
          :items="sidebarItems"
          orientation="vertical"
          highlight
          class="data-[orientation=vertical]:w-full"
        />

        <template #footer="{ collapsed }">
          <div
            class="flex flex-col gap-2 p-2"
            :class="collapsed ? 'items-center' : ''"
          >
            <FbaThemeToggle />
            <UButton
              v-if="configured"
              color="error"
              variant="soft"
              size="xs"
              class="whitespace-nowrap"
              :loading="signingOut"
              :icon="collapsed ? 'i-heroicons-arrow-right-on-rectangle' : undefined"
              @click="onSignOut"
            >
              <span v-if="!collapsed">{{ t('dashboard.accountSignOut') }}</span>
            </UButton>
            <UButton
              to="/"
              variant="ghost"
              color="neutral"
              size="xs"
              class="whitespace-nowrap"
              :icon="collapsed ? 'i-heroicons-home' : undefined"
              :aria-label="t('app.nav.backToSite')"
            >
              <span v-if="!collapsed">{{ t('app.nav.backToSite') }}</span>
            </UButton>
          </div>
        </template>
      </UDashboardSidebar>

      <UDashboardPanel>
        <template #header>
          <UDashboardNavbar
            :title="pageTitle"
            class="fba-header-bar border-b border-default/50 bg-default/90 backdrop-blur-md supports-[backdrop-filter]:bg-default/75"
          >
            <template #right>
              <FbaLocaleSwitcher class="w-[min(10rem,40vw)] shrink-0" />
            </template>
          </UDashboardNavbar>
        </template>
        <template #body>
          <div class="fba-app-canvas min-h-full p-4 md:p-6 lg:p-8">
            <div class="mx-auto max-w-6xl">
              <NuxtPage />
            </div>
          </div>
        </template>
      </UDashboardPanel>
    </UDashboardGroup>
  </UApp>
</template>
