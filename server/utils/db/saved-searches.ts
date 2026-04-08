import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'

type SavedSearchInsert = Database['public']['Tables']['saved_searches']['Insert']

export async function listSavedSearchesForUser(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function insertSavedSearch(client: SupabaseClient<Database>, row: SavedSearchInsert) {
  const { data, error } = await client.from('saved_searches').insert(row).select('*').single()

  if (error) throw error
  return data
}
