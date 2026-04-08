import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '~~/types/database.types'
import { UsageEventType } from '~lib/billing/usage-events'
import type { EffectivePlanLimits } from '~~/server/utils/billing/user-plan'
import { countActiveAlertsForUser } from './alerts'
import { countUsageEventsForUtcDay } from './usage'

export type QuotaCheckResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; reason: 'search_daily_limit'; used: number; limit: number }
  | { ok: false; reason: 'active_alert_limit'; used: number; limit: number }

/**
 * Daily search quota (UTC calendar day, same as `usage_events` day index).
 * Counts existing `search_executed` rows before allowing another search.
 */
export async function assertCanExecuteSearch(
  client: SupabaseClient<Database>,
  userId: string,
  limits: EffectivePlanLimits,
  dayUtc = new Date().toISOString().slice(0, 10),
): Promise<QuotaCheckResult> {
  const limit = limits.max_searches_per_day
  const used = await countUsageEventsForUtcDay(client, userId, UsageEventType.searchExecuted, dayUtc)
  const remaining = limit - used
  if (used >= limit) return { ok: false, reason: 'search_daily_limit', used, limit }
  return { ok: true, remaining: Math.max(remaining, 0), limit }
}

/** Active alerts only (`status = active`); paused/deleted do not count. */
export async function assertCanActivateAlert(
  client: SupabaseClient<Database>,
  userId: string,
  limits: EffectivePlanLimits,
): Promise<QuotaCheckResult> {
  const limit = limits.max_active_alerts
  const used = await countActiveAlertsForUser(client, userId)
  const remaining = limit - used
  if (used >= limit) return { ok: false, reason: 'active_alert_limit', used, limit }
  return { ok: true, remaining: Math.max(remaining, 0), limit }
}
