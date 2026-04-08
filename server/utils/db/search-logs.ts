import type { SupabaseClient } from '@supabase/supabase-js'
import type { Json } from '~~/types/database.types'
import type { Database } from '~~/types/database.types'

export async function insertSearchLog(
  client: SupabaseClient<Database>,
  row: {
    user_id: string
    loyalty_program_slug: string
    params?: Json
    result_count?: number | null
    duration_ms?: number | null
  },
) {
  const { data, error } = await client
    .from('search_logs')
    .insert({
      user_id: row.user_id,
      loyalty_program_slug: row.loyalty_program_slug,
      params: row.params ?? {},
      result_count: row.result_count ?? null,
      duration_ms: row.duration_ms ?? null,
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}
