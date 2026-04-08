<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { magicLinkSchema, passwordLoginSchema } from '~lib/auth/schemas'

definePageMeta({
  layout: 'marketing',
  middleware: 'guest-only',
})

const { t } = useT()
const toast = useToast()
const { configured, signInWithPassword, sendMagicLink, translateAuthError } = useAuth()

useSeoMeta({
  title: () => `${t('seo.pageTitle.login')} — ${t('common.appName')}`,
  ogTitle: () => `${t('seo.pageTitle.login')} — ${t('common.appName')}`,
  description: () => t('seo.pageDescription.login'),
  ogDescription: () => t('seo.pageDescription.login'),
  ogType: 'website',
  twitterCard: 'summary',
  ogSiteName: () => t('common.appName'),
})

const tabItems = computed(() => [
  { label: t('auth.tabs.password'), value: 'password', slot: 'password' },
  { label: t('auth.tabs.magic'), value: 'magic', slot: 'magic' },
])

const pwdState = reactive({ email: '', password: '' })
const magicState = reactive({ email: '' })

const pwdLoading = ref(false)
const magicLoading = ref(false)
const authBusy = computed(() => pwdLoading.value || magicLoading.value)

async function onPasswordSubmit(e: Event) {
  e.preventDefault()
  if (!configured.value) {
    toast.add({ title: t('auth.errors.notConfigured'), color: 'error' })
    return
  }
  const parsed = passwordLoginSchema.safeParse(pwdState)
  if (!parsed.success) {
    toast.add({ title: t('auth.validation.formInvalid'), color: 'warning' })
    return
  }
  pwdLoading.value = true
  try {
    await signInWithPassword(parsed.data.email, parsed.data.password)
  } catch (e) {
    toast.add({ title: translateAuthError(e), color: 'error' })
  } finally {
    pwdLoading.value = false
  }
}

async function onMagicSubmit(e: Event) {
  e.preventDefault()
  if (!configured.value) {
    toast.add({ title: t('auth.errors.notConfigured'), color: 'error' })
    return
  }
  const parsed = magicLinkSchema.safeParse(magicState)
  if (!parsed.success) {
    toast.add({ title: t('auth.validation.emailInvalid'), color: 'warning' })
    return
  }
  magicLoading.value = true
  try {
    await sendMagicLink(parsed.data.email)
    toast.add({ title: t('auth.success.magicLinkSent'), color: 'success' })
  } catch (e) {
    toast.add({ title: translateAuthError(e), color: 'error' })
  } finally {
    magicLoading.value = false
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
              {{ t('auth.login.title') }}
            </h1>
            <p class="mt-1 text-sm text-muted">
              {{ t('auth.login.body') }}
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

        <UTabs
          v-else
          :items="tabItems"
          default-value="password"
          class="w-full"
        >
          <template #password>
            <p class="mb-4 text-sm text-muted">
              {{ t('auth.hints.password') }}
            </p>
            <form class="space-y-4" :aria-busy="pwdLoading" @submit="onPasswordSubmit">
              <UFormField
                :label="t('auth.form.email')"
                :description="t('auth.form.emailHint')"
                name="email"
              >
                <UInput
                  v-model="pwdState.email"
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
                  v-model="pwdState.password"
                  type="password"
                  autocomplete="current-password"
                  required
                />
              </UFormField>
              <UButton
                type="submit"
                block
                color="primary"
                size="lg"
                :loading="pwdLoading"
                :disabled="magicLoading"
              >
                {{ t('auth.form.submitLogin') }}
              </UButton>
              <p class="text-xs text-muted">
                {{ t('auth.links.forgotPassword') }}
              </p>
            </form>
          </template>

          <template #magic>
            <p class="mb-4 text-sm text-muted">
              {{ t('auth.hints.magic') }}
            </p>
            <form class="space-y-4" :aria-busy="magicLoading" @submit="onMagicSubmit">
              <UFormField
                :label="t('auth.form.email')"
                :description="t('auth.form.magicHint')"
                name="magic-email"
              >
                <UInput
                  v-model="magicState.email"
                  type="email"
                  autocomplete="email"
                  required
                />
              </UFormField>
              <UButton
                type="submit"
                block
                variant="soft"
                color="primary"
                size="lg"
                :loading="magicLoading"
                :disabled="pwdLoading"
              >
                {{ t('auth.form.submitMagic') }}
              </UButton>
            </form>
          </template>
        </UTabs>

        <template #footer>
          <div class="flex flex-col gap-3" :aria-busy="authBusy">
            <p class="text-center text-sm text-muted">
              {{ t('auth.links.needAccount') }}
              <ULink to="/signup" class="font-medium text-primary underline-offset-2 hover:underline">
                {{ t('nav.signup') }}
              </ULink>
            </p>
            <UButton to="/" variant="soft" color="neutral" size="lg" block>
              {{ t('auth.login.backHome') }}
            </UButton>
          </div>
        </template>
      </FbaAppCard>
    </div>
  </FbaSection>
</template>
