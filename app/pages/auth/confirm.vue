<script setup lang="ts">
import type { SupabaseClient } from '@supabase/supabase-js'
import { nextTick, onMounted, ref } from 'vue'
import { normalizeLocale } from '~lib/i18n'

definePageMeta({
  layout: 'marketing',
  i18n: false,
})

const route = useRoute()
const router = useRouter()
const { setLocale } = useI18n()

const rawLang = route.query.lang
const langParam =
  typeof rawLang === 'string' ? rawLang : Array.isArray(rawLang) ? rawLang[0] : undefined
const qLang = normalizeLocale(langParam)
if (qLang) {
  await setLocale(qLang)
}

const { t } = useT()
const localePath = useLocalePath()
const { redirectAfterLogin } = useAuth()

const status = ref<'loading' | 'ok' | 'err'>('loading')

const displayTitle = useSeoDisplayTitle('seo.pageTitle.confirm')

useSeoMeta({
  title: () => t('seo.pageTitle.confirm'),
  ogTitle: () => displayTitle.value,
  description: () => t('seo.pageDescription.confirm'),
  ogDescription: () => t('seo.pageDescription.confirm'),
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: () => displayTitle.value,
  twitterDescription: () => t('seo.pageDescription.confirm'),
  ogSiteName: () => t('common.appName'),
})

onMounted(async () => {
  const q = { ...route.query }
  if (q.lang != null) {
    delete q.lang
    await router.replace({ path: route.path, query: q, hash: route.hash })
  }

  const supabase = useNuxtApp().$supabase as { client: SupabaseClient } | undefined
  const client = supabase?.client
  if (!client) {
    status.value = 'err'
    return
  }

  await nextTick()

  const trySession = async () => {
    const { data, error } = await client.auth.getSession()
    if (error || !data.session) return false
    await redirectAfterLogin()
    return true
  }

  if (await trySession()) {
    status.value = 'ok'
    return
  }

  await new Promise((r) => setTimeout(r, 400))
  if (await trySession()) {
    status.value = 'ok'
    return
  }

  status.value = 'err'
})
</script>

<template>
  <FbaSection>
    <div class="mx-auto max-w-lg">
      <FbaAppCard>
        <template #header>
          <div class="space-y-1">
            <h1 class="text-lg font-semibold text-highlighted">
              {{ t('auth.confirm.title') }}
            </h1>
            <p class="text-sm text-muted">
              {{ t('auth.confirm.body') }}
            </p>
          </div>
        </template>

        <div
          v-if="status === 'loading'"
          class="flex flex-col items-center justify-center gap-3 py-8 text-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <UIcon name="i-heroicons-arrow-path" class="size-8 animate-spin text-dimmed" />
          <p class="text-sm text-muted">
            {{ t('auth.confirm.body') }}
          </p>
        </div>

        <UAlert
          v-else-if="status === 'err'"
          color="warning"
          variant="subtle"
          icon="i-heroicons-exclamation-triangle"
          :title="t('auth.errors.confirmFailed')"
          :description="t('auth.confirm.bodyError')"
        />

        <UAlert
          v-else
          color="success"
          variant="subtle"
          icon="i-heroicons-check-circle"
          :title="t('auth.confirm.successTitle')"
          :description="t('auth.confirm.successBody')"
        />

        <template #footer>
          <div class="flex flex-col gap-2">
            <UButton
              v-if="status === 'err'"
              :to="localePath('/login')"
              color="primary"
              size="lg"
              block
            >
              {{ t('nav.login') }}
            </UButton>
            <UButton
              v-else-if="status === 'ok'"
              :to="localePath('/app')"
              color="primary"
              size="lg"
              block
            >
              {{ t('auth.confirm.continueApp') }}
            </UButton>
            <UButton :to="localePath('/')" variant="soft" color="neutral" size="lg" block>
              {{ t('auth.confirm.backHome') }}
            </UButton>
          </div>
        </template>
      </FbaAppCard>
    </div>
  </FbaSection>
</template>
