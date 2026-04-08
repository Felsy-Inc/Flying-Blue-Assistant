import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

type AlertInsert = Database['public']['Tables']['alerts']['Insert']
type AlertUpdate = Database['public']['Tables']['alerts']['Update']

export async function countActiveAlertsForUser(client: SupabaseClient<Database>, userId: string) {
  const { count, error } = await client
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    if (isMissingDbObjectError(error)) return 0
    throw error
  }
  return count ?? 0
}

export async function listAlertsForUser(client: SupabaseClient<Database>, userId: string) {
  const { data, error } = await client
    .from('alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingDbObjectError(error)) return []
    throw error
  }
  return data ?? []
}

export async function getAlertByIdForUser(
  client: SupabaseClient<Database>,
  alertId: string,
  userId: string,
) {
  const { data, error } = await client
    .from('alerts')
    .select('*')
    .eq('id', alertId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingDbObjectError(error)) return null
    throw error
  }
  return data
}

export async function insertAlert(client: SupabaseClient<Database>, row: AlertInsert) {
  const { data, error } = await client.from('alerts').insert(row).select('*').single()

  if (error) throw error
  return data
}

export async function updateAlert(client: SupabaseClient<Database>, alertId: string, userId: string, patch: AlertUpdate) {
  const { data, error } = await client
    .from('alerts')
    .update(patch)
    .eq('id', alertId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function deleteAlertForUser(client: SupabaseClient<Database>, alertId: string, userId: string) {
  const { error } = await client.from('alerts').delete().eq('id', alertId).eq('user_id', userId)

  if (error) throw error
}
