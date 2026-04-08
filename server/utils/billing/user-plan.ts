import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import {
  effectivePlanLimits,
  normalizePlanTier,
  type PlanTier,
} from '~lib/billing/plan-limits-defaults'
import { fetchPlanLimitRow } from '~~/server/utils/db/plan-limits'
import { fetchProfileById } from '~~/server/utils/db/profiles'

export type EffectivePlanLimits = {
  max_searches_per_day: number
  max_active_alerts: number
}

/** Profile → tier (default free) + limits row → effective caps (DB or code fallback). */
export async function getUserPlanContext(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{ planTier: PlanTier; limits: EffectivePlanLimits }> {
  let planTier: PlanTier = 'free'
  try {
    const profile = await fetchProfileById(client, userId)
    planTier = normalizePlanTier(profile?.plan_tier ?? undefined)
  } catch {
    planTier = 'free'
  }

  const row = await fetchPlanLimitRow(client, planTier)
  const limits = effectivePlanLimits(planTier, row)
  return { planTier, limits }
}
