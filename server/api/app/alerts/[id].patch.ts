import {
  alertPatchBodySchema,
  alertRowToFormValues,
  alertUpsertBodySchema,
  alertUpsertBodyToUpdate,
} from '~lib/alerts/alert-schema'
import { requireSupabaseSession } from '~~/server/utils/api/require-auth'
import { throwValidationFailed } from '~~/server/utils/api/validation'
import { getUserPlanContext } from '~~/server/utils/billing/user-plan'
import { getAlertByIdForUser, updateAlert } from '~~/server/utils/db/alerts'
import { assertCanActivateAlert } from '~~/server/utils/db/usage-limits'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !UUID_RE.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'invalid_alert_id' })
  }

  const { userId, supabase } = await requireSupabaseSession(event)

  const existing = await getAlertByIdForUser(supabase, id, userId)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'alert_not_found' })
  }

  const raw = await readBody(event)
  const patchParsed = alertPatchBodySchema.safeParse(raw ?? {})
  if (!patchParsed.success) {
    throwValidationFailed(patchParsed.error)
  }

  const mergedRaw = { ...alertRowToFormValues(existing), ...patchParsed.data }
  const fullParsed = alertUpsertBodySchema.safeParse(mergedRaw)
  if (!fullParsed.success) {
    throwValidationFailed(fullParsed.error)
  }

  const next = fullParsed.data

  const { limits } = await getUserPlanContext(supabase, userId)

  if (next.status === 'active' && existing.status !== 'active') {
    const quota = await assertCanActivateAlert(supabase, userId, limits)
    if (!quota.ok) {
      throw createError({
        statusCode: 429,
        statusMessage: 'active_alert_limit',
        data: { reason: quota.reason, used: quota.used, limit: quota.limit },
      })
    }
  }

  const row = await updateAlert(supabase, id, userId, alertUpsertBodyToUpdate(next))
  return { alert: row }
})
