/**
 * Redirect authenticated users away from login/signup (when Supabase session exists).
 */
import { withLocaleInternalPath } from '~lib/i18n/with-locale-internal-path'

export default defineNuxtRouteMiddleware(() => {
  const supa = useNuxtApp().$supabase as { client?: unknown } | undefined
  if (!supa?.client) return

  const session = useSessionState()
  if (!session.value) return

  let nextPath: string | null = null
  try {
    nextPath = useSupabaseCookieRedirect().pluck()
  } catch {
    /* no redirect cookie integration */
  }
  const localePath = useLocalePath()
  const target = withLocaleInternalPath(nextPath || '/app', localePath)
  return navigateTo(target, { replace: true })
})
