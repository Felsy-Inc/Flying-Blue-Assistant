import { serverSupabaseServiceRole } from '#supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { UsageEventType } from '~lib/billing/usage-events'
import { availabilitySearchBodySchema, toAvailabilitySearchRequest } from '~lib/availability/search-request.zod'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { throwValidationFailed } from '~~/server/utils/api/validation'
import { getUserPlanContext } from '~~/server/utils/billing/user-plan'
import { insertSearchLog } from '~~/server/utils/db/search-logs'
import { insertUsageEvent } from '~~/server/utils/db/usage'
import { assertCanExecuteSearch } from '~~/server/utils/db/usage-limits'
import { resolveAvailabilityProvider } from '~~/server/utils/availability/resolve-provider'
import { isMissingDbObjectError } from '~~/server/utils/db/supabase-errors'
import type { Json } from '~~/types/database.types'

export default defineEventHandler(async (event) => {
  const { userId, supabase } = await requireSupabaseSession(event)

  const rawBody = await readBody(event)
  const parsed = availabilitySearchBodySchema.safeParse(rawBody ?? {})
  if (!parsed.success) {
    throwValidationFailed(parsed.error)
  }

  const request = toAvailabilitySearchRequest(parsed.data)

  const { limits } = await getUserPlanContext(supabase, userId)
  const quota = await assertCanExecuteSearch(supabase, userId, limits)
  if (!quota.ok) {
    throw createError({
      statusCode: 429,
      statusMessage: 'search_daily_limit',
      data: { reason: quota.reason, used: quota.used, limit: quota.limit },
    })
  }

  let serviceClient: SupabaseClient | null = null
  try {
    serviceClient = serverSupabaseServiceRole(event)
  } catch {
    serviceClient = null
  }

  const provider = resolveAvailabilityProvider('mock', serviceClient)
  const started = Date.now()
  const response = await provider.search(request)
  const durationMs = Date.now() - started

  try {
    await insertUsageEvent(supabase, {
      user_id: userId,
      loyalty_program_slug: request.loyaltyProgramSlug,
      event_type: UsageEventType.searchExecuted,
      metadata: {
        offerCount: response.offers.length,
        cacheHit: response.cacheHit ?? false,
      },
    })
  } catch (e) {
    if (!isMissingDbObjectError(e)) {
      throw createError({ statusCode: 503, statusMessage: 'usage_write_failed' })
    }
  }

  try {
    await insertSearchLog(supabase, {
      user_id: userId,
      loyalty_program_slug: request.loyaltyProgramSlug,
      params: JSON.parse(JSON.stringify(request)) as Json,
      result_count: response.offers.length,
      duration_ms: durationMs,
    })
  } catch {
    /* optional */
  }

  return response
})
