import type { SupabaseClient } from '@supabase/supabase-js'
import type { Locale } from '~lib/i18n'

/**
 * Persists UI locale on the Supabase user so Auth email templates can read `{{ .Data.locale }}`.
 * Safe to call when not signed in (no-op).
 */
export async function syncSupabaseUserLocale(
  client: SupabaseClient | null | undefined,
  locale: Locale,
): Promise<void> {
  if (!client) return
  const { data: { session } } = await client.auth.getSession()
  if (!session?.user) return
  const current = session.user.user_metadata?.locale
  if (current === locale) return
  await client.auth.updateUser({ data: { locale } })
}
