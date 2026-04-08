import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

export async function fetchPlanLimitRow(
  client: SupabaseClient<Database>,
  planTier: Database['public']['Tables']['plan_limits']['Row']['plan_tier'],
) {
  const { data, error } = await client.from('plan_limits').select('*').eq('plan_tier', planTier).maybeSingle()

  if (error) {
    if (isMissingDbObjectError(error)) return null
    throw error
  }
  return data
}

export async function listPlanLimits(client: SupabaseClient<Database>) {
  const { data, error } = await client.from('plan_limits').select('*').order('plan_tier')

  if (error) {
    if (isMissingDbObjectError(error)) return []
    throw error
  }
  return data ?? []
}
