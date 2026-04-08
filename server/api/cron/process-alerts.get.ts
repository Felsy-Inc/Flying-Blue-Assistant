import { serverSupabaseServiceRole } from '#supabase/server'
import { assertCronSecret } from '~~/server/utils/cron/assert-cron-secret'
import { listDueAlerts } from '~~/server/utils/db/alerts-scheduler'
import { resolveAvailabilityProvider } from '~~/server/utils/availability/resolve-provider'
import { processOneAlert } from '~~/server/utils/scheduler/process-alert'

/**
 * Vercel Cron (or manual GET with `Authorization: Bearer $CRON_SECRET`).
 *
 * Batch size: see `listDueAlerts` default (25). One serverless invocation processes up to that many
 * alerts sequentially — tune down on slow providers or tight timeouts.
 */
export default defineEventHandler(async (event) => {
  assertCronSecret(event)

  const config = useRuntimeConfig(event)
  if (!config.public?.supabase?.url) {
    throw createError({ statusCode: 503, statusMessage: 'supabase_not_configured' })
  }

  let serviceClient
  try {
    serviceClient = serverSupabaseServiceRole(event)
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'supabase_service_role_missing' })
  }

  const started = Date.now()
  const rows = await listDueAlerts(serviceClient)
  const provider = resolveAvailabilityProvider('mock', serviceClient)
  const results = []

  for (const row of rows) {
    const r = await processOneAlert(event, serviceClient, provider, row)
    results.push(r)
  }

  const okCount = results.filter((r) => r.ok).length
  const notified = results.filter((r) => r.notified).length

  console.info(
    `[cron/process-alerts] done in ${Date.now() - started}ms — queued=${rows.length} ok=${okCount} emailed=${notified}`,
  )

  return {
    ok: true,
    durationMs: Date.now() - started,
    queued: rows.length,
    processedOk: okCount,
    emailsSent: notified,
    results,
  }
})
