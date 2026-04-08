/**
 * Redirect authenticated users away from login/signup (when Supabase session exists).
 */
export default defineNuxtRouteMiddleware(() => {
  if (!useNuxtApp().$supabase?.client) return

  const session = useSessionState()
  if (!session.value) return

  let nextPath: string | null = null
  try {
    nextPath = useSupabaseCookieRedirect().pluck()
  } catch {
    /* no redirect cookie integration */
  }
  return navigateTo(nextPath || '/app', { replace: true })
})
