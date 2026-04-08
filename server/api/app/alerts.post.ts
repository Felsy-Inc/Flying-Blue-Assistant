import { alertBodyToInsert, alertUpsertBodySchema } from '~lib/alerts/alert-schema'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { throwValidationFailed } from '~~/server/utils/api/validation'
import { getUserPlanContext } from '~~/server/utils/billing/user-plan'
import { insertAlert } from '~~/server/utils/db/alerts'
import { assertCanActivateAlert } from '~~/server/utils/db/usage-limits'

export default defineEventHandler(async (event) => {
  const { userId, supabase } = await requireSupabaseSession(event)

  const raw = await readBody(event)
  const parsed = alertUpsertBodySchema.safeParse(raw ?? {})
  if (!parsed.success) {
    throwValidationFailed(parsed.error)
  }

  const body = parsed.data

  const { limits } = await getUserPlanContext(supabase, userId)

  if (body.status === 'active') {
    const quota = await assertCanActivateAlert(supabase, userId, limits)
    if (!quota.ok) {
      throw createError({
        statusCode: 429,
        statusMessage: 'active_alert_limit',
        data: { reason: quota.reason, used: quota.used, limit: quota.limit },
      })
    }
  }

  const row = await insertAlert(supabase, alertBodyToInsert(userId, body))
  return { alert: row }
})
