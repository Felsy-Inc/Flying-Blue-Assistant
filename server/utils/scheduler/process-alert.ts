import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import { alertRowToAvailabilitySearchRequest } from '~lib/alerts/alert-to-search-request'
import {
  digestForMatchedOffers,
  filterOffersForAlertCriteria,
} from '~lib/alerts/match-offers-for-alert'
import { alertRowToEmailFields } from '~lib/email/alert-payload'
import { localeFromUserMetadata } from '~lib/auth/user-locale'
import type { AvailabilityProvider } from '~lib/availability/provider'
import type { Database, Json } from '~~/types/database.types'
import { insertAlertMatch } from '~~/server/utils/db/alert-matches'
import {
  alertMatchDigestExists,
  planTierFromDueRow,
  resolveCheckIntervalMinutes,
  updateAlertScheduleAfterRun,
  type DueAlertRow,
} from '~~/server/utils/db/alerts-scheduler'
import { dispatchAlertMatchNotifications } from '~~/server/utils/notifications/dispatch-alert-match'

export type ProcessAlertResult = {
  ok: boolean
  alertId: string
  matched?: number
  notified?: boolean
  repeatedDigest?: boolean
  emailStatus?: 'sent' | 'skipped' | 'failed'
  error?: string
}

/**
 * One alert: search mock provider → tighten to alert date windows → digest dedupe → email → persist match.
 *
 * Production notes:
 * - Serverless time budget: keep `listDueAlerts` limit conservative on Hobby (10s).
 * - Failed Resend: we do **not** insert `alert_matches` so the next run can retry email.
 * - Skipped email (`EMAILS_ENABLED=false`): we still insert the match for in-app history.
 */
export async function processOneAlert(
  event: H3Event,
  serviceClient: SupabaseClient<Database>,
  provider: AvailabilityProvider,
  row: DueAlertRow,
): Promise<ProcessAlertResult> {
  const alertId = row.id
  const planTier = planTierFromDueRow(row)
  const intervalMinutes = resolveCheckIntervalMinutes(row.check_interval_minutes, planTier)

  try {
    const request = alertRowToAvailabilitySearchRequest(row)
    const response = await provider.search(request)
    const matched = filterOffersForAlertCriteria(row, response.offers)

    if (matched.length === 0) {
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
      return { ok: true, alertId, matched: 0, notified: false }
    }

    const digest = digestForMatchedOffers(matched)
    if (await alertMatchDigestExists(serviceClient, alertId, digest)) {
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
      return {
        ok: true,
        alertId,
        matched: matched.length,
        notified: false,
        repeatedDigest: true,
      }
    }

    const { data: userData, error: userErr } = await serviceClient.auth.admin.getUserById(row.user_id)
    if (userErr || !userData?.user) {
      console.error(`[cron/alerts] auth.admin.getUserById failed`, alertId, userErr)
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
      return { ok: false, alertId, error: 'user_lookup_failed' }
    }

    const email = userData.user.email?.trim()
    const locale = localeFromUserMetadata(userData.user.user_metadata)
    const fields = alertRowToEmailFields(row)

    if (!email) {
      await insertAlertMatch(serviceClient, {
        alert_id: alertId,
        loyalty_program_slug: row.loyalty_program_slug,
        digest_hash: digest,
        summary: `${matched.length} option(s)`,
        details: {
          offerCount: matched.length,
          offerIds: matched.map((o) => o.id),
          generatedAt: response.generatedAt,
          note: 'no_user_email',
        } as unknown as Json,
      })
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
      return {
        ok: true,
        alertId,
        matched: matched.length,
        notified: false,
        emailStatus: 'skipped',
        error: 'user_email_missing',
      }
    }

    const { email: emailResult } = await dispatchAlertMatchNotifications({
      event,
      serviceClient,
      userId: row.user_id,
      toEmail: email,
      locale,
      alert: fields,
    })

    if (emailResult.status === 'failed') {
      console.warn(`[cron/alerts] email failed`, alertId, emailResult.reason)
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
      return {
        ok: true,
        alertId,
        matched: matched.length,
        notified: false,
        emailStatus: 'failed',
        error: emailResult.reason,
      }
    }

    await insertAlertMatch(serviceClient, {
      alert_id: alertId,
      loyalty_program_slug: row.loyalty_program_slug,
      digest_hash: digest,
      summary: `${matched.length} option(s)`,
      details: {
        offerCount: matched.length,
        offerIds: matched.map((o) => o.id),
        generatedAt: response.generatedAt,
      } as unknown as Json,
    })

    await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
    return {
      ok: true,
      alertId,
      matched: matched.length,
      notified: emailResult.status === 'sent',
      emailStatus: emailResult.status,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`[cron/alerts] alert ${alertId}`, e)
    try {
      await updateAlertScheduleAfterRun(serviceClient, alertId, intervalMinutes)
    } catch (e2) {
      console.error(`[cron/alerts] schedule update failed`, alertId, e2)
    }
    return { ok: false, alertId, error: msg }
  }
}
