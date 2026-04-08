import type { Database } from '~~/types/database.types'

export type PlanTier = Database['public']['Tables']['profiles']['Row']['plan_tier']
type PlanLimitsRow = Database['public']['Tables']['plan_limits']['Row']

/** MVP caps; DB `plan_limits` should match — these apply when row missing (seed / migration gap). */
export const PLAN_LIMIT_DEFAULTS: Record<
  PlanTier,
  Pick<PlanLimitsRow, 'max_searches_per_day' | 'max_active_alerts'>
> = {
  free: { max_searches_per_day: 3, max_active_alerts: 1 },
  pro: { max_searches_per_day: 50, max_active_alerts: 10 },
}

export function normalizePlanTier(raw: string | null | undefined): PlanTier {
  return raw === 'pro' ? 'pro' : 'free'
}

export function effectivePlanLimits(
  tier: PlanTier,
  row: PlanLimitsRow | null,
): Pick<PlanLimitsRow, 'max_searches_per_day' | 'max_active_alerts'> {
  if (row) {
    return {
      max_searches_per_day: row.max_searches_per_day,
      max_active_alerts: row.max_active_alerts,
    }
  }
  return { ...PLAN_LIMIT_DEFAULTS[tier] }
}
