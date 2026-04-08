import type { SupabaseClient } from '@supabase/supabase-js'
import type { PlanTier } from '~lib/billing/plan-limits-defaults'
import { normalizePlanTier } from '~lib/billing/plan-limits-defaults'
import type { AlertRow } from '~lib/alerts/alert-schema'
import type { Database } from '~~/types/database.types'
import { isMissingDbObjectError } from './supabase-errors'

/** Joined row from `listDueAlerts` (PostgREST embed). */
export type DueAlertRow = AlertRow & {
  profiles: { plan_tier: string } | { plan_tier: string }[] | null
}

export function planTierFromDueRow(row: DueAlertRow): PlanTier {
  const p = row.profiles
  const raw = Array.isArray(p) ? p[0]?.plan_tier : p?.plan_tier
  return normalizePlanTier(raw)
}

const DEFAULT_BATCH = 25

/**
 * Active alerts whose `next_check_at` is null (never scheduled) or due now (UTC).
 * Ordered so overdue / never-run are processed first.
 */
/** One profile per alert via `user_id` — explicit FK hint avoids ambiguity if relations grow. */
const dueSelect = '*,profiles!alerts_user_id_fkey(plan_tier)' as const

export async function listDueAlerts(
  serviceClient: SupabaseClient<Database>,
  limit = DEFAULT_BATCH,
): Promise<DueAlertRow[]> {
  const nowIso = new Date().toISOString()

  const [neverScheduled, due] = await Promise.all([
    serviceClient
      .from('alerts')
      .select(dueSelect)
      .eq('status', 'active')
      .is('next_check_at', null)
      .order('created_at', { ascending: true })
      .limit(limit),
    serviceClient
      .from('alerts')
      .select(dueSelect)
      .eq('status', 'active')
      .not('next_check_at', 'is', null)
      .lte('next_check_at', nowIso)
      .order('next_check_at', { ascending: true })
      .limit(limit),
  ])

  const e1 = neverScheduled.error
  const e2 = due.error
  if (e1 && isMissingDbObjectError(e1)) return []
  if (e2 && isMissingDbObjectError(e2)) return []
  if (e1) throw e1
  if (e2) throw e2

  const byId = new Map<string, DueAlertRow>()
  for (const row of (neverScheduled.data ?? []) as DueAlertRow[]) {
    byId.set(row.id, row)
  }
  for (const row of (due.data ?? []) as DueAlertRow[]) {
    byId.set(row.id, row)
  }

  const merged = [...byId.values()].sort((a, b) => {
    if (a.next_check_at == null && b.next_check_at != null) return -1
    if (a.next_check_at != null && b.next_check_at == null) return 1
    if (a.next_check_at == null && b.next_check_at == null) {
      return a.created_at.localeCompare(b.created_at)
    }
    return (a.next_check_at ?? '').localeCompare(b.next_check_at ?? '')
  })

  return merged.slice(0, limit)
}

export function resolveCheckIntervalMinutes(
  checkIntervalOverride: number | null,
  planTier: PlanTier,
): number {
  const defaults: Record<PlanTier, number> = { free: 60, pro: 15 }
  if (checkIntervalOverride != null && checkIntervalOverride > 0) {
    return checkIntervalOverride
  }
  return defaults[planTier] ?? 60
}

export async function updateAlertScheduleAfterRun(
  serviceClient: SupabaseClient<Database>,
  alertId: string,
  intervalMinutes: number,
): Promise<void> {
  const now = new Date()
  const next = new Date(now.getTime() + intervalMinutes * 60_000)

  const { error } = await serviceClient
    .from('alerts')
    .update({
      last_checked_at: now.toISOString(),
      next_check_at: next.toISOString(),
    })
    .eq('id', alertId)

  if (error) throw error
}

export async function alertMatchDigestExists(
  serviceClient: SupabaseClient<Database>,
  alertId: string,
  digestHash: string,
): Promise<boolean> {
  const { data, error } = await serviceClient
    .from('alert_matches')
    .select('id')
    .eq('alert_id', alertId)
    .eq('digest_hash', digestHash)
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingDbObjectError(error)) return false
    throw error
  }
  return data != null
}
