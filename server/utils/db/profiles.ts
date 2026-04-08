import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

/**
 * Ensures `public.profiles` has a row (FK target for `subscriptions.user_id`).
 * Use the **service role** client so `auth.admin.getUserById` works.
 */
export async function ensureProfileForUser(
  serviceClient: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  const existing = await fetchProfileById(serviceClient, userId)
  if (existing) return

  const { data, error } = await serviceClient.auth.admin.getUserById(userId)
  if (error) throw error
  const u = data.user
  if (!u) {
    throw new Error(`auth user not found: ${userId}`)
  }

  const meta = u.user_metadata as Record<string, unknown> | undefined
  const displayName =
    (typeof meta?.display_name === 'string' && meta.display_name.trim()) ||
    (typeof meta?.full_name === 'string' && meta.full_name.trim()) ||
    (u.email ? u.email.split('@')[0] : null)

  const { error: insErr } = await serviceClient.from('profiles').insert({
    id: userId,
    display_name: displayName,
  })

  if (insErr) {
    if (insErr.code === '23505') return
    throw insErr
  }
}

export async function fetchProfileById(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle()

  if (error) {
    if (isMissingDbObjectError(error)) return null
    throw error
  }
  return data
}
