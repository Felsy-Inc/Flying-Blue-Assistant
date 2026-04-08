<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

definePageMeta({
  layout: 'marketing',
})

const { t } = useT()
const { redirectAfterLogin } = useAuth()

const status = ref<'loading' | 'ok' | 'err'>('loading')

useSeoMeta({
  title: () => `${t('seo.pageTitle.confirm')} — ${t('common.appName')}`,
  ogTitle: () => `${t('seo.pageTitle.confirm')} — ${t('common.appName')}`,
  description: () => t('seo.pageDescription.confirm'),
  ogDescription: () => t('seo.pageDescription.confirm'),
  ogType: 'website',
  twitterCard: 'summary',
  ogSiteName: () => t('common.appName'),
})

onMounted(async () => {
  const client = useNuxtApp().$supabase?.client
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
              to="/login"
              color="primary"
              size="lg"
              block
            >
              {{ t('nav.login') }}
            </UButton>
            <UButton
              v-else-if="status === 'ok'"
              to="/app"
              color="primary"
              size="lg"
              block
            >
              {{ t('auth.confirm.continueApp') }}
            </UButton>
            <UButton to="/" variant="soft" color="neutral" size="lg" block>
              {{ t('auth.confirm.backHome') }}
            </UButton>
          </div>
        </template>
      </FbaAppCard>
    </div>
  </FbaSection>
</template>
