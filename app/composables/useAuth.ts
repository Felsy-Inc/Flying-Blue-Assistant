import type { AuthError, SupabaseClient } from '@supabase/supabase-js'
import { computed } from 'vue'
import { authErrorToKey } from '~lib/auth/map-auth-error'
import { normalizeLocale } from '~lib/i18n'
import { withLocaleInternalPath } from '~lib/i18n/with-locale-internal-path'
import type { Database } from '~~/types/database.types'

type SupabaseNuxtModule = { client: SupabaseClient<Database> }

export const useAuth = () => {
  const nuxtApp = useNuxtApp()
  const session = useSessionState()
  const { t } = useT()
  const config = useRuntimeConfig()
  const localePath = useLocalePath()
  const { locale } = useI18n()

  const emailConfirmRedirectUrl = () => {
    const loc = normalizeLocale(String(locale.value)) ?? 'en'
    const base = config.public.appUrl.replace(/\/$/, '')
    return `${base}/auth/confirm?lang=${encodeURIComponent(loc)}`
  }

  const configured = computed(() =>
    Boolean((nuxtApp.$supabase as SupabaseNuxtModule | undefined)?.client),
  )

  const client = () => {
    const c = (nuxtApp.$supabase as SupabaseNuxtModule | undefined)?.client
    if (!c) {
      throw new Error('AUTH_UNAVAILABLE')
    }
    return c
  }

  const userEmail = computed(() => session.value?.user?.email ?? null)

  const redirectAfterLogin = async () => {
    let next: string | null = null
    try {
      next = useSupabaseCookieRedirect().pluck()
    } catch {
      // No `public.supabase` (module disabled / misconfigured)
    }
    const target = withLocaleInternalPath(next || '/app', localePath)
    await navigateTo(target, { replace: true })
  }

  function isAuthErrorLike(error: unknown): error is AuthError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as AuthError).message === 'string'
    )
  }

  const translateAuthError = (error: unknown) =>
    isAuthErrorLike(error) ? t(authErrorToKey(error)) : t('auth.errors.generic')

  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await client().auth.signInWithPassword({ email, password })
    if (error) throw error
    await redirectAfterLogin()
  }

  const sendMagicLink = async (email: string) => {
    const emailRedirectTo = emailConfirmRedirectUrl()
    const { error } = await client().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo,
      },
    })
    if (error) throw error
  }

  const signUpWithPassword = async (email: string, password: string) => {
    const emailRedirectTo = emailConfirmRedirectUrl()
    const { data, error } = await client().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
      },
    })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await client().auth.signOut()
    await navigateTo(localePath('/'), { replace: true })
  }

  return {
    configured,
    session,
    userEmail,
    signInWithPassword,
    sendMagicLink,
    signUpWithPassword,
    signOut,
    translateAuthError,
    redirectAfterLogin,
  }
}
