import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '~~/types/database.types'

type AvailabilityCacheRow = Database['public']['Tables']['availability_cache_entries']['Row']

/**
 * Availability / search-result cache. Requires **service role** client (`serverSupabaseServiceRole`).
 * Authenticated users have no table grants; RLS blocks direct access.
 */
export async function getAvailabilityCacheByFingerprint(
  client: SupabaseClient<Database>,
  loyaltyProgramSlug: string,
  fingerprint: string,
): Promise<AvailabilityCacheRow | null> {
  const { data, error } = await client
    .from('availability_cache_entries')
    .select('*')
    .eq('loyalty_program_slug', loyaltyProgramSlug)
    .eq('fingerprint', fingerprint)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const row = data as AvailabilityCacheRow
  if (new Date(row.expires_at) <= new Date()) return null
  return row
}

export async function upsertAvailabilityCacheEntry(
  client: SupabaseClient<Database>,
  row: {
    loyalty_program_slug: string
    fingerprint: string
    search_params?: Json
    payload: Json
    source?: string
    expires_at: string
  },
) {
  const { data, error } = await client
    .from('availability_cache_entries')
    .upsert(
      {
        loyalty_program_slug: row.loyalty_program_slug,
        fingerprint: row.fingerprint,
        search_params: row.search_params ?? {},
        payload: row.payload,
        source: row.source ?? 'flying_blue_mvp',
        expires_at: row.expires_at,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'loyalty_program_slug,fingerprint' },
    )
    .select('*')
    .single()

  if (error) throw error
  return data
}
