import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'

type AlertMatchInsert = Database['public']['Tables']['alert_matches']['Insert']

/**
 * Inserts a match row (typically **service role** after a background check).
 * End-users only have `SELECT` on `alert_matches` via RLS.
 */
export async function insertAlertMatch(client: SupabaseClient<Database>, row: AlertMatchInsert) {
  const { data, error } = await client.from('alert_matches').insert(row).select('*').single()

  if (error) throw error
  return data
}
