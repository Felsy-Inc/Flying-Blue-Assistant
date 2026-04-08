<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { signupSchema } from '~lib/auth/schemas'
import type { Locale } from '~lib/i18n/locales'
import { absoluteUrlForLocale } from '~lib/seo/locale-urls'

definePageMeta({
  layout: 'marketing',
  middleware: 'guest-only',
})

const { t } = useT()
const { locale } = useAppLocale()
const localePath = useLocalePath()
const config = useRuntimeConfig()
const siteUrl = computed(() => String(config.public.appUrl ?? '').replace(/\/$/, '') || '')
const toast = useToast()
const {
  configured,
  signUpWithPassword,
  translateAuthError,
  redirectAfterLogin,
} = useAuth()

useMarketingLocaleSeo('/signup')

const displayTitle = useSeoDisplayTitle('seo.pageTitle.signup')

useSeoMeta({
  title: () => t('seo.pageTitle.signup'),
  ogTitle: () => displayTitle.value,
  description: () => t('seo.pageDescription.signup'),
  ogDescription: () => t('seo.pageDescription.signup'),
  ogType: 'website',
  twitterCard: 'summary',
  twitterTitle: () => displayTitle.value,
  twitterDescription: () => t('seo.pageDescription.signup'),
  ogSiteName: () => t('common.appName'),
  ogUrl: () =>
    siteUrl.value ? absoluteUrlForLocale(siteUrl.value, locale.value as Locale, '/signup') : undefined,
})

const state = reactive({
  email: '',
  password: '',
  confirmPassword: '',
})

const loading = ref(false)

async function onSubmit(e: Event) {
  e.preventDefault()
  if (!configured.value) {
    toast.add({ title: t('auth.errors.notConfigured'), color: 'error' })
    return
  }
  const parsed = signupSchema.safeParse(state)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    if (issue?.path?.[0] === 'confirmPassword') {
      toast.add({ title: t('auth.validation.passwordMismatch'), color: 'warning' })
    } else {
      toast.add({ title: t('auth.validation.formInvalid'), color: 'warning' })
    }
    return
  }

  loading.value = true
  try {
    const data = await signUpWithPassword(parsed.data.email, parsed.data.password)
    if (data?.session) {
      toast.add({ title: t('auth.success.signupSession'), color: 'success' })
      await redirectAfterLogin()
    } else {
      toast.add({ title: t('auth.success.signupCheckEmail'), color: 'success' })
    }
  } catch (e) {
    toast.add({ title: translateAuthError(e), color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <FbaSection>
    <div class="mx-auto max-w-md space-y-6">
      <FbaAppCard>
        <template #header>
          <div>
            <h1 class="text-lg font-semibold text-highlighted">
              {{ t('auth.signup.title') }}
            </h1>
            <p class="mt-1 text-sm text-muted">
              {{ t('auth.signup.body') }}
            </p>
          </div>
        </template>

        <UAlert
          v-if="!configured"
          color="warning"
          variant="subtle"
          :title="t('auth.errors.unavailable')"
          :description="t('auth.errors.notConfigured')"
        />

        <form v-else class="space-y-4" :aria-busy="loading" @submit="onSubmit">
          <UFormField
            :label="t('auth.form.email')"
            :description="t('auth.form.emailHint')"
            name="email"
          >
            <UInput
              v-model="state.email"
              type="email"
              autocomplete="email"
              required
            />
          </UFormField>
          <UFormField
            :label="t('auth.form.password')"
            :description="t('auth.form.passwordHint')"
            name="password"
          >
            <UInput
              v-model="state.password"
              type="password"
              autocomplete="new-password"
              required
            />
          </UFormField>
          <UFormField
            :label="t('auth.form.confirmPassword')"
            :description="t('auth.form.confirmPasswordHint')"
            name="confirmPassword"
          >
            <UInput
              v-model="state.confirmPassword"
              type="password"
              autocomplete="new-password"
              required
            />
          </UFormField>
          <UButton type="submit" block color="primary" size="lg" :loading="loading">
            {{ t('auth.form.submitSignup') }}
          </UButton>
        </form>

        <template #footer>
          <div class="flex flex-col gap-3">
            <p class="text-center text-sm text-muted">
              {{ t('auth.links.haveAccount') }}
              <ULink :to="localePath('/login')" class="font-medium text-primary underline-offset-2 hover:underline">
                {{ t('nav.login') }}
              </ULink>
            </p>
            <UButton :to="localePath('/')" variant="soft" color="neutral" size="lg" block>
              {{ t('auth.signup.backHome') }}
            </UButton>
          </div>
        </template>
      </FbaAppCard>
    </div>
  </FbaSection>
</template>
